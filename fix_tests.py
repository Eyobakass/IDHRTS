import codecs
with codecs.open(r"idhrts_backend\disputes\tests.py", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("print('\\nDEBUG:', response.content)\\n        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)", "self.assertEqual(response.status_code, status.HTTP_201_CREATED)")

with codecs.open(r"idhrts_backend\disputes\tests.py", "w", encoding="utf-8") as f:
    f.write(text)
