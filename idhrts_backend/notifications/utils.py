import logging

logger = logging.getLogger(__name__)


def send_sms(phone_number, message):
    """
    FR-NOTIF-001: AfroMessage Integration with 3-attempt retry at 30-second intervals.
    Returns True on success, False after all attempts fail.
    """
    import time
    import requests
    from django.conf import settings
    url = "https://api.afromessage.com/api/send"
    headers = {
        "Authorization": f"Bearer {getattr(settings, 'AFROMESSAGE_API_KEY', 'default-key')}",
        "Content-Type": "application/json"
    }
    payload = {
        "to": phone_number,
        "message": message
    }
    for attempt in range(1, 4):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            logger.info("SMS sent to %s on attempt %d", phone_number, attempt)
            return True
        except Exception as e:
            logger.warning("SMS attempt %d/3 failed for %s: %s", attempt, phone_number, e)
            if attempt < 3:
                from django.conf import settings
                delay = getattr(settings, 'AFROMESSAGE_RETRY_DELAY_SECONDS', 30)
                if delay > 0:
                    time.sleep(delay)
    logger.error("Failed to send SMS to %s after 3 attempts.", phone_number)
    return False


def notify(user, notification_type, message_english, message_amharic='',
           related_record_type='', related_record_id=None, sms_message=None, is_mandatory=False):
    """
    Create the in-app Notification record (FR-NOTIF-011) and deliver it by SMS.

    Returns the Notification instance. SMS delivery failure is recorded on the
    record (sms_sent stays False) and never raises, so a failing AfroMessage
    call cannot roll back the business transaction that triggered it.
    """
    from django.utils import timezone
    from .models import Notification

    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        message_english=message_english,
        message_amharic=message_amharic,
        related_record_type=related_record_type,
        related_record_id=related_record_id,
    )

    phone_number = getattr(user, 'phone_number', None)
    if not phone_number:
        logger.warning("Notification %s has no phone number to send SMS to", notification.id)
        return notification

    # FR-NOTIF-012: Respect sms_opt_in preference unless notification is mandatory
    sms_opt_in = getattr(user, 'sms_opt_in', True)
    if not is_mandatory and not sms_opt_in:
        logger.info("Skipping SMS for notification %s due to user opt-out", notification.id)
        return notification

    delivered = send_sms(phone_number, sms_message or message_english)
    notification.sms_attempts += 1
    if delivered:
        notification.sms_sent = True
        notification.sms_sent_at = timezone.now()
    notification.save(update_fields=['sms_sent', 'sms_sent_at', 'sms_attempts'])
    return notification
