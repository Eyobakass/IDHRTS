import codecs
with codecs.open(r"idhrts_backend\disputes\tests.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
with codecs.open(r"idhrts_backend\disputes\tests.py", "w", encoding="utf-8") as f:
    for line in lines:
        if "self.assertEqual(response.status_code, status.HTTP_201_CREATED)" in line:
            f.write("        print('DEBUG JSON:', response.json() if hasattr(response, 'json') else response.data)\n")
        f.write(line)
