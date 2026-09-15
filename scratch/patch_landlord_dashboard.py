import re

with open('idhrts_frontend/src/app/dashboard/landlord/page.tsx', 'r') as f:
    content = f.read()

# Add a function to handle renewal
renewal_func = """
  const handleRenew = async (contractId: string, oldRent: number) => {
    const newRentStr = window.prompt(`Enter new monthly rent in ETB. Note: Rent hike cannot exceed 11.5% of ${oldRent} ETB.`);
    if (!newRentStr) return;
    const newRent = parseFloat(newRentStr);
    if (isNaN(newRent)) return alert('Invalid rent amount');
    try {
      await api.post(`/contracts/${contractId}/renew/`, { monthly_rent_etb: newRent });
      alert('Contract renewal draft created successfully!');
      // reload page
      window.location.reload();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to renew contract');
    }
  };
"""

# Insert right after `useEffect`
content = content.replace("  const total = properties.length;", renewal_func + "\n  const total = properties.length;")

# Add the button to the UI
button_old = """                        </button>
                    )}"""
button_new = """                        </button>
                    )}
                    {c.status === 'REGISTERED' && (
                        <button
                          onClick={() => handleRenew(c.id, c.monthly_rent_etb)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-[14px] transition-colors mt-2"
                        >
                          Renew Contract
                        </button>
                    )}"""
content = content.replace(button_old, button_new)

with open('idhrts_frontend/src/app/dashboard/landlord/page.tsx', 'w') as f:
    f.write(content)
print("Patched Landlord Dashboard for Renewals")
