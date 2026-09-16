'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import NavBar from '@/components/NavBar';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { TableSkeleton } from '@/components/Skeleton';

interface TaxAssessment {
  id: string;
  property_detail?: { house_number?: string };
  landlord_detail?: { full_name_en?: string };
  tenant_detail?: { full_name_en?: string };
  fiscal_year?: string;
  tax_due_etb?: number;
  gross_annual_rent_etb?: number;
  effective_rate_pct?: number;
  status: string;
  due_date?: string;
  prn_code?: string;
  months_late?: number;
  late_interest_etb?: number;
  total_due_etb?: number;
}

interface RegisteredContract {
  id: string;
  contract_reg_number?: string;
  monthly_rent_etb: number;
  status: string;
  property_detail?: { house_number?: string; building_type?: string };
  landlord_detail?: { full_name_en?: string };
  tenant_detail?: { full_name_en?: string };
}

type Tab = 'assessments' | 'generate' | 'vacant';

export default function TaxDashboard() {
  const [tab, setTab] = useState<Tab>('assessments');
  const [downloading, setDownloading] = useState(false);
  const [assessments, setAssessments] = useState<TaxAssessment[]>([]);
  const [contracts, setContracts] = useState<RegisteredContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [vacantProperties, setVacantProperties] = useState<any[]>([]);
  const [vacantLoading, setVacantLoading] = useState(false);

  const [prnLoading, setPrnLoading] = useState<string | null>(null);
  
  const handleGeneratePrn = async (id: string) => {
    setPrnLoading(id);
    try {
      const res = await api.post(`/tax/${id}/generate-prn/`);
      setAssessments(prev => prev.map(a => a.id === id ? { ...a, prn_code: res.data.prn_code } : a));
      showMessage('Offline Payment Reference Number generated.', 'success');
    } catch {
      showMessage('Failed to generate PRN.', 'error');
    } finally {
      setPrnLoading(null);
    }
  };

  const handleDownloadClearance = async (id: string) => {
    try {
      const res = await api.get(`/tax/${id}/clearance-pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_clearance_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showMessage('Failed to download clearance PDF.', 'error');
    }
  };

  const downloadPdf = async (url: string, filename: string) => {
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
      showMessage("Failed to download document", "error");
    }
  };

  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState<string | null>(null);

  // PRN Reconciliation State
  const [isPrnModalOpen, setIsPrnModalOpen] = useState(false);
  const [prnCode, setPrnCode] = useState('');
  const [prnSubmitting, setPrnSubmitting] = useState(false);

  const handleReconcilePrn = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrnSubmitting(true);
    try {
      await api.post('/payments/reconcile-prn/', { prn_code: prnCode });
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

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch assessments on mount
  useEffect(() => {
    api.get('/tax/')
      .then(res => setAssessments(Array.isArray(res.data) ? res.data : res.data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch REGISTERED contracts when switching to generate tab
  useEffect(() => {
    if (tab === 'generate') {
      setContractsLoading(true);
      api.get('/contracts/')
        .then(res => {
          const all: RegisteredContract[] = Array.isArray(res.data) ? res.data : res.data.results ?? [];
          setContracts(all.filter(c => c.status === 'REGISTERED'));
        })
        .catch(() => showMessage('Failed to load contracts.', 'error'))
        .finally(() => setContractsLoading(false));
    } else if (tab === 'vacant') {
      setVacantLoading(true);
      api.get('/properties/')
        .then(res => {
          const all = Array.isArray(res.data) ? res.data : res.data.results ?? [];
          // Simplistic filter: properties without contracts or assumed vacant for demo
          setVacantProperties(all.filter((p: any) => p.status === 'ACTIVE' && !p.has_active_contract)); 
        })
        .catch(() => showMessage('Failed to load properties.', 'error'))
        .finally(() => setVacantLoading(false));
    }
  }, [tab]);

  const downloadSigtas = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/reports/sigtas/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sigtas_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      showMessage('SIGTAS CSV downloaded successfully.', 'success');
    } catch {
      showMessage('Failed to download SIGTAS CSV.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePay = async (id: string) => {
    setPayLoading(id);
    try {
      const res = await api.post('/payments/initialize_chapa/', { assessment_id: id });
      const url = res.data?.checkout_url;
      if (url) window.open(url, '_blank');
      else showMessage('Payment initialized successfully.', 'success');
    } catch {
      showMessage('Failed to initialize payment.', 'error');
    } finally {
      setPayLoading(null);
    }
  };

  const handleGenerateAssessment = async (contractId: string) => {
    setGenerateLoading(contractId);
    try {
      const res = await api.post('/tax/generate/', { contract_id: contractId });
      const newAssessment: TaxAssessment = res.data;
      setAssessments(prev => [newAssessment, ...prev]);
      showMessage(`Assessment generated: ETB ${Number(newAssessment.tax_due_etb ?? 0).toLocaleString()} due.`, 'success');
      // Remove from contracts list since it's now assessed for this fiscal year
      setContracts(prev => prev.filter(c => c.id !== contractId));
    } catch (err: any) {
      const errMsg = err?.response?.data?.error ?? 'Failed to generate assessment.';
      showMessage(errMsg, 'error');
    } finally {
      setGenerateLoading(null);
    }
  };

  const total = assessments.length;
  const pending = assessments.filter(a => a.status === 'PENDING').length;
  const paid = assessments.filter(a => a.status === 'PAID' || a.status === 'CONFIRMED').length;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Tax Officer Portal" />

      {/* Toast notification */}
      {message && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-[20px] sm:text-[24px] font-bold text-[#111827]">Tax Assessments Overview</h1>
          <button 
            onClick={() => downloadPdf('/reports/subcity-revenue-pdf/', 'SubCity_Revenue_Report.pdf')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Revenue Report PDF
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard variant="metric" label="Total Assessments" value={total} icon="document" />
          <StatCard variant="metric" label="Pending Payment" value={pending} icon="clock" valueColor="amber" />
          <StatCard variant="metric" label="Paid" value={paid} icon="check" valueColor="green" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-4 sm:gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
          {([
            { id: 'assessments', label: 'Assessments' },
            { id: 'generate', label: 'Generate Assessment' },
            { id: 'vacant', label: 'Vacant Properties' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-[14px] font-medium transition-colors ${
                tab === t.id
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ASSESSMENTS TAB */}
        {tab === 'assessments' && (
          <>
            {/* SIGTAS Export */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
              <h3 className="text-[16px] font-bold text-[#111827]">SIGTAS Export</h3>
              <p className="text-[13px] text-gray-500 mt-1 mb-4">Export a CSV report of all tax assessments in SIGTAS-compatible format for submission to the tax authority</p>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-[13px] text-gray-500 mb-4">
                Format: CSV&nbsp;&nbsp;|&nbsp;&nbsp;Fields: 13 columns&nbsp;&nbsp;|&nbsp;&nbsp;Scope: All assessments in your sub-city
              </div>
              <button onClick={downloadSigtas} disabled={downloading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-[15px] transition-colors">
                {downloading ? 'Downloading...' : 'Download SIGTAS CSV'}
              </button>
            </div>

            {/* Assessments table */}
            <h2 className="text-[18px] font-bold text-[#111827] mb-3">All Assessments</h2>
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden overflow-x-auto">
              {loading ? (
                <div className="p-4"><TableSkeleton rows={4} columns={6} /></div>
              ) : assessments.length === 0 ? (
                <div className="py-12"><EmptyState title="No Assessments Found" description="Use 'Generate Assessment' to create one from a registered contract." /></div>
              ) : (
                <table className="w-full text-[14px]">
                  <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                    <tr>
                      {['Property', 'Landlord', 'Tax Year', 'Total Due (ETB)', 'Due Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assessments.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-[#111827]">#{a.property_detail?.house_number ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{a.landlord_detail?.full_name_en ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{a.fiscal_year ?? '—'}</td>
                        <td className="px-4 py-3 text-[#111827] font-semibold">ETB {Number(a.total_due_etb ?? a.tax_due_etb ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 text-[13px]">{a.due_date ? new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            {(a.status === 'PENDING' || a.status === 'OVERDUE') && (
                              <>
                                <button onClick={() => handlePay(a.id)} disabled={payLoading === a.id} className="px-3 py-1 bg-[#2563EB] text-white rounded text-[13px] font-medium hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors">
                                  {payLoading === a.id ? 'Processing...' : 'Pay Online'}
                                </button>
                                {a.prn_code ? (
                                  <div className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 text-[12px] font-mono rounded text-center">PRN: {a.prn_code}</div>
                                ) : (
                                  <button onClick={() => handleGeneratePrn(a.id)} disabled={prnLoading === a.id} className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-[12px] hover:bg-gray-50 disabled:opacity-50 transition-colors">
                                    {prnLoading === a.id ? '...' : 'Generate PRN'}
                                  </button>
                                )}
                                <button onClick={() => {
                                  const reason = prompt("Enter investigation reason:");
                                  if (reason) {
                                    api.post(`/tax/${a.id}/flag_investigation/`, { reason }).then(() => showMessage("Flagged", "success"));
                                  }
                                }} className="px-3 py-1 text-red-600 border border-red-200 rounded text-[12px] hover:bg-red-50">
                                  Flag Investigate
                                </button>
                                <button onClick={() => {
                                  const amt = prompt("Enter new tax amount:");
                                  const reason = prompt("Enter override reason:");
                                  if (amt && reason) {
                                    api.post(`/tax/${a.id}/override_assessment/`, { new_tax_due: amt, reason: reason }).then(() => showMessage("Overridden", "success"));
                                  }
                                }} className="px-3 py-1 text-orange-600 border border-orange-200 rounded text-[12px] hover:bg-orange-50">
                                  Override
                                </button>
                              </>
                            )}
                            {a.status === 'PAID' && (
                              <button onClick={() => handleDownloadClearance(a.id)} className="px-3 py-1 border border-green-600 text-green-700 rounded text-[12px] hover:bg-green-50 transition-colors">
                                Clearance PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* GENERATE ASSESSMENT TAB */}
        {tab === 'generate' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-5">
              <p className="text-[14px] font-semibold text-blue-900">Ethiopian Rental Income Tax</p>
              <p className="text-[13px] text-blue-800 mt-1">
                20% deduction applied to gross annual rent, then progressive ERCA rates (0%–35%) applied to taxable income.
                Assessments are generated per fiscal year (Hamle – Sene).
              </p>
            </div>

            {contractsLoading ? (
              <div className="p-4"><TableSkeleton rows={4} columns={5} /></div>
            ) : contracts.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E5E7EB] py-12">
                <EmptyState
                  title="No Registered Contracts"
                  description="Assessments can only be generated for contracts with REGISTERED status. Authenticate a signed contract first."
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden overflow-x-auto">
                <table className="w-full text-[14px]">
                  <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                    <tr>
                      {['Property', 'Landlord', 'Tenant', 'Monthly Rent', 'Est. Annual Tax', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contracts.map(c => {
                      // Estimate the tax for display purposes
                      const gross = c.monthly_rent_etb * 12;
                      const taxable = gross * 0.80;
                      // Rough progressive calc for display only
                      let estTax = 0;
                      const bands = [[7200,0],[19800,0.10],[38400,0.15],[63000,0.20],[93600,0.25],[130800,0.30]] as [number,number][];
                      let rem = taxable; let prev = 0;
                      for (const [lim, rate] of bands) {
                        if (rem <= 0) break;
                        const chunk = Math.min(rem, lim - prev);
                        estTax += chunk * rate;
                        rem -= chunk; prev = lim;
                      }
                      if (rem > 0) estTax += rem * 0.35;

                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-[#111827]">
                            #{c.property_detail?.house_number ?? '—'}
                            <span className="text-gray-400 font-normal ml-1 text-[12px]">{c.property_detail?.building_type}</span>
                          </td>
                          <td className="px-4 py-4 text-gray-700">{c.landlord_detail?.full_name_en ?? '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{c.tenant_detail?.full_name_en ?? '—'}</td>
                          <td className="px-4 py-4 text-[#111827] font-medium">ETB {c.monthly_rent_etb.toLocaleString()}</td>
                          <td className="px-4 py-4 text-[#111827]">≈ ETB {Math.round(estTax).toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleGenerateAssessment(c.id)}
                              disabled={generateLoading === c.id}
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-[13px] font-semibold transition-colors"
                            >
                              {generateLoading === c.id ? 'Generating...' : 'Assess Tax'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* VACANT PROPERTIES TAB */}
        {tab === 'vacant' && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden overflow-x-auto">
            {vacantLoading ? (
              <div className="p-4"><TableSkeleton rows={4} columns={5} /></div>
            ) : vacantProperties.length === 0 ? (
              <EmptyState title="No Vacant Properties" description="No properties are currently flagged as vacant." />
            ) : (
              <table className="w-full text-[14px]">
                <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                  <tr>
                    {['Property', 'Landlord', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vacantProperties.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-semibold text-[#111827]">#{p.house_number}</td>
                      <td className="px-4 py-4 text-gray-700">{p.landlord_detail?.full_name_en}</td>
                      <td className="px-4 py-4 text-orange-600 font-medium">No Contract / Vacant</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={async () => {
                            try {
                              await api.post(`/tax/generate/`, { property_id: p.id });
                              showMessage('Tax assessment created for vacant property.', 'success');
                              const res = await api.get('/properties/');
                              const all = Array.isArray(res.data) ? res.data : res.data.results ?? [];
                              setVacantProperties(all.filter((v: any) => v.status === 'ACTIVE' && !v.has_active_contract));
                            } catch (err: any) {
                              showMessage(err.response?.data?.error || 'Failed to assess vacant property.', 'error');
                            }
                          }}
                          className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-[12px] font-semibold hover:bg-orange-200 transition-colors"
                        >
                          Assess Vacant Tax
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
