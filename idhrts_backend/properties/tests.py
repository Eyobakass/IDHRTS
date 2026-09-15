import bcrypt
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, SubCity, Woreda
from properties.models import Property


def make_pin_hash(pin='1234'):
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt(12)).decode()


class PropertyTests(TestCase):
    """
    Comprehensive tests for PropertyViewSet:
    - Role-based access (Landlord vs Woreda Officer)
    - Property state machine: DRAFT -> PENDING_REVIEW -> ACTIVE / DRAFT
    - Rejection reason length enforcement (min 20 chars)
    - RBAC: only WOREDA_OFFICER can approve/reject
    """

    def setUp(self):
        self.client = APIClient()
        self.sub = SubCity.objects.create(name_en='Bole', name_am='ቦሌ', code='BO')
        self.wor = Woreda.objects.create(sub_city=self.sub, name_en='Woreda 03', name_am='ወረዳ 03', code='03')
        self.wor2 = Woreda.objects.create(sub_city=self.sub, name_en='Woreda 04', name_am='ወረዳ 04', code='04')

        h = make_pin_hash()
        self.landlord1 = User.objects.create(phone_number='+251911100001', full_name_en='Landlord1', full_name_am='', role='LANDLORD', pin_hash=h)
        self.landlord2 = User.objects.create(phone_number='+251911100002', full_name_en='Landlord2', full_name_am='', role='LANDLORD', pin_hash=h)
        self.woreda_officer = User.objects.create(phone_number='+251911100003', full_name_en='Officer', full_name_am='', role='WOREDA_OFFICER', pin_hash=h, sub_city=self.sub, woreda=self.wor)

        self.property1 = Property.objects.create(
            landlord=self.landlord1, sub_city=self.sub, woreda=self.wor,
            house_number='100', building_type='VILLA',
            monthly_rent_etb=Decimal('5000.00'), status='DRAFT'
        )

    def test_landlord_can_create_property(self):
        self.client.force_authenticate(user=self.landlord1)
        data = {
            'sub_city': str(self.sub.id), 'woreda': str(self.wor.id),
            'house_number': '200', 'building_type': 'APARTMENT',
            'monthly_rent_etb': '7000.00'
        }
        response = self.client.post('/api/properties/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'DRAFT')

    def test_landlord_only_sees_own_properties(self):
        Property.objects.create(
            landlord=self.landlord2, sub_city=self.sub, woreda=self.wor,
            house_number='300', building_type='VILLA',
            monthly_rent_etb=Decimal('6000.00'), status='DRAFT'
        )
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # landlord1 should only see their own 1 property
        ids = [p['id'] for p in response.data]
        self.assertEqual(len(ids), 1)
        self.assertEqual(response.data[0]['house_number'], '100')

    def test_submit_property(self):
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.post(f'/api/properties/{self.property1.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property1.refresh_from_db()
        self.assertEqual(self.property1.status, 'PENDING_REVIEW')

    def test_cannot_submit_active_property(self):
        self.property1.status = 'ACTIVE'
        self.property1.save()
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.post(f'/api/properties/{self.property1.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_woreda_officer_can_approve(self):
        self.property1.status = 'PENDING_REVIEW'
        self.property1.save()
        self.client.force_authenticate(user=self.woreda_officer)
        response = self.client.post(f'/api/properties/{self.property1.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property1.refresh_from_db()
        self.assertEqual(self.property1.status, 'ACTIVE')

    def test_woreda_officer_can_reject_with_valid_reason(self):
        self.property1.status = 'PENDING_REVIEW'
        self.property1.save()
        self.client.force_authenticate(user=self.woreda_officer)
        response = self.client.post(
            f'/api/properties/{self.property1.id}/reject/',
            {'reason': 'This is a valid rejection reason, it has more than 20 characters.'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property1.refresh_from_db()
        self.assertEqual(self.property1.status, 'DRAFT')

    def test_reject_reason_too_short_returns_400(self):
        self.property1.status = 'PENDING_REVIEW'
        self.property1.save()
        self.client.force_authenticate(user=self.woreda_officer)
        response = self.client.post(
            f'/api/properties/{self.property1.id}/reject/',
            {'reason': 'Too short'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_woreda_officer_cannot_approve(self):
        self.property1.status = 'PENDING_REVIEW'
        self.property1.save()
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.post(f'/api/properties/{self.property1.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_sees_all_properties(self):
        admin = User.objects.create(phone_number='+251911100099', full_name_en='Admin', full_name_am='', role='ADMIN', pin_hash=make_pin_hash())
        Property.objects.create(
            landlord=self.landlord2, sub_city=self.sub, woreda=self.wor,
            house_number='300', building_type='VILLA',
            monthly_rent_etb=Decimal('6000.00'), status='DRAFT'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # admin should see both properties
        ids = [p['id'] for p in response.data]
        self.assertEqual(len(ids), 2)

    def test_non_woreda_officer_cannot_reject(self):
        self.property1.status = 'PENDING_REVIEW'
        self.property1.save()
        self.client.force_authenticate(user=self.landlord1)
        response = self.client.post(f'/api/properties/{self.property1.id}/reject/', {'reason': 'Very long reason text to reject the property'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

