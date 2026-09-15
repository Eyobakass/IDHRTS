import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from users.models import SystemConfig, AuditLog, User
from django.utils import timezone

try:
    config = SystemConfig.objects.get(key='RENT_HIKE_CEILING_PCT')
    old_value = config.value
    config.value = '12.0'
    config.save()
    
    admin_user = User.objects.filter(role='ADMIN').first()
    ip_address = '127.0.0.1'

    AuditLog.objects.create(
        actor=admin_user,
        action='CONFIG_UPDATED',
        target_id=str(config.id),
        target_type='SystemConfig',
        ip_address=ip_address,
        metadata={'key': 'RENT_HIKE_CEILING_PCT', 'old_value': old_value, 'new_value': '12.0'}
    )
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
