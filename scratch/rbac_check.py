import re, sys

checks = [
    ("properties/views.py", "upload_document", "role != 'LANDLORD'"),
    ("woreda/views.py", "WalkInPropertyRegistrationView", "role != 'WOREDA_OFFICER'"),
    ("tax/views.py", "flag_investigation", "role != 'TAX_OFFICER'"),
    ("tax/views.py", "override_assessment", "TAX_OFFICER"),
    ("contracts/views.py", "terminate", "LANDLORD"),
    ("reports/views.py", "WoredaMonthlyReportPDFView", "WOREDA_OFFICER"),
]

all_ok = True
for filepath, fn_name, pattern in checks:
    content = open(f"idhrts_backend/{filepath}").read()
    if pattern in content:
        print(f"[RBAC OK] {filepath} / {fn_name}: {pattern!r}")
    else:
        print(f"[RBAC MISSING] {filepath} / {fn_name}: {pattern!r}")
        all_ok = False

print()
if all_ok:
    print("ALL RBAC ROLE CHECKS PRESENT")
else:
    sys.exit(1)
