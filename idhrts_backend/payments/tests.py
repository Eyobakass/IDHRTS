import hmac
import hashlib
import json
from decimal import Decimal
import bcrypt
from datetime import date, timedelta
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, SubCity, Woreda
from properties.models import Property
from contracts.models import RentalContract
from tax.models import TaxAssessment
from payments.models import TaxPayment
from unittest.mock import patch


@override_settings(CHAPA_WEBHOOK_SECRET='test_webhook_secret')
class ChapaWebhookTests(TestCase):
    """Unit tests for Chapa HMAC webhook verification and payment confirmation"""

    def setUp(self):
        self.client = APIClient()
        # ChapaWebhookView is registered at router prefix 'webhook'
        # action name 'webhook' -> URL: /api/payments/webhook/webhook/
        self.webhook_url = '/api/payments/webhook/webhook/'
        self.initialize_url = '/api/payments/initialize_chapa/'

        pin_hash = bcrypt.hashpw('1234'.encode(), bcrypt.gensalt(12)).decode()
        self.sub = SubCity.objects.create(name_en='Bole', name_am='ቦሌ', code='BO')
        self.wor = Woreda.objects.create(sub_city=self.sub, name_en='Woreda 03', name_am='ወረዳ 03', code='03')
        self.landlord = User.objects.create(
            phone_number='+251911200001', full_name_en='Test Landlord',
            full_name_am='', role='LANDLORD', pin_hash=pin_hash
        )
        self.tenant = User.objects.create(
            phone_number='+251911200002', full_name_en='Test Tenant',
            full_name_am='', role='TENANT', pin_hash=pin_hash
        )
        self.prop = Property.objects.create(
            landlord=self.landlord, sub_city=self.sub, woreda=self.wor,
            house_number='10A', building_type='VILLA',
            monthly_rent_etb=Decimal('5000.00'), status='ACTIVE'
        )
        self.contract = RentalContract.objects.create(
            landlord=self.landlord, tenant=self.tenant, property=self.prop,
            monthly_rent_etb=Decimal('5000.00'), advance_payment_etb=Decimal('10000.00'),
            lease_start_date=date.today(), lease_duration_months=24,
            lease_end_date=date.today() + timedelta(days=730),
            payment_method='BANK_TRANSFER', status='REGISTERED'
        )
        self.assessment = TaxAssessment.objects.create(
            contract=self.contract, property=self.prop, landlord=self.landlord,
            fiscal_year='2025/2026',
            gross_annual_rent_etb=Decimal('60000.00'),
            deduction_etb=Decimal('12000.00'),
            taxable_income_etb=Decimal('48000.00'),
            tax_due_etb=Decimal('3600.00'),
            effective_rate_pct=Decimal('6.00'),
            status='PENDING',
            due_date=date.today() + timedelta(days=30)
        )
        # Pre-created payment for webhook tests (uses unique tx_ref)
        self.payment = TaxPayment.objects.create(
            assessment=self.assessment, landlord=self.landlord,
            amount_etb=Decimal('3600.00'),
            payment_method='CHAPA_TELEBIRR',
            status='PROCESSING',
            chapa_tx_ref='TX-WEBHOOK-TEST-001'
        )

    def _make_signature(self, payload_bytes, secret='test_webhook_secret'):
        return hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()

    def test_webhook_valid_signature_confirms_payment(self):
        """Valid HMAC signature + matching tx_ref confirms payment → 200"""
        payload = json.dumps({'status': 'success', 'tx_ref': 'TX-WEBHOOK-TEST-001'}).encode()
        sig = self._make_signature(payload)
        response = self.client.post(
            self.webhook_url, data=payload,
            content_type='application/json',
            HTTP_X_CHAPA_SIGNATURE=sig
        )
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'CONFIRMED')

    def test_webhook_invalid_signature_rejected(self):
        """Wrong HMAC signature must return 400"""
        payload = json.dumps({'status': 'success', 'tx_ref': 'TX-WEBHOOK-TEST-001'}).encode()
        response = self.client.post(
            self.webhook_url, data=payload,
            content_type='application/json',
            HTTP_X_CHAPA_SIGNATURE='thisisawrongsignature'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_webhook_missing_signature_rejected(self):
        """No X-CHAPA-SIGNATURE header must return 400"""
        payload = json.dumps({'status': 'success', 'tx_ref': 'TX-WEBHOOK-TEST-001'}).encode()
        response = self.client.post(
            self.webhook_url, data=payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_webhook_updates_assessment_to_paid(self):
        """Valid webhook also marks linked TaxAssessment as PAID"""
        payload = json.dumps({'status': 'success', 'tx_ref': 'TX-WEBHOOK-TEST-001'}).encode()
        sig = self._make_signature(payload)
        self.client.post(
            self.webhook_url, data=payload,
            content_type='application/json',
            HTTP_X_CHAPA_SIGNATURE=sig
        )
        self.assessment.refresh_from_db()
        self.assertEqual(self.assessment.status, 'PAID')

    @patch('requests.post')
    def test_initialize_chapa_creates_payment_record(self, mock_post):
        """Authenticated POST to initialize_chapa returns checkout_url and tx_ref.
        Chapa key is injected via override_settings so the guard doesn't block."""
        from django.test import override_settings
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"data": {"checkout_url": "https://chapa.co"}}
        # Delete the pre-existing payment so initialize_chapa can create a fresh one
        self.payment.delete()
        self.client.force_authenticate(user=self.landlord)
        with override_settings(CHAPA_SECRET_KEY='test-chapa-key'):
            response = self.client.post(
                self.initialize_url,
                {'assessment_id': str(self.assessment.id)},
                format='json'
            )
        self.assertEqual(response.status_code, 200)
        self.assertIn('checkout_url', response.data)
        self.assertIn('tx_ref', response.data)


    @patch('requests.post')
    def test_initialize_chapa_duplicate_call_should_be_idempotent_or_fail_cleanly(self, mock_post):
        """Regression test: calling initialize_chapa twice must be idempotent (not crash with IntegrityError)"""
        from django.test import override_settings
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"data": {"checkout_url": "https://chapa.co"}}
        self.payment.delete()
        self.client.force_authenticate(user=self.landlord)
        with override_settings(CHAPA_SECRET_KEY='test-chapa-key'):
            # First call should succeed
            res1 = self.client.post(self.initialize_url, {'assessment_id': str(self.assessment.id)}, format='json')
            self.assertEqual(res1.status_code, 200)
            tx_ref_1 = res1.data['tx_ref']

            # Second call must also succeed and return the SAME tx_ref (idempotent)
            res2 = self.client.post(self.initialize_url, {'assessment_id': str(self.assessment.id)}, format='json')
            self.assertEqual(res2.status_code, 200)
            tx_ref_2 = res2.data['tx_ref']

        self.assertEqual(tx_ref_1, tx_ref_2)
        # Only one payment record should exist in the DB
        from payments.models import TaxPayment
        self.assertEqual(TaxPayment.objects.filter(assessment=self.assessment).count(), 1)

    def test_initialize_chapa_cross_user_isolation(self):
        """User B cannot initialize a payment for User A's assessment"""
        self.client.force_authenticate(user=self.tenant)
        res = self.client.post(self.initialize_url, {'assessment_id': str(self.assessment.id)}, format='json')
        self.assertEqual(res.status_code, 404)

    def test_initialize_chapa_nonexistent_assessment(self):
        """Using a random UUID should return 404"""
        import uuid
        self.client.force_authenticate(user=self.landlord)
        res = self.client.post(self.initialize_url, {'assessment_id': str(uuid.uuid4())}, format='json')
        self.assertEqual(res.status_code, 404)
