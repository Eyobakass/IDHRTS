from django.test import TestCase
from unittest.mock import patch, MagicMock, call
from notifications.utils import send_sms
import requests


class TestSendSMS(TestCase):
    @patch('requests.post')
    def test_send_sms_success(self, mock_post):
        """On first-attempt success, post is called exactly once and returns True."""
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = send_sms('+251911000000', 'Your OTP is 123456')

        self.assertTrue(result)
        # FR-NOTIF-001: retry logic — succeeds on first try so exactly 1 call
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(kwargs['json']['to'], '+251911000000')
        self.assertEqual(kwargs['json']['message'], 'Your OTP is 123456')
        self.assertIn('Authorization', kwargs['headers'])
        self.assertTrue(kwargs['headers']['Authorization'].startswith('Bearer '))

    @patch('requests.post')
    def test_send_sms_failure_network_error(self, mock_post):
        """On persistent network error, post is retried 3 times and returns False."""
        mock_post.side_effect = requests.exceptions.ConnectionError("Connection failed")
        result = send_sms('+251911000000', 'Your OTP is 123456')
        self.assertFalse(result)
        # FR-NOTIF-001: must retry exactly 3 times on failure
        self.assertEqual(mock_post.call_count, 3)

    @patch('requests.post')
    def test_send_sms_failure_http_error(self, mock_post):
        """On persistent HTTP error, post is retried 3 times and returns False."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("400 Bad Request")
        mock_post.return_value = mock_response

        result = send_sms('+251911000000', 'Your OTP is 123456')
        self.assertFalse(result)
        # FR-NOTIF-001: must retry exactly 3 times on failure
        self.assertEqual(mock_post.call_count, 3)

    @patch('requests.post')
    def test_send_sms_succeeds_on_second_attempt(self, mock_post):
        """If second attempt succeeds, returns True after 2 calls."""
        good_response = MagicMock()
        good_response.raise_for_status.return_value = None
        mock_post.side_effect = [
            requests.exceptions.ConnectionError("Timeout"),
            good_response,
        ]
        result = send_sms('+251911000000', 'Your OTP is 123456')
        self.assertTrue(result)
        self.assertEqual(mock_post.call_count, 2)
