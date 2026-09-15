"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import NavBar from "@/components/NavBar";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeleton";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Section = "properties" | "contracts" | "disputes" | "walkin";
type PropertyFilter = "all" | "PENDING_REVIEW" | "ACTIVE" | "REJECTED";

const MOCK_COMPLIANCE_DATA = [
  { name: 'Jan', compliance: 65 },
  { name: 'Feb', compliance: 59 },
  { name: 'Mar', compliance: 80 },
  { name: 'Apr', compliance: 81 },
  { name: 'May', compliance: 56 },
  { name: 'Jun', compliance: 55 },
  { name: 'Jul', compliance: 40 },
  { name: 'Aug', compliance: 75 },
  { name: 'Sep', compliance: 85 },
  { name: 'Oct', compliance: 90 },
  { name: 'Nov', compliance: 88 },
  { name: 'Dec', compliance: 95 },
];

interface Property {
  id: string;
  house_number: string;
  building_type: string;
  monthly_rent_etb: number;
  status: string;
  submitted_at?: string;
  landlord_detail?: { full_name_en?: string; phone_number?: string };
  woreda?: string;
}

interface Contract {
  id: string;
  contract_reg_number?: string;
  monthly_rent_etb: number;
  status: string;
  landlord_detail?: { full_name_en?: string };
  tenant_detail?: { full_name_en?: string };
  property_detail?: { house_number?: string; building_type?: string };
}

interface Dispute {
  id: string;
  description: string;
  status: string;
  filed_at?: string;
  filer_detail?: { full_name_en?: string };
}

const NavItems: { id: Section; label: string }[] = [
  { id: "properties", label: "Property Registrations" },
  { id: "contracts", label: "Contract Authentication" },
  { id: "disputes", label: "Disputes" },
  { id: "walkin", label: "Walk-In Assistance" },
];

const PROPERTY_FILTERS: { value: PropertyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
];

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "\u2014";
}

