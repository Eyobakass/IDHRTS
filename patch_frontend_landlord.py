import codecs
with codecs.open(r"idhrts_frontend\src\app\dashboard\landlord\page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add states for modal
state_injection = """  const [contractsLoading, setContractsLoading] = useState(true);
  const router = useRouter();

  // Drafting Modal State
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftData, setDraftData] = useState({
    property: '',
    tenant_phone: '',
    monthly_rent_etb: '',
    advance_payment_etb: '',
    lease_start_date: '',
    lease_duration_months: '24',
    payment_method: 'BANK_TRANSFER'
  });
  const [drafting, setDrafting] = useState(false);

  const handleDraftContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrafting(true);
    try {
      await api.post('/contracts/', {
        ...draftData,
        monthly_rent_etb: parseFloat(draftData.monthly_rent_etb),
        advance_payment_etb: parseFloat(draftData.advance_payment_etb),
        lease_duration_months: parseInt(draftData.lease_duration_months)
      });
      alert('Contract drafted successfully!');
      setIsDraftModalOpen(false);
      // reload contracts
      const res = await api.get('/contracts/');
      setContracts(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch (e: any) {
      alert(e.response?.data?.tenant_phone?.[0] || e.response?.data?.non_field_errors?.[0] || e.response?.data?.error || 'Failed to draft contract');
    } finally {
      setDrafting(false);
    }
  };"""

text = text.replace("  const [contractsLoading, setContractsLoading] = useState(true);\n  const router = useRouter();", state_injection)

# Add button to Contracts section
button_injection = """          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-[28px] font-bold text-[#111827] leading-tight">My Contracts</h2>
              <p className="text-[14px] text-gray-500 mt-1">Manage your rental agreements</p>
            </div>
            <button
              onClick={() => setIsDraftModalOpen(true)}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-[14px] font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
            >
              + Draft New Contract
            </button>
          </div>"""

text = text.replace("""          <div className="mb-6">
            <h2 className="text-[28px] font-bold text-[#111827] leading-tight">My Contracts</h2>
            <p className="text-[14px] text-gray-500 mt-1">Manage your rental agreements</p>
          </div>""", button_injection)


# Add Modal at the end of the file
modal_injection = """
      {/* Draft Contract Modal */}
      {isDraftModalOpen && (
        <Modal isOpen={isDraftModalOpen} onClose={() => setIsDraftModalOpen(false)}>
          <div className="p-1">
            <h3 className="text-[20px] font-bold text-[#111827] mb-4">Draft New Contract</h3>
            <form onSubmit={handleDraftContract} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1">Select Property</label>
                <select
                  required
                  value={draftData.property}
                  onChange={e => setDraftData({...draftData, property: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                >
                  <option value="">-- Choose a property --</option>
                  {properties.filter(p => p.status === 'APPROVED_WOREDA').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.house_number} ({p.sub_city?.name || p.sub_city} - Woreda {p.woreda?.name || p.woreda})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1">Tenant Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+251..."
                  value={draftData.tenant_phone}
                  onChange={e => setDraftData({...draftData, tenant_phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1">Monthly Rent (ETB)</label>
                  <input
                    type="number"
                    required
                    value={draftData.monthly_rent_etb}
                    onChange={e => setDraftData({...draftData, monthly_rent_etb: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1">Advance Payment (ETB)</label>
                  <input
                    type="number"
                    required
                    value={draftData.advance_payment_etb}
                    onChange={e => setDraftData({...draftData, advance_payment_etb: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    required
                    value={draftData.lease_start_date}
                    onChange={e => setDraftData({...draftData, lease_start_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    required
                    min="24"
                    value={draftData.lease_duration_months}
                    onChange={e => setDraftData({...draftData, lease_duration_months: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1">Payment Method</label>
                <select
                  required
                  value={draftData.payment_method}
                  onChange={e => setDraftData({...draftData, payment_method: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="CBE_BIRR">CBE Birr</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="flex-1 py-2 text-[14px] font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={drafting}
                  className="flex-1 py-2 bg-[#2563EB] text-white text-[14px] font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {drafting ? 'Drafting...' : 'Submit Draft'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
"""

text = text.replace("    </div>\n  );\n}\n", modal_injection)

# Add Modal import at top if it isn't there
if "import Modal" not in text:
    text = text.replace("import EmptyState from '@/components/EmptyState';", "import EmptyState from '@/components/EmptyState';\nimport Modal from '@/components/Modal';")

with codecs.open(r"idhrts_frontend\src\app\dashboard\landlord\page.tsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated landlord/page.tsx")
