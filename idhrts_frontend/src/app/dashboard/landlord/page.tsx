'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import PropertyCard from '@/components/PropertyCard';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import SkeletonCard from '@/components/SkeletonCard';

export default function LandlordDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  // Fix 21: sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  // Fix 28: SMS preferences
  const [smsOptIn, setSmsOptIn] = useState<boolean>(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get('/properties/')
      .then(res => { setProperties(Array.isArray(res.data) ? res.data : res.data.results ?? []); setLoading(false); })
      .catch(() => router.push('/login'));
      
    api.get('/contracts/')
      .then(res => { setContracts(Array.isArray(res.data) ? res.data : res.data.results ?? []); setContractsLoading(false); })
      .catch(console.error);

    // FR-TAX-003: Landlord tax view
    api.get('/tax/')
      .then(res => { setAssessments(Array.isArray(res.data) ? res.data : res.data.results ?? []); setAssessmentsLoading(false); })
      .catch(() => setAssessmentsLoading(false));
    // Fix 21: active sessions
    api.get('/auth/sessions/').then(res => { setSessions(Array.isArray(res.data) ? res.data : []); setSessionsLoading(false); }).catch(() => setSessionsLoading(false));
    // Fix 28: load preferences
    api.get('/auth/preferences/').then(res => setSmsOptIn(res.data?.sms_opt_in ?? true)).catch(() => {});
  }, [router]);


  // Fix 21: revoke session
  const handleRevokeSession = async (sessionId: string) => {
    try { await api.post(`/auth/sessions/${sessionId}/revoke/`); setSessions(s => s.filter(x => x.id !== sessionId)); }
    catch { alert('Failed to revoke session.'); }
  };

  // Fix 28: toggle SMS opt-in
  const handleToggleSms = async () => {
    setPrefsSaving(true);
    try {
      const next = !smsOptIn;
      await api.patch('/auth/preferences/', { sms_opt_in: next });
      setSmsOptIn(next);
    } catch { alert('Failed to save preference.'); }
    finally { setPrefsSaving(false); }
  };

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

  const total = properties.length;
  const active = properties.filter((p: any) => p.status === 'ACTIVE').length;
  const pending = properties.filter((p: any) => p.status === 'PENDING_REVIEW').length;
  const rejected = properties.filter((p: any) => p.status === 'DRAFT' && p.review_note).length;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Landlord Portal" />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[36px] font-bold text-[#111827] leading-tight">My Properties</h1>
            <p className="text-[14px] text-gray-500 mt-1">Manage your registered properties</p>
          </div>
          <Link href="/dashboard/landlord/register-property"
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Register Property
          </Link>
        </div>

        {/* Stats row — 4 inline cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard variant="inline" label="Total Properties" value={total} />
          <StatCard variant="inline" label="Rejected" value={rejected} />
          <StatCard variant="inline" label="Active" value={active} />
          <StatCard variant="inline" label="Pending Review" value={pending} />
        </div>
        {/* Note: The 4-card layout above matches the design image exactly */}

        {/* Property grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState title="No Properties Yet" description="Register your first property to get started." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {properties.map((p: any) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* Contracts Section */}
        <div className="mb-6">
          <h2 className="text-[28px] font-bold text-[#111827] leading-tight">My Contracts</h2>
          <p className="text-[14px] text-gray-500 mt-1">Manage your rental agreements</p>
        </div>
        {contractsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState title="No Contracts" description="No contracts have been generated yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((c: any) => {
              const isRegistered = c.status === 'REGISTERED' || c.status === 'SIGNED';
              return (
                <div key={c.id} className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-white">
                  <div className={`px-5 py-4 flex items-center justify-between ${
                    isRegistered ? 'bg-[#1E3A5F]' : 'bg-gray-500'
                  }`}>
                    <span className="text-white text-[15px] font-semibold">
                      {c.contract_reg_number ? `Contract #${c.contract_reg_number}` : 'Pending Contract'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {c.status}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="text-[14px] text-[#111827] font-medium">
                      Tenant: {c.tenant_detail?.full_name_en || 'Unknown'}
                    </div>
                    <div className="text-[13px] text-gray-600">
                      Rent: ETB {c.monthly_rent_etb?.toLocaleString()} / mo
                    </div>
                    {isRegistered && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            // Routed through the shared api client so the backend host
                            // comes from one place and the JWT interceptor applies.
                            api.get(`/contracts/${c.id}/pdf/`, { responseType: 'blob' })
                            .then(res => {
                              const a = document.createElement('a');
                              a.href = window.URL.createObjectURL(res.data);
                              a.download = `Contract_${c.contract_reg_number || c.id}.pdf`;
                              a.click();
                            });
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-[13px] transition-colors"
                        >
                          Download
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
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-[13px] transition-colors"
                        >
                          Terminate
                        </button>
                        {c.status === 'REGISTERED' && (
                          <button
                            onClick={() => handleRenew(c.id, c.monthly_rent_etb)}
                            className="flex-1 bg-[#1E3A5F] hover:bg-[#162D4A] text-white py-2.5 rounded-lg font-semibold text-[13px] transition-colors"
                          >
                            Renew
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FR-TAX-003: Tax Assessments section */}
      <main className="max-w-7xl mx-auto px-8 pb-12">
        <div className="mb-6">
          <h2 className="text-[28px] font-bold text-[#111827] leading-tight">My Tax Assessments</h2>
          <p className="text-[14px] text-gray-500 mt-1">Your rental income tax obligations</p>
        </div>
        {assessmentsLoading ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center text-gray-400">Loading...</div>
        ) : assessments.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] py-12">
            <div className="text-center text-gray-500 text-[14px]">No tax assessments yet. They appear here after your contract is registered.</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            <table className="w-full text-[14px]">
              <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  {['Fiscal Year', 'Property', 'Annual Rent', 'Tax Due (ETB)', 'Due Date', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#111827]">{a.fiscal_year ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">#{a.property_detail?.house_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">ETB {Number(a.gross_annual_rent_etb ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-[#111827]">ETB {Number(a.total_due_etb ?? a.tax_due_etb ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{a.due_date ? new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        a.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {(a.status === 'PENDING' || a.status === 'OVERDUE') && (
                        <button
                          onClick={() =>
                            api.post('/payments/initialize_chapa/', { assessment_id: a.id })
                              .then((res: any) => window.open(res.data.checkout_url, '_blank'))
                              .catch(() => alert('Failed to initiate payment. Please try again.'))
                          }
                          className="bg-[#2563EB] text-white px-3 py-1 rounded text-[12px] font-medium hover:bg-[#1D4ED8] transition-colors"
                        >
                          Pay Online
                        </button>
                      )}
                      {a.status === 'PAID' && (
                        <button
                          onClick={() =>
                            api.get(`/tax/${a.id}/clearance-pdf/`, { responseType: 'blob' })
                              .then((res: any) => {
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `clearance_${a.fiscal_year}.pdf`;
                                link.click();
                              })
                              .catch(() => alert('Failed to download clearance.'))
                          }
                          className="border border-green-600 text-green-700 px-3 py-1 rounded text-[12px] font-medium hover:bg-green-50 transition-colors"
                        >
                          Clearance PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Fix 21: Active Sessions */}
      <section className="max-w-7xl mx-auto px-8 py-6">
        <h2 className="text-[18px] font-bold text-[#111827] mb-4">Active Sessions</h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          {sessionsLoading ? <div className="p-6 text-center text-gray-400 animate-pulse">Loading sessions...</div> :
           sessions.length === 0 ? <div className="p-6 text-center text-gray-400">No active sessions found.</div> : (
            <table className="min-w-full text-[13px] divide-y divide-gray-100">
              <thead className="bg-gray-50"><tr>
                {['Device', 'IP Address', 'Last Active', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#111827]">{s.device_name || 'Unknown Device'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.last_active ? new Date(s.last_active).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleRevokeSession(s.id)} className="text-red-600 hover:text-red-800 font-medium text-[12px]">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Fix 28: SMS Notification Preference */}
      <section className="max-w-7xl mx-auto px-8 pb-10">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#111827]">SMS Notifications</p>
            <p className="text-[13px] text-gray-500 mt-0.5">Receive SMS alerts for contract updates, tax reminders, and dispute notices.</p>
          </div>
          <button onClick={handleToggleSms} disabled={prefsSaving}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              smsOptIn ? 'bg-[#1E3A5F]' : 'bg-gray-300'
            }`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              smsOptIn ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </section>
    </div>
  );
}
