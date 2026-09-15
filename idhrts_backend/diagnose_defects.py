import os, sys, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()
from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from users.models import User
from properties.models import Property
from disputes.models import Dispute
from tax.models import TaxAssessment

landlord = User.objects.get(phone_number='+251900000001')
tenant   = User.objects.get(phone_number='+251900000002')

tn = APIClient()
tn.force_authenticate(user=tenant)
ll = APIClient()
ll.force_authenticate(user=landlord)

# DEFECT 1: TENANT sees ALL properties (IDOR)
r = tn.get('/api/properties/')
data = r.json()
items = data if isinstance(data, list) else data.get('results', [])
print(f"DEFECT 1: TENANT /api/properties/ count={len(items)}")
print(f"  PropertyViewSet.get_queryset for TENANT falls through to all() because no 'TENANT' branch!")

# DEFECT 2: SIGTAS URL
import django.urls
try:
    url = django.urls.reverse('sigtas-export')
    print(f"SIGTAS URL found: {url}")
except Exception as e:
    print(f"DEFECT 2: SIGTAS URL not registered: {e}")

# DEFECT 3: Dashboard metrics keys
r2 = ll.get('/api/reports/dashboard-metrics/')
print(f"Dashboard status: {r2.status_code}")
if r2.status_code == 200:
    keys = list(r2.json().keys())
    print(f"Dashboard keys: {keys}")
    required = ['total_properties', 'total_contracts', 'total_disputes']
    missing = [k for k in required if k not in keys]
    print(f"Missing required keys: {missing}")

# DEFECT 4: LANDLORD property submit returned 400
draft_prop = Property.objects.filter(status='DRAFT', landlord=landlord).first()
if draft_prop:
    r3 = ll.post('/api/properties/' + str(draft_prop.id) + '/submit/')
    print(f"Property submit status: {r3.status_code}, response: {r3.content.decode()[:300]}")
else:
    print("No DRAFT property for landlord found")

# DEFECT 5: TENANT accessing another user's tax breakdown  
ta = TaxAssessment.objects.first()
if ta:
    r4 = tn.get('/api/tax/' + str(ta.id) + '/breakdown/')
    print(f"TENANT tax breakdown status: {r4.status_code} (should be 404)")
else:
    print("No TaxAssessment exists")

# DEFECT 6: TENANT can call submit_to_tenant on pending contract (it's theirs as tenant)
from contracts.models import RentalContract
pc = RentalContract.objects.filter(status='PENDING_TENANT_SIGNATURE').first()
if pc:
    r5 = tn.post('/api/contracts/' + str(pc.id) + '/submit_to_tenant/')
    print(f"TENANT submit_to_tenant: {r5.status_code} (should be 403, but no role guard!)")

# Check what the PropertyViewSet queryset returns for TENANT
from properties.views import PropertyViewSet
print("\nPropertyViewSet.get_queryset logic:")
print("  if role==LANDLORD: filter by landlord")
print("  elif role==WOREDA_OFFICER: filter by woreda")
print("  else (TENANT/TAX/ADMIN): return ALL properties  <-- IDOR BUG")
