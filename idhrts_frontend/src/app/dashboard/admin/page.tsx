"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Officer {
  id: string;
  full_name_en: string;
  phone_number: string;
  role: string;
  is_active: boolean;
}

interface Metrics {
  properties: { total: number; active: number };
  contracts: { total: number; registered: number };
  disputes: { total: number; open: number };
  financials: { total_tax_due_etb: number; total_tax_paid_etb: number };
}

interface TrendData {
  month: string;
  contracts: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "officers" | "create-officer" | "audit-log" | "data-export">("overview");
  const [newOfficer, setNewOfficer] = useState({ full_name_en: "", full_name_am: "", phone_number: "", role: "WOREDA_OFFICER", woreda_id: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    if (activeTab === "officers") {
      setOfficersLoading(true);
      try {
        const res = await api.get("/auth/officers/");
        setOfficers(res.data);
      } catch (err: any) {
        showToast(err.response?.data?.error || "Failed to load officers", "error");
      } finally {
        setOfficersLoading(false);
      }
    } else {
      setMetricsLoading(true);
      try {
        const res = await api.get("/reports/dashboard-metrics/");
        setMetrics(res.data.metrics);
        setTrends(res.data.trends);
      } catch (err: any) {
        showToast(err.response?.data?.error || "Failed to load metrics", "error");
      } finally {
        setMetricsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeactivate = async (officerId: string, officerName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${officerName}?`)) return;
    setActionLoading(officerId);
    try {
      await api.post(`/auth/${officerId}/deactivate/`);
      showToast(`Successfully deactivated ${officerName}`, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to deactivate officer", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadReport = async (officerId: string, officerName: string) => {
    setActionLoading(officerId);
    try {
      const res = await api.get(`/auth/${officerId}/incident-report/`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `incident_report_${officerId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`Report downloaded for ${officerName}`, "success");
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to generate report", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (officerId: string, officerName: string) => {
    if (!confirm(`Unlock account for ${officerName}?`)) return;
    setActionLoading(officerId);
    try {
      await api.post(`/auth/${officerId}/unlock/`);
      showToast(`Account unlocked for ${officerName}`, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to unlock account", "error");
    } finally { setActionLoading(null); }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/auth/officers/create/", newOfficer);
      showToast("Officer created successfully. Temporary PIN sent via SMS.", "success");
      setNewOfficer({ full_name_en: "", full_name_am: "", phone_number: "", role: "WOREDA_OFFICER", woreda_id: "" });
      setActiveTab("officers");
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to create officer", "error");
    } finally { setCreateLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("/auth/audit-logs/");
      setAuditLogs(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch { setAuditLogs([]); } finally { setAuditLoading(false); }
  };

  const renderOverview = () => {
    if (metricsLoading) return <div className="p-8 text-center animate-pulse">Loading dashboard metrics...</div>;
    if (!metrics) return null;

    const cards = [
      { title: "Total Properties", value: metrics.properties.total, sub: `${metrics.properties.active} Active`, color: "bg-blue-50 text-blue-700" },
      { title: "Registered Contracts", value: metrics.contracts.registered, sub: `out of ${metrics.contracts.total} total`, color: "bg-green-50 text-green-700" },
      { title: "Open Disputes", value: metrics.disputes.open, sub: `out of ${metrics.disputes.total} total`, color: "bg-orange-50 text-orange-700" },
      { title: "Tax Revenue (ETB)", value: metrics.financials.total_tax_paid_etb.toLocaleString(), sub: `${metrics.financials.total_tax_due_etb.toLocaleString()} Expected`, color: "bg-purple-50 text-purple-700" }
    ];

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
              <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">{c.title}</p>
              <p className="text-3xl font-bold text-[#111827] mt-2 mb-1">{c.value}</p>
              <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${c.color}`}>{c.sub}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
          <h3 className="text-[16px] font-bold text-[#111827] mb-6">Contract Registrations (Last 6 Months)</h3>
          <div className="h-[300px] w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="contracts" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">Not enough data to display trend</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOfficers = () => (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden animate-fade-in">
      {officersLoading ? (
        <div className="p-8 text-center animate-pulse">Loading officers...</div>
      ) : officers.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No officers found.</div>
      ) : (
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {officers.map((o) => (
              <tr key={o.id}>
                <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-[#111827]">{o.full_name_en}</td>
                <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#6B7280]">{o.phone_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {o.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium border ${o.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {o.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-[13px]">
                  <button
                    onClick={() => handleDownloadReport(o.id, o.full_name_en)}
                    disabled={actionLoading === o.id}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-4 disabled:opacity-50"
                  >
                    Report
                  </button>
                  {o.is_active && (
                    <button
                      onClick={() => handleDeactivate(o.id, o.full_name_en)}
                      disabled={actionLoading === o.id}
                      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 mr-4"
                    >
                      Deactivate
                    </button>
                  )}
                  {!o.is_active && (
                    <button onClick={() => handleUnlock(o.id, o.full_name_en)} disabled={actionLoading === o.id}
                      className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50">
                      Unlock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="HR Admin Portal" variant="dark" />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-[22px] sm:text-[28px] font-bold text-[#111827] mb-2">System Dashboard</h1>
            <p className="text-[14px] text-[#6B7280]">Real-time IDHRTS analytics and officer management.</p>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-[#E5E7EB] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('officers')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${activeTab === 'officers' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Officers
            </button>
            <button
              onClick={() => setActiveTab('create-officer')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${activeTab === 'create-officer' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              + Create Officer
            </button>
            <button
              onClick={() => { setActiveTab('audit-log'); fetchAuditLogs(); }}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${activeTab === 'audit-log' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Audit Log
            </button>
            <button
              onClick={() => setActiveTab('data-export')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${activeTab === 'data-export' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Data Export
            </button>
          </div>
        </div>

        {toast && (
          <div className={`fixed top-20 right-8 px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in ${toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'officers' && renderOfficers()}
        {activeTab === 'create-officer' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8 max-w-xl">
            <h2 className="text-[20px] font-bold text-[#111827] mb-6">Create New Officer</h2>
            <form onSubmit={handleCreateOfficer} className="space-y-4">
              {[{label:'Full Name (English)', key:'full_name_en'},{label:'Full Name (Amharic)', key:'full_name_am'},{label:'Phone Number', key:'phone_number'}].map(f => (
                <div key={f.key}>
                  <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">{f.label}</label>
                  <input type="text" required value={(newOfficer as any)[f.key]}
                    onChange={e => setNewOfficer({...newOfficer, [f.key]: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Role</label>
                <select value={newOfficer.role} onChange={e => setNewOfficer({...newOfficer, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px]">
                  <option value="WOREDA_OFFICER">Woreda Officer</option>
                  <option value="TAX_OFFICER">Tax Officer</option>
                </select>
              </div>
              <button type="submit" disabled={createLoading}
                className="w-full bg-[#1E3A5F] text-white py-3 rounded-lg font-semibold text-[14px] disabled:opacity-50">
                {createLoading ? 'Creating...' : 'Create Officer & Send PIN via SMS'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'data-export' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8">
            <h2 className="text-[20px] font-bold text-[#111827] mb-2">Data Export</h2>
            <p className="text-[14px] text-gray-500 mb-6">Download system data as CSV files. All exports include current data at time of download.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Users', table: 'users', desc: 'All registered landlords, tenants, and officers' },
                { label: 'Properties', table: 'properties', desc: 'All registered properties with status' },
                { label: 'Contracts', table: 'contracts', desc: 'All rental contracts and lifecycle status' },
                { label: 'Tax Assessments', table: 'tax_assessments', desc: 'All tax calculations and due amounts' },
                { label: 'Tax Payments', table: 'tax_payments', desc: 'Confirmed payments and transaction refs' },
                { label: 'Disputes', table: 'disputes', desc: 'All filed disputes and their resolutions' },
                { label: 'Audit Logs', table: 'audit_logs', desc: 'Full system audit trail' },
                { label: 'Notifications', table: 'notifications', desc: 'All system notifications sent' },
              ].map(({ label, table, desc }) => (
                <div key={table} className="border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-3">
                  <div>
                    <p className="text-[15px] font-bold text-[#111827]">{label}</p>
                    <p className="text-[12px] text-gray-500 mt-1">{desc}</p>
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/reports/export/${table}/`}
                    download
                    className="mt-auto inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#162D4A] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download CSV
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'audit-log' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center">
              <h2 className="text-[16px] font-bold text-[#111827]">System Audit Log</h2>
              <button onClick={fetchAuditLogs} className="text-[13px] text-blue-600 hover:underline">Refresh</button>
            </div>
            {auditLoading ? <div className="p-8 text-center animate-pulse">Loading...</div> : (
              <table className="min-w-full divide-y divide-[#E5E7EB] text-[13px]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    {['Timestamp', 'Actor', 'Action', 'Resource', 'IP Address'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No audit logs found.</td></tr>
                  ) : auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-[#111827]">{log.user_detail?.full_name_en || 'System'}</td>
                      <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold">{log.action}</span></td>
                      <td className="px-4 py-3 text-gray-600">{log.resource_type} #{log.resource_id?.slice?.(0,8)}</td>
                      <td className="px-4 py-3 text-gray-400">{log.ip_address || '—'}</td>
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
