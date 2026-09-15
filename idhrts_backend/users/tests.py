import bcrypt
from django.test import TestCase
from django.urls import path
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from users.models import User, OTP
from users.views import LoginView, RegisterView, RegisterVerifyView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('register/verify/', RegisterVerifyView.as_view(), name='register-verify'),
]


class AuthTests(TestCase):
    """
    Comprehensive unit tests for Auth endpoints:
    - LoginView: POST /auth/login/
    - RegisterView: POST /auth/register/
    """

    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        self.register_url = '/api/auth/register/'

        self.phone_number = '+251911000001'
        self.pin = '1234'
        pin_hash = bcrypt.hashpw(self.pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')

        self.user = User.objects.create(
            phone_number=self.phone_number,
            full_name_en='Test Landlord',
            full_name_am='ቴስት ዩዘር',
            role='LANDLORD',
            pin_hash=pin_hash
        )

    def test_login_success(self):
        """valid phone + correct PIN returns 200, access token, and correct role"""
        response = self.client.post(self.login_url, {
            'phone_number': self.phone_number,
            'pin': self.pin
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['role'], 'LANDLORD')

    def test_login_wrong_pin(self):
        """correct phone but wrong PIN returns 401"""
        response = self.client.post(self.login_url, {
            'phone_number': self.phone_number,
            'pin': '0000'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Invalid PIN')

    def test_login_nonexistent_user(self):
        """unknown phone number returns 404"""
        response = self.client.post(self.login_url, {
            'phone_number': '+251000000000',
            'pin': self.pin
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'User not found')

    def test_login_missing_fields(self):
        """empty POST body returns 400"""
        response = self.client.post(self.login_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Phone and PIN required')

    def test_login_missing_pin_only(self):
        """POST with phone but no PIN returns 400"""
        response = self.client.post(self.login_url, {
            'phone_number': self.phone_number
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_jwt_contains_role(self):
        """decoded JWT access token must contain 'role' claim"""
        response = self.client.post(self.login_url, {
            'phone_number': self.phone_number,
            'pin': self.pin
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = AccessToken(response.data['access'])
        self.assertIn('role', token.payload)
        self.assertEqual(token.payload['role'], 'LANDLORD')

    def test_register_success(self):
        """
        FR-AUTH-001: Registration is a 2-step OTP flow.
        Step 1 → POST /register/ creates OTP record, returns 200 (no user created yet).
        Step 2 → POST /register/verify/ validates OTP, creates user, returns 201.
        AfroMessage SMS is mocked so tests pass without external dependency.
        """
        from unittest.mock import patch
        new_phone = '+251922000001'

        # Step 1: Send OTP (mock the SMS call)
        with patch('notifications.utils.send_sms', return_value=False):  # SMS failure is OK
            step1 = self.client.post(self.register_url, {
                'phone_number': new_phone,
                'role': 'TENANT',
            }, format='json')
        self.assertEqual(step1.status_code, status.HTTP_200_OK)
        # User must NOT be created yet
        self.assertFalse(User.objects.filter(phone_number=new_phone).exists())

        # Step 2: Verify OTP — read code directly from DB (no live SMS needed)
        otp_record = OTP.objects.filter(phone_number=new_phone).order_by('-created_at').first()
        self.assertIsNotNone(otp_record, "OTP record must exist after step 1")

        verify_url = '/api/auth/register/verify/'
        step2 = self.client.post(verify_url, {
            'phone_number': new_phone,
            'otp': otp_record.code,
            'pin': '5678',
            'full_name_en': 'New Tenant',
            'role': 'TENANT',
        }, format='json')
        self.assertEqual(step2.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_id', step2.data)
        self.assertTrue(User.objects.filter(phone_number=new_phone).exists())

    def test_register_duplicate_phone(self):
        """registering the same phone number twice returns 400"""
        from unittest.mock import patch
        with patch('notifications.utils.send_sms', return_value=False):
            response = self.client.post(self.register_url, {
                'phone_number': self.phone_number,
                'role': 'LANDLORD',
            }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Phone already registered')

    def test_register_pin_is_hashed(self):
        """
        stored pin_hash must be a bcrypt hash, never plaintext.
        Tests the full 2-step flow with mocked SMS.
        """
        from unittest.mock import patch
        new_phone = '+251933000001'
        raw_pin = '4321'

        with patch('notifications.utils.send_sms', return_value=False):
            self.client.post(self.register_url, {
                'phone_number': new_phone,
                'role': 'LANDLORD',
            }, format='json')

        otp_record = OTP.objects.filter(phone_number=new_phone).order_by('-created_at').first()
        self.assertIsNotNone(otp_record)

        self.client.post('/api/auth/register/verify/', {
            'phone_number': new_phone,
            'otp': otp_record.code,
            'pin': raw_pin,
            'full_name_en': 'Hash Test',
            'role': 'LANDLORD',
        }, format='json')

        user = User.objects.get(phone_number=new_phone)
        # Must not be stored as plaintext
        self.assertNotEqual(user.pin_hash, raw_pin)
        # Must be a valid bcrypt hash
        self.assertTrue(user.pin_hash.startswith('$2b$') or user.pin_hash.startswith('$2a$'))
        # Original pin must verify correctly
        self.assertTrue(bcrypt.checkpw(raw_pin.encode('utf-8'), user.pin_hash.encode('utf-8')))

class UserManagerTests(TestCase):
    def test_create_user_no_phone_number_raises_error(self):
        with self.assertRaisesMessage(ValueError, 'The phone number must be set'):
            User.objects.create_user(phone_number='')

