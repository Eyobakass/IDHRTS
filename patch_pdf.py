import codecs
with codecs.open(r"idhrts_backend\core\pdf_utils.py", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """def generate_secure_qr(data: dict) -> bytes:
    payload_str = json.dumps(data, sort_keys=True)
    sig = hmac.new(settings.HMAC_SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    qr_content = json.dumps({"data": data, "sig": sig})
    
    qr = qrcode.make(qr_content)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    return buffer.getvalue()

def generate_contract_pdf(contract):
    qr_bytes = generate_secure_qr({
        "reg_no": contract.contract_reg_number or "N/A",
        "property_id": str(contract.property.id),
        "signed_at": contract.signing_date.isoformat() if contract.signing_date else ""
    })"""

new_logic = """def generate_secure_qr(data: dict) -> bytes:
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
    qr_bytes = generate_secure_qr(qr_data)"""

content = content.replace(old_logic, new_logic)
with codecs.open(r"idhrts_backend\core\pdf_utils.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated core/pdf_utils.py")
