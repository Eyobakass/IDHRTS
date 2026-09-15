import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from django.utils import timezone
import hashlib
from decimal import Decimal

def generate_tax_clearance_pdf(payment, issuing_officer=None):
    """
    GAP-10 (FR-TAX-008): Tax Clearance Certificate PDF with all required fields + HMAC QR code.
    Fields: Taxpayer name/TIN, Property address, Payment date, Amount, Certificate number,
    Issuing officer name, and a HMAC-signed QR code for verification.
    """
    import io, uuid
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    width, height = A4
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    cert_number = f"CLR-{str(payment.id)[:8].upper()}-{payment.created_at.strftime('%Y%m%d') if hasattr(payment, 'created_at') and payment.created_at else 'NA'}"

    # Header
    c.setFillColor(colors.HexColor('#1E3A5F'))
    c.rect(0, height - 100, width, 100, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 17)
    c.drawCentredString(width / 2, height - 42, "TAX CLEARANCE CERTIFICATE")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 60, "IDHRTS — Integrated Digital House Rental Tax System")
    c.drawCentredString(width / 2, height - 74, "Addis Ababa City Administration | Ministry of Finance")

    c.setFillColor(colors.black)
    y = height - 145
    def row(label, value):
        nonlocal y
        c.setFont("Helvetica-Bold", 10); c.drawString(50, y, label)
        c.setFont("Helvetica", 10);      c.drawString(240, y, str(value) if value else "—")
        y -= 22

    assessment = payment.assessment
    landlord   = payment.landlord
    prop       = assessment.property if assessment else None

    row("Certificate Number:",     cert_number)
    row("Taxpayer Name (EN):",     landlord.full_name_en if landlord else "—")
    row("Taxpayer TIN:",           landlord.tin if landlord else "—")
    row("Property Address:",       f"{prop.house_number}, {prop.woreda}" if prop else "—")
    row("Fiscal Year:",            assessment.fiscal_year if assessment and hasattr(assessment, 'fiscal_year') else "—")
    row("Total Tax Paid (ETB):",   f"{payment.amount_etb:,.2f}")
    row("Payment Date:",           payment.paid_at.strftime('%d %B %Y') if hasattr(payment, 'paid_at') and payment.paid_at else "—")
    row("Payment Reference:",      payment.chapa_tx_ref or payment.prn_code or "—")
    row("Payment Method:",         payment.payment_method)
    row("Issuing Officer:",        issuing_officer.full_name_en if issuing_officer else "System Generated")
    row("Issue Date:",             __import__('django.utils.timezone', fromlist=['timezone']).timezone.now().strftime('%d %B %Y'))

    # HMAC QR code
    y -= 10
    try:
        from core.pdf_utils import generate_secure_qr
        qr_buf = generate_secure_qr(cert_number)
        from reportlab.lib.utils import ImageReader
        c.drawImage(ImageReader(qr_buf), width - 130, y - 80, width=100, height=100)
        c.setFont("Helvetica", 8)
        c.drawString(width - 130, y - 90, "Scan to verify")
    except Exception:
        pass

    y -= 30
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor('#6B7280'))
    c.drawString(50, y, "This certificate confirms that all rental income tax obligations have been satisfied for the stated period.")
    c.drawString(50, y - 13, f"Certificate ID: {cert_number}")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf

def create_assessment_for_contract(contract):
    from tax.models import TaxAssessment
    from tax.views import _calculate_ethiopian_rental_tax
    from django.utils import timezone
    from decimal import Decimal
    import datetime

    today = timezone.now().date()
    fiscal_year = f"{today.year}/{today.year + 1}" if today.month >= 7 else f"{today.year - 1}/{today.year}"
    
    if TaxAssessment.objects.filter(property=contract.property, fiscal_year=fiscal_year).exists():
        return TaxAssessment.objects.filter(property=contract.property, fiscal_year=fiscal_year).first()

    calc = _calculate_ethiopian_rental_tax(Decimal(str(contract.monthly_rent_etb)))
    due_date = datetime.date(today.year + 1 if today.month >= 7 else today.year, 1, 31)
    
    assessment = TaxAssessment.objects.create(
        contract=contract,
        property=contract.property,
        landlord=contract.landlord,
        fiscal_year=fiscal_year,
        gross_annual_rent_etb=calc["gross_annual"],
        deduction_etb=calc["deduction"],
        taxable_income_etb=calc["taxable"],
        tax_due_etb=calc["tax_due"],
        effective_rate_pct=calc["effective_rate"],
        status="PENDING",
        due_date=due_date,
    )
    return assessment


def get_ethiopian_fiscal_year(date_obj=None):
    from django.utils import timezone
    if not date_obj:
        date_obj = timezone.now().date()
    # Ethiopian FY runs July 8 - July 7 roughly.
    if date_obj.month > 7 or (date_obj.month == 7 and date_obj.day >= 8):
        return f"{date_obj.year}/{date_obj.year + 1}"
    return f"{date_obj.year - 1}/{date_obj.year}"

def calculate_schedule_b_tax(monthly_rent):
    # Just a mock wrapper for the internal tax calc
    from tax.views import _calculate_ethiopian_rental_tax
    from decimal import Decimal
    return _calculate_ethiopian_rental_tax(Decimal(str(monthly_rent)))

def build_prn_prefix(woreda, date_obj=None):
    from django.utils import timezone
    date_obj = date_obj or timezone.now().date()
    date_str = date_obj.strftime('%Y%m%d')
    woreda_code = str(getattr(woreda, 'code', '')).zfill(2)
    return f"PRN-{woreda_code}-{date_str}-"

def next_prn_sequence(woreda):
    from tax.models import TaxAssessment
    from django.utils import timezone
    
    prefix = build_prn_prefix(woreda)
    latest = (
        TaxAssessment.objects
        .filter(prn_code__startswith=prefix)
        .order_by('-prn_code')
        .values_list('prn_code', flat=True)
        .first()
    )
    sequence = 1
    if latest:
        try:
            sequence = int(latest.split('-')[-1]) + 1
        except (IndexError, ValueError):
            pass
    return f"{prefix}{sequence:06d}"
