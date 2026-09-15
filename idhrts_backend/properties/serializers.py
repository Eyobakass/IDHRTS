from rest_framework import serializers
from .models import Property, Document
from users.models import User


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name_en', 'phone_number']


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'


class PropertySerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    landlord_detail = UserMiniSerializer(source='landlord', read_only=True)

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ['landlord', 'status', 'reviewed_by', 'review_note']
