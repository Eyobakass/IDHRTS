import os

models_path = 'idhrts_backend/users/models.py'
with open(models_path, 'r') as f:
    content = f.read()

# Add requires_pin_change to User
if 'requires_pin_change' not in content:
    content = content.replace(
        'is_active = models.BooleanField(default=True)',
        'is_active = models.BooleanField(default=True)\n    requires_pin_change = models.BooleanField(default=False)'
    )

# Add UserSession model
if 'class UserSession' not in content:
    session_model = """
class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    device_fingerprint = models.CharField(max_length=255) # Hash of UA + IP
    device_name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-last_active']
"""
    content += session_model

with open(models_path, 'w') as f:
    f.write(content)

print("Updated users/models.py")
