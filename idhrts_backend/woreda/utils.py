import io
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

def generate_summons_pdf(dispute, officer):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(1*inch, 10.5*inch, "WOREDA HOUSING OFFICE")
    p.setFont("Helvetica", 14)
    p.drawString(1*inch, 10*inch, "OFFICIAL SUMMONS TO APPEAR")
    p.setFont("Helvetica", 10)
    p.drawString(1*inch, 9*inch, f"Reference: SUM-{officer.woreda.id if officer.woreda else 0}-{timezone.now().strftime('%Y+m%d')}-{dispute.id}")
    p.drawString(1*inch, 8.6*inch, f"Date Issued: {timezone.now().strftime('%B %d, %Y')}")
    p.drawString(4.5*inch, 8.6*inch, f"Officer: {officer.full_name_en}")
    p.setFont("Helvetica-Bold", 12)
    p.drawString(1*inch, 7.8*inch, "TO: ")
    p.setFont("Helvetica", 12)
    resp_phone = str(dispute.respondent.phone_number) if dispute.respondent else "Unknown"
    p.drawString(1.5*inch, 7.8*inch, resp_phone)
    p.drawString(1*inch, 7*inch, "You are hereby summoned to appear at the Woreda Housing Office regarding")
    p.drawString(1*inch, 6.7*inch, f"the dispute filed for the property located at:")
    p.setFont("Helvetica-Bold", 12)
    house_num = dispute.contract.property.house_number if dispute.contract else "Unknown"
    p.drawString(1*inch, 6.4*inch, house_num)
    p.setFont("Helvetica", 12)
    p.drawString(1*inch, 5.5*inch, "Description of dispute:")
    p.setFont("Helvetica", 10)
    desc = dispute.description
    y = 5.2 * inch
    for i in range(0, len(desc), 80):
        p.drawString(1*inch, y, desc[i:i+80])
        y -= 0.2 * inch
    p.setFont("Helvetica-Bold", 12)
    p.drawString(1*inch, y - 0.6*inch, "FAILURE TO APPEAR MAY RESULT IN DEFAULT JUDGMENT.")
    p.setFont("Helvetica", 12)
    p.drawString(1*inch, y - 1.5*inch, "Authorized Signature:")
    p.line(2.5*inch, y - 1.5*inch, 5*inch, y - 1.5*inch)
    p.drawString(1*inch, y - 2*inch, "Official Stamp:")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer

def generate_registration_notice_pdf(contract, officer):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(1*inch, 10.5*inch, "WOREDA HOUSING OFFICE")
    p.setFont("Helvetica", 14)
    p.drawString(1*inch, 10*inch, "CERTIFICATE OF RENTAL CONTRACT REGISTRATION")
    p.setFont("Helvetica", 10)
    p.drawString(1*inch, 9*inch, f"Registration Number: {contract.contract_reg_number}")
    p.drawString(1*inch, 8.6*inch, f"Registration Date: {contract.updated_at.strftime('%B %d, %Y')}")
    p.drawString(4.5*inch, 8.7*inch, f"Officer: {officer.full_name_en}")
    p.setFont("Helvetica-Bold", 12)
    p.drawString(1*inch, 7.8*inch, "PROPERTY DETAILS")
    p.setFont("Helvetica", 12)
    p.drawString(1*inch, 7.5*inch, f"House Number: {contract.property.house_number}")
    p.drawString(1*inch, 7.2*inch, f"Monthly Rent: {contract.monthly_rent_etb} ETB")
    p.setFont("Helvetica-Bold", 12)
    p.drawString(1*inch, 6.5*inch, "PARTIES")
    p.setFont("Helvetica", 12)
    p.drawString(1*inch, 6.2*inch, f"Landlord: {contract.property.landlord.full_name_en} ({contract.property.landlord.phone_number})")
    if contract.tenant:
        p.drawString(1*inch, 5.9*inch, f"Tenant: {contract.tenant.full_name_en} ({contract.tenant.phone_number})")
    p.setFont("Helvetica-Bold", 12)
    p.drawString(1*inch, 5.2*inch, "LEASE TERM")
    p.setFont("Helvetica", 12)
    if contract.lease_start_date and contract.lease_end_date:
        p.drawString(1*inch, 4.9*inch, f"From: {contract.lease_start_date.strftime('%B %d, %Y')}")
        p.drawString(1*inch, 4.6*inch, f"To: {contract.lease_end_date.strftime('%B %d, %Y')}")
    p.drawString(1*inch, 3.5*inch, "This document certifies that the rental contract described above has")
    p.drawString(1*inch, 3.2*inch, "been successfully registered with the Woreda Housing Office.")
    p.drawString(1*inch, 2*inch, "Authorized Signature:")
    p.line(2.5*inch, 2*inch, 5*inch, 2*inch)
    p.drawString(1*inch, 1.2*inch, "Official Stamp:")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
