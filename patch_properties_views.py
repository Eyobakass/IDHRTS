import codecs
with codecs.open(r"idhrts_backend\properties\views.py", "r", encoding="utf-8") as f:
    text = f.read()

new_logic = """
    @action(detail=False, methods=['post'], url_path='walk_in')
    def walk_in(self, request):
        if request.user.role != 'WOREDA_OFFICER':
            return Response({"error": "Unauthorized"}, status=403)
            
        landlord_phone = request.data.get('landlord_phone')
        house_number = request.data.get('house_number')
        rent = request.data.get('monthly_rent_etb')
        
        from users.models import User
        try:
            landlord = User.objects.get(phone_number=landlord_phone, role='LANDLORD')
        except User.DoesNotExist:
            return Response({"error": "Landlord not found with this phone number."}, status=400)
            
        prop = Property.objects.create(
            landlord=landlord,
            woreda=request.user.woreda,
            sub_city=request.user.woreda.sub_city,
            house_number=house_number,
            status='ACTIVE', # Walk-in registrations can be auto-approved
            reviewed_by=request.user
        )
        return Response({"id": prop.id, "status": "Property Registered for Walk-in"})
"""

# add it before the end of PropertyViewSet
text = text.replace("    @action(detail=True, methods=['post'])\n    def reject(self, request, pk=None):", new_logic + "\n    @action(detail=True, methods=['post'])\n    def reject(self, request, pk=None):")

with codecs.open(r"idhrts_backend\properties\views.py", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated properties/views.py")
