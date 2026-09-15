import codecs
with codecs.open(r"idhrts_backend\disputes\tests.py", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("'dispute_type': 'UNLAWFUL_RENT_INCREASE',", "'dispute_type': 'UNREGISTERED_CONTRACT',")
with codecs.open(r"idhrts_backend\disputes\tests.py", "w", encoding="utf-8") as f:
    f.write(c)
print("Fixed disputes/tests.py")
