import re

with open('idhrts_frontend/e2e/real/property-workflow.spec.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('await landlordPage.goto', 'landlordPage.on(\'console\', msg => console.log(\'BROWSER CONSOLE: \', msg.text()));\n    await landlordPage.goto')

with open('idhrts_frontend/e2e/real/property-workflow.spec.ts', 'w', encoding='utf-8') as f:
    f.write(content)
