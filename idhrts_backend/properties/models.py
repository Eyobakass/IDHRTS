import uuid
from django.db import models
from users.models import User, SubCity, Woreda

class Property(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'), ('PENDING_REVIEW', 'Pending Review'),
        ('ACTIVE', 'Active'), ('SUSPENDED', 'Suspended'), ('ARCHIVED', 'Archived')
    )
    BLDG_CHOICES = (
        ('APARTMENT', 'Apartment'), ('VILLA', 'Villa'), ('CONDOMINIUM', 'Condominium'),
        ('TRADITIONAL', 'Traditional'), ('COMMERCIAL_RESIDENTIAL', 'Commercial/Residential')
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    sub_city = models.ForeignKey(SubCity, on_delete=models.PROTECT, db_index=True)
    woreda = models.ForeignKey(Woreda, on_delete=models.PROTECT, db_index=True)
    kebele = models.CharField(max_length=50, null=True, blank=True)
    house_number = models.CharField(max_length=50)
    cadastral_upi = models.CharField(max_length=100, null=True, blank=True)
    building_type = models.CharField(max_length=30, choices=BLDG_CHOICES)
    num_rooms = models.IntegerField(null=True)
    floor_area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    construction_year = models.IntegerField(null=True)
    num_units = models.IntegerField(default=1)
    monthly_rent_etb = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reviewed_properties')
    review_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Document(models.Model):
    DOC_CHOICES = (('TITLE_DEED', 'Title Deed'), ('HOLDING_CERT', 'Holding Certificate'), ('COURT_ORDER', 'Court Order'))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=20, choices=DOC_CHOICES)
    file_path = models.CharField(max_length=500)
    file_size_bytes = models.IntegerField()
    is_clean = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