export default function WoredaDashboard() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("properties");
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>("all");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; propertyId: string | null }>({ open: false, propertyId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Fix 23: TIN / house-number search
  const [searchQuery, setSearchQuery] = useState('');
  const searchedProperties = properties.filter((p: any) =>
    !searchQuery ||
    p.house_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.landlord_detail?.tin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.landlord_detail?.full_name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, dRes, sRes] = await Promise.all([
          api.get("/properties/"),
          api.get("/contracts/"),
          api.get("/disputes/"),
          api.get("/woreda/stats/").catch(() => ({ data: [] })), // Graceful fallback
        ]);
        setProperties(Array.isArray(pRes.data) ? pRes.data : (pRes.data.results ?? []));
        setContracts(Array.isArray(cRes.data) ? cRes.data : (cRes.data.results ?? []));
        setDisputes(Array.isArray(dRes.data) ? dRes.data : (dRes.data.results ?? []));
        setComplianceData(sRes.data || []);
      } catch (err: any) {
        console.error("Woreda API Failed:", err?.response?.data || err);
        showToast("Failed to load Woreda data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [router]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/properties/${id}/approve/`);
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status: "ACTIVE" } : p)));
      showToast("Property approved successfully.", "success");
    } catch {
      showToast("Failed to approve property.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.propertyId || rejectReason.length < 20) return;
    setActionLoading(rejectModal.propertyId);
    try {
      await api.post(`/properties/${rejectModal.propertyId}/reject/`, { reason: rejectReason });
      setProperties((prev) => prev.map((p) => (p.id === rejectModal.propertyId ? { ...p, status: "REJECTED" } : p)));
      showToast("Property rejected.", "success");
      setRejectModal({ open: false, propertyId: null });
      setRejectReason("");
    } catch {
      showToast("Failed to reject property.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAuthenticate = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/contracts/${id}/authenticate/`);
      setContracts(contracts.map((c) => (c.id === id ? { ...c, status: "REGISTERED" } : c)));
      showToast("Contract registered successfully!", "success");
    } catch {
      showToast("Failed to authenticate contract", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectContract = async (id: string) => {
    const reason = window.prompt("Enter rejection reason (minimum 20 characters):");
    if (reason === null) return;
    if (reason.trim().length < 20) { showToast("Rejection reason must be at least 20 characters.", "error"); return; }
    setActionLoading(id);
    try {
      await api.post(`/contracts/${id}/reject/`, { reason: reason.trim() });
      setContracts(contracts.map((c) => (c.id === id ? { ...c, status: "DRAFT" } : c)));
      showToast("Contract rejected. Parties have been notified.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to reject contract.", "error");
    } finally {
      setActionLoading(null);
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
          className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] bg-[#374151] flex-shrink-0 flex flex-col py-4">
          {NavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-5 py-3 text-[14px] font-medium transition-colors text-left w-full ${
                section === item.id
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              {item.id === "properties" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              )}
              {item.id === "contracts" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              )}
              {item.id === "disputes" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  {section === "properties" ? "Property Registrations" : section === "contracts" ? "Contract Authentication" : section === "disputes" ? "Disputes" : "Assistance"}
                </p>
                <h1 className="text-[26px] font-bold text-[#111827]">{sectionTitle}</h1>
                <p className="text-[13px] text-gray-500 mt-1">{sectionSubtitle}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => downloadPdf('/reports/woreda-monthly-pdf/', 'Woreda_Monthly_Report.pdf')}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Monthly Report
                </button>
                <button 
                  onClick={() => downloadPdf('/reports/dispute-stats-pdf/', 'Dispute_Stats.pdf')}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Dispute Stats
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {/* PROPERTIES */}
            {section === "properties" && (
              <>
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-6">
                  <h3 className="text-[16px] font-bold text-[#111827] mb-4">12-Month Compliance Trend</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={complianceData.length > 0 ? complianceData : MOCK_COMPLIANCE_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="compliance" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex gap-3 mb-4 items-center">
                  <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search by TIN, house number, or landlord name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                    {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">x</button>)}
                  </div>
                  <span className="text-[12px] text-gray-500">{finalFilteredProperties.length} result{finalFilteredProperties.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="flex gap-6 border-b border-gray-200 mb-5">
                  {PROPERTY_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setPropertyFilter(f.value)}
                      className={`pb-3 text-[14px] font-medium transition-colors ${
                        propertyFilter === f.value
                          ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="p-4"><TableSkeleton rows={5} columns={6} /></div>
                ) : finalFilteredProperties.length === 0 ? (
                  <EmptyState title="No Properties" description="No properties match this filter." />
                ) : (
                  <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                    <table className="w-full text-[14px]">
                      <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                        <tr>
                          {["House #", "Landlord", "Building Type", "Rent (ETB)", "Woreda", "Submitted", "Status", "Actions"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {finalFilteredProperties.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 font-semibold text-[#111827]">#{p.house_number}</td>
                            <td className="px-4 py-4 text-gray-700">{p.landlord_detail?.full_name_en ?? p.landlord_detail?.phone_number ?? "\u2014"}</td>
                            <td className="px-4 py-4 text-gray-600">{p.building_type}</td>
                            <td className="px-4 py-4 text-[#111827] font-medium">{p.monthly_rent_etb?.toLocaleString()}</td>
                            <td className="px-4 py-4 text-gray-600">{p.woreda ?? "\u2014"}</td>
                            <td className="px-4 py-4 text-gray-500 text-[13px]">{fmtDate(p.submitted_at)}</td>
                            <td className="px-4 py-4"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-4">
                              {p.status === "PENDING_REVIEW" ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}
                                    className="border border-green-600 text-green-600 px-3 py-1 rounded text-[12px] font-medium hover:bg-green-50 disabled:opacity-50 transition-colors">
                                    Approve
                                  </button>
                                  <button onClick={() => setRejectModal({ open: true, propertyId: p.id })} disabled={actionLoading === p.id}
                                    className="border border-red-500 text-red-500 px-3 py-1 rounded text-[12px] font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                                    Reject
                                  </button>
                                  <button onClick={() => router.push(`/dashboard/woreda/properties/${p.id}`)}
                                    className="border border-blue-600 text-blue-600 px-3 py-1 rounded text-[12px] font-medium hover:bg-blue-50 transition-colors">
                                    View Details
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => router.push(`/dashboard/woreda/properties/${p.id}`)} className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-[12px] font-medium hover:bg-gray-50 transition-colors">View</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* CONTRACTS */}
            {section === "contracts" && (
              loading ? (
                <div className="p-4"><TableSkeleton rows={4} columns={6} /></div>
              ) : contracts.length === 0 ? (
                <EmptyState title="No Contracts" description="No contracts awaiting authentication." />
              ) : (
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-[14px]">
                    <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                      <tr>
                        {["Property", "Landlord", "Tenant", "Rent (ETB)", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contracts.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-[#111827]">#{c.property_detail?.house_number ?? "\u2014"}</td>
                          <td className="px-4 py-4 text-gray-700">{c.landlord_detail?.full_name_en ?? "\u2014"}</td>
                          <td className="px-4 py-4 text-gray-700">{c.tenant_detail?.full_name_en ?? "\u2014"}</td>
                          <td className="px-4 py-4 text-[#111827] font-medium">{c.monthly_rent_etb?.toLocaleString()}</td>
                          <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                {c.status === "SIGNED" && (
                                  <>
                                    <button onClick={() => handleAuthenticate(c.id)} disabled={actionLoading === c.id}
                                      className="border border-[#2563EB] text-[#2563EB] px-3 py-1 rounded text-[12px] font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors">
                                      {actionLoading === c.id ? "Processing..." : "Authenticate"}
                                    </button>
                                    <button onClick={() => handleRejectContract(c.id)} disabled={actionLoading === c.id}
                                      className="border border-red-400 text-red-500 px-3 py-1 rounded text-[12px] font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                                      Reject
                                    </button>
                                  </>
                                )}
                                {c.status === "REGISTERED" && (
                                  <button onClick={() => downloadPdf(`/woreda/contracts/${c.id}/certificate/`, `Registration_${c.contract_reg_number}.pdf`)}
                                    className="border border-[#10B981] text-[#10B981] px-3 py-1 rounded text-[12px] font-medium hover:bg-emerald-50 transition-colors">
                                    Print Certificate
                                  </button>
                                )}
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* DISPUTES */}
            {section === "disputes" && (
              loading ? (
                <div className="p-4"><TableSkeleton rows={4} columns={6} /></div>
              ) : disputes.length === 0 ? (
                <EmptyState title="No Disputes" description="No disputes have been filed in your woreda." />
              ) : (
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-[14px]">
                    <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                      <tr>
                        {["Filed By", "Description", "Filed At", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {disputes.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-medium text-[#111827]">{d.filer_detail?.full_name_en ?? "\u2014"}</td>
                          <td className="px-4 py-4 text-gray-600 max-w-xs truncate">{d.description}</td>
                          <td className="px-4 py-4 text-gray-500 text-[13px]">{fmtDate(d.filed_at)}</td>
                          <td className="px-4 py-4"><StatusBadge status={d.status} /></td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push(`/dashboard/woreda/disputes/${d.id}`)}
                                  className="border border-[#2563EB] text-[#2563EB] px-3 py-1 rounded text-[12px] font-medium hover:bg-blue-50 transition-colors"
                                >
                                  Manage →
                                </button>
                                <button
                                  onClick={() => downloadPdf(`/woreda/disputes/${d.id}/summons/`, `Summons_${d.id}.pdf`)}
                                  className="border border-purple-600 text-purple-600 px-3 py-1 rounded text-[12px] font-medium hover:bg-purple-50 transition-colors"
                                >
                                  Print Summons
                                </button>
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* WALKIN */}
            {section === "walkin" && (
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
                  <h3 className="text-[17px] font-bold text-[#111827] mb-2">Register Property for Citizen</h3>
                  <p className="text-[13px] text-gray-500 mb-6">Assist walk-in landlords without smartphones to register their properties.</p>
                  
                  <form onSubmit={handleWalkinProperty} className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Landlord Phone Number</label>
                      <input type="text" required placeholder="+251..." value={walkinProp.landlord_phone} onChange={e => setWalkinProp({ ...walkinProp, landlord_phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">House Number</label>
                      <input type="text" required placeholder="House number" value={walkinProp.house_number} onChange={e => setWalkinProp({ ...walkinProp, house_number: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Monthly Rent (ETB)</label>
                      <input type="number" required placeholder="0.00" value={walkinProp.monthly_rent_etb} onChange={e => setWalkinProp({ ...walkinProp, monthly_rent_etb: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                    </div>
                    <button type="submit" disabled={walkinLoading} className="w-full bg-[#2563EB] text-white py-2 rounded-lg font-semibold text-[14px] disabled:opacity-50">
                      {walkinLoading ? "Registering..." : "Register Property"}
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
                  <h3 className="text-[17px] font-bold text-[#111827] mb-2">File Dispute for Citizen</h3>
                  <p className="text-[13px] text-gray-500 mb-6">Assist walk-in citizens to file a dispute against a landlord or tenant.</p>
                  
                  <form onSubmit={handleWalkinDispute} className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Contract Registration Number</label>
                      <input type="text" required placeholder="CTR-..." value={walkinDisp.contract_reg_number} onChange={e => setWalkinDisp({ ...walkinDisp, contract_reg_number: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Dispute Type</label>
                      <select value={walkinDisp.dispute_type} onChange={e => setWalkinDisp({ ...walkinDisp, dispute_type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]">
                        <option value="UNLAWFUL_RENT_INCREASE">UNLAWFUL_RENT_INCREASE</option>
                        <option value="ILLEGAL_EVICTION_NOTICE">ILLEGAL_EVICTION_NOTICE</option>
                        <option value="UNREGISTERED_CONTRACT">UNREGISTERED_CONTRACT</option>
                        <option value="UTILITY_DISCONNECTION">UTILITY_DISCONNECTION</option>
                        <option value="DEPOSIT_NOT_RETURNED">DEPOSIT_NOT_RETURNED</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Description (min 100 characters)</label>
                      <textarea required rows={3} placeholder="Provide details (min 100 characters)..." value={walkinDisp.description} onChange={e => setWalkinDisp({ ...walkinDisp, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"></textarea>
                      <p className="text-[11px] text-gray-400 mt-1">{walkinDisp.description.length}/100 characters minimum</p>
                    </div>
                    <button type="submit" disabled={walkinLoading || walkinDisp.description.length < 100} className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold text-[14px] disabled:opacity-50">
                      {walkinLoading ? "Filing..." : "File Dispute"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => { setRejectModal({ open: false, propertyId: null }); setRejectReason(""); }}
        title="Reject"
      >
        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason" rows={5} maxLength={220}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none" />
        <div className="flex justify-between items-center mt-1 mb-4">
          <span className={`text-[12px] ${rejectReason.length < 20 ? "text-red-500" : "text-gray-400"}`}>
            Min 20 characters required
          </span>
          <span className="text-[12px] text-gray-400">{220 - rejectReason.length}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setRejectModal({ open: false, propertyId: null }); setRejectReason(""); }}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleReject} disabled={rejectReason.length < 20 || !!actionLoading}
            className="flex-1 bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-[14px] font-semibold transition-colors">
            Submit Rejection
          </button>
        </div>
      </Modal>
    </div>
  );
}
