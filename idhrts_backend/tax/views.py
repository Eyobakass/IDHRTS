from rest_framework import viewsets, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TaxAssessment
from .serializers import TaxAssessmentSerializer
from contracts.models import RentalContract
from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from datetime import timedelta
import datetime


def _calculate_ethiopian_rental_tax(monthly_rent_etb: Decimal):
    """
    Ethiopian rental income tax calculation per ERCA schedule:
    1. Gross annual rent = monthly_rent × 12
    2. Deduction = 20% of gross annual (allowable expenses)
    3. Taxable income = gross - deduction
    4. Progressive tax rates applied to taxable income:
       0 – 7,200       → 0%
       7,201 – 19,800  → 10%
       19,801 – 38,400 → 15%
       38,401 – 63,000 → 20%
       63,001 – 93,600 → 25%
       93,601 – 130,800→ 30%
       130,801+        → 35%
    """
    gross = monthly_rent_etb * 12
    deduction = (gross * Decimal("0.20")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    taxable = gross - deduction

    # FR-ADMIN-004: Load brackets from SystemConfig if admin has overridden them
    brackets = None
    try:
        import json
        from woreda.models import SystemConfig
        cfg = SystemConfig.objects.filter(key='TAX_BRACKET_JSON').first()
        if cfg and cfg.value:
            raw = json.loads(cfg.value)
            # Expected format: [[upper_limit_or_null, rate_pct], ...]
            # e.g. [[7200, 0], [19800, 10], [38400, 15], [null, 35]]
            brackets = [
                (Decimal(str(limit)) if limit is not None else None, Decimal(str(rate)) / 100)
                for limit, rate in raw
            ]
    except Exception:
        brackets = None  # Fall back to hardcoded defaults below

    if brackets is None:
        brackets = [
            (Decimal("7200"),   Decimal("0.00")),
            (Decimal("19800"),  Decimal("0.10")),
            (Decimal("38400"),  Decimal("0.15")),
            (Decimal("63000"),  Decimal("0.20")),
            (Decimal("93600"),  Decimal("0.25")),
            (Decimal("130800"), Decimal("0.30")),
            (None,              Decimal("0.35")),
        ]

    tax = Decimal("0")
    prev_limit = Decimal("0")
    remaining = taxable

    for limit, rate in brackets:
        if remaining <= 0:
            break
        bracket_size = (limit - prev_limit) if limit is not None else remaining
        taxable_in_bracket = min(remaining, bracket_size)
        tax += (taxable_in_bracket * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        remaining -= taxable_in_bracket
        if limit is not None:
            prev_limit = limit

    effective_rate = ((tax / gross) * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if gross > 0 else Decimal("0")

    return {
        "gross_annual": gross,
        "deduction": deduction,
        "taxable": taxable,
        "tax_due": tax,
        "effective_rate": effective_rate,
    }


class TaxAssessmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaxAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'LANDLORD':
            return TaxAssessment.objects.select_related('contract', 'property', 'landlord').filter(landlord=user)
        elif user.role == 'TAX_OFFICER':
            return TaxAssessment.objects.select_related('contract', 'property', 'landlord').filter(property__sub_city=user.sub_city)
        elif user.role == 'WOREDA_OFFICER':
            return TaxAssessment.objects.select_related('contract', 'property', 'landlord').filter(property__woreda=user.woreda)
        elif user.role == 'TENANT':
            # Tenants have no visibility into tax assessments
            return TaxAssessment.objects.none()
        # ADMIN sees all
        return TaxAssessment.objects.select_related('contract', 'property', 'landlord').all()

    @action(detail=True, methods=['get'])
    def breakdown(self, request, pk=None):
        assessment = self.get_object()
        # contract can be null for vacant-property imputed assessments
        monthly_rent = (
            assessment.contract.monthly_rent_etb
            if assessment.contract_id
            else assessment.gross_annual_rent_etb / 12
        )
        return Response({
            "monthly_rent": monthly_rent,
            "gross_annual": assessment.gross_annual_rent_etb,
            "deduction_20_pct": assessment.deduction_etb,
            "taxable_income": assessment.taxable_income_etb,
            "tax_due": assessment.tax_due_etb,
            "effective_rate": assessment.effective_rate_pct,
            "is_vacant_imputed": assessment.contract_id is None,
        })

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        POST /api/tax/generate/
        Body: { "contract_id": "<uuid>" }

        Tax Officer only. Creates a TaxAssessment for a REGISTERED contract.
        Uses the Ethiopian rental income tax schedule (20% deduction + progressive rates).
        Prevents duplicate assessments for the same contract + fiscal year.
        """
        import traceback as _tb
        try:
            if request.user.role != 'TAX_OFFICER':
                return Response(
                    {"error": "Only Tax Officers can generate assessments."},
                    status=http_status.HTTP_403_FORBIDDEN,
                )

            contract_id = request.data.get("contract_id")
            if not contract_id:
                return Response(
                    {"error": "contract_id is required."},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )

            try:
                contract = RentalContract.objects.select_related('property', 'landlord').get(id=contract_id)
            except RentalContract.DoesNotExist:
                return Response({"error": "Contract not found."}, status=http_status.HTTP_404_NOT_FOUND)

            if contract.status != 'REGISTERED':
                return Response(
                    {"error": f"Assessments can only be generated for REGISTERED contracts (current status: {contract.status})."},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )

            # Fiscal year: Ethiopian fiscal year runs July 8 → July 7
            today = timezone.now().date()
            fiscal_year = f"{today.year}/{today.year + 1}" if today.month >= 7 else f"{today.year - 1}/{today.year}"

            if TaxAssessment.objects.select_related('contract', 'property', 'landlord').filter(contract=contract, fiscal_year=fiscal_year).exists():
                return Response(
                    {"error": f"An assessment already exists for this contract in fiscal year {fiscal_year}."},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )

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

            return Response(
                TaxAssessmentSerializer(assessment).data,
                status=http_status.HTTP_201_CREATED,
            )
        except Exception as _e:
            import logging
            logging.getLogger(__name__).error("generate() crashed: %s\n%s", _e, _tb.format_exc())
            return Response({"error": str(_e), "detail": _tb.format_exc()}, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """GAP-04 (FR-TAX-003): Download the official Tax Assessment Notice PDF."""
        assessment = self.get_object()
        from django.http import HttpResponse
        buf = generate_tax_assessment_pdf(assessment)
        response = HttpResponse(buf.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="tax_assessment_{str(assessment.id)[:8]}.pdf"'
        return response

    @action(detail=True, methods=['post'], url_path='generate-prn')
    def generate_prn(self, request, pk=None):
        assessment = self.get_object()
        if assessment.status != 'PENDING':
            return Response({'error': 'Can only generate PRN for PENDING assessments.'}, status=http_status.HTTP_400_BAD_REQUEST)
        
        if not assessment.prn_code:
            # GAP-09: Use structured PRN format PRN-[WoredaCode]-[YYYYMMDD]-[XXXXXX]
            from tax.utils import next_prn_sequence
            prn = next_prn_sequence(assessment.property.woreda)
            assessment.prn_code = prn
            assessment.prn_expires_at = timezone.now() + timedelta(days=30)
            assessment.save(update_fields=['prn_code', 'prn_expires_at'])
            
            # FR-PAY-002: Create TaxPayment in PROCESSING status
            from payments.models import TaxPayment
            TaxPayment.objects.create(
                assessment=assessment,
                landlord=assessment.landlord,
                amount_etb=assessment.tax_due_etb,
                payment_method='PRN_BANK',
                status='PROCESSING',
                prn_code=prn
            )
            
        return Response(TaxAssessmentSerializer(assessment).data)

    @action(detail=True, methods=['get'], url_path='clearance-pdf')
    def clearance_pdf(self, request, pk=None):
        assessment = self.get_object()
        if assessment.status != 'PAID':
            return Response({'error': 'Tax Clearance Certificate is only available for PAID assessments.'}, status=http_status.HTTP_400_BAD_REQUEST)
            
        from .utils import generate_tax_clearance_pdf
        from django.http import HttpResponse
        
        pdf_bytes = generate_tax_clearance_pdf(assessment)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="tax_clearance_{assessment.id}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def flag_investigation(self, request, pk=None):
        if request.user.role != 'TAX_OFFICER':
            return Response({'error': 'Unauthorized'}, status=403)
        assessment = self.get_object()
        assessment.is_under_investigation = not assessment.is_under_investigation
        assessment.save(update_fields=['is_under_investigation'])
        status_msg = 'Flagged for investigation' if assessment.is_under_investigation else 'Investigation flag removed'
        return Response({'status': status_msg})

    @action(detail=True, methods=['post'])
    def override_assessment(self, request, pk=None):
        """GAP-05 (FR-TAX-011): Tax Officer submits override → PENDING_OVERRIDE. Admin must approve."""
        if request.user.role != 'TAX_OFFICER':
            return Response({'error': 'Only Tax Officers can request overrides.'}, status=403)

        reason = request.data.get('reason')
        new_tax_due = request.data.get('new_tax_due')
        if not reason or not new_tax_due:
            return Response({'error': 'Both reason and new_tax_due are required'}, status=400)

        assessment = self.get_object()
        if assessment.status == 'PAID':
            return Response({'error': 'Cannot override a PAID assessment'}, status=400)

        # Store pending values without applying yet
        assessment.override_reason = reason
        assessment.status = 'PENDING_OVERRIDE'
        assessment.save(update_fields=['override_reason', 'status'])

        from users.models import AuditLog, User
        AuditLog.objects.create(
            actor=request.user, action='TAX_OVERRIDE_REQUESTED',
            target_id=str(assessment.id), target_type='TaxAssessment',
            ip_address=request.META.get('REMOTE_ADDR'),
            metadata={'requested_new_tax_due': str(new_tax_due), 'reason': reason}
        )
        # Notify all admins
        from notifications.utils import notify
        admins = User.objects.filter(role='ADMIN')
        for admin in admins:
            notify(admin, f"Tax override request for assessment {assessment.id}. Proposed amount: {new_tax_due} ETB. Reason: {reason}. Please approve or reject.", sms=False)

        return Response({'status': 'Override request submitted. Awaiting Admin approval.'})

    @action(detail=True, methods=['post'], url_path='approve-override')
    def approve_override(self, request, pk=None):
        """GAP-05 (FR-TAX-011): System Admin approves a pending tax override."""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only Admins can approve overrides.'}, status=403)
        assessment = self.get_object()
        if assessment.status != 'PENDING_OVERRIDE':
            return Response({'error': 'No pending override for this assessment.'}, status=400)
        new_tax_due = request.data.get('new_tax_due')
        if not new_tax_due:
            return Response({'error': 'new_tax_due is required to confirm the approved amount.'}, status=400)
        assessment.tax_due_etb = Decimal(str(new_tax_due))
        assessment.status = 'PENDING'
        assessment.save(update_fields=['tax_due_etb', 'status'])
        from users.models import AuditLog
        AuditLog.objects.create(
            actor=request.user, action='TAX_OVERRIDE_APPROVED',
            target_id=str(assessment.id), target_type='TaxAssessment',
            ip_address=request.META.get('REMOTE_ADDR'),
            metadata={'approved_new_tax_due': str(new_tax_due)}
        )
        return Response({'status': 'Override approved and applied successfully.'})



def generate_tax_assessment_pdf(assessment):
    """
    GAP-04 (FR-TAX-003): Generate an official Tax Assessment Notice PDF.
    Returns a BytesIO buffer.
    """
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    width, height = A4
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    # Header
    c.setFillColor(colors.HexColor('#1E3A5F'))
    c.rect(0, height - 90, width, 90, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, height - 38, "IDHRTS — Tax Assessment Notice")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 58, "Integrated Digital House Rental Tax System — Addis Ababa")
    c.drawString(40, height - 72, "Federal Democratic Republic of Ethiopia")

    # Body
    c.setFillColor(colors.black)
    y = height - 130
    def row(label, value):
        nonlocal y
        c.setFont("Helvetica-Bold", 10); c.drawString(50, y, label)
        c.setFont("Helvetica", 10);      c.drawString(230, y, str(value))
        y -= 20

    row("Assessment ID:", str(assessment.id)[:16] + "…")
    row("Landlord:", assessment.landlord.full_name_en if assessment.landlord else "—")
    row("TIN:", assessment.landlord.tin if assessment.landlord and assessment.landlord.tin else "—")
    row("Property:", assessment.property.house_number if assessment.property else "—")
    row("Fiscal Year:", assessment.fiscal_year if hasattr(assessment, 'fiscal_year') else "—")
    row("Gross Annual Rent (ETB):", f"{assessment.gross_annual_rent_etb:,.2f}" if hasattr(assessment, 'gross_annual_rent_etb') else "—")
    row("Deduction 20% (ETB):", f"{assessment.deduction_etb:,.2f}" if hasattr(assessment, 'deduction_etb') else "—")
    row("Taxable Income (ETB):", f"{assessment.taxable_income_etb:,.2f}" if hasattr(assessment, 'taxable_income_etb') else "—")
    row("Tax Due (ETB):", f"{assessment.tax_due_etb:,.2f}")
    row("Status:", assessment.status)
    row("PRN Code:", assessment.prn_code or "Not yet generated")
    row("PRN Expires:", str(assessment.prn_expires_at)[:19] if assessment.prn_expires_at else "—")

    y -= 20
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor('#6B7280'))
    c.drawString(50, y, "This is an official tax assessment notice. Pay via bank using the PRN code before the expiry date.")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf
