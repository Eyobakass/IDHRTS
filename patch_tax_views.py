import codecs
with codecs.open(r"idhrts_backend\tax\views.py", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """        if not assessment.prn_code:
            import random
            # Generate a 12 digit random PRN
            prn = str(random.randint(100000000000, 999999999999))
            assessment.prn_code = prn
            assessment.save(update_fields=['prn_code'])"""

new_logic = """        if not assessment.prn_code or (assessment.prn_expires_at and assessment.prn_expires_at < timezone.now()):
            from tax.utils import next_prn_sequence
            from datetime import timedelta
            
            # Generate PRN per Appendix E
            prn = next_prn_sequence(assessment.property.woreda)
            assessment.prn_code = prn
            assessment.prn_expires_at = timezone.now() + timedelta(days=30)
            assessment.save(update_fields=['prn_code', 'prn_expires_at'])"""

content = content.replace(old_logic, new_logic)
with codecs.open(r"idhrts_backend\tax\views.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated tax/views.py")
