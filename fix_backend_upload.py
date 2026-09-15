import re

with open('idhrts_backend/properties/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("file_obj = request.FILES.get('file')", "file_obj = request.FILES.get('file') or request.FILES.get('document')")

with open('idhrts_backend/properties/views.py', 'w', encoding='utf-8') as f:
    f.write(content)
