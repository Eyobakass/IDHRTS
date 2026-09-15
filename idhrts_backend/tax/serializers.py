from rest_framework import serializers
from .models import TaxAssessment

class TaxAssessmentSerializer(serializers.ModelSerializer):
    property_detail = serializers.SerializerMethodField()
    landlord_detail = serializers.SerializerMethodField()
    months_late = serializers.IntegerField(read_only=True)
    late_interest_etb = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_due_etb = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = TaxAssessment
        fields = '__all__'

    def get_property_detail(self, obj):
        return {
            "house_number": obj.property.house_number,
            "building_type": obj.property.building_type
        } if obj.property else None

    def get_landlord_detail(self, obj):
        return {
            "full_name_en": obj.landlord.full_name_en
        } if obj.landlord else None
