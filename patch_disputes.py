import codecs

with codecs.open(r"idhrts_backend\disputes\views.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_create = False
skip = False
for line in lines:
    if "def perform_create(self, serializer):" in line:
        in_create = True
        new_lines.append(line)
        continue
    
    if in_create:
        if "contract = serializer.validated_data.get('contract')" in line:
            new_lines.append("        dispute_type = serializer.validated_data.get('dispute_type')\n")
            new_lines.append(line)
            continue
            
        if "if not contract:" in line:
            new_lines.append("        if not contract and dispute_type != 'UNREGISTERED_CONTRACT':\n")
            continue
            
        if "if self.request.user != contract.landlord and self.request.user != contract.tenant:" in line:
            new_lines.append("        if contract and self.request.user != contract.landlord and self.request.user != contract.tenant:\n")
            continue
            
        if "woreda=contract.property.woreda" in line:
            new_lines.append("            woreda=contract.property.woreda if contract else serializer.validated_data.get('woreda')\n")
            continue
            
        if "def _assign_and_notify_officer" in line:
            in_create = False
            
    new_lines.append(line)

with codecs.open(r"idhrts_backend\disputes\views.py", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Fixed disputes/views.py")
