from rest_framework import serializers
from .models import Dispute
from users.models import User


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name_en', 'phone_number']


class DisputeSerializer(serializers.ModelSerializer):
    filer_detail = UserMiniSerializer(source='filer', read_only=True)

    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ['status', 'filer', 'assigned_officer', 'ruling_text', 'ruling_at', 'appeal_deadline']
