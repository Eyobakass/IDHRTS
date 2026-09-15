import re

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{filteredProperties.length}', '{finalFilteredProperties.length}')
content = content.replace('filteredProperties.length === 0', 'finalFilteredProperties.length === 0')
content = content.replace('filteredProperties.map', 'finalFilteredProperties.map')

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
