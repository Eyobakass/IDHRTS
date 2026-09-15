import uuid
from django.db import models
from users.models import User


class Notification(models.Model):
    """
    In-app + SMS notification record (SRS 5.1 Notification entity, FR-NOTIF-011).
    One row per user-facing message; sms_* fields track AfroMessage delivery.
    """
    TYPE_CHOICES = (
        ('OTP_DELIVERY', 'OTP Delivery'),
        ('DEADLINE_WARNING_DAY25', 'Deadline Warning Day 25'),
        ('DEADLINE_BREACH_DAY30', 'Deadline Breach Day 30'),
        ('TENANT_REVIEW_REQUEST', 'Tenant Review Request'),
        ('AUTH_APPROVED', 'Authentication Approved'),
        ('AUTH_REJECTED', 'Authentication Rejected'),
        ('TAX_ISSUED', 'Tax Assessment Issued'),
        ('TAX_REMINDER', 'Tax Payment Reminder'),
        ('TAX_CONFIRMED', 'Tax Payment Confirmed'),
        ('DISPUTE_UPDATE', 'Dispute Update'),
        ('SYSTEM_INFO', 'System Information'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='SYSTEM_INFO')
    message_amharic = models.TextField(blank=True, default='')
    message_english = models.TextField(blank=True, default='')
    sms_sent = models.BooleanField(default=False)
    sms_sent_at = models.DateTimeField(null=True, blank=True)
    sms_attempts = models.IntegerField(default=0)
    in_app_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    related_record_type = models.CharField(max_length=50, blank=True, default='')
    related_record_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} -> {self.user.phone_number}"
