"""FR-AUTH-005: JWT session management — refresh redemption and logout blacklisting."""
import bcrypt
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

from users.models import User


class JwtSessionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        self.logout_url = '/api/auth/logout/'
        self.refresh_url = '/api/auth/refresh/'
        self.pin = '1234'
        self.user = User.objects.create(
            phone_number='+251911700001',
            full_name_en='Session User',
            full_name_am='',
            role='LANDLORD',
            pin_hash=bcrypt.hashpw(self.pin.encode(), bcrypt.gensalt(12)).decode(),
        )

    def _tokens(self):
        response = self.client.post(
            self.login_url,
            {'phone_number': self.user.phone_number, 'pin': self.pin},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data['refresh'], response.data['access']

    def test_refresh_token_can_be_redeemed_for_new_access_token(self):
        refresh, _ = self._tokens()
        response = self.client.post(self.refresh_url, {'refresh': refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_logout_blacklists_refresh_token(self):
        refresh, _ = self._tokens()
        response = self.client.post(self.logout_url, {'refresh': refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(BlacklistedToken.objects.count(), 1)

    def test_blacklisted_refresh_token_is_rejected(self):
        refresh, _ = self._tokens()
        self.client.post(self.logout_url, {'refresh': refresh}, format='json')

        response = self.client.post(self.refresh_url, {'refresh': refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_without_refresh_token_is_rejected(self):
        response = self.client.post(self.logout_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('refresh', response.data)

    def test_logout_with_invalid_refresh_token_is_rejected(self):
        response = self.client.post(self.logout_url, {'refresh': 'not-a-jwt'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logging_out_twice_is_rejected_the_second_time(self):
        refresh, _ = self._tokens()
        self.assertEqual(
            self.client.post(self.logout_url, {'refresh': refresh}, format='json').status_code,
            status.HTTP_200_OK
        )
        second = self.client.post(self.logout_url, {'refresh': refresh}, format='json')
        self.assertEqual(second.status_code, status.HTTP_401_UNAUTHORIZED)
