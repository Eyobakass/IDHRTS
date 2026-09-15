import codecs
with codecs.open(r"idhrts_backend\disputes\views.py", "r", encoding="utf-8") as f:
    text = f.read()

new_logic = """
    @action(detail=False, methods=['post'], url_path='walk_in')
    def walk_in(self, request):
        if request.user.role != 'WOREDA_OFFICER':
            return Response({"error": "Unauthorized"}, status=403)
            
        contract_reg = request.data.get('contract_reg_number')
        dispute_type = request.data.get('dispute_type')
        description = request.data.get('description')
        
        from contracts.models import RentalContract
        try:
            contract = RentalContract.objects.get(contract_reg_number=contract_reg)
        except RentalContract.DoesNotExist:
            return Response({"error": "Contract not found."}, status=400)
            
        dispute = Dispute.objects.create(
            contract=contract,
            woreda=contract.property.woreda,
            filer=contract.tenant, # assume tenant filed it for walk-in if not specified, or landlord
            respondent=contract.landlord,
            dispute_type=dispute_type,
            description=description,
            status='FILED'
        )
        return Response({"id": dispute.id, "status": "Dispute Filed for Walk-in"})
"""

text = text.replace("    @action(detail=True, methods=['post'])\n    def resolve(self, request, pk=None):", new_logic + "\n    @action(detail=True, methods=['post'])\n    def resolve(self, request, pk=None):")

with codecs.open(r"idhrts_backend\disputes\views.py", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated disputes/views.py")
