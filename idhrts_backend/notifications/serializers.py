from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'type', 'message_amharic', 'message_english', 'sms_sent', 'sms_sent_at', 'sms_attempts', 'related_record_type', 'related_record_id', 'created_at']
