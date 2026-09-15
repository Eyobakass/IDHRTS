from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from users.models import User
from properties.models import Property, SubCity, Woreda
from contracts.models import RentalContract
from contracts.tasks import check_registration_deadlines

class ContractTasksTest(TestCase):
    def setUp(self):
        self.landlord = User.objects.create(
            phone_number="+251911000000",
            full_name_en="John Doe",
            role="LANDLORD",
            pin_hash="$2b$12$fakehashonly"
        )
        self.tenant = User.objects.create(
            phone_number="+251911000001",
            full_name_en="Jane Doe",
            role="TENANT",
            pin_hash="$2b$12$fakehashonly"
        )
        self.sub_city = SubCity.objects.create(name_en="Bole", code="BOL")
        self.woreda = Woreda.objects.create(sub_city=self.sub_city, name_en="Woreda 01", code="W01")
        self.property = Property.objects.create(
            landlord=self.landlord,
            sub_city=self.sub_city,
            woreda=self.woreda,
            house_number="123",
            building_type="VILLA",
            monthly_rent_etb=10000.00,
            status="ACTIVE"
        )

    def create_contract(self, status='SIGNED', signing_date=None, overdue=False):
        if signing_date is None:
            signing_date = timezone.now()
        
        return RentalContract.objects.create(
            landlord=self.landlord,
            tenant=self.tenant,
            property=self.property,
            monthly_rent_etb=10000.00,
            advance_payment_etb=0.00,
            lease_start_date=timezone.now().date(),
            lease_duration_months=12,
            lease_end_date=(timezone.now() + timedelta(days=365)).date(),
            payment_method="CASH",
            status=status,
            signing_date=signing_date,
            overdue_registration=overdue
        )

    @patch('contracts.tasks.send_sms')
    def test_contract_before_25_days_no_sms_sent(self, mock_send_sms):
        self.create_contract(signing_date=timezone.now() - timedelta(days=24))
        check_registration_deadlines()
        mock_send_sms.assert_not_called()

    @patch('contracts.tasks.send_sms')
    def test_contract_at_25_days_sends_warning_sms(self, mock_send_sms):
        self.create_contract(signing_date=timezone.now() - timedelta(days=25))
        check_registration_deadlines()
        mock_send_sms.assert_called_once_with(
            self.landlord.phone_number,
            "WARNING: 5 days left to register contract for property 123."
        )

    @patch('contracts.tasks.send_sms')
    def test_sms_message_contains_house_number(self, mock_send_sms):
        self.create_contract(signing_date=timezone.now() - timedelta(days=25))
        check_registration_deadlines()
        args, kwargs = mock_send_sms.call_args
        self.assertIn("123", args[1])

    @patch('contracts.tasks.send_sms')
    def test_contract_at_30_days_marked_overdue(self, mock_send_sms):
        contract = self.create_contract(signing_date=timezone.now() - timedelta(days=30))
        check_registration_deadlines()
        contract.refresh_from_db()
        self.assertTrue(contract.overdue_registration)

    @patch('contracts.tasks.send_sms')
    def test_contract_at_31_days_also_marked_overdue(self, mock_send_sms):
        contract = self.create_contract(signing_date=timezone.now() - timedelta(days=31))
        check_registration_deadlines()
        contract.refresh_from_db()
        self.assertTrue(contract.overdue_registration)

    @patch('contracts.tasks.send_sms')
    def test_already_overdue_contract_skipped(self, mock_send_sms):
        self.create_contract(signing_date=timezone.now() - timedelta(days=30), overdue=True)
        check_registration_deadlines()
        mock_send_sms.assert_not_called()

    @patch('contracts.tasks.send_sms')
    def test_non_signed_contracts_skipped(self, mock_send_sms):
        self.create_contract(status='REGISTERED', signing_date=timezone.now() - timedelta(days=25))
        check_registration_deadlines()
        mock_send_sms.assert_not_called()

    @patch('contracts.tasks.send_sms')
    def test_multiple_contracts_processed_independently(self, mock_send_sms):
        c1 = self.create_contract(signing_date=timezone.now() - timedelta(days=25))
        
        p2 = Property.objects.create(
            landlord=self.landlord,
            sub_city=self.sub_city,
            woreda=self.woreda,
            house_number="124",
            building_type="VILLA",
            monthly_rent_etb=10000.00,
            status="ACTIVE"
        )
        c2 = RentalContract.objects.create(
            landlord=self.landlord,
            tenant=self.tenant,
            property=p2,
            monthly_rent_etb=10000.00,
            advance_payment_etb=0.00,
            lease_start_date=timezone.now().date(),
            lease_duration_months=12,
            lease_end_date=(timezone.now() + timedelta(days=365)).date(),
            payment_method="CASH",
            status='SIGNED',
            signing_date=timezone.now() - timedelta(days=30),
            overdue_registration=False
        )
        
        check_registration_deadlines()
        mock_send_sms.assert_called_once()
        c2.refresh_from_db()
        self.assertTrue(c2.overdue_registration)
