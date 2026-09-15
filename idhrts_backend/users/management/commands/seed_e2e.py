import bcrypt
from django.core.management.base import BaseCommand
from properties.models import Property
from contracts.models import RentalContract
from disputes.models import Dispute
from tax.models import TaxAssessment
from payments.models import TaxPayment
from users.models import User, SubCity, Woreda

class Command(BaseCommand):
    help = 'Seeds the database for E2E testing'

    def handle(self, *args, **kwargs):
        self.stdout.write("Wiping tables...")
        # Clear AuditLog first to avoid ProtectedError on User deletion
        from django.apps import apps
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                if model.__name__ == 'AuditLog':
                    model.objects.all().delete()
        TaxPayment.objects.all().delete()
        TaxAssessment.objects.all().delete()
        Dispute.objects.all().delete()
        RentalContract.objects.all().delete()
        Property.objects.all().delete()
        User.objects.all().delete()
        Woreda.objects.all().delete()
        SubCity.objects.all().delete()

        self.stdout.write("Creating initial data...")
        # SubCity
        subcity = SubCity.objects.create(name_en='Test SubCity', name_am='Test SubCity', code='TS')
        
        # Woreda
        woreda = Woreda.objects.create(sub_city=subcity, name_en='Test Woreda', name_am='Test Woreda', code='TW')

        # PIN hashing
        pin = '1234'
        pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Users
        landlord = User.objects.create_user(
            phone_number='+251900000001',
            pin_hash=pin_hash,
            role='LANDLORD',
            sub_city=subcity,
            full_name_en='Landlord',
            full_name_am='Landlord',
            woreda=woreda
        )

        tenant = User.objects.create_user(
            phone_number='+251900000002',
            pin_hash=pin_hash,
            role='TENANT',
            full_name_en='Tenant',
            full_name_am='Tenant'
        )

        woreda_officer = User.objects.create_user(
            phone_number='+251900000003',
            pin_hash=pin_hash,
            role='WOREDA_OFFICER',
            full_name_en='Woreda Officer',
            full_name_am='Woreda Officer',
            woreda=woreda
        )

        tax_officer = User.objects.create_user(
            phone_number='+251900000004',
            pin_hash=pin_hash,
            role='TAX_OFFICER',
            full_name_en='Tax Officer',
            full_name_am='Tax Officer',
            sub_city=subcity,
            woreda=woreda
        )

        # Properties
        # DRAFT property for property-workflow test
        Property.objects.create(
            landlord=landlord,
            sub_city=subcity,
            woreda=woreda,
            status='DRAFT',
            monthly_rent_etb=5000,
            house_number='E2E-100',
            building_type='APARTMENT',
            num_units=1,
            floor_area_sqm=100
        )

        # ACTIVE property for contract-workflow test
        active_property = Property.objects.create(
            landlord=landlord,
            sub_city=subcity,
            woreda=woreda,
            status='ACTIVE',
            monthly_rent_etb=8000,
            house_number='E2E-200',
            building_type='VILLA',
            num_units=1,
            floor_area_sqm=150
        )

        # RentalContract with PENDING_TENANT_SIGNATURE status
        from datetime import date, timedelta
        from django.utils import timezone
        from django.utils.crypto import get_random_string

        lease_start = date.today() + timedelta(days=7)
        lease_duration = 12
        lease_end = lease_start + timedelta(days=30 * lease_duration)

        contract = RentalContract.objects.create(
            property=active_property,
            landlord=landlord,
            tenant=tenant,
            monthly_rent_etb=8000,
            advance_payment_etb=16000,
            lease_start_date=lease_start,
            lease_duration_months=lease_duration,
            lease_end_date=lease_end,
            payment_method='BANK_TRANSFER',
            status='PENDING_TENANT_SIGNATURE',
            secure_review_token='e2e-test-contract-token-12345678',
            secure_review_expires=timezone.now() + timedelta(days=7)
        )

        # Dispute filed by Landlord against Tenant
        Dispute.objects.create(
            dispute_type='UNLAWFUL_RENT_INCREASE',
            filer=landlord,
            respondent=tenant,
            contract=contract,
            woreda=woreda,
            description='Tenant is refusing to pay the agreed monthly rent despite signed contract.',
            incident_date=date.today() - timedelta(days=5),
            status='FILED'
        )

        # REGISTERED contract for tax-workflow test
        tax_property = Property.objects.create(
            landlord=landlord,
            sub_city=subcity,
            woreda=woreda,
            status='ACTIVE',
            monthly_rent_etb=12000,
            house_number='E2E-300',
            building_type='COMMERCIAL',
            num_units=1,
            floor_area_sqm=80
        )

        tax_contract = RentalContract.objects.create(
            property=tax_property,
            landlord=landlord,
            tenant=tenant,
            monthly_rent_etb=12000,
            advance_payment_etb=24000,
            lease_start_date=lease_start,
            lease_duration_months=lease_duration,
            lease_end_date=lease_end,
            payment_method='BANK_TRANSFER',
            status='REGISTERED',
            contract_reg_number='REG-E2E-9999'
        )

        self.stdout.write(self.style.SUCCESS("Testing created hashes..."))
        assert bcrypt.checkpw('1234'.encode('utf-8'), landlord.pin_hash.encode('utf-8')), "Landlord hash failed!"
        assert bcrypt.checkpw('1234'.encode('utf-8'), woreda_officer.pin_hash.encode('utf-8')), "Woreda hash failed!"
        assert bcrypt.checkpw('1234'.encode('utf-8'), tax_officer.pin_hash.encode('utf-8')), "Tax hash failed!"

        self.stdout.write(self.style.SUCCESS("Successfully seeded E2E database with:"))
        self.stdout.write(self.style.SUCCESS("  - 3 properties (1 DRAFT, 2 ACTIVE)"))
        self.stdout.write(self.style.SUCCESS("  - 2 contracts (1 PENDING, 1 REGISTERED)"))
        self.stdout.write(self.style.SUCCESS("  - 1 dispute (FILED)"))

