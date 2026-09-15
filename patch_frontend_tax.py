import codecs
with codecs.open(r"idhrts_frontend\src\app\dashboard\tax\page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

state_injection = """  const [generateLoading, setGenerateLoading] = useState<string | null>(null);

  // PRN Reconciliation State
  const [isPrnModalOpen, setIsPrnModalOpen] = useState(false);
  const [prnCode, setPrnCode] = useState('');
  const [prnSubmitting, setPrnSubmitting] = useState(false);

  const handleReconcilePrn = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrnSubmitting(true);
    try {
      await api.post('/payments/reconcile_prn/', { prn_code: prnCode });
      showMessage('PRN Successfully Reconciled and Paid!', 'success');
      setIsPrnModalOpen(false);
      setPrnCode('');
      // Reload assessments
      const res = await api.get('/tax/');
      setAssessments(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Failed to reconcile PRN. Ensure it is valid and not expired.', 'error');
    } finally {
      setPrnSubmitting(false);
    }
  };
"""

text = text.replace("  const [generateLoading, setGenerateLoading] = useState<string | null>(null);", state_injection)

# Add button
header_injection = """            <button 
              onClick={downloadSigtas}
              className="px-4 py-2 bg-[#166534] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:bg-[#14532D] transition-colors flex items-center gap-2"
            >
              dY"? Export SIGTAS Data
            </button>
            <button
              onClick={() => setIsPrnModalOpen(true)}
              className="px-4 py-2 bg-[#2563EB] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
            >
              dY"Reconcile PRN
            </button>
          </div>"""

text = text.replace("""            <button 
              onClick={downloadSigtas}
              className="px-4 py-2 bg-[#166534] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:bg-[#14532D] transition-colors flex items-center gap-2"
            >
              dY"? Export SIGTAS Data
            </button>
          </div>""", header_injection)

# Add modal
modal_injection = """
      {/* PRN Reconciliation Modal */}
      {isPrnModalOpen && (
        <Modal isOpen={isPrnModalOpen} onClose={() => setIsPrnModalOpen(false)}>
          <div className="p-1">
            <h3 className="text-[20px] font-bold text-[#111827] mb-4">Reconcile Offline PRN</h3>
            <p className="text-[13px] text-gray-500 mb-6">Enter the Payment Reference Number from the physical bank slip to mark the tax assessment as paid.</p>
            <form onSubmit={handleReconcilePrn} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1">PRN Code</label>
                <input
                  type="text"
                  required
                  value={prnCode}
                  onChange={e => setPrnCode(e.target.value)}
                  placeholder="PRN-..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrnModalOpen(false)}
                  className="flex-1 py-2 text-[14px] font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prnSubmitting}
                  className="flex-1 py-2 bg-[#2563EB] text-white text-[14px] font-semibold rounded-lg hover:bg-[#1D4ED8]"
                >
                  {prnSubmitting ? 'Verifying...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}"""

text = text.replace("    </div>\n  );\n}", modal_injection)

if "import Modal" not in text:
    text = text.replace("import EmptyState from '@/components/EmptyState';", "import EmptyState from '@/components/EmptyState';\nimport Modal from '@/components/Modal';")

with codecs.open(r"idhrts_frontend\src\app\dashboard\tax\page.tsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated tax/page.tsx")
