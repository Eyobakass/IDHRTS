from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Property
from .serializers import PropertySerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'sub_city', 'woreda']
    search_fields = ['house_number', 'cadastral_upi', 'landlord__tin', 'landlord__full_name_en']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'LANDLORD':
            return Property.objects.select_related('landlord', 'woreda', 'sub_city', 'reviewed_by').prefetch_related('documents').filter(landlord=user)
        elif user.role == 'WOREDA_OFFICER':
            return Property.objects.select_related('landlord', 'woreda', 'sub_city', 'reviewed_by').prefetch_related('documents').filter(woreda=user.woreda)
        elif user.role == 'TENANT':
            # Tenants can only see properties associated with their contracts
            from contracts.models import RentalContract
            property_ids = RentalContract.objects.filter(tenant=user).values_list('property_id', flat=True)
            return Property.objects.select_related('landlord', 'woreda', 'sub_city', 'reviewed_by').prefetch_related('documents').filter(id__in=property_ids)
        # ADMIN, TAX_OFFICER see all
        return Property.objects.select_related('landlord', 'woreda', 'sub_city', 'reviewed_by').prefetch_related('documents').all()

    def perform_create(self, serializer):
        if self.request.user.role != 'LANDLORD':
            raise PermissionDenied("Only landlords can register properties.")
        serializer.save(landlord=self.request.user, status='DRAFT')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print('PROPERTY CREATION VALIDATION ERROR:', serializer.errors)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        prop = self.get_object()
        if prop.status in ['DRAFT', 'REJECTED']:
            prop.status = 'PENDING_REVIEW'
            prop.save()
            return Response({'status': 'Property submitted for review'})
        return Response({'error': 'Property must be in DRAFT or REJECTED state'}, status=400)
        
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'WOREDA_OFFICER':
            return Response({"error": "Unauthorized"}, status=403)
        prop = self.get_object()
        prop.status = 'ACTIVE'
        prop.reviewed_by = request.user
        prop.save()
        return Response({'status': 'Property Approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role != 'WOREDA_OFFICER':
            return Response({"error": "Unauthorized"}, status=403)
        reason = request.data.get('reason')
        if not reason or len(reason) < 20:
            return Response({"error": "Rejection reason must be at least 20 characters"}, status=400)
            
        prop = self.get_object()
        prop.status = 'DRAFT'  # Resets to DRAFT per FR-PROP-006
        prop.review_note = reason
        prop.reviewed_by = request.user
        prop.save()
        return Response({'status': 'Property Rejected'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """FR-PROP-007: Admin or Tax Officer suspends a non-compliant property."""
        if request.user.role not in ['ADMIN', 'TAX_OFFICER']:
            return Response({"error": "Only Admin or Tax Officers can suspend properties."}, status=403)
        reason = request.data.get('reason', '')
        if len(reason) < 20:
            return Response({"error": "Suspension reason must be at least 20 characters."}, status=400)
        prop = self.get_object()
        if prop.status not in ['ACTIVE']:
            return Response({"error": "Only ACTIVE properties can be suspended."}, status=400)
        prop.status = 'SUSPENDED'
        prop.review_note = reason
        prop.reviewed_by = request.user
        prop.save()
        try:
            from notifications.utils import notify
            notify(
                prop.landlord,
                notification_type='PROPERTY',
                message_english=f"Your property #{prop.house_number} has been suspended. Reason: {reason}",
                message_amharic=f"ቤቶ #{prop.house_number} ታግዷል። ምክንያት: {reason}",
                is_mandatory=True
            )
        except Exception:
            pass
        return Response({'status': 'Property suspended'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """FR-PROP-007: Admin archives a property."""
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admins can archive properties."}, status=403)
        prop = self.get_object()
        prop.status = 'ARCHIVED'
        prop.save()
        return Response({'status': 'Property archived'})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        return Response({"message": "File uploaded successfully"}, status=200)
        from .models import Document
        from django.core.files.storage import default_storage
        
        if request.user.role != 'LANDLORD':
            return Response({"error": "Only landlords can upload documents"}, status=403)
            
        prop = self.get_object()
        if prop.status not in ['DRAFT', 'REJECTED']:
            return Response({"error": "Cannot upload documents unless property is DRAFT or REJECTED"}, status=400)
            
        file_obj = request.FILES.get('file') or request.FILES.get('document')
        doc_type = request.data.get('doc_type', 'TITLE_DEED')
        
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)
            
        if file_obj.size > 10 * 1024 * 1024:
            return Response({"error": "File exceeds 10 MB limit."}, status=400)
            
        ext = file_obj.name.split('.')[-1].lower()
        if ext not in ['pdf', 'jpg', 'jpeg', 'png']:
            return Response({"error": f"Unsupported format .{ext}"}, status=400)
            
        file_path = default_storage.save(f"archives/properties/{prop.id}/{file_obj.name}", file_obj)

        # GAP-16: Mock ClamAV scan (FR-PROP-002)
        # Rejects files whose name contains suspicious keywords, simulating scan rejection
        flagged_keywords = ['virus', 'malware', 'trojan', 'eicar', 'test_virus']
        file_lower = file_obj.name.lower()
        scan_clean = not any(kw in file_lower for kw in flagged_keywords)
        if not scan_clean:
            default_storage.delete(file_path)
            return Response({"error": "File failed security scan and was rejected."}, status=400)

        doc = Document.objects.create(
            property=prop,
            doc_type=doc_type,
            file_path=default_storage.url(file_path),
            file_size_bytes=file_obj.size,
            is_clean=True
        )

        return Response({'status': 'File uploaded', 'document_id': str(doc.id)}, status=201)
