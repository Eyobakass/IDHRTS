from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from django.http import FileResponse, HttpResponse
from .models import RentalContract
from .serializers import RentalContractSerializer
from .utils import (
    assign_reg_number,
    contract_pdf_download_path,
    notify_contract_authenticated,
    store_contract_pdf,
)
from core.pdf_utils import generate_contract_pdf
from tax.utils import create_assessment_for_contract
from django.utils.crypto import get_random_string
from datetime import timedelta
from django.utils import timezone
import logging
import os

logger = logging.getLogger(__name__)

class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = RentalContractSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'LANDLORD':
            return RentalContract.objects.select_related('property', 'landlord', 'tenant').filter(landlord=user)
        elif user.role == 'TENANT':
            return RentalContract.objects.select_related('property', 'landlord', 'tenant').filter(tenant=user)
        elif user.role == 'WOREDA_OFFICER':
            return RentalContract.objects.select_related('property', 'landlord', 'tenant').filter(property__woreda=user.woreda)
        return RentalContract.objects.select_related('property', 'landlord', 'tenant').all()

    def perform_create(self, serializer):
        # GAP-02: Only landlords may create contracts
        if self.request.user.role != 'LANDLORD':
            raise PermissionDenied("Only landlords can create rental contracts.")

        rent = serializer.validated_data['monthly_rent_etb']
        advance = serializer.validated_data['advance_payment_etb']
        
        # FR-CONT-002: Advance cap enforcement
        if advance > (rent * 2):
            raise serializers.ValidationError("Advance payment exceeds 2x monthly rent (Proclamation 1320/2024 Art. 13)")
            
        # FR-CONT-001: Minimum duration enforcement
        months = serializer.validated_data['lease_duration_months']
        if months < 24:
            raise serializers.ValidationError("Minimum lease duration is 24 months (Proclamation 1320/2024 Art. 6)")
            
        serializer.save(landlord=self.request.user, status='DRAFT')

    @action(detail=True, methods=['post'])
    def submit_to_tenant(self, request, pk=None):
        if request.user.role != 'LANDLORD':
            return Response({"error": "Only landlords can submit contracts to tenants."}, status=403)
        contract = self.get_object()
        contract.status = 'PENDING_TENANT_SIGNATURE'
        contract.secure_review_token = get_random_string(32)
        contract.secure_review_expires = timezone.now() + timedelta(days=7)
        contract.submission_to_woreda_date = timezone.now()
        contract.save()

        # FR-NOTIF-004: Notify tenant with the secure review link
        try:
            from notifications.utils import notify, send_sms
            from django.conf import settings
            frontend_base = getattr(settings, 'FRONTEND_BASE_URL', '')
            review_link = f"{frontend_base}/review/{contract.secure_review_token}"
            send_sms(
                contract.tenant.phone_number,
                f"A rental contract has been shared with you for review and signature. "
                f"Open this link to review and sign (valid 7 days): {review_link}"
            )
            notify(
                contract.tenant,
                notification_type='CONTRACT',
                message_english=f"Landlord {contract.landlord.full_name_en} has submitted a contract for your digital signature.",
                message_amharic="አከራዩ ለፊርማዎ ውል አቅርቧል። ለመፈተሽ እና ለመፈረም ማስፈንጠሪያውን ይጫኑ።",
                is_mandatory=True
            )
        except Exception as e:
            logger.warning("Failed to notify tenant on submit_to_tenant: %s", e)

        return Response({
            'status': 'Submitted for tenant signature',
            'review_link': f"/review/{contract.secure_review_token}"
        })
        
    @action(detail=True, methods=['post'])
    def authenticate(self, request, pk=None):
        """
        FR-CONT-010: officer authenticates and registers a contract. Also
        triggers the QR contract PDF (FR-CONT-012), the automatic Schedule B
        assessment (FR-TAX-001) and party notifications (FR-NOTIF-004/005).
        """
        if request.user.role != 'WOREDA_OFFICER':
            return Response(status=403)
        contract = self.get_object()
        contract.status = 'REGISTERED'
        contract.authenticated_by = request.user
        contract.authenticated_at = timezone.now()

        # Appendix D format: [SubCityCode]-[WoredaCode]-[YYYY]-[XXXXXX]
        assign_reg_number(contract)

        try:
            contract.pdf_path = store_contract_pdf(contract)
            contract.save(update_fields=['pdf_path'])
        except Exception:
            logger.exception("Contract %s registered but PDF archiving failed", contract.id)

        assessment = create_assessment_for_contract(contract)
        notify_contract_authenticated(contract, assessment)

        return Response({
            'status': 'Authenticated',
            'reg_number': contract.contract_reg_number,
            'assessment_id': str(assessment.id),
            'pdf_path': contract_pdf_download_path(contract),
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """FR-CONT-009: Woreda Officer rejects a SIGNED contract with a reason."""
        if request.user.role != 'WOREDA_OFFICER':
            return Response({"error": "Only Woreda Officers can reject contracts."}, status=403)
        contract = self.get_object()
        if contract.status != 'SIGNED':
            return Response({"error": "Only SIGNED contracts can be rejected."}, status=400)
        reason = request.data.get('reason', '')
        if len(reason) < 20:
            return Response({"error": "Rejection reason must be at least 20 characters."}, status=400)
        contract.status = 'DRAFT'
        contract.save()
        try:
            from notifications.utils import notify
            for user in [contract.landlord, contract.tenant]:
                if user:
                    notify(
                        user,
                        notification_type='CONTRACT',
                        message_english=f"Your contract has been rejected by the Woreda Officer. Reason: {reason}",
                        message_amharic=f"ውልዎ በወረዳ ባለሥልጣን ውድቅ ተደርጓል። ምክንያት: {reason}",
                        is_mandatory=True
                    )
        except Exception as e:
            logger.warning("Failed to notify parties on contract rejection: %s", e)
        return Response({'status': 'Contract rejected, reset to DRAFT', 'reason': reason})

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """FR-CONT-011: Landlord renews a REGISTERED contract. Rent hike capped at RENT_HIKE_CEILING_PCT."""
        if request.user.role != 'LANDLORD':
            return Response({"error": "Only landlords can renew contracts."}, status=403)
        contract = self.get_object()
        if contract.status != 'REGISTERED':
            return Response({"error": "Only REGISTERED contracts can be renewed."}, status=400)
        if contract.landlord != request.user:
            return Response({"error": "You can only renew your own contracts."}, status=403)

        new_rent = request.data.get('monthly_rent_etb')
        if not new_rent:
            return Response({"error": "monthly_rent_etb is required."}, status=400)

        try:
            from users.models import SystemConfig
            ceiling_pct = float(SystemConfig.objects.get(key='RENT_HIKE_CEILING_PCT').value)
        except Exception:
            ceiling_pct = 11.5  # SRS Appendix A default

        old_rent = float(contract.monthly_rent_etb)
        new_rent_val = float(new_rent)
        max_allowed = old_rent * (1 + ceiling_pct / 100)
        if new_rent_val > max_allowed:
            return Response({
                "error": f"Rent increase exceeds the {ceiling_pct}% ceiling per Proclamation 1320/2024. "
                         f"Maximum allowed: ETB {max_allowed:.2f}."
            }, status=400)

        from decimal import Decimal
        from dateutil.relativedelta import relativedelta
        duration = contract.lease_duration_months
        start = timezone.now().date()
        new_contract = RentalContract.objects.create(
            property=contract.property,
            landlord=contract.landlord,
            tenant=contract.tenant,
            monthly_rent_etb=Decimal(str(new_rent_val)),
            advance_payment_etb=contract.advance_payment_etb,
            lease_start_date=start,
            lease_duration_months=duration,
            lease_end_date=start + relativedelta(months=duration),
            payment_method=contract.payment_method,
            status='DRAFT',
            parent_contract=contract,
        )
        return Response({
            'status': 'Renewal draft created. Submit to tenant to begin signing.',
            'new_contract_id': str(new_contract.id)
        }, status=201)

    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        """
        GAP-03 (FR-CONT-015): Landlord requests termination.
        Sets status to PENDING_TERMINATION and notifies Woreda Officers.
        Actual termination only happens after approve_termination by a Woreda Officer.
        """
        contract = self.get_object()
        if request.user.role != 'LANDLORD' or contract.landlord != request.user:
            return Response({'error': 'Only the landlord can request termination.'}, status=403)
        if contract.status not in ['REGISTERED', 'OVERDUE']:
            return Response({'error': 'Only REGISTERED or OVERDUE contracts can be terminated.'}, status=400)
        reason = request.data.get('reason', '')
        contract.status = 'PENDING_TERMINATION'
        contract.save(update_fields=['status'])
        # Notify Woreda Officers
        from notifications.utils import notify
        from users.models import User
        officers = User.objects.filter(role='WOREDA_OFFICER', woreda=contract.property.woreda)
        for officer in officers:
            notify(officer, f"Termination requested for contract {contract.contract_reg_number}. Reason: {reason}", sms=False)
        return Response({'status': 'Termination request submitted. Awaiting Woreda Officer approval.'})

    @action(detail=True, methods=['post'], url_path='approve-termination')
    def approve_termination(self, request, pk=None):
        """GAP-03 (FR-CONT-015): Woreda Officer approves a pending termination."""
        if request.user.role != 'WOREDA_OFFICER':
            return Response({'error': 'Only Woreda Officers can approve terminations.'}, status=403)
        contract = self.get_object()
        if contract.status != 'PENDING_TERMINATION':
            return Response({'error': 'Contract is not pending termination.'}, status=400)
        contract.status = 'TERMINATED'
        contract.save(update_fields=['status'])
        # Notify both parties via SMS
        from notifications.utils import notify
        notify(contract.landlord, f"Your contract {contract.contract_reg_number} has been terminated by Woreda decision.", sms=True)
        notify(contract.tenant, f"Your rental contract {contract.contract_reg_number} has been officially terminated.", sms=True)
        return Response({'status': 'Contract terminated successfully.'})


    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """FR-CONT-012: download the QR-coded authenticated contract PDF."""
        contract = self.get_object()
        if contract.status != 'REGISTERED' or not contract.contract_reg_number:
            return Response(
                {"error": "PDF is only available for authenticated (REGISTERED) contracts"},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_name = f"Contract_{contract.contract_reg_number}.pdf"
        if contract.pdf_path and os.path.exists(contract.pdf_path):
            return FileResponse(
                open(contract.pdf_path, 'rb'),
                content_type='application/pdf',
                as_attachment=True,
                filename=file_name,
            )

        # Archived copy missing (e.g. contract registered before archiving existed)
        pdf_bytes = generate_contract_pdf(contract)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

class PublicContractView(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='review/(?P<token>[^/.]+)')
    def review(self, request, token=None):
        try:
            contract = RentalContract.objects.get(secure_review_token=token)
            if contract.secure_review_expires < timezone.now():
                return Response({"error": "Secure link has expired"}, status=400)
            serializer = RentalContractSerializer(contract)
            return Response(serializer.data)
        except RentalContract.DoesNotExist:
            return Response({"error": "Contract not found"}, status=404)
            
    @action(detail=False, methods=['post'], url_path='review/(?P<token>[^/.]+)/request-otp')
    def request_otp(self, request, token=None):
        try:
            contract = RentalContract.objects.get(secure_review_token=token)
            if contract.status != 'PENDING_TENANT_SIGNATURE':
                return Response({"error": "Contract is not pending signature"}, status=400)
            
            import random
            from users.models import OTP
            from notifications.utils import send_sms
            
            code = f"{random.randint(0, 999999):06d}"
            tenant = contract.tenant
            if not tenant:
                return Response({"error": "No tenant associated"}, status=400)
                
            OTP.objects.create(phone_number=tenant.phone_number, code=code)
            send_sms(tenant.phone_number, f"Your contract signing OTP is {code}. It expires in 5 minutes.")
            
            return Response({"status": "OTP sent"})
        except RentalContract.DoesNotExist:
            return Response(status=404)

    @action(detail=False, methods=['post'], url_path='review/(?P<token>[^/.]+)/sign')
    def sign(self, request, token=None):
        try:
            contract = RentalContract.objects.get(secure_review_token=token)
            if contract.status != 'PENDING_TENANT_SIGNATURE':
                return Response({"error": "Contract is not pending signature"}, status=400)
                
            otp_code = request.data.get('otp')
            if not otp_code:
                return Response({"error": "OTP is required"}, status=400)
                
            from users.models import OTP
            tenant = contract.tenant
            
            otp = OTP.objects.filter(phone_number=tenant.phone_number, code=otp_code, is_used=False).order_by('-created_at').first()
            if not otp or not otp.is_valid():
                return Response({"error": "Invalid or expired OTP"}, status=400)
                
            otp.is_used = True
            otp.save()
                
            contract.status = 'SIGNED'
            contract.signing_date = timezone.now()
            contract.save()
            return Response({"status": "Contract digitally signed successfully"})
        except RentalContract.DoesNotExist:
            return Response(status=404)
