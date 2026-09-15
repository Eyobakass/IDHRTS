import re

with open('idhrts_backend/contracts/views.py', 'r') as f:
    content = f.read()

renewal_action = """
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def renew(self, request, pk=None):
        if request.user.role != 'LANDLORD':
            return Response({"error": "Only landlords can renew contracts"}, status=status.HTTP_403_FORBIDDEN)
            
        parent_contract = self.get_object()
        if parent_contract.status != 'REGISTERED':
            return Response({"error": "Can only renew registered contracts"}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils import timezone
        import datetime
        from dateutil.relativedelta import relativedelta
        
        # Check if within 60 days of expiry
        today = timezone.now().date()
        days_to_expiry = (parent_contract.end_date - today).days
        if days_to_expiry > 60:
            return Response({"error": "Can only renew within 60 days of expiry"}, status=status.HTTP_400_BAD_REQUEST)
            
        new_rent = request.data.get('monthly_rent_etb')
        if not new_rent:
            return Response({"error": "New monthly rent is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        new_rent = Decimal(str(new_rent))
        
        # Check rent hike ceiling
        from users.models import SystemConfig
        try:
            hike_ceiling = Decimal(SystemConfig.objects.get(key='RENT_HIKE_CEILING_PCT').value)
        except SystemConfig.DoesNotExist:
            hike_ceiling = Decimal("11.5")
            
        max_allowed_rent = parent_contract.monthly_rent_etb * (Decimal("1") + hike_ceiling / Decimal("100"))
        if new_rent > max_allowed_rent:
            return Response({"error": f"Rent hike cannot exceed {hike_ceiling}%"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create new draft contract
        new_contract = RentalContract.objects.create(
            property=parent_contract.property,
            landlord=parent_contract.landlord,
            tenant=parent_contract.tenant,
            parent_contract=parent_contract,
            monthly_rent_etb=new_rent,
            start_date=parent_contract.end_date + datetime.timedelta(days=1),
            end_date=parent_contract.end_date + datetime.timedelta(days=1) + relativedelta(years=1),
            status='DRAFT'
        )
        
        return Response({
            "message": "Renewal draft created successfully",
            "contract_id": new_contract.id
        }, status=status.HTTP_201_CREATED)
"""

# Append to ContractViewSet
if "def renew(self, request, pk=None):" not in content:
    content = content.replace(
        "    @action(detail=False, methods=['get'])",
        renewal_action + "\n    @action(detail=False, methods=['get'])"
    )

with open('idhrts_backend/contracts/views.py', 'w') as f:
    f.write(content)
print("Added renew action to ContractViewSet")
