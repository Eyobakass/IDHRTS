import qrcode
import json
import hmac
import hashlib
from django.conf import settings
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader

def generate_secure_qr(data: dict) -> bytes:
    # Appendix F: calculate HMAC over the exact flattened payload
    payload_str = json.dumps(data, sort_keys=True)
    hmac_sig = hmac.new(settings.HMAC_SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    
    # Flatten it into a single dict containing the sig
    qr_payload = data.copy()
    qr_payload["hmac_sig"] = hmac_sig
    
    qr = qrcode.make(json.dumps(qr_payload, sort_keys=True))
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    return buffer.getvalue()

def generate_contract_pdf(contract):
    from contracts.utils import property_address
    base_url = getattr(settings, 'PUBLIC_BASE_URL', 'https://idhrts.et')
    reg = contract.contract_reg_number or "N/A"
    
    qr_data = {
        "version": "1.0",
        "contract_id": str(contract.id),
        "registration_number": reg,
        "landlord_tin": contract.landlord.tin or "N/A",
        "landlord_name": contract.landlord.full_name_en,
        "tenant_name": contract.tenant.full_name_en if contract.tenant else "N/A",
        "property_id": str(contract.property.id),
        "property_address": property_address(contract.property),
        "monthly_rent_etb": float(contract.monthly_rent_etb),
        "lease_start_date": contract.lease_start_date.isoformat(),
        "lease_end_date": contract.lease_end_date.isoformat(),
        "registered_at": contract.authenticated_at.isoformat() if contract.authenticated_at else "",
        "registered_by_officer": contract.authenticated_by.full_name_en if contract.authenticated_by else "N/A",
        "registered_by_woreda": f"Sub-City {contract.property.sub_city.code}, Woreda {contract.property.woreda.code}",
        "verification_url": f"{base_url}/verify/contract/{reg}"
    }
    qr_bytes = generate_secure_qr(qr_data)
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, height - 100, "OFFICIAL RENTAL CONTRACT REGISTRATION")
    
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 140, f"Registration Number: {contract.contract_reg_number or 'N/A'}")
    p.drawString(100, height - 160, f"Property ID: {contract.property.id}")
    p.drawString(100, height - 180, f"House Number: {contract.property.house_number}")
    
    p.drawString(100, height - 220, f"Landlord: {contract.landlord.full_name_en if contract.landlord else 'N/A'}")
    p.drawString(100, height - 240, f"Tenant: {contract.tenant.full_name_en if contract.tenant else 'N/A'}")
    
    p.drawString(100, height - 280, f"Monthly Rent (ETB): {contract.monthly_rent_etb}")
    p.drawString(100, height - 300, f"Start Date: {contract.lease_start_date}")
    p.drawString(100, height - 320, f"End Date: {contract.lease_end_date}")
    
    p.drawString(100, height - 360, f"Status: {contract.status}")
    
    # Add QR code
    qr_image = ImageReader(BytesIO(qr_bytes))
    p.drawImage(qr_image, width - 200, height - 200, width=150, height=150)

    p.showPage()

    # GAP-11 (FR-CONT-012): Amharic bilingual page
    p.setFont("Helvetica-Bold", 14)
    p.drawCentredString(width / 2, height - 60, "የቤት ኪራይ ውል — ዋና ውሎች (Amharic Terms)")
    p.setFont("Helvetica", 10)
    amharic_clauses = [
        f"ባለቤት: {contract.landlord.full_name_en if contract.landlord else 'N/A'}",
        f"ተከራይ: {contract.tenant.full_name_en if contract.tenant else 'N/A'}",
        f"ወርሃዊ ኪራይ (ብር): {contract.monthly_rent_etb}",
        f"የኪራይ መጀመሪያ: {contract.lease_start_date}",
        f"የኪራይ መጨረሻ: {contract.lease_end_date}",
        "ዚህ ውል በኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ ህጎች (አዋጅ 1320/2024) መሰረት ተዘጋጅቷል።",
        "ዝቅተኛ የኪራይ ጊዜ 24 ወር ሲሆን ቅድሚያ ክፍያ ከ 2 ወር ኪራይ ሊበልጥ አይችልም።",
        "ሁለቱም ወገኖች ውሉን ፈርመው ዎሬዳ ቢሮ ምዝገባ አድርገዋል።",
        "ይህ ሰነድ ህጋዊ ቅጂ ሲሆን ዎሬዳ ቢሮ HMAC QR ኮድ ተፈርሟል።",
    ]
    y_am = height - 100
    for clause in amharic_clauses:
        try:
            p.drawString(60, y_am, clause)
        except Exception:
            p.drawString(60, y_am, "[Amharic — install Ethiopic Unicode font for display]")
        y_am -= 24

    p.save()
    
    return buffer.getvalue()

