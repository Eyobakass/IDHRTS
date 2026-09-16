'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import SkeletonCard from '@/components/SkeletonCard';

interface Contract {
  id: string;
  contract_reg_number?: string;
  monthly_rent_etb: number;
  advance_payment_etb?: number;
  lease_duration_months: number;
  status: string;
  lease_start_date?: string;
  lease_end_date?: string;
  property_detail?: { house_number?: string; building_type?: string; };
  landlord_detail?: { full_name_en?: string };
  secure_review_token?: string;
  tenant_detail?: { full_name_en?: string };
}

interface Dispute {
  id: string;
  dispute_type: string;
  status: string;
  description: string;
  created_at: string;
  ruling_text?: string;
  appeal_deadline?: string;
  contract?: string;
}

const DISPUTE_TYPES = [
  { value: 'UNLAWFUL_RENT_INCREASE', label: 'Unlawful Rent Increase' },
  { value: 'ILLEGAL_EVICTION_NOTICE', label: 'Illegal Eviction Notice' },
  { value: 'UNREGISTERED_CONTRACT', label: 'Unregistered Contract' },
  { value: 'UTILITY_DISCONNECTION', label: 'Utility Disconnection' },
  { value: 'DEPOSIT_NOT_RETURNED', label: 'Deposit Not Returned' },
  { value: 'OTHER', label: 'Other' }
];

