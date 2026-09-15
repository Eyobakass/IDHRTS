from celery import shared_task
from django.utils import timezone
from .models import RentalContract
from notifications.utils import send_sms

@shared_task
def check_registration_deadlines():
    today = timezone.now().date()
    # Find signed contracts that are not yet authenticated
    contracts = RentalContract.objects.filter(status='SIGNED', overdue_registration=False)
    for contract in contracts:
        days_since = (today - contract.signing_date.date()).days
        if days_since == 25:
            send_sms(contract.landlord.phone_number, f"WARNING: 5 days left to register contract for property {contract.property.house_number}.")
        elif days_since >= 30:
            contract.overdue_registration = True
            contract.save(update_fields=['overdue_registration'])
            # FR-CONT-007: Escalation — SMS to landlord
            send_sms(
                contract.landlord.phone_number,
                f"URGENT: Your rental contract for property #{contract.property.house_number} "
                f"is {days_since} days overdue for Woreda registration. "
                f"Failure to register is a violation of Proclamation 1320/2024. "
                f"Contact your Woreda Housing Office immediately."
            )
            # FR-CONT-007: Escalation — in-app notification to Woreda Officers
            try:
                from notifications.utils import notify
                from users.models import User
                officers = User.objects.filter(
                    role='WOREDA_OFFICER',
                    woreda=contract.property.woreda,
                    is_active=True
                )
                for officer in officers:
                    notify(
                        officer,
                        notification_type='CONTRACT',
                        message_english=(
                            f"OVERDUE ALERT: Contract by {contract.landlord.full_name_en} "
                            f"for property #{contract.property.house_number} is {days_since} days "
                            f"overdue for registration. Please follow up."
                        ),
                        message_amharic=(
                            f"ማስጠንቀቂያ: {contract.landlord.full_name_en} ቤት #{contract.property.house_number} "
                            f"ውሉ ለ{days_since} ቀናት ሳይመዘገብ ቀርቷል።"
                        ),
                        is_mandatory=True
                    )
            except Exception:
                pass
