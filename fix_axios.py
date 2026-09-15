import re

with open('idhrts_frontend/src/app/dashboard/landlord/register-property/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("await api.post(/properties/\/upload_document/, fileData, {\n          headers: { 'Content-Type': 'multipart/form-data' }\n        });", "await api.post(/properties/\/upload_document/, fileData);")

with open('idhrts_frontend/src/app/dashboard/landlord/register-property/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
