import codecs
with codecs.open(r"idhrts_frontend\src\app\dashboard\woreda\page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add downloadSigtas and walk-in form handlers
handlers_injection = """  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // SIGTAS Export
  const downloadSigtas = async () => {
    try {
      const res = await api.get('/reports/sigtas/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sigtas_schedule_b_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('SIGTAS CSV Export downloaded.', 'success');
    } catch (err) {
      showToast('Failed to download SIGTAS export.', 'error');
    }
  };

  // Walk-In Forms
  const [walkinProp, setWalkinProp] = useState({ landlord_phone: '', house_number: '', monthly_rent_etb: '' });
  const [walkinDisp, setWalkinDisp] = useState({ contract_reg_number: '', dispute_type: 'UNPAID_RENT', description: '' });
  const [walkinLoading, setWalkinLoading] = useState(false);

  const handleWalkinProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinLoading(true);
    try {
      await api.post('/properties/walk_in/', walkinProp);
      showToast('Walk-in property registered successfully', 'success');
      setWalkinProp({ landlord_phone: '', house_number: '', monthly_rent_etb: '' });
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to register walk-in property', 'error');
    } finally {
      setWalkinLoading(false);
    }
  };

  const handleWalkinDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinLoading(true);
    try {
      await api.post('/disputes/walk_in/', walkinDisp);
      showToast('Walk-in dispute filed successfully', 'success');
      setWalkinDisp({ contract_reg_number: '', dispute_type: 'UNPAID_RENT', description: '' });
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to file walk-in dispute', 'error');
    } finally {
      setWalkinLoading(false);
    }
  };
"""

text = text.replace("  const [actionLoading, setActionLoading] = useState<string | null>(null);", handlers_injection)

# Add Download SIGTAS button to header
header_injection = """
          <div className="flex items-center gap-4">
            <button
              onClick={downloadSigtas}
              className="px-4 py-2 bg-green-600 text-white text-[14px] font-semibold rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              dY"? Download SIGTAS CSV
            </button>
            <div className="flex bg-[#F3F4F6] p-1 rounded-lg">"""

text = text.replace('          <div className="flex items-center gap-4">\n            <div className="flex bg-[#F3F4F6] p-1 rounded-lg">', header_injection)

# Update Walk-In Property form
prop_form_old = """<form onSubmit={(e) => { e.preventDefault(); showToast("Submitted walk-in property", "success"); }} className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Landlord Phone Number</label>
                        <input type="text" required placeholder="+251..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">House Number</label>
                        <input type="text" required placeholder="House number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Monthly Rent (ETB)</label>
                        <input type="number" required placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <button type="submit" className="w-full bg-[#2563EB] text-white py-2 rounded-lg font-semibold text-[14px]">
                        Register Property
                      </button>
                    </form>"""

prop_form_new = """<form onSubmit={handleWalkinProperty} className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Landlord Phone Number</label>
                        <input type="text" required value={walkinProp.landlord_phone} onChange={e => setWalkinProp({...walkinProp, landlord_phone: e.target.value})} placeholder="+251..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">House Number</label>
                        <input type="text" required value={walkinProp.house_number} onChange={e => setWalkinProp({...walkinProp, house_number: e.target.value})} placeholder="House number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Monthly Rent (ETB)</label>
                        <input type="number" required value={walkinProp.monthly_rent_etb} onChange={e => setWalkinProp({...walkinProp, monthly_rent_etb: e.target.value})} placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <button type="submit" disabled={walkinLoading} className="w-full bg-[#2563EB] text-white py-2 rounded-lg font-semibold text-[14px]">
                        {walkinLoading ? 'Submitting...' : 'Register Property'}
                      </button>
                    </form>"""
text = text.replace(prop_form_old, prop_form_new)

disp_form_old = """<form onSubmit={(e) => { e.preventDefault(); showToast("Submitted walk-in dispute", "success"); }} className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Contract Registration Number</label>
                        <input type="text" required placeholder="CTR-..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Dispute Type</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]">
                          <option>UNPAID_RENT</option>
                          <option>PROPERTY_DAMAGE</option>
                          <option>EVICTION_NOTICE</option>
                          <option>OTHER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Description</label>
                        <textarea required rows={3} placeholder="Provide details..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"></textarea>
                      </div>
                      <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold text-[14px]">
                        File Dispute
                      </button>
                    </form>"""
                    
disp_form_new = """<form onSubmit={handleWalkinDispute} className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Contract Registration Number</label>
                        <input type="text" required value={walkinDisp.contract_reg_number} onChange={e => setWalkinDisp({...walkinDisp, contract_reg_number: e.target.value})} placeholder="CTR-..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Dispute Type</label>
                        <select required value={walkinDisp.dispute_type} onChange={e => setWalkinDisp({...walkinDisp, dispute_type: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]">
                          <option value="UNPAID_RENT">UNPAID_RENT</option>
                          <option value="PROPERTY_DAMAGE">PROPERTY_DAMAGE</option>
                          <option value="EVICTION_NOTICE">EVICTION_NOTICE</option>
                          <option value="UNREGISTERED_CONTRACT">UNREGISTERED_CONTRACT</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Description</label>
                        <textarea required value={walkinDisp.description} onChange={e => setWalkinDisp({...walkinDisp, description: e.target.value})} rows={3} placeholder="Provide details..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"></textarea>
                      </div>
                      <button type="submit" disabled={walkinLoading} className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold text-[14px]">
                        {walkinLoading ? 'Filing...' : 'File Dispute'}
                      </button>
                    </form>"""
text = text.replace(disp_form_old, disp_form_new)

with codecs.open(r"idhrts_frontend\src\app\dashboard\woreda\page.tsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated woreda/page.tsx")
