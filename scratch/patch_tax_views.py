import re

with open('idhrts_backend/tax/views.py', 'r') as f:
    content = f.read()

tax_func_old = """def _calculate_ethiopian_rental_tax(monthly_rent_etb: Decimal):
    \"\"\"
    Ethiopian rental income tax calculation per ERCA schedule:
    1. Gross annual rent = monthly_rent * 12
    2. Deduction = 20% of gross annual (allowable expenses)
    3. Taxable income = gross - deduction
    4. Progressive tax rates applied to taxable income:
       0 - 7,200       -> 0%
       7,201 - 19,800  -> 10%
       19,801 - 38,400 -> 15%
       38,401 - 63,000 -> 20%
       63,001 - 93,600 -> 25%
       93,601 - 130,800-> 30%
       130,801+        -> 35%
    \"\"\"
    gross = monthly_rent_etb * 12
    deduction = (gross * Decimal("0.20")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    taxable = gross - deduction

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

tax_func_new = """def _calculate_ethiopian_rental_tax(monthly_rent_etb: Decimal):
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
    except (SystemConfig.DoesNotExist, json.JSONDecodeError):
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

if tax_func_old in content:
    content = content.replace(tax_func_old, tax_func_new)
    print("Replaced tax calculation")

with open('idhrts_backend/tax/views.py', 'w') as f:
    f.write(content)
