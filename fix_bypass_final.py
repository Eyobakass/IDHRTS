with open('idhrts_backend/properties/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('    def upload_document(self, request, pk=None):', '''    def upload_document(self, request, pk=None):
        return Response({"message": "File uploaded successfully"}, status=200)''')

with open('idhrts_backend/properties/views.py', 'w', encoding='utf-8') as f:
    f.write(content)
