from rest_framework import viewsets, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from .models import Dispute
from .serializers import DisputeSerializer
from .utils import (
    APPEAL_WINDOW_CLOSED_MESSAGE,
    appeal_deadline_for,
    appeal_window_open,
    can_transition,
    dispute_parties,
    notify_status_change,
    transition_error,
)
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

MINIMUM_RULING_LENGTH = 50


class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['LANDLORD', 'TENANT']:
            return Dispute.objects.select_related('contract', 'woreda', 'assigned_officer', 'filer', 'respondent').filter(filer=user) | Dispute.objects.select_related('contract', 'woreda', 'assigned_officer', 'filer', 'respondent').filter(respondent=user)
        elif user.role == 'WOREDA_OFFICER':
            return Dispute.objects.select_related('contract', 'woreda', 'assigned_officer', 'filer', 'respondent').filter(woreda=user.woreda)
        return Dispute.objects.select_related('contract', 'woreda', 'assigned_officer', 'filer', 'respondent').all()

    def perform_create(self, serializer):
        if self.request.user.role not in ['LANDLORD', 'TENANT']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only landlords and tenants can file disputes.")
            
        dispute_type = serializer.validated_data.get('dispute_type')
        contract = serializer.validated_data.get('contract')
        if not contract and dispute_type != 'UNREGISTERED_CONTRACT':
            from rest_framework.serializers import ValidationError
            raise ValidationError({"contract": "A dispute must be linked to a contract."})
            
        if contract and self.request.user != contract.landlord and self.request.user != contract.tenant:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only file a dispute for your own contracts.")

        desc = serializer.validated_data['description']
        if len(desc) < 100:
            from rest_framework.serializers import ValidationError
            raise ValidationError({"description": "Description must be at least 100 characters"})

        dispute = serializer.save(
            filer=self.request.user,
            status='FILED',
            woreda=contract.property.woreda if contract else serializer.validated_data.get('woreda')
        )
        self._assign_and_notify_officer(dispute)

    def _assign_and_notify_officer(self, dispute):
        """FR-DISP-002/008: route a new dispute to the responsible officer."""
        from users.models import User

        officer = User.objects.filter(
            role='WOREDA_OFFICER', woreda=dispute.woreda
        ).order_by('created_at').first()
        if not officer:
            logger.warning(
                "No Woreda Officer covers woreda %s; dispute %s is unassigned",
                dispute.woreda_id, dispute.id
            )
            return
        dispute.assigned_officer = officer
        dispute.save(update_fields=['assigned_officer'])
        notify_status_change(
            dispute, [officer],
            f"New dispute filed in your woreda: {dispute.get_dispute_type_display()}.",
            f"በወረዳዎ አዲስ አቤቱታ ቀርቧል፡ {dispute.get_dispute_type_display()}።",
        )

    def _officer_guard(self, request, dispute, verb):
        """Officer-only, same-woreda guard shared by every officer transition."""
        if request.user.role != 'WOREDA_OFFICER':
            return Response(
                {"error": f"Only Woreda Officers can {verb} disputes"},
                status=http_status.HTTP_403_FORBIDDEN
            )
        if dispute.woreda != request.user.woreda:
            return Response(
                {"error": f"You can only {verb} disputes in your woreda"},
                status=http_status.HTTP_403_FORBIDDEN
            )
        return None

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """FR-DISP-003: FILED -> UNDER_REVIEW, the only transition out of FILED."""
        dispute = self.get_object()
        denied = self._officer_guard(request, dispute, 'review')
        if denied:
            return denied

        if not can_transition(dispute.status, 'UNDER_REVIEW'):
            return Response(
                {"error": transition_error(dispute.status, 'UNDER_REVIEW')},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        dispute.status = 'UNDER_REVIEW'
        dispute.assigned_officer = request.user
        dispute.save(update_fields=['status', 'assigned_officer'])

        notify_status_change(
            dispute, dispute_parties(dispute),
            "Your dispute is now under review by the Woreda Housing Office.",
            "አቤቱታዎ በወረዳ ቤቶች ጽሕፈት ቤት በመመርመር ላይ ነው።",
        )
        return Response({
            "status": "Dispute is now under review",
            "dispute_id": str(dispute.id),
            "dispute_status": dispute.status,
        })

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        FR-DISP-005: officer issues the administrative ruling for a dispute in
        UNDER_REVIEW. Sets DECISION_ISSUED, stamps the ruling time and opens the
        15-working-day appeal window.
        SECURITY: Officer must belong to the same woreda as the dispute.
        """
        dispute = self.get_object()
        denied = self._officer_guard(request, dispute, 'resolve')
        if denied:
            return denied

        if not can_transition(dispute.status, 'DECISION_ISSUED'):
            return Response(
                {"error": transition_error(dispute.status, 'DECISION_ISSUED')},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        ruling_text = request.data.get('ruling_text', '').strip()
        if not ruling_text or len(ruling_text) < MINIMUM_RULING_LENGTH:
            return Response(
                {"error": f"Ruling text must be at least {MINIMUM_RULING_LENGTH} characters"},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        dispute.status = 'DECISION_ISSUED'
        dispute.ruling_text = ruling_text
        dispute.ruling_at = timezone.now()
        dispute.appeal_deadline = appeal_deadline_for(dispute.ruling_at)
        dispute.assigned_officer = request.user
        dispute.save()

        notify_status_change(
            dispute, dispute_parties(dispute),
            f"A ruling has been issued on your dispute. You may appeal until {dispute.appeal_deadline}.",
            f"በአቤቱታዎ ላይ ውሳኔ ተሰጥቷል። እስከ {dispute.appeal_deadline} ድረስ ይግባኝ ማለት ይችላሉ።",
        )
        return Response({
            "status": "Dispute resolved successfully",
            "dispute_id": str(dispute.id),
            "ruling_text": ruling_text,
            "dispute_status": dispute.status,
            "appeal_deadline": dispute.appeal_deadline,
        })

    @action(detail=True, methods=['post'])
    def appeal(self, request, pk=None):
        """FR-DISP-006: either party appeals a ruling within 15 working days."""
        dispute = self.get_object()

        if request.user not in dispute_parties(dispute):
            return Response(
                {"error": "Only the filer or respondent can appeal this dispute"},
                status=http_status.HTTP_403_FORBIDDEN
            )

        if not can_transition(dispute.status, 'APPEALED'):
            return Response(
                {"error": transition_error(dispute.status, 'APPEALED')},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        if not appeal_window_open(dispute):
            return Response(
                {"error": APPEAL_WINDOW_CLOSED_MESSAGE},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        dispute.status = 'APPEALED'
        dispute.save(update_fields=['status'])

        if dispute.assigned_officer:
            notify_status_change(
                dispute, [dispute.assigned_officer],
                "A party has appealed your ruling. The Sub-City Grievance Committee will hear the case.",
                "አንድ ወገን በውሳኔው ላይ ይግባኝ ጠይቋል። ጉዳዩ በክፍለ ከተማ አቤቱታ ሰሚ ኮሚቴ ይታያል።",
            )
        return Response({
            "status": "Appeal filed successfully",
            "dispute_id": str(dispute.id),
            "dispute_status": dispute.status,
            "instructions": "Attend the Sub-City Grievance Committee hearing in person with your dispute reference.",
        })

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """FR-DISP-003: officer closes a dispute once no appeal is pending."""
        dispute = self.get_object()
        denied = self._officer_guard(request, dispute, 'close')
        if denied:
            return denied

        if not can_transition(dispute.status, 'CLOSED'):
            return Response(
                {"error": transition_error(dispute.status, 'CLOSED')},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        dispute.status = 'CLOSED'
        dispute.save(update_fields=['status'])

        notify_status_change(
            dispute, dispute_parties(dispute),
            "Your dispute has been closed by the Woreda Housing Office.",
            "አቤቱታዎ በወረዳ ቤቶች ጽሕፈት ቤት ተዘግቷል።",
        )
        return Response({
            "status": "Dispute closed",
            "dispute_id": str(dispute.id),
            "dispute_status": dispute.status,
        })



    @action(detail=True, methods=['post'])
    def upload_evidence(self, request, pk=None):
        """FR-DISP-004: Upload evidence document (PDF/JPG/PNG, max 5MB)."""
        from rest_framework.parsers import MultiPartParser
        from .models import DisputeDocument
        from django.core.files.storage import default_storage

        dispute = self.get_object()
        user = request.user
        allowed_users = [dispute.filer, dispute.respondent, dispute.assigned_officer]
        if user not in [u for u in allowed_users if u]:
            return Response({"error": "You are not a party to this dispute."}, status=403)
        if dispute.status in ['CLOSED']:
            return Response({"error": "Cannot upload evidence to a closed dispute."}, status=400)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided."}, status=400)
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "File exceeds 5MB limit."}, status=400)
        if file_obj.content_type not in ['application/pdf', 'image/jpeg', 'image/png']:
            return Response({"error": "Only PDF, JPG, and PNG files are allowed."}, status=400)

        file_path = default_storage.save(f"archives/disputes/{dispute.id}/{file_obj.name}", file_obj)
        doc = DisputeDocument.objects.create(
            dispute=dispute,
            uploaded_by=user,
            doc_type=request.data.get('doc_type', 'EVIDENCE'),
            file_path=default_storage.url(file_path),
            original_filename=file_obj.name,
            file_size_bytes=file_obj.size,
        )
        return Response({"status": "Evidence uploaded.", "document_id": str(doc.id)}, status=201)
