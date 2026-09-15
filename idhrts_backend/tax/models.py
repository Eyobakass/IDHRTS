import uuid
from django.db import models
from users.models import User
from properties.models import Property
from contracts.models import RentalContract

class TaxAssessment(models.Model):
    STATUS_CHOICES = (('PENDING', 'Pending'), ('PAID', 'Paid'), ('OVERDUE', 'Overdue'),
        ('PENDING_OVERRIDE', 'Pending Override'), ('WAIVED', 'Waived'))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(RentalContract, on_delete=models.CASCADE, related_name='assessments', null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    landlord = models.ForeignKey(User, on_delete=models.CASCADE)
    fiscal_year = models.CharField(max_length=9) # e.g. 2025/2026
    gross_annual_rent_etb = models.DecimalField(max_digits=14, decimal_places=2)
    deduction_etb = models.DecimalField(max_digits=14, decimal_places=2)
    taxable_income_etb = models.DecimalField(max_digits=14, decimal_places=2)
    tax_due_etb = models.DecimalField(max_digits=14, decimal_places=2)
    effective_rate_pct = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    due_date = models.DateField()
    assessment_pdf_path = models.CharField(max_length=500, null=True, blank=True)
    prn_code = models.CharField(max_length=20, null=True, blank=True, unique=True)
    prn_expires_at = models.DateTimeField(null=True, blank=True)
    is_under_investigation = models.BooleanField(default=False)
    override_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    import builtins
    @builtins.property
    def months_late(self):
        from django.utils import timezone
        import math
        from decimal import Decimal
        
        today = timezone.now().date()
        if today <= self.due_date:
            return 0
            
        # Calculate days late and approximate months (rounding up to next full month)
        days_late = (today - self.due_date).days
        months = math.ceil(days_late / 30.0)
        return months
        
    @builtins.property
    def late_interest_etb(self):
        from decimal import Decimal, ROUND_HALF_UP
        if self.status == 'PAID' or self.months_late == 0:
            return Decimal("0.00")
            
        # 2% compounding monthly
        multiplier = Decimal("1.02") ** self.months_late
        total_with_interest = self.tax_due_etb * multiplier
        interest = total_with_interest - self.tax_due_etb
        return interest.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
    @builtins.property
    def total_due_etb(self):
        return self.tax_due_etb + self.late_interest_etb

    class Meta:
        unique_together = ('property', 'fiscal_year')
