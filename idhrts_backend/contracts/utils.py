"""Contract helpers: registration numbering and authenticated PDF archiving."""
import logging
from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

REG_NUMBER_ATTEMPTS = 5


def _woreda_code(woreda):
    """Appendix D: 2-digit zero-padded Woreda number within the Sub-City."""
    code = str(getattr(woreda, 'code', '') or '')
    return code.zfill(2) if code.isdigit() else code


def build_reg_number_prefix(contract, year=None):
    """`[SubCityCode]-[WoredaCode]-[YYYY]-` per SRS Appendix D."""
    year = year or timezone.now().year
    prop = contract.property
    sub_city_code = str(getattr(prop.sub_city, 'code', '') or 'XX')
    return f"{sub_city_code}-{_woreda_code(prop.woreda)}-{year}-"


def next_reg_number(contract, year=None):
    """
    Next `[SubCityCode]-[WoredaCode]-[YYYY]-[XXXXXX]` number. The 6-digit
    sequence restarts at 000001 each Gregorian year per Woreda (Appendix D);
    zero padding makes lexicographic order match numeric order.
    """
    from .models import RentalContract

    prefix = build_reg_number_prefix(contract, year)
    latest = (
        RentalContract.objects
        .filter(contract_reg_number__startswith=prefix)
        .order_by('-contract_reg_number')
        .values_list('contract_reg_number', flat=True)
        .first()
    )
    sequence = 1
    if latest:
        try:
            sequence = int(latest.rsplit('-', 1)[1]) + 1
        except (IndexError, ValueError):
            logger.warning("Unparseable registration number %s; restarting sequence", latest)
    return f"{prefix}{sequence:06d}"


def assign_reg_number(contract, **save_fields):
    """
    Persist contract with a fresh registration number, retrying when a
    concurrent authentication in the same Woreda claims the same sequence.
    """
    update_fields = save_fields.pop('update_fields', None)
    for attempt in range(REG_NUMBER_ATTEMPTS):
        contract.contract_reg_number = next_reg_number(contract)
        try:
            with transaction.atomic():
                contract.save(update_fields=update_fields)
            return contract.contract_reg_number
        except IntegrityError:
            logger.warning(
                "Registration number %s already taken (attempt %s)",
                contract.contract_reg_number, attempt + 1
            )
    raise IntegrityError("Could not allocate a unique contract registration number")


def store_contract_pdf(contract):
    """
    FR-CONT-012: render the QR-coded authenticated contract PDF and archive it
    under settings.ARCHIVE_DIR. Returns the stored path as a string.
    """
    from core.pdf_utils import generate_contract_pdf

    pdf_bytes = generate_contract_pdf(contract)
    target_dir = settings.ARCHIVE_DIR / 'contracts'
    target_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{contract.contract_reg_number or contract.id}.pdf"
    target_path = target_dir / file_name
    target_path.write_bytes(pdf_bytes)
    return str(target_path)


def contract_pdf_download_path(contract):
    """Link used in SMS bodies; absolute only when PUBLIC_BASE_URL is configured."""
    base = getattr(settings, 'PUBLIC_BASE_URL', '')
    return f"{base}/api/contracts/{contract.id}/pdf/"


def property_address(prop):
    parts = [
        getattr(prop.sub_city, 'name_en', '') or '',
        f"Woreda {getattr(prop.woreda, 'code', '') or ''}".strip(),
        f"Kebele {prop.kebele}" if prop.kebele else '',
        f"House {prop.house_number}" if prop.house_number else '',
    ]
    return ', '.join(part for part in parts if part)


def notify_contract_authenticated(contract, assessment=None):
    """FR-NOTIF-005 (both parties) and FR-NOTIF-004 (landlord tax notice)."""
    from notifications.utils import notify

    link = contract_pdf_download_path(contract)
    reg = contract.contract_reg_number
    message_en = (
        f"Contract {reg} has been authenticated and registered. "
        f"Download the official PDF: {link}"
    )
    message_am = f"ውል {reg} ተመዝግቧል። ሰነዱን ያውርዱ፡ {link}"

    for party in (contract.landlord, contract.tenant):
        if party:
            notify(
                party, 'AUTH_APPROVED', message_en, message_am,
                related_record_type='RentalContract', related_record_id=contract.id,
            )

    if assessment and contract.landlord:
        tax_en = (
            f"Tax assessment issued for {property_address(contract.property)} "
            f"(fiscal year {assessment.fiscal_year}): ETB {assessment.tax_due_etb} "
            f"due by {assessment.due_date}."
        )
        tax_am = (
            f"የግብር ማስታወቂያ ለ{property_address(contract.property)} "
            f"({assessment.fiscal_year})፡ ብር {assessment.tax_due_etb} "
            f"በ{assessment.due_date} ይክፈሉ።"
        )
        notify(
            contract.landlord, 'TAX_ISSUED', tax_en, tax_am,
            related_record_type='TaxAssessment', related_record_id=assessment.id,
        )
