import re

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''  const downloadPdf = async (url: string, filename: string) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      showToast("Failed to download document", "error");
    }
  };

  const finalFilteredProperties = propertyFilter === "all" ? searchedProperties : searchedProperties.filter((p: any) => p.status === propertyFilter);

  const sectionTitle = {
    properties: "Pending Property Reviews",
    contracts: "Contracts Awaiting Authentication",
    disputes: "Woreda Disputes",
    walkin: "Walk-In Assistance"
  }[section];

  const sectionSubtitle = {
    properties: "Review and approve or reject landlord property submissions",
    contracts: "Authenticate signed rental contracts",
    disputes: "Manage and resolve disputes filed in your woreda",
    walkin: "Assist citizens without smartphones to use the platform"
  }[section];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F3F4F6]">
      <NavBar portalName="Woreda Officer Portal" variant="dark" />

      {toast && (
        <div
          className={ixed top-16 right-6 z-50'''

content = content.replace('          className={ixed top-16 right-6 z-50', replacement)

with open('idhrts_frontend/src/app/dashboard/woreda/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
