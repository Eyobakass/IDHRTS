from django.test import TestCase
from datetime import timedelta
from django.utils import timezone
from users.models import OTP

class TestOTPModel(TestCase):
    def test_otp_is_valid_initially(self):
        otp = OTP.objects.create(phone_number='+251911000000', code='123456')
        self.assertTrue(otp.is_valid())

    def test_otp_is_invalid_after_5_minutes(self):
        otp = OTP.objects.create(phone_number='+251911000000', code='123456')
        otp.created_at = timezone.now() - timedelta(minutes=6)
        otp.save()
        self.assertFalse(otp.is_valid())

    def test_otp_is_invalid_when_used(self):
        otp = OTP.objects.create(phone_number='+251911000000', code='123456', is_used=True)
        self.assertFalse(otp.is_valid())

    def test_otp_edge_case_exactly_5_minutes(self):
        otp = OTP.objects.create(phone_number='+251911000000', code='123456')
        otp.created_at = timezone.now() - timedelta(minutes=4, seconds=59)
        otp.save()
        self.assertTrue(otp.is_valid())
