import codecs, re
with codecs.open(r"idhrts_backend\disputes\tests.py", "r", encoding="utf-8") as f:
    text = f.read()

# Replace the literal characters \n with actual newline, etc
text = text.replace(r"print('\nDEBUG:', response.content)\n        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)", "self.assertEqual(response.status_code, status.HTTP_201_CREATED)")
text = text.replace(r"print('\nDEBUG:', response.content)\n        self.assertEqual(response.status_code, status.HTTP_201_CREATED)", "self.assertEqual(response.status_code, status.HTTP_201_CREATED)")

with codecs.open(r"idhrts_backend\disputes\tests.py", "w", encoding="utf-8") as f:
    f.write(text)
