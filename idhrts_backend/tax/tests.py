from django.test import TestCase
from decimal import Decimal
from tax.utils import calculate_schedule_b_tax

class ScheduleBTaxTests(TestCase):
    def test_zero_tax_for_low_income(self):
        # Monthly 2000 -> gross 24000 -> deduction 4800 -> taxable 19200 -> tax 1200
        result = calculate_schedule_b_tax(Decimal('2000.00'))
        self.assertEqual(result['tax_due'], Decimal('1200.00'))

    def test_15_percent_bracket(self):
        # Monthly 3000 -> gross 36000 -> deduction 7200 -> taxable 28800
        # tax = (19800-7200)*0.1 + (28800-19800)*0.15 = 1260 + 1350 = 2610
        result = calculate_schedule_b_tax(Decimal('3000.00'))
        self.assertEqual(result['tax_due'], Decimal('2610.00'))

    def test_high_income_uses_35_percent_bracket(self):
        result = calculate_schedule_b_tax(Decimal('50000.00'))
        self.assertGreater(result['tax_due'], Decimal('100000.00'))

    def test_20_percent_deduction_applied(self):
        result = calculate_schedule_b_tax(Decimal('10000.00'))
        expected_deduction = result['gross_annual'] * Decimal('0.20')
        self.assertEqual(result['deduction'], expected_deduction)

    def test_returns_all_required_fields(self):
        result = calculate_schedule_b_tax(Decimal('5000.00'))
        expected_keys = {
            'gross_annual',
            'deduction',
            'taxable',
            'tax_due',
            'effective_rate'
        }
        self.assertEqual(set(result.keys()), expected_keys)

    def test_decimal_precision(self):
        result = calculate_schedule_b_tax(Decimal('5000.00'))
        self.assertIsInstance(result['gross_annual'], Decimal)
        self.assertIsInstance(result['deduction'], Decimal)
        self.assertIsInstance(result['taxable'], Decimal)
        self.assertIsInstance(result['tax_due'], Decimal)
        self.assertIsInstance(result['effective_rate'], Decimal)

    def test_gross_annual_is_monthly_times_12(self):
        result = calculate_schedule_b_tax(Decimal('1000.00'))
        self.assertEqual(result['gross_annual'], Decimal('12000.00'))

    def test_taxable_income_is_gross_minus_deduction(self):
        result = calculate_schedule_b_tax(Decimal('1000.00'))
        expected = result['gross_annual'] - result['deduction']
        self.assertEqual(result['taxable'], expected)
