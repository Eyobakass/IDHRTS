import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class SubCity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name_en = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100)
    code = models.CharField(max_length=5, unique=True)
    is_active = models.BooleanField(default=True)

class Woreda(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_city = models.ForeignKey(SubCity, on_delete=models.CASCADE)
    name_en = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100)
    code = models.CharField(max_length=5)
    is_active = models.BooleanField(default=True)

class UserManager(BaseUserManager):
    def create_user(self, phone_number, **extra_fields):
        if not phone_number:
            raise ValueError('The phone number must be set')
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_unusable_password() # We use PIN instead
        user.save()
        return user

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('LANDLORD', 'Landlord'),
        ('TENANT', 'Tenant'),
        ('WOREDA_OFFICER', 'Woreda Officer'),
        ('TAX_OFFICER', 'Tax Officer'),
        ('ADMIN', 'Admin'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=13, unique=True) # +251XXXXXXXXX
    full_name_am = models.CharField(max_length=255)
    full_name_en = models.CharField(max_length=255)
    pin_hash = models.CharField(max_length=255)
    tin = models.CharField(max_length=20, null=True, blank=True, unique=True)
    fayda_id = models.BinaryField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    sub_city = models.ForeignKey(SubCity, on_delete=models.SET_NULL, null=True, blank=True)
    woreda = models.ForeignKey(Woreda, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    requires_pin_change = models.BooleanField(default=False)
    failed_login_count = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sms_opt_in = models.BooleanField(default=True)

    # Django auth requirements
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    password = None 

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['full_name_en', 'role']
    
    objects = UserManager()

class OTP(models.Model):
    phone_number = models.CharField(max_length=13, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from datetime import timedelta
        from django.utils import timezone
        return not self.is_used and self.created_at >= timezone.now() - timedelta(minutes=5)

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(User, on_delete=models.PROTECT, related_name='audit_actions', null=True, blank=True)
    action = models.CharField(max_length=50, db_index=True)
    target_id = models.UUIDField(null=True, blank=True, db_index=True)
    target_type = models.CharField(max_length=50, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = 'audit_log'
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['target_id', 'action']),
        ]

class SystemConfig(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_config'

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    device_fingerprint = models.CharField(max_length=255) # Hash of UA + IP
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-last_active']
