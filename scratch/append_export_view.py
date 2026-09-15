import re

with open('idhrts_backend/reports/views.py', 'r') as f:
    content = f.read()

new_view = """
class FullDatabaseExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, table_name):
        if request.user.role != 'ADMIN':
            return HttpResponse('Unauthorized', status=403)
            
        import csv
        from django.http import HttpResponse
        from django.apps import apps
        
        # Map URL table name to actual Model
        table_mapping = {
            'users': ('users', 'User'),
            'properties': ('properties', 'Property'),
            'contracts': ('contracts', 'RentalContract'),
            'tax_assessments': ('tax', 'TaxAssessment'),
            'tax_payments': ('payments', 'TaxPayment'),
            'disputes': ('disputes', 'Dispute'),
            'audit_logs': ('users', 'AuditLog'),
            'notifications': ('notifications', 'Notification'),
        }
        
        if table_name not in table_mapping:
            return HttpResponse('Invalid table name', status=400)
            
        app_label, model_name = table_mapping[table_name]
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:
            return HttpResponse('Model not found', status=404)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{table_name}_export.csv"'
        writer = csv.writer(response)
        
        # Get all field names
        fields = [f.name for f in model._meta.fields]
        writer.writerow(fields)
        
        # Stream data to CSV
        for obj in model.objects.all().iterator():
            row = []
            for field in fields:
                val = getattr(obj, field)
                if val is None:
                    row.append('')
                else:
                    row.append(str(val))
            writer.writerow(row)
            
        # Log the export action
        from users.models import AuditLog
        AuditLog.objects.create(
            actor=request.user,
            action='FULL_DB_EXPORT',
            target_type=model_name,
            ip_address=request.META.get('REMOTE_ADDR')
        )
            
        return response
"""

content += new_view

with open('idhrts_backend/reports/views.py', 'w') as f:
    f.write(content)
print("Appended FullDatabaseExportView")
