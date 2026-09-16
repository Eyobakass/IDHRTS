'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import StatusBadge from '@/components/StatusBadge';

type Document = {
  id: string;
  doc_type: string;
  file_path: string;
  file_size_bytes: number;
  is_clean: boolean;
  uploaded_at: string;
};

type Property = {
  id: string;
  house_number: string;
  building_type: string;
  monthly_rent_etb: number;
  status: string;
  kebele?: string;
  cadastral_upi?: string;
  num_rooms?: number;
  floor_area_sqm?: number;
  construction_year?: number;
  num_units?: number;
  review_note?: string;
  created_at: string;
  updated_at: string;
  sub_city?: any;
  woreda?: any;
  landlord_detail?: { id: string; full_name_en: string; phone_number: string };
  documents?: Document[];
};

function InfoItem({ label, value, icon }: { label: string; value?: string | number | null; icon: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#F9FAFB] rounded-lg">
      <div className="w-8 h-8 bg-white rounded-md border border-[#E5E7EB] flex items-center justify-center shrink-0 text-base">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[15px] font-bold text-[#111827] mt-0.5 truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const DOC_LABELS: Record<string, string> = {
  TITLE_DEED: 'Title Deed',
  HOLDING_CERT: 'Holding Certificate',
  COURT_ORDER: 'Court Order',
};

export default function WoreditaPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    api.get(`/properties/${id}/`)
      .then(res => setProperty(res.data))
      .catch(() => router.push('/dashboard/woreda'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await api.post(`/properties/${id}/approve/`);
      showToast('success', 'Property approved successfully!');
      const res = await api.get(`/properties/${id}/`);
      setProperty(res.data);
    } catch {
      showToast('error', 'Failed to approve. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (rejectNote.trim().length < 20) return;
    setActing(true);
    try {
      await api.post(`/properties/${id}/reject/`, { review_note: rejectNote });
      showToast('success', 'Property rejected with review notes.');
      setShowRejectModal(false);
      setRejectNote('');
      const res = await api.get(`/properties/${id}/`);
      setProperty(res.data);
    } catch {
      showToast('error', 'Failed to reject. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const downloadDoc = (doc: Document) => {
    const token = localStorage.getItem('access_token');
    const url = doc.file_path.startsWith('http') ? doc.file_path : `http://127.0.0.1:8000${doc.file_path}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${doc.doc_type}_${doc.id}`;
        a.click();
      })
      .catch(() => showToast('error', 'Could not download document.'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <NavBar portalName="Woreda Portal" variant="dark" />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!property) return null;

  const isPendingReview = property.status === 'PENDING_REVIEW';

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Woreda Portal" variant="dark" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex flex-wrap items-center gap-2 sm:gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-[14px] font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-[18px] font-bold text-[#111827] mb-2">Reject Property</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Please provide a detailed reason for rejection. The landlord will see this note.</p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={4}
              maxLength={220}
              placeholder="Explain why this property is being rejected... (minimum 20 characters)"
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] text-[#111827] resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex items-center justify-between mt-1 mb-4">
              <span className={`text-[11px] ${rejectNote.trim().length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                {rejectNote.trim().length < 20 ? `${20 - rejectNote.trim().length} more characters required` : 'Good'}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">{rejectNote.length}/220</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectNote(''); }}
                disabled={acting}
                className="flex-1 bg-[#F3F4F6] text-[#374151] py-2.5 rounded-lg font-semibold text-[14px] hover:bg-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={acting || rejectNote.trim().length < 20}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
              >
                {acting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6">
          <Link href="/dashboard/woreda" className="hover:text-[#2563EB] transition-colors flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Properties
          </Link>
          <span>›</span>
          <span className="text-[#111827] font-medium">House #{property.house_number}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-[22px] sm:text-[32px] font-bold text-[#111827]">House #{property.house_number}</h1>
            <StatusBadge status={property.status} />
          </div>
          {isPendingReview && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={acting}
                className="flex items-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Reject Property
              </button>
              <button
                onClick={handleApprove}
                disabled={acting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shadow-sm"
              >
                {acting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Working...</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Approve Property</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Already reviewed banner */}
        {property.status === 'ACTIVE' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-[13px] font-semibold text-green-800">This property has been approved and is currently active.</p>
          </div>
        )}
        {property.review_note && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-800">Previous Review Note</p>
              <p className="text-[13px] text-amber-700 mt-0.5">{property.review_note}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT — span 2 */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">🏠</span>
                Property Information
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InfoItem label="Building Type" value={property.building_type?.replace(/_/g, ' ')} icon="🏢" />
                <InfoItem label="Number of Rooms" value={property.num_rooms} icon="🛏" />
                <InfoItem label="Floor Area" value={property.floor_area_sqm ? `${property.floor_area_sqm} sqm` : null} icon="📐" />
                <InfoItem label="Construction Year" value={property.construction_year} icon="📅" />
                <InfoItem label="Number of Units" value={property.num_units ?? 1} icon="🔑" />
                <InfoItem label="Cadastral UPI" value={property.cadastral_upi} icon="#" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">📍</span>
                Location Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InfoItem label="Sub-City" value={typeof property.sub_city === 'object' ? property.sub_city?.name : property.sub_city} icon="🗺" />
                <InfoItem label="Woreda" value={typeof property.woreda === 'object' ? property.woreda?.name : property.woreda} icon="📌" />
                <InfoItem label="Kebele" value={property.kebele} icon="🏘" />
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">📄</span>
                Supporting Documents
                <span className="ml-auto text-[12px] font-normal text-[#6B7280]">{property.documents?.length ?? 0} file(s)</span>
              </h2>
              {!property.documents || property.documents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📂</div>
                  <p className="text-[13px] text-[#6B7280]">No documents uploaded by the landlord.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#F3F4F6] hover:border-[#E5E7EB] transition-colors">
                      <div className="w-9 h-9 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center text-lg shrink-0">📄</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#111827]">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{fmtBytes(doc.file_size_bytes)} · Uploaded {fmt(doc.uploaded_at)}</p>
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                        doc.is_clean ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.is_clean ? 'Verified' : 'Pending'}
                      </span>
                      <button
                        onClick={() => downloadDoc(doc)}
                        className="w-8 h-8 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] transition-colors"
                        title="Download"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">🕐</span>
                Timeline
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Submitted On" value={fmt(property.created_at)} icon="📆" />
                <InfoItem label="Last Updated" value={fmt(property.updated_at)} icon="✏️" />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EFF6FF] rounded-full opacity-60" />
              <p className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 relative">Monthly Rent</p>
              <p className="text-[28px] font-black text-[#2563EB] leading-tight relative">
                ETB {Number(property.monthly_rent_etb).toLocaleString()}
              </p>
              <p className="text-[12px] text-[#9CA3AF] mt-1 relative">per month</p>
            </div>

            {/* Landlord Info */}
            {property.landlord_detail && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-[15px] font-bold text-[#111827] mb-4">Landlord Info</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white font-bold text-[15px] shrink-0">
                    {property.landlord_detail.full_name_en.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#111827]">{property.landlord_detail.full_name_en}</p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">{property.landlord_detail.phone_number}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Actions Card — only when pending */}
            {isPendingReview && (
              <div className="bg-[#1E3A5F] rounded-xl shadow-sm p-6">
                <h3 className="text-[15px] font-bold text-white mb-2">Review Decision</h3>
                <p className="text-[12px] text-blue-200 mb-5">Review all documents above before making a decision.</p>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={acting}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
                  >
                    ✓ Approve Property
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={acting}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
                  >
                    ✕ Reject Property
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
