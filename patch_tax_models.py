import codecs
with codecs.open(r"idhrts_backend\tax\models.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
with codecs.open(r"idhrts_backend\tax\models.py", "w", encoding="utf-8") as f:
    for line in lines:
        f.write(line)
        if "prn_code = " in line:
            f.write("    prn_expires_at = models.DateTimeField(null=True, blank=True)\n")
print("Updated tax/models.py")
