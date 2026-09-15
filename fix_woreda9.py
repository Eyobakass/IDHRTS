import re

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('filteredProperties.length !== 1', 'finalFilteredProperties.length !== 1')

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
