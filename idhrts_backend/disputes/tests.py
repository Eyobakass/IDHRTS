from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from users.models import User, SubCity, Woreda
from .models import Dispute

class DisputeTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/disputes/'

        # Setup SubCity and Woredas
        self.sub_city = SubCity.objects.create(name_en='Bole', name_am='Bole_AM', code='01')
        self.woreda1 = Woreda.objects.create(sub_city=self.sub_city, name_en='W1', name_am='W1_AM', code='W01')
        self.woreda2 = Woreda.objects.create(sub_city=self.sub_city, name_en='W2', name_am='W2_AM', code='W02')

        # Setup Users
        self.landlord1 = User.objects.create(
            phone_number='0911000001', role='LANDLORD', pin_hash='$2b$12$fakehashfortest', sub_city=self.sub_city, woreda=self.woreda1
        )
        self.landlord2 = User.objects.create(
            phone_number='0911000002', role='LANDLORD', pin_hash='$2b$12$fakehashfortest', sub_city=self.sub_city, woreda=self.woreda2
        )
        self.tenant1 = User.objects.create(
            phone_number='0911000003', role='TENANT', pin_hash='$2b$12$fakehashfortest', sub_city=self.sub_city, woreda=self.woreda1
        )
        self.tenant2 = User.objects.create(
            phone_number='0911000004', role='TENANT', pin_hash='$2b$12$fakehashfortest', sub_city=self.sub_city, woreda=self.woreda2
        )
        self.woreda_officer1 = User.objects.create(
            phone_number='0911000005', role='WOREDA_OFFICER', pin_hash='$2b$12$fakehashfortest', sub_city=self.sub_city, woreda=self.woreda1
        )
        self.woreda_officer2 = User.objects.create(
            phone_number='0911000006', role='WOREDA_OFFICER', pin_hash='$2b$12$fakehashfortest', sub_city=self.sub_city, woreda=self.woreda2
        )

        # Base valid payload
        self.valid_payload = {
            'dispute_type': 'UNREGISTERED_CONTRACT',
            'woreda': self.woreda1.id,
            'description': 'A' * 100,
            'incident_date': '2023-01-01'
        }

    def test_create_dispute_success(self):
        self.client.force_authenticate(user=self.tenant1)
        response = self.client.post(self.url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'FILED')
        self.assertEqual(str(response.data['filer']), str(self.tenant1.id))
        self.assertEqual(Dispute.objects.count(), 1)

    def test_create_dispute_description_too_short(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        payload['description'] = 'A' * 50
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Dispute.objects.count(), 0)

    def test_create_dispute_description_exact_99_chars(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        payload['description'] = 'A' * 99
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Dispute.objects.count(), 0)

    def test_create_dispute_description_exact_100_chars(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        payload['description'] = 'A' * 100
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Dispute.objects.count(), 1)

    def test_create_dispute_unauthenticated(self):
        response = self.client.post(self.url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Dispute.objects.count(), 0)

    def test_create_dispute_status_always_filed(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        payload['status'] = 'CLOSED'
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        dispute = Dispute.objects.get(id=response.data['id'])
        self.assertEqual(dispute.status, 'FILED')

    def test_create_dispute_filer_always_set_to_requester(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        payload['filer'] = self.landlord1.id
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        dispute = Dispute.objects.get(id=response.data['id'])
        self.assertEqual(dispute.filer, self.tenant1)

    def test_landlord_sees_own_filed_disputes(self):
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.landlord1, woreda=self.woreda1, description='A'*100
        )
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]['filer']), str(self.landlord1.id))

    def test_landlord_sees_disputes_as_respondent(self):
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant1, respondent=self.landlord1, woreda=self.woreda1, description='A'*100
        )
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]['respondent']), str(self.landlord1.id))

    def test_landlord_cannot_see_unrelated_disputes(self):
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant2, respondent=self.landlord2, woreda=self.woreda2, description='A'*100
        )
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_tenant_isolation(self):
        # tenant1's dispute
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant1, woreda=self.woreda1, description='A'*100
        )
        # unrelated dispute
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.landlord2, respondent=self.tenant2, woreda=self.woreda2, description='A'*100
        )
        self.client.force_authenticate(user=self.tenant1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]['filer']), str(self.tenant1.id))

    def test_woreda_officer_sees_only_woreda_disputes(self):
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant1, woreda=self.woreda1, description='A'*100
        )
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.landlord1, woreda=self.woreda1, description='A'*100
        )
        self.client.force_authenticate(user=self.woreda_officer1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_woreda_officer_cross_woreda_isolation(self):
        # dispute in woreda2
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant2, woreda=self.woreda2, description='A'*100
        )
        self.client.force_authenticate(user=self.woreda_officer1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_dispute_with_invalid_type(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        payload['dispute_type'] = 'INVALID_TYPE'
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Dispute.objects.count(), 0)

    def test_create_dispute_with_optional_contract(self):
        self.client.force_authenticate(user=self.tenant1)
        payload = self.valid_payload.copy()
        # contract is implicitly None because it's not in the payload
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        dispute = Dispute.objects.get(id=response.data['id'])
        self.assertIsNone(dispute.contract)

    def test_admin_sees_all_disputes(self):
        admin = User.objects.create(phone_number='0911000099', role='ADMIN', pin_hash='$2b$12$fakehashfortest')
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant1, woreda=self.woreda1, description='A'*100
        )
        Dispute.objects.create(
            dispute_type='OTHER', filer=self.tenant2, woreda=self.woreda2, description='A'*100
        )
        self.client.force_authenticate(user=admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

