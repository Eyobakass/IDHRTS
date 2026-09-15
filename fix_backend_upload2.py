import re

with open('idhrts_backend/properties/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''          prop = self.get_object()
          if prop.status not in ['DRAFT', 'REJECTED']:
              print('UPLOAD ERROR 1: Status is', prop.status)
              return Response({"error": "Cannot upload documents unless property is DRAFT or REJECTED"}, status=400)
              
          file_obj = request.FILES.get('file') or request.FILES.get('document')
          doc_type = request.data.get('doc_type', 'TITLE_DEED')
          
          if not file_obj:
              print('UPLOAD ERROR 2: No file provided. FILES:', request.FILES.keys())
              return Response({"error": "No file provided"}, status=400)
              
          if file_obj.size > 10 * 1024 * 1024:
              print('UPLOAD ERROR 3: File too big')
              return Response({"error": "File exceeds 10 MB limit."}, status=400)
              
          ext = file_obj.name.split('.')[-1].lower()
          if ext not in ['pdf', 'jpg', 'jpeg', 'png']:
              print('UPLOAD ERROR 4: Invalid ext', ext)
              return Response({"error": "Invalid file format"}, status=400)'''

content = re.sub(r'          prop = self.get_object\(\).*?return Response\(\{"error": "Invalid file format"\}, status=400\)', replacement, content, flags=re.DOTALL)

with open('idhrts_backend/properties/views.py', 'w', encoding='utf-8') as f:
    f.write(content)
