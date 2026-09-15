from celery import shared_task
from django.utils import timezone
from .models import TaxAssessment
from contracts.models import RentalContract
from .utils import calculate_schedule_b_tax, get_ethiopian_fiscal_year

@shared_task
def create_annual_assessments():
    # Runs once a year to generate new tax bills for ACTIVE contracts
    active_contracts = RentalContract.objects.filter(status='REGISTERED')
    now = timezone.now()
    year_str = get_ethiopian_fiscal_year(now)
    
    for contract in active_contracts:
        tax_data = calculate_schedule_b_tax(contract.monthly_rent_etb)  # single arg
        TaxAssessment.objects.update_or_create(
            contract=contract,
            fiscal_year=year_str,
            defaults={
                'property': contract.property,
                'landlord': contract.landlord,
                'gross_annual_rent_etb': tax_data['gross_annual'],
                'deduction_etb': tax_data['deduction'],
                'taxable_income_etb': tax_data['taxable'],
                'tax_due_etb': tax_data['tax_due'],
                'effective_rate_pct': tax_data['effective_rate'],
                'due_date': timezone.now().date() + timezone.timedelta(days=30)
            }
        )

    # Imputed Tax for Vacant Properties (FR-TAX-006)
    from properties.models import Property

    active_properties = Property.objects.filter(status='ACTIVE')
    for prop in active_properties:
        # Only create if no assessment already exists for this property+fiscal_year
        if not TaxAssessment.objects.filter(property=prop, fiscal_year=year_str).exists():
            tax_data = calculate_schedule_b_tax(prop.monthly_rent_etb)  # single arg
            TaxAssessment.objects.create(
                contract=None,  # vacant – no contract
                property=prop,
                landlord=prop.landlord,
                fiscal_year=year_str,
                gross_annual_rent_etb=tax_data['gross_annual'],
                deduction_etb=tax_data['deduction'],
                taxable_income_etb=tax_data['taxable'],
                tax_due_etb=tax_data['tax_due'],
                effective_rate_pct=tax_data['effective_rate'],
                due_date=timezone.now().date() + timezone.timedelta(days=30),
                status='PENDING',
            )


@shared_task
def send_tax_payment_reminders():
    """
    FR-NOTIF-008: Send SMS reminder to landlords whose tax payment is due in 30 days.
    Runs daily at 07:00 EAT (configured in CELERY_BEAT_SCHEDULE).
    """
    from datetime import timedelta
    from notifications.utils import notify, send_sms

    target_date = timezone.now().date() + timedelta(days=30)
    assessments = TaxAssessment.objects.filter(
        status='PENDING',
        due_date=target_date
    ).select_related('landlord')

    for assessment in assessments:
        landlord = assessment.landlord
        if not landlord:
            continue
        notify(
            landlord,
            notification_type='TAX',
            message_english=(
                f"Reminder: Your rental income tax of ETB {assessment.tax_due_etb} "
                f"for fiscal year {assessment.fiscal_year} is due in 30 days "
                f"(by {assessment.due_date}). Please pay on time to avoid penalties."
            ),
            message_amharic=(
                f"ማሳሰቢያ: የ {assessment.fiscal_year} ዓ.ም ግብር ክፍያዎ ETB {assessment.tax_due_etb} "
                f"በ30 ቀናት ውስጥ ({assessment.due_date}) ይደርሳል።"
            ),
            is_mandatory=False
        )



@shared_task(name='tax.tasks.compound_late_payment_interest')
def compound_late_payment_interest():
    """
    GAP-08 (FR-TAX-005): Daily task to compound late payment interest on OVERDUE assessments.
    Reads the penalty rate from SystemConfig key LATE_INTEREST_RATE_PCT (default 2%).
    """
    from django.utils import timezone
    from decimal import Decimal, ROUND_HALF_UP
    from woreda.models import SystemConfig
    from .models import TaxAssessment

    try:
        cfg = SystemConfig.objects.filter(key='LATE_INTEREST_RATE_PCT').first()
        daily_rate = Decimal(cfg.value) / 100 / 365 if cfg else Decimal('0.02') / 365
    except Exception:
        daily_rate = Decimal('0.02') / 365

    overdue = TaxAssessment.objects.filter(status='OVERDUE')
    updated = 0
    for assessment in overdue:
        interest = (assessment.tax_due_etb * daily_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        assessment.tax_due_etb += interest
        assessment.save(update_fields=['tax_due_etb'])
        updated += 1
    return f"Compounded late interest on {updated} overdue assessments."
