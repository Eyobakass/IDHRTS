import re

with open('idhrts_frontend/src/app/dashboard/tenant/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('wantsSms', 'smsOptIn')

with open('idhrts_frontend/src/app/dashboard/tenant/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
