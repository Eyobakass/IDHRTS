import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
app = Celery('idhrts')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Schedules are evaluated in CELERY_TIMEZONE (Africa/Addis_Ababa), set in settings.
app.conf.beat_schedule = {
    'check-registration-deadlines': {
        'task': 'contracts.tasks.check_registration_deadlines',
        'schedule': crontab(hour=0, minute=1),  # Daily 00:01 EAT
    },
    'annual-tax-cycle': {
        'task': 'tax.tasks.create_annual_assessments',
        # The task labels assessments with get_ethiopian_fiscal_year(now), which
        # rolls over on Sept 11 (tax/utils.py). Running before that boundary would
        # regenerate the outgoing fiscal year, so fire on the rollover date itself.
        # minute is pinned because an unset minute means "every minute of the hour".
        'schedule': crontab(month_of_year=9, day_of_month=11, hour=0, minute=0),
    },
}
