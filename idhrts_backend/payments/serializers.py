from rest_framework import serializers
from .models import TaxPayment

class TaxPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxPayment
        fields = '__all__'
