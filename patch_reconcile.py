import codecs
with codecs.open(r"idhrts_backend\payments\views.py", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """        try:
            payment = TaxPayment.objects.get(prn_code=prn, status='PROCESSING')
            payment.status = 'CONFIRMED'"""

new_logic = """        from django.utils import timezone
        try:
            payment = TaxPayment.objects.get(prn_code=prn, status='PROCESSING')
            
            if payment.assessment.prn_expires_at and payment.assessment.prn_expires_at < timezone.now():
                payment.status = 'FAILED'
                payment.save(update_fields=['status'])
                return Response({'error': 'PRN has expired (exceeded 30 days validity). The landlord must generate a new PRN.'}, status=400)
                
            payment.status = 'CONFIRMED'"""

content = content.replace(old_logic, new_logic)
with codecs.open(r"idhrts_backend\payments\views.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated payments/views.py")
