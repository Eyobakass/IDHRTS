import sys
from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from users.models import User
from contracts.models import RentalContract
from disputes.models import Dispute

def run():
    client = APIClient()
    contract = RentalContract.objects.filter(status='REGISTERED').first()
    tenant = contract.tenant
    client.force_authenticate(user=tenant)
    print(f'\n--- STRICT BACKEND VALIDATION ---')
    print(f'[BEFORE] Disputes count in DB: {Dispute.objects.count()}')
    
    response = client.post(
        '/api/disputes/', 
        {'contract': str(contract.id), 'dispute_type': 'UNLAWFUL_RENT_INCREASE', 'description': 'My landlord illegally raised my rent without providing the legally required notice period as defined by the regional housing authorities. I am filing this dispute to seek administrative intervention before they attempt an unlawful eviction.'}, 
        format='json'
    )
    
    print(f'[RESPONSE STATUS]: {response.status_code}')
    if response.status_code == 201:
        print(f'[RESPONSE DATA]: Dispute created successfully. ID: {response.json()["id"]}')
        print(f'[DISPUTE TYPE]: {response.json()["dispute_type"]}')
        print(f'[ASSIGNED TO]: Woreda {response.json()["woreda"]} Officer')
    else:
        print(f'[RESPONSE ERROR]: {response.content.decode("utf-8")}')
        
    print(f'[AFTER] Disputes count in DB: {Dispute.objects.count()}')
    print(f'--- VALIDATION COMPLETE ---\n')

if __name__ == '__main__':
    run()
