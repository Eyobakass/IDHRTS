from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from users.models import User
from properties.models import Property, SubCity, Woreda
from contracts.models import RentalContract
from tax.models import TaxAssessment
from tax.tasks import create_annual_assessments
from tax.utils import calculate_schedule_b_tax, get_ethiopian_fiscal_year

class TaxTasksTest(TestCase):
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

    def create_contract(self, status='REGISTERED'):
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
            signing_date=timezone.now()
        )

    def test_creates_assessment_for_registered_contract(self):
        contract = self.create_contract(status='REGISTERED')
        create_annual_assessments()
        self.assertTrue(TaxAssessment.objects.filter(contract=contract).exists())

    def test_skips_non_registered_contracts(self):
        contract = self.create_contract(status='SIGNED')
        create_annual_assessments()
        self.assertFalse(TaxAssessment.objects.filter(contract=contract).exists())

    def test_assessment_uses_correct_fiscal_year(self):
        # A registered contract should have assessments created
        contract = self.create_contract(status='REGISTERED')
        create_annual_assessments()
        
        assessment = TaxAssessment.objects.get(contract=contract)
        
        expected_year_str = get_ethiopian_fiscal_year(timezone.now())
        self.assertEqual(assessment.fiscal_year, expected_year_str)

    def test_update_or_create_idempotency(self):
        contract = self.create_contract(status='REGISTERED')
        create_annual_assessments()
        create_annual_assessments()
        self.assertEqual(TaxAssessment.objects.filter(contract=contract).count(), 1)

    def test_tax_data_derived_from_calculate_schedule_b(self):
        contract = self.create_contract(status='REGISTERED')
        create_annual_assessments()
        assessment = TaxAssessment.objects.get(contract=contract)
        
        expected_year_str = get_ethiopian_fiscal_year(timezone.now())
        tax_data = calculate_schedule_b_tax(contract.monthly_rent_etb, expected_year_str)
        
        self.assertEqual(assessment.gross_annual_rent_etb, tax_data['gross_annual_rent_etb'])
        self.assertEqual(assessment.deduction_etb, tax_data['deduction_etb'])
        self.assertEqual(assessment.taxable_income_etb, tax_data['taxable_income_etb'])
        self.assertEqual(assessment.tax_due_etb, tax_data['tax_due_etb'])
        self.assertEqual(assessment.effective_rate_pct, tax_data['effective_rate_pct'])

    def test_due_date_is_30_days_from_now(self):
        contract = self.create_contract(status='REGISTERED')
        create_annual_assessments()
        assessment = TaxAssessment.objects.get(contract=contract)
        expected_due_date = timezone.now().date() + timedelta(days=30)
        self.assertEqual(assessment.due_date, expected_due_date)

    def test_multiple_contracts_each_get_assessment(self):
        c1 = self.create_contract(status='REGISTERED')
        
        p2 = Property.objects.create(
            landlord=self.landlord,
            sub_city=self.sub_city,
            woreda=self.woreda,
            house_number="124",
            building_type="VILLA",
            monthly_rent_etb=20000.00,
            status="ACTIVE"
        )
        c2 = RentalContract.objects.create(
            landlord=self.landlord,
            tenant=self.tenant,
            property=p2,
            monthly_rent_etb=20000.00,
            advance_payment_etb=0.00,
            lease_start_date=timezone.now().date(),
            lease_duration_months=12,
            lease_end_date=(timezone.now() + timedelta(days=365)).date(),
            payment_method="CASH",
            status='REGISTERED',
            signing_date=timezone.now()
        )
        
        p3 = Property.objects.create(
            landlord=self.landlord,
            sub_city=self.sub_city,
            woreda=self.woreda,
            house_number="125",
            building_type="VILLA",
            monthly_rent_etb=30000.00,
            status="ACTIVE"
        )
        c3 = RentalContract.objects.create(
            landlord=self.landlord,
            tenant=self.tenant,
            property=p3,
            monthly_rent_etb=30000.00,
            advance_payment_etb=0.00,
            lease_start_date=timezone.now().date(),
            lease_duration_months=12,
            lease_end_date=(timezone.now() + timedelta(days=365)).date(),
            payment_method="CASH",
            status='REGISTERED',
            signing_date=timezone.now()
        )

        create_annual_assessments()
        self.assertEqual(TaxAssessment.objects.count(), 3)
