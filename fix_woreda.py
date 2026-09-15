import re

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip().startswith('className={ixed top-16 right-6 z-50'):
        new_lines.extend([
            '  const downloadPdf = async (url: string, filename: string) => {\n',
            '    try {\n',
            '      const res = await api.get(url, { responseType: \'blob\' });\n',
            '      const blobUrl = URL.createObjectURL(new Blob([res.data]));\n',
            '      const link = document.createElement(\'a\');\n',
            '      link.href = blobUrl;\n',
            '      link.download = filename;\n',
            '      document.body.appendChild(link);\n',
            '      link.click();\n',
            '      document.body.removeChild(link);\n',
            '      URL.revokeObjectURL(blobUrl);\n',
            '    } catch (err) {\n',
            '      showToast("Failed to download document", "error");\n',
            '    }\n',
            '  };\n',
            '\n',
            '  const finalFilteredProperties = propertyFilter === "all" ? searchedProperties : searchedProperties.filter((p: any) => p.status === propertyFilter);\n',
            '\n',
            '  const sectionTitle = {\n',
            '    properties: "Pending Property Reviews",\n',
            '    contracts: "Contracts Awaiting Authentication",\n',
            '    disputes: "Woreda Disputes",\n',
            '    walkin: "Walk-In Assistance"\n',
            '  }[section];\n',
            '\n',
            '  const sectionSubtitle = {\n',
            '    properties: "Review and approve or reject landlord property submissions",\n',
            '    contracts: "Authenticate signed rental contracts",\n',
            '    disputes: "Manage and resolve disputes filed in your woreda",\n',
            '    walkin: "Assist citizens without smartphones to use the platform"\n',
            '  }[section];\n',
            '\n',
            '  return (\n',
            '    <div className="flex flex-col h-screen overflow-hidden bg-[#F3F4F6]">\n',
            '      <NavBar portalName="Woreda Officer Portal" variant="dark" />\n',
            '\n',
            '      {toast && (\n',
            '        <div\n'
        ])
        new_lines.append(line)
    else:
        new_lines.append(line)

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'w') as f:
    f.writelines(new_lines)