export default function TenantDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'contracts' | 'disputes'>('contracts');
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  
  // Dispute Modal State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [disputeType, setDisputeType] = useState(DISPUTE_TYPES[0].value);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, disputesRes] = await Promise.all([
        api.get('/contracts/'),
        api.get('/disputes/')
      ]);
      setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : contractsRes.data.results ?? []);
      setDisputes(Array.isArray(disputesRes.data) ? disputesRes.data : disputesRes.data.results ?? []);
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    api.get('/auth/sessions/').then(res => { setSessions(Array.isArray(res.data) ? res.data : []); setSessionsLoading(false); }).catch(() => setSessionsLoading(false));
    api.get('/auth/preferences/').then(res => setSmsOptIn(res.data?.sms_opt_in ?? true)).catch(() => {});
  }, [router]);

  const handleRevokeSession = async (sessionId: string) => {
    try { await api.post(`/auth/sessions/${sessionId}/revoke/`); setSessions((s: any[]) => s.filter((x: any) => x.id !== sessionId)); }
    catch { showToast('Failed to revoke session.', 'error'); }
  };

  const handleToggleSms = async () => {
    setPrefsSaving(true);
    try { const next = !smsOptIn; await api.patch('/auth/preferences/', { sms_opt_in: next }); setSmsOptIn(next); }
    catch { showToast('Failed to save preference.', 'error'); }
    finally { setPrefsSaving(false); }
  };

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDispute(true);
    try {
      await api.post('/disputes/', {
        contract: selectedContractId,
        dispute_type: disputeType,
        description: disputeDescription
      });
      showToast('Dispute filed successfully. A Woreda Officer will review it shortly.', 'success');
      setIsDisputeModalOpen(false);
      setDisputeType(DISPUTE_TYPES[0].value);
      setDisputeDescription('');
      fetchData();
      setActiveTab('disputes');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to file dispute', 'error');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const renderContracts = () => {
    if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /></div>;
    if (contracts.length === 0) return <EmptyState title="No Contracts Yet" description="Your landlord will send you a contract when ready." />;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-fade-in">
        {contracts.map(c => {
          const isRegistered = c.status === 'REGISTERED' || c.status === 'SIGNED';
          const isPending = c.status === 'PENDING_TENANT_SIGNATURE';

          return (
            <div key={c.id} className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-white">
              <div className={`px-5 py-4 flex items-center justify-between ${isRegistered ? 'bg-[#1E3A5F]' : isPending ? 'bg-[#D97706]' : 'bg-gray-500'}`}>
                <span className="text-white text-[15px] font-semibold">
                  {c.contract_reg_number ? `Contract #${c.contract_reg_number}` : 'Contract #(Pending)'}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isRegistered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                  {isRegistered ? 'REGISTERED' : 'AWAITING SIGNATURE'}
                </span>
              </div>

              <div className="px-5 py-5 space-y-4">
                {c.property_detail && (
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span className="text-[14px] text-[#111827] font-medium">House #{c.property_detail.house_number}, {c.property_detail.building_type}</span>
                  </div>
                )}
                <div className="h-px bg-gray-100" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-600">
                  <span>Monthly Rent: <strong className="text-[#111827]">ETB {c.monthly_rent_etb?.toLocaleString()}</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Duration: <strong className="text-[#111827]">{c.lease_duration_months} months</strong></span>
                </div>
                {c.landlord_detail && (
                  <div className="text-[13px] text-gray-600">
                    <span>Landlord: <strong className="text-[#111827]">{c.landlord_detail.full_name_en}</strong></span>
                  </div>
                )}

                {isRegistered ? (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        api.get(`/contracts/${c.id}/pdf/`, { responseType: 'blob' }).then(res => {
                          const a = document.createElement('a');
                          a.href = window.URL.createObjectURL(res.data);
                          a.download = `Contract_${c.contract_reg_number || c.id}.pdf`;
                          a.click();
                        });
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border border-green-600 rounded py-2 text-[13px] font-medium transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContractId(c.id);
                        setIsDisputeModalOpen(true);
                      }}
                      className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 rounded py-2 text-[13px] font-medium transition-colors"
                    >
                      Dispute
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Enter termination reason:");
                        if (reason) {
                          api.post(`/contracts/${c.id}/terminate/`, { termination_reason: reason })
                          .then(() => { alert("Contract terminated."); window.location.reload(); })
                          .catch(() => alert("Failed to terminate contract."));
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-2 text-[13px] font-medium transition-colors"
                    >
                      Terminate
                    </button>
                  </div>
                ) : isPending ? (
                  <button
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 rounded-lg font-semibold text-[14px] transition-colors mt-2"
                    onClick={() => {
                      if (c.secure_review_token) {
                        router.push(`/review/${c.secure_review_token}`);
                      } else {
                        alert('Review link not available yet. Please contact your landlord.');
                      }
                    }}
                  >
                    Review & Sign
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDisputes = () => {
    if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /></div>;
    if (disputes.length === 0) return <EmptyState title="No Disputes" description="You have not filed any disputes." />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        {disputes.map(d => {
          const isClosed = d.status === 'CLOSED' || d.status === 'DECISION_ISSUED';
          
          return (
            <div key={d.id} className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-white">
              <div className={`px-5 py-4 flex items-center justify-between ${isClosed ? 'bg-gray-100 border-b border-gray-200' : 'bg-red-50 border-b border-red-100'}`}>
                <span className={`text-[15px] font-semibold ${isClosed ? 'text-gray-700' : 'text-red-800'}`}>
                  {d.dispute_type.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  d.status === 'FILED' ? 'bg-orange-100 text-orange-800' :
                  d.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                  d.status === 'DECISION_ISSUED' ? 'bg-purple-100 text-purple-800' :
                  d.status === 'CLOSED' ? 'bg-gray-200 text-gray-700' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {d.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="px-5 py-5 space-y-3">
                <p className="text-[13px] text-gray-600 line-clamp-3">"{d.description}"</p>
                <p className="text-[11px] text-gray-400">Filed on {new Date(d.created_at).toLocaleDateString()}</p>
                
                {d.ruling_text && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-1">Official Ruling</p>
                    <p className="text-[13px] text-purple-900">{d.ruling_text}</p>
                  </div>
                )}

                {d.status === 'DECISION_ISSUED' && (
                  <button
                    className="w-full mt-3 border border-purple-400 text-purple-700 py-2 rounded-lg text-[13px] font-semibold hover:bg-purple-50 transition-colors"
                    onClick={() => {
                      const reason = window.prompt('Enter your appeal reason (minimum 50 characters):');
                      if (reason === null) return;
                      if (reason.trim().length < 50) {
                        alert('Appeal reason must be at least 50 characters.');
                        return;
                      }
                      api.post(`/disputes/${d.id}/appeal/`, { appeal_reason: reason.trim() })
                        .then(() => {
                          alert('Appeal submitted successfully. The Woreda Office will review your case.');
                          window.location.reload();
                        })
                        .catch((err: any) => alert(err.response?.data?.error || 'Failed to submit appeal.'));
                    }}
                  >
                    Appeal Decision
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Tenant Portal" />

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] sm:text-[32px] font-black text-[#111827] leading-tight">My Dashboard</h1>
            <p className="text-[14px] text-gray-500 mt-1">Manage your contracts and resolve issues</p>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-[#E5E7EB] self-start md:self-auto">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${activeTab === 'contracts' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Contracts
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'disputes' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Disputes
              {disputes.filter(d => d.status !== 'CLOSED').length > 0 && (
                <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold">
                  {disputes.filter(d => d.status !== 'CLOSED').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {toast && (
          <div className={`fixed top-20 right-8 px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in ${toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            <span className="text-[14px] font-medium">{toast.message}</span>
          </div>
        )}

        {activeTab === 'contracts' ? renderContracts() : renderDisputes()}
      
      {/* Fix 21: Active Sessions */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <h2 className="text-[16px] font-bold text-[#111827] mb-3">Active Sessions</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden overflow-x-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-[13px]">No active sessions.</div>
          ) : (
            <table className="min-w-full text-[13px] divide-y divide-gray-100">
              <thead className="bg-gray-50"><tr>
                {['Device','IP Address','Last Active',''].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.device_name || 'Unknown Device'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.last_active ? new Date(s.last_active).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleRevokeSession(s.id)} className="text-red-600 hover:text-red-800 text-[12px] font-medium">Revoke</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Fix 28: SMS Notification Preference */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#111827]">SMS Notifications</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Receive SMS alerts for contract and dispute updates.</p>
          </div>
          <button onClick={handleToggleSms} disabled={prefsSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${smsOptIn ? "bg-blue-600" : "bg-gray-300"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${smsOptIn ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </section>
    </main>

      {/* Dispute Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-[18px] text-gray-900">File a Dispute</h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleFileDispute} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Dispute Type</label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    {DISPUTE_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-[14px] h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">This will be submitted to the Woreda Housing Office for mediation.</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 text-[14px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-2 text-[14px] font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
