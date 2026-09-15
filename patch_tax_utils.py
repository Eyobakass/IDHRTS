import codecs

new_logic = """
def build_prn_prefix(woreda, date_obj=None):
    from django.utils import timezone
    date_obj = date_obj or timezone.now().date()
    date_str = date_obj.strftime('%Y%m%d')
    woreda_code = str(getattr(woreda, 'code', '')).zfill(2)
    return f"PRN-{woreda_code}-{date_str}-"

def next_prn_sequence(woreda):
    from tax.models import TaxAssessment
    from django.utils import timezone
    
    prefix = build_prn_prefix(woreda)
    latest = (
        TaxAssessment.objects
        .filter(prn_code__startswith=prefix)
        .order_by('-prn_code')
        .values_list('prn_code', flat=True)
        .first()
    )
    sequence = 1
    if latest:
        try:
            sequence = int(latest.split('-')[-1]) + 1
        except (IndexError, ValueError):
            pass
    return f"{prefix}{sequence:06d}"
"""

with codecs.open(r"idhrts_backend\tax\utils.py", "a", encoding="utf-8") as f:
    f.write(new_logic)
print("Updated tax/utils.py")
