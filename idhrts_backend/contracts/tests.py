import bcrypt
from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, SubCity, Woreda
from properties.models import Property
from contracts.models import RentalContract


def make_pin_hash(pin='1234'):
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt(12)).decode()


class ContractTests(TestCase):
    """
    Comprehensive tests for ContractViewSet and PublicContractView:
    - Art. 13: Advance payment cannot exceed 2x monthly rent
    - Art. 6: Minimum lease duration of 24 months
    - Digital signing flow via secure token
    - Woreda authentication and reg number generation
    - RBAC: only WOREDA_OFFICER can authenticate
    - Tenant/Landlord queryset isolation
    """

    def setUp(self):
        self.client = APIClient()
        h = make_pin_hash()
        self.sub = SubCity.objects.create(name_en='Bole', name_am='ቦሌ', code='BO')
        self.wor = Woreda.objects.create(sub_city=self.sub, name_en='Woreda 03', name_am='ወረዳ 03', code='03')

        self.landlord = User.objects.create(phone_number='+251911300001', full_name_en='Landlord', full_name_am='', role='LANDLORD', pin_hash=h)
        self.tenant1 = User.objects.create(phone_number='+251911300002', full_name_en='Tenant1', full_name_am='', role='TENANT', pin_hash=h)
        self.tenant2 = User.objects.create(phone_number='+251911300003', full_name_en='Tenant2', full_name_am='', role='TENANT', pin_hash=h)
        self.woreda_officer = User.objects.create(phone_number='+251911300004', full_name_en='Officer', full_name_am='', role='WOREDA_OFFICER', pin_hash=h, sub_city=self.sub, woreda=self.wor)

        self.prop = Property.objects.create(
            landlord=self.landlord, sub_city=self.sub, woreda=self.wor,
            house_number='50B', building_type='APARTMENT',
            monthly_rent_etb=Decimal('5000.00'), status='ACTIVE'
        )

        self.contract = RentalContract.objects.create(
            landlord=self.landlord, tenant=self.tenant1, property=self.prop,
            monthly_rent_etb=Decimal('5000.00'),
            advance_payment_etb=Decimal('10000.00'),
            lease_start_date=date.today(),
            lease_duration_months=24,
            lease_end_date=date.today() + timedelta(days=730),
            payment_method='BANK_TRANSFER',
            status='DRAFT'
        )

    def _valid_contract_payload(self, **overrides):
        payload = {
            'property': str(self.prop.id),
            'tenant': str(self.tenant1.id),
            'monthly_rent_etb': '5000.00',
            'advance_payment_etb': '10000.00',
            'lease_start_date': str(date.today()),
            'lease_duration_months': 24,
            'lease_end_date': str(date.today() + timedelta(days=730)),
            'payment_method': 'BANK_TRANSFER',
        }
        payload.update(overrides)
        return payload

    def test_create_contract_success(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post('/api/contracts/', self._valid_contract_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'DRAFT')

    def test_advance_exceeds_2x_rent_blocked(self):
        """Art. 13: advance > 2x monthly rent must be blocked"""
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post(
            '/api/contracts/',
            self._valid_contract_payload(advance_payment_etb='15000.00'),  # 3x rent
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duration_less_than_24_months_blocked(self):
        """Art. 6: lease duration < 24 months must be blocked"""
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post(
            '/api/contracts/',
            self._valid_contract_payload(lease_duration_months=12),
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_exact_2x_advance_is_allowed(self):
        """Advance exactly equal to 2x rent must pass"""
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post(
            '/api/contracts/',
            self._valid_contract_payload(advance_payment_etb='10000.00'),  # exactly 2x
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_submit_to_tenant_generates_secure_token(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post(f'/api/contracts/{self.contract.id}/submit_to_tenant/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.status, 'PENDING_TENANT_SIGNATURE')
        self.assertIsNotNone(self.contract.secure_review_token)
        self.assertIn('review_link', response.data)

    def test_public_sign_endpoint_changes_status_to_signed(self):
        from users.models import OTP
        self.contract.status = 'PENDING_TENANT_SIGNATURE'
        self.contract.secure_review_token = 'abcdefghijklmnop12345678abcdef12'
        self.contract.secure_review_expires = timezone.now() + timedelta(days=7)
        self.contract.save()
        OTP.objects.create(phone_number=self.contract.tenant.phone_number, code='123456')
        response = self.client.post(
            f'/api/contracts/public/review/{self.contract.secure_review_token}/sign/',
            {'otp': '123456'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.status, 'SIGNED')

    def test_woreda_authenticate_sets_reg_number(self):
        self.contract.status = 'SIGNED'
        self.contract.save()
        self.client.force_authenticate(user=self.woreda_officer)
        response = self.client.post(f'/api/contracts/{self.contract.id}/authenticate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.status, 'REGISTERED')
        self.assertIsNotNone(self.contract.contract_reg_number)
        # Appendix D: [SubCityCode]-[WoredaCode]-[YYYY]-[XXXXXX]
        self.assertRegex(
            self.contract.contract_reg_number,
            rf'^{self.sub.code}-{self.wor.code}-{timezone.now().year}-\d{{6}}$'
        )

    def test_authenticate_creates_tax_assessment(self):
        """FR-TAX-001: assessment is created automatically on authentication."""
        from tax.models import TaxAssessment
        self.contract.status = 'SIGNED'
        self.contract.save()
        self.client.force_authenticate(user=self.woreda_officer)
        response = self.client.post(f'/api/contracts/{self.contract.id}/authenticate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        assessment = TaxAssessment.objects.get(contract=self.contract)
        self.assertEqual(str(assessment.id), response.data['assessment_id'])
        # Monthly 5,000 -> gross 60,000, deduction 12,000, taxable 48,000, tax 5,970
        self.assertEqual(assessment.gross_annual_rent_etb, Decimal('60000.00'))
        self.assertEqual(assessment.deduction_etb, Decimal('12000.00'))
        self.assertEqual(assessment.taxable_income_etb, Decimal('48000.00'))
        self.assertEqual(assessment.tax_due_etb, Decimal('5970.00'))
        self.assertEqual(assessment.status, 'PENDING')

    def test_authenticate_notifies_landlord_and_tenant(self):
        """FR-NOTIF-004/005: notification records created for both parties."""
        from notifications.models import Notification
        self.contract.status = 'SIGNED'
        self.contract.save()
        self.client.force_authenticate(user=self.woreda_officer)
        self.client.post(f'/api/contracts/{self.contract.id}/authenticate/')

        self.assertTrue(Notification.objects.filter(
            user=self.landlord, type='AUTH_APPROVED').exists())
        self.assertTrue(Notification.objects.filter(
            user=self.tenant1, type='AUTH_APPROVED').exists())
        self.assertTrue(Notification.objects.filter(
            user=self.landlord, type='TAX_ISSUED').exists())

    def test_authenticated_contract_pdf_download(self):
        """FR-CONT-012: registered contract PDF is downloadable by the landlord."""
        self.contract.status = 'SIGNED'
        self.contract.save()
        self.client.force_authenticate(user=self.woreda_officer)
        self.client.post(f'/api/contracts/{self.contract.id}/authenticate/')

        self.client.force_authenticate(user=self.landlord)
        response = self.client.get(f'/api/contracts/{self.contract.id}/pdf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('attachment', response['Content-Disposition'])
        content = b''.join(response.streaming_content) if response.streaming else response.content
        self.assertTrue(content.startswith(b'%PDF'))

    def test_pdf_requires_registered_contract(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.get(f'/api/contracts/{self.contract.id}/pdf/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_pdf_requires_authentication(self):
        self.contract.status = 'REGISTERED'
        self.contract.contract_reg_number = 'BO-03-2026-000009'
        self.contract.save()
        response = self.client.get(f'/api/contracts/{self.contract.id}/pdf/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_landlord_cannot_authenticate_contract(self):
        self.contract.status = 'SIGNED'
        self.contract.save()
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post(f'/api/contracts/{self.contract.id}/authenticate/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tenant_sees_only_their_own_contracts(self):
        # Create contract for tenant2
        RentalContract.objects.create(
            landlord=self.landlord, tenant=self.tenant2, property=self.prop,
            monthly_rent_etb=Decimal('5000.00'), advance_payment_etb=Decimal('10000.00'),
            lease_start_date=date.today(), lease_duration_months=24,
            lease_end_date=date.today() + timedelta(days=730),
            payment_method='BANK_TRANSFER', status='DRAFT'
        )
        self.client.force_authenticate(user=self.tenant1)
        response = self.client.get('/api/contracts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
