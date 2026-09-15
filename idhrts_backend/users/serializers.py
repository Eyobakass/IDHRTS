from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone_number', 'full_name_en', 'full_name_am', 'role', 'tin', 'is_active', 'sms_opt_in']
