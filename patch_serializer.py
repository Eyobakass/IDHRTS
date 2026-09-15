import codecs
with codecs.open(r"idhrts_backend\contracts\serializers.py", "r", encoding="utf-8") as f:
    text = f.read()

old_logic = """class RentalContractSerializer(serializers.ModelSerializer):
    landlord_detail = UserMiniSerializer(source='landlord', read_only=True)
    tenant_detail = UserMiniSerializer(source='tenant', read_only=True)
    property_detail = PropertyMiniSerializer(source='property', read_only=True)

    class Meta:
        model = RentalContract
        fields = '__all__'
        read_only_fields = ['contract_reg_number', 'status', 'signing_date', 'authenticated_by', 'landlord']"""

new_logic = """class RentalContractSerializer(serializers.ModelSerializer):
    landlord_detail = UserMiniSerializer(source='landlord', read_only=True)
    tenant_detail = UserMiniSerializer(source='tenant', read_only=True)
    property_detail = PropertyMiniSerializer(source='property', read_only=True)
    tenant_phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = RentalContract
        fields = '__all__'
        read_only_fields = ['contract_reg_number', 'status', 'signing_date', 'authenticated_by', 'landlord', 'tenant']

    def create(self, validated_data):
        tenant_phone = validated_data.pop('tenant_phone', None)
        if tenant_phone:
            from users.models import User
            try:
                tenant = User.objects.get(phone_number=tenant_phone, role='TENANT')
                validated_data['tenant'] = tenant
            except User.DoesNotExist:
                raise serializers.ValidationError({"tenant_phone": "No tenant found with this phone number."})
        return super().create(validated_data)
"""

text = text.replace(old_logic, new_logic)
with codecs.open(r"idhrts_backend\contracts\serializers.py", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated contracts/serializers.py")
