import os

models_path = 'idhrts_backend/users/models.py'
with open(models_path, 'r') as f:
    content = f.read()

# Fix subcity and woreda requires_pin_change
content = content.replace('''class SubCity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name_en = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100)
    code = models.CharField(max_length=5, unique=True)
    is_active = models.BooleanField(default=True)
    requires_pin_change = models.BooleanField(default=False)''', '''class SubCity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name_en = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100)
    code = models.CharField(max_length=5, unique=True)
    is_active = models.BooleanField(default=True)''')

content = content.replace('''class Woreda(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_city = models.ForeignKey(SubCity, on_delete=models.CASCADE)
    name_en = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100)
    code = models.CharField(max_length=5)
    is_active = models.BooleanField(default=True)
    requires_pin_change = models.BooleanField(default=False)''', '''class Woreda(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_city = models.ForeignKey(SubCity, on_delete=models.CASCADE)
    name_en = models.CharField(max_length=100)
    name_am = models.CharField(max_length=100)
    code = models.CharField(max_length=5)
    is_active = models.BooleanField(default=True)''')

with open(models_path, 'w') as f:
    f.write(content)

# Delete migration 0006
import glob
for p in glob.glob('idhrts_backend/users/migrations/0006*.py'):
    os.remove(p)

print("Fixed users/models.py")
