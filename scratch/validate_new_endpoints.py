import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def print_result(name, res):
    if str(res.status_code).startswith('2'):
        print(f"[PASS] {name} PASSED ({res.status_code})")
    else:
        print(f"[FAIL] {name} FAILED ({res.status_code}) - {res.text}")

def run_validations():
    print("--- RE-VALIDATING ALL ENDPOINTS ---")
    
    # 1. Test RegisterView Vulnerability Fix
    res = requests.post(f"{BASE_URL}/auth/register/", json={
        "phone_number": f"+251911{int(time.time()) % 1000000:06d}",
        "pin": "1234",
        "role": "ADMIN"
    })
    if res.status_code == 400 and "LANDLORD or TENANT" in res.text:
        print("[PASS] RegisterView Admin Vulnerability Blocked PASSED (400)")
    else:
        print(f"[FAIL] RegisterView Admin Vulnerability Blocked FAILED - {res.status_code} {res.text}")

    # Register a landlord properly to get a token
    landlord_phone = f"+251911{int(time.time() + 1) % 1000000:06d}"
    res = requests.post(f"{BASE_URL}/auth/register/", json={
        "phone_number": landlord_phone,
        "pin": "1234",
        "role": "LANDLORD"
    })
    
    # Login as Admin
    res = requests.post(f"{BASE_URL}/auth/login/", json={
        "phone_number": "+251999999999",
        "pin": "1234"
    })
    
    if res.status_code != 200:
        print(f"Failed to login as admin: {res.text}")
        return
        
    admin_token = res.json().get('access')
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 2. Test Admin Configs
    res = requests.get(f"{BASE_URL}/auth/system-config/", headers=admin_headers)
    print_result("SystemConfig GET", res)
    
    # Test updating a config
    res = requests.put(f"{BASE_URL}/auth/system-config/", headers=admin_headers, json={
        "key": "RENT_HIKE_CEILING_PCT",
        "value": "12.0"
    })
    print_result("SystemConfig PUT (Update config)", res)

    # 3. Test Create Officer
    officer_phone = f"+251922{int(time.time() + 2) % 1000000:06d}"
    res = requests.post(f"{BASE_URL}/auth/officers/create/", headers=admin_headers, json={
        "phone_number": officer_phone,
        "full_name_en": "New Officer",
        "role": "WOREDA_OFFICER"
    })
    print_result("Create Officer (Admin)", res)
    
    # 4. Test Audit Logs (should have an entry for the config update)
    res = requests.get(f"{BASE_URL}/auth/audit-logs/", headers=admin_headers)
    print_result("Audit Logs GET", res)
    if res.status_code == 200 and len(res.json()) > 0:
        print("[PASS] Audit Log contains entries")
    else:
        print("[FAIL] Audit Log is empty or failed")

    # 5. Test Export CSV
    res = requests.get(f"{BASE_URL}/reports/export/users/", headers=admin_headers)
    if res.status_code == 200 and "text/csv" in res.headers.get("Content-Type", ""):
        print("[PASS] Database CSV Export PASSED")
    else:
        print(f"[FAIL] Database CSV Export FAILED ({res.status_code})")

    # 6. Test Property Search/Filtering (Unauthenticated or as landlord/admin)
    res = requests.get(f"{BASE_URL}/properties/?status=ACTIVE&search=TEST", headers=admin_headers)
    print_result("Property Filter & Search GET", res)

    # 7. Test Forgot PIN Request
    res = requests.post(f"{BASE_URL}/auth/pin/request-reset/", json={
        "phone_number": landlord_phone
    })
    print_result("Forgot PIN Request OTP", res)
    
    # 8. Test Session List
    res = requests.get(f"{BASE_URL}/auth/sessions/", headers=admin_headers)
    print_result("Session List GET", res)
    
    # 9. Test Multi-Device Fingerprint Limit
    # We will log in 3 more times with DIFFERENT User-Agents to simulate different devices
    headers1 = {"User-Agent": "Device1"}
    requests.post(f"{BASE_URL}/auth/login/", headers=headers1, json={"phone_number": "+251999999999", "pin": "1234"})
    
    headers2 = {"User-Agent": "Device2"}
    requests.post(f"{BASE_URL}/auth/login/", headers=headers2, json={"phone_number": "+251999999999", "pin": "1234"})
    
    headers3 = {"User-Agent": "Device3"}
    res_limit = requests.post(f"{BASE_URL}/auth/login/", headers=headers3, json={"phone_number": "+251999999999", "pin": "1234"})
    
    if res_limit.status_code == 403 and "Maximum of 3 active devices" in res_limit.text:
        print("[PASS] Multi-Device Max Limit Enforced PASSED (403)")
    else:
        print(f"[FAIL] Multi-Device Max Limit Enforced FAILED - Expected 403, got {res_limit.status_code}")

if __name__ == "__main__":
    run_validations()
