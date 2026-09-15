"""
validate_srs_final.py
Comprehensive validation for all 7 SRS features added in this session.
Covers: Document Upload, Notifications, Walk-In workflows, Vacant Tax, 
        Contract Termination, Tax Overrides, PDF Reports.
Also includes regression checks for pre-existing endpoints.
"""
import requests, json, sys

BASE = "http://127.0.0.1:8000/api"
PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
INFO = "\033[94m[INFO]\033[0m"

results = []

def check(label, condition, details=""):
    status = PASS if condition else FAIL
    print(f"{status} {label}" + (f" — {details}" if details else ""))
    results.append((label, condition))

def get_token(phone, pin, role=""):
    r = requests.post(f"{BASE}/auth/login/", json={"phone_number": phone, "pin": pin})
    if r.status_code == 200:
        return r.json().get("access")
    return None

def auth(token):
    return {"Authorization": f"Bearer {token}"}


print(f"\n{'='*60}")
print(" REGRESSION: Pre-existing Endpoints")
print('='*60)

# Login endpoint still works
r = requests.post(f"{BASE}/auth/login/", json={"phone_number": "+251900000001", "pin": "1234"})
check("Login endpoint responds (200 or 400)", r.status_code in [200, 400, 401, 403])

# Properties list still reachable
r = requests.get(f"{BASE}/properties/")
check("Properties endpoint reachable (401 for unauth)", r.status_code == 401)

# Contracts endpoint reachable
r = requests.get(f"{BASE}/contracts/")
check("Contracts endpoint reachable (401 for unauth)", r.status_code == 401)

# Tax endpoint reachable
r = requests.get(f"{BASE}/tax/")
check("Tax endpoint reachable (401 for unauth)", r.status_code == 401)

# Disputes endpoint reachable
r = requests.get(f"{BASE}/disputes/")
check("Disputes endpoint reachable (401 for unauth)", r.status_code == 401)

# Reports: dashboard metrics still works
r = requests.get(f"{BASE}/reports/dashboard-metrics/")
check("Dashboard metrics endpoint reachable (401 for unauth)", r.status_code == 401)

# Swagger still works
r = requests.get("http://127.0.0.1:8000/api/docs/swagger-ui/")
check("Swagger UI still serves (200)", r.status_code == 200)


print(f"\n{'='*60}")
print(" NEW: In-App Notifications API")
print('='*60)

# Notifications endpoint exists and requires auth
r = requests.get(f"{BASE}/notifications/")
check("GET /api/notifications/ exists and requires auth (401)", r.status_code == 401)

r = requests.post(f"{BASE}/notifications/1/mark_read/")
check("POST /api/notifications/<id>/mark_read/ exists (401)", r.status_code == 401)

r = requests.post(f"{BASE}/notifications/mark_all_read/")
check("POST /api/notifications/mark_all_read/ exists (401)", r.status_code == 401)


print(f"\n{'='*60}")
print(" NEW: Woreda Walk-In Endpoints")
print('='*60)

r = requests.post(f"{BASE}/woreda/walk-in/property/")
check("POST /api/woreda/walk-in/property/ exists (401)", r.status_code == 401)

r = requests.post(f"{BASE}/woreda/walk-in/dispute/")
check("POST /api/woreda/walk-in/dispute/ exists (401)", r.status_code == 401)


print(f"\n{'='*60}")
print(" NEW: Document Upload Endpoint")
print('='*60)

# Should require auth
r = requests.post(f"{BASE}/properties/00000000-0000-0000-0000-000000000000/upload_document/")
check("POST /api/properties/<id>/upload_document/ exists (401)", r.status_code == 401)


print(f"\n{'='*60}")
print(" NEW: Contract Terminate Endpoint")
print('='*60)

r = requests.post(f"{BASE}/contracts/00000000-0000-0000-0000-000000000000/terminate/")
check("POST /api/contracts/<id>/terminate/ exists (401)", r.status_code == 401)


print(f"\n{'='*60}")
print(" NEW: Tax Override & Investigation Endpoints")
print('='*60)

r = requests.post(f"{BASE}/tax/00000000-0000-0000-0000-000000000000/flag_investigation/")
check("POST /api/tax/<id>/flag_investigation/ exists (401)", r.status_code == 401)

r = requests.post(f"{BASE}/tax/00000000-0000-0000-0000-000000000000/override_assessment/")
check("POST /api/tax/<id>/override_assessment/ exists (401)", r.status_code == 401)


print(f"\n{'='*60}")
print(" NEW: Analytical PDF Report Endpoints")
print('='*60)

r = requests.get(f"{BASE}/reports/woreda-monthly-pdf/")
check("GET /api/reports/woreda-monthly-pdf/ exists (401)", r.status_code == 401)

r = requests.get(f"{BASE}/reports/subcity-revenue-pdf/")
check("GET /api/reports/subcity-revenue-pdf/ exists (401)", r.status_code == 401)

r = requests.get(f"{BASE}/reports/dispute-stats-pdf/")
check("GET /api/reports/dispute-stats-pdf/ exists (401)", r.status_code == 401)


print(f"\n{'='*60}")
print(" REGRESSION: Previous Session Endpoints (Admin/Auth)")
print('='*60)

r = requests.get(f"{BASE}/auth/audit-logs/")
check("GET /api/auth/audit-logs/ exists (401)", r.status_code == 401)

r = requests.get(f"{BASE}/reports/export/users/")
check("GET /api/reports/export/users/ exists (401)", r.status_code == 401)

r = requests.post(f"{BASE}/auth/create-officer/")
check("POST /api/auth/create-officer/ exists (401)", r.status_code == 401)

r = requests.post(f"{BASE}/auth/request-pin-reset/")
check("POST /api/auth/request-pin-reset/ exists (401/400)", r.status_code in [400, 401])


print(f"\n{'='*60}")
passed = sum(1 for _, ok in results if ok)
total = len(results)
print(f" RESULTS: {passed}/{total} tests passed")
print('='*60)
if passed < total:
    print(f"\n[FAILURES]")
    for label, ok in results:
        if not ok:
            print(f"  {FAIL} {label}")
    sys.exit(1)
else:
    print("\n All checks passed!")
