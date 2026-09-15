import csv
from io import StringIO
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient
import bcrypt

from users.models import User, SubCity, Woreda
from properties.models import Property
from contracts.models import RentalContract
from tax.models import TaxAssessment
from payments.models import TaxPayment

class SIGTASExportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/reports/sigtas/'

        pin_hash = bcrypt.hashpw('1234'.encode(), bcrypt.gensalt(12)).decode()
        
        self.sub_city_a = SubCity.objects.create(name_en='Bole', name_am='ቦሌ', code='BO')
        self.woreda_a = Woreda.objects.create(sub_city=self.sub_city_a, name_en='Woreda 03', name_am='ወረዳ 03', code='03')
        
        self.sub_city_b = SubCity.objects.create(name_en='Kirkos', name_am='ቂርቆስ', code='KI')
        self.woreda_b = Woreda.objects.create(sub_city=self.sub_city_b, name_en='Woreda 01', name_am='ወረዳ 01', code='01')

        self.tax_officer_a = User.objects.create(
            phone_number='+251911200001', full_name_en='Tax Officer A',
            full_name_am='', role='TAX_OFFICER', pin_hash=pin_hash, sub_city=self.sub_city_a
        )
        self.woreda_officer = User.objects.create(
            phone_number='+251911200002', full_name_en='Woreda Officer',
            full_name_am='', role='WOREDA_OFFICER', pin_hash=pin_hash, sub_city=self.sub_city_a, woreda=self.woreda_a
        )
        self.landlord_a = User.objects.create(
            phone_number='+251911200003', full_name_en='Landlord A',
            full_name_am='', role='LANDLORD', pin_hash=pin_hash, sub_city=self.sub_city_a, tin='TIN123'
        )
        self.landlord_b = User.objects.create(
            phone_number='+251911200004', full_name_en='Landlord B',
            full_name_am='', role='LANDLORD', pin_hash=pin_hash, sub_city=self.sub_city_b, tin='TIN456'
        )
        self.tenant = User.objects.create(
            phone_number='+251911200005', full_name_en='Tenant',
            full_name_am='', role='TENANT', pin_hash=pin_hash
        )

        self.prop_a = Property.objects.create(
            landlord=self.landlord_a, sub_city=self.sub_city_a, woreda=self.woreda_a,
            house_number='10A', building_type='VILLA',
            monthly_rent_etb=Decimal('5000.00'), status='ACTIVE'
        )
        self.contract_a = RentalContract.objects.create(
            landlord=self.landlord_a, tenant=self.tenant, property=self.prop_a,
            monthly_rent_etb=Decimal('5000.00'), advance_payment_etb=Decimal('10000.00'),
            lease_start_date=date.today(), lease_duration_months=24,
            lease_end_date=date.today() + timedelta(days=730),
            payment_method='BANK_TRANSFER', status='REGISTERED'
        )
        self.assessment_a = TaxAssessment.objects.create(
            contract=self.contract_a, property=self.prop_a, landlord=self.landlord_a,
            fiscal_year='2025/2026',
            gross_annual_rent_etb=Decimal('60000.00'),
            deduction_etb=Decimal('12000.00'),
            taxable_income_etb=Decimal('48000.00'),
            tax_due_etb=Decimal('3600.00'),
            effective_rate_pct=Decimal('6.00'),
            status='PAID',
            due_date=date.today() + timedelta(days=30)
        )
        self.payment_a = TaxPayment.objects.create(
            assessment=self.assessment_a, landlord=self.landlord_a,
            amount_etb=Decimal('3600.00'),
            payment_method='CHAPA_TELEBIRR',
            status='CONFIRMED',
            chapa_tx_ref='CHAPA_REF_A',
            confirmed_at=timezone.now()
        )

        self.prop_b = Property.objects.create(
            landlord=self.landlord_b, sub_city=self.sub_city_b, woreda=self.woreda_b,
            house_number='20B', building_type='APARTMENT',
            monthly_rent_etb=Decimal('6000.00'), status='ACTIVE'
        )
        self.contract_b = RentalContract.objects.create(
            landlord=self.landlord_b, tenant=self.tenant, property=self.prop_b,
            monthly_rent_etb=Decimal('6000.00'), advance_payment_etb=Decimal('12000.00'),
            lease_start_date=date.today(), lease_duration_months=12,
            lease_end_date=date.today() + timedelta(days=365),
            payment_method='BANK_TRANSFER', status='REGISTERED'
        )
        self.assessment_b = TaxAssessment.objects.create(
            contract=self.contract_b, property=self.prop_b, landlord=self.landlord_b,
            fiscal_year='2025/2026',
            gross_annual_rent_etb=Decimal('72000.00'),
            deduction_etb=Decimal('14400.00'),
            taxable_income_etb=Decimal('57600.00'),
            tax_due_etb=Decimal('4320.00'),
            effective_rate_pct=Decimal('6.00'),
            status='PAID',
            due_date=date.today() + timedelta(days=30)
        )
        self.payment_b = TaxPayment.objects.create(
            assessment=self.assessment_b, landlord=self.landlord_b,
            amount_etb=Decimal('4320.00'),
            payment_method='CBE_BIRR',
            status='CONFIRMED',
            prn_code='PRN_CODE_B',
            confirmed_at=timezone.now()
        )

    def test_tax_officer_can_export(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')

    def test_non_tax_officer_role_forbidden(self):
        self.client.force_authenticate(user=self.woreda_officer)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_landlord_role_forbidden(self):
        self.client.force_authenticate(user=self.landlord_a)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_gets_403(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [401, 403])

    def test_csv_has_correct_13_headers(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        headers = next(reader)
        expected = ['TIN', 'Taxpayer Name', 'Property ID', 'Fiscal Year', 'Gross Rent ETB', 
                    'Deduction ETB', 'Taxable Income ETB', 'Tax Due ETB', 'Amount Paid ETB', 
                    'Payment Date', 'Payment Method', 'Payment Reference', 'Assessment Period']
        self.assertEqual(headers, expected)
        self.assertEqual(len(headers), 13)

    def test_only_confirmed_payments_exported(self):
        self.payment_a.status = 'PROCESSING'
        self.payment_a.save()

        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        next(reader)
        rows = list(reader)
        self.assertEqual(len(rows), 0)

    def test_sub_city_isolation(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        next(reader)
        rows = list(reader)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][1], 'Landlord A')

    def test_empty_export_has_only_headers(self):
        TaxPayment.objects.all().delete()
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        rows = list(reader)
        self.assertEqual(len(rows), 1)

    def test_csv_content_disposition_header(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        self.assertEqual(response['Content-Disposition'], 'attachment; filename="sigtas_schedule_b.csv"')

    def test_fiscal_year_in_export(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        next(reader)
        row = next(reader)
        self.assertEqual(row[3], '2025/2026')

    def test_assessment_period_column_always_annual(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        next(reader)
        row = next(reader)
        self.assertEqual(row[-1], 'ANNUAL')

    def test_payment_reference_uses_chapa_tx_ref(self):
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        next(reader)
        row = next(reader)
        self.assertEqual(row[-2], 'CHAPA_REF_A')

    def test_payment_reference_falls_back_to_prn_code(self):
        self.tax_officer_a.sub_city = self.sub_city_b
        self.tax_officer_a.save()
        self.client.force_authenticate(user=self.tax_officer_a)
        response = self.client.get(self.url)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        next(reader)
        row = next(reader)
        self.assertEqual(row[-2], 'PRN_CODE_B')
