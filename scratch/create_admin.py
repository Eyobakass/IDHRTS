import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from users.models import User
import bcrypt

pin = "1234"
pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt(4)).decode('utf-8')

User.objects.filter(phone_number="+251999999999").delete()
admin = User.objects.create(
    phone_number="+251999999999",
    full_name_en="Super Admin",
    role="ADMIN",
    pin_hash=pin_hash,
    requires_pin_change=False
)
print("Admin created")
