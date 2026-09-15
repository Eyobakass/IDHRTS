import uuid
from django.db import models
from users.models import User
from properties.models import Property

class RentalContract(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'), ('PENDING_TENANT_SIGNATURE', 'Pending Tenant Signature'),
        ('SIGNED', 'Signed'), ('PENDING_AUTHENTICATION', 'Pending Authentication'),
        ('REGISTERED', 'Registered'), ('REJECTED', 'Rejected'), ('TERMINATED', 'Terminated'),
        ('PENDING_TERMINATION', 'Pending Termination'), ('OVERDUE', 'Overdue'),
    )
    PAY_CHOICES = (('BANK_TRANSFER', 'Bank Transfer'), ('TELEBIRR', 'Telebirr'), ('CBE_BIRR', 'CBE Birr'))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract_reg_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name='contracts')
    landlord = models.ForeignKey(User, on_delete=models.PROTECT, related_name='landlord_contracts')
    tenant = models.ForeignKey(User, on_delete=models.PROTECT, related_name='tenant_contracts')
    monthly_rent_etb = models.DecimalField(max_digits=12, decimal_places=2)
    advance_payment_etb = models.DecimalField(max_digits=12, decimal_places=2)
    lease_start_date = models.DateField()
    lease_duration_months = models.IntegerField()
    lease_end_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAY_CHOICES)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    signing_date = models.DateTimeField(null=True, blank=True)
    submission_to_woreda_date = models.DateTimeField(null=True, blank=True)
    authenticated_at = models.DateTimeField(null=True, blank=True)
    authenticated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authenticated_contracts')
    overdue_registration = models.BooleanField(default=False)
    parent_contract = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    secure_review_token = models.CharField(max_length=255, unique=True, null=True, blank=True)
    secure_review_expires = models.DateTimeField(null=True, blank=True)
    pdf_path = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
