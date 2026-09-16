from rest_framework import serializers
from .models import RentalContract
from users.models import User
from properties.models import Property


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name_en', 'phone_number', 'tin']


class PropertyMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'house_number', 'building_type']


class RentalContractSerializer(serializers.ModelSerializer):
    landlord_detail = UserMiniSerializer(source='landlord', read_only=True)
    tenant_detail = UserMiniSerializer(source='tenant', read_only=True)
    property_detail = PropertyMiniSerializer(source='property', read_only=True)

    class Meta:
        model = RentalContract
        fields = '__all__'
        read_only_fields = ['contract_reg_number', 'status', 'signing_date', 'authenticated_by', 'landlord']
