import uuid
from django.db import models
from users.models import User
from tax.models import TaxAssessment

class TaxPayment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'), ('PROCESSING', 'Processing'), 
        ('CONFIRMED', 'Confirmed'), ('FAILED', 'Failed'), ('REFUNDED', 'Refunded')
    )
    METHOD_CHOICES = (
        ('CHAPA_TELEBIRR', 'Chapa Telebirr'), ('CHAPA_CBE', 'Chapa CBE Birr'),
        ('CHAPA_CARD', 'Chapa Card'), ('PRN_BANK', 'PRN Bank'),
        ('PRN_TELEBIRR', 'PRN Telebirr'), ('MANUAL', 'Manual')
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(TaxAssessment, on_delete=models.CASCADE, related_name='payments')
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount_etb = models.DecimalField(max_digits=14, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    prn_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    chapa_tx_ref = models.CharField(max_length=255, unique=True, null=True, blank=True)
    chapa_checkout_url = models.CharField(max_length=500, null=True, blank=True)
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_payments')
    receipt_pdf_path = models.CharField(max_length=500, null=True, blank=True)
    clearance_pdf_path = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
