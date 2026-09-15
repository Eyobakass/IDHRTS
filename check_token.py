import requests
import json
import base64

res = requests.post('http://127.0.0.1:8000/api/auth/login/', json={
    'phone_number': '+251911000001',
    'pin': '1234'
})
data = res.json()
print('LOGIN STATUS:', res.status_code)
if 'access' in data:
    token = data['access']
    payload = token.split('.')[1]
    payload += '=' * (4 - len(payload) % 4)
    decoded = json.loads(base64.b64decode(payload))
    print('PAYLOAD:', decoded)
