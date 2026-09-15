import re

with open('idhrts_backend/tax/views.py', 'r') as f:
    content = f.read()

# Using regex to replace the function
pattern = r"def _calculate_ethiopian_rental_tax\(monthly_rent_etb: Decimal\):.*?(?=\n\nclass TaxAssessmentSerializer)"

new_func = """def _calculate_ethiopian_rental_tax(monthly_rent_etb: Decimal):
    gross = monthly_rent_etb * 12
    deduction = (gross * Decimal("0.20")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    taxable = gross - deduction

    from users.models import SystemConfig
    import json
    
    try:
        config = SystemConfig.objects.get(key='TAX_BRACKET_JSON')
        brackets_data = json.loads(config.value)
        brackets = []
        for b in brackets_data:
            upper = Decimal(str(b['upper'])) if b['upper'] is not None else Decimal("Infinity")
            rate = Decimal(str(b['rate']))
            brackets.append((upper, rate))
    except (SystemConfig.DoesNotExist, json.JSONDecodeError, Exception):
        # Fallback to defaults
        brackets = [
            (Decimal("7200"),   Decimal("0.00")),
            (Decimal("19800"),  Decimal("0.10")),
            (Decimal("38400"),  Decimal("0.15")),
            (Decimal("63000"),  Decimal("0.20")),
            (Decimal("93600"),  Decimal("0.25")),
            (Decimal("130800"), Decimal("0.30")),
            (Decimal("Infinity"), Decimal("0.35")),
        ]

    tax = Decimal("0.00")
    prev_limit = Decimal("0.00")

    for limit, rate in brackets:
        if taxable > prev_limit:
            if limit == Decimal("Infinity") or taxable <= limit:
                tax += (taxable - prev_limit) * rate
                break
            else:
                tax += (limit - prev_limit) * rate
        prev_limit = limit

    tax = tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    effective_rate = (tax / taxable * 100).quantize(Decimal("0.01")) if taxable > 0 else Decimal("0.00")

    return {
        "gross_annual": gross,
        "deduction": deduction,
        "taxable": taxable,
        "tax_due": tax,
        "effective_rate": effective_rate
    }"""

content = re.sub(pattern, new_func, content, flags=re.DOTALL)

with open('idhrts_backend/tax/views.py', 'w') as f:
    f.write(content)
print("Replaced tax calculation using regex")
