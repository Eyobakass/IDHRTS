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
  sub_city?: { id: string; name: string };
  woreda?: { id: string; name: string };
  landlord_detail?: { id: string; full_name_en: string; phone_number: string };
  documents?: Document[];
};

const STATUS_STEPS = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE'];

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

export default function LandlordPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    api.get(`/properties/${id}/`)
      .then(res => setProperty(res.data))
      .catch(() => router.push('/dashboard/landlord'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/properties/${id}/submit/`);
      showToast('success', 'Property submitted for review successfully!');
      const res = await api.get(`/properties/${id}/`);
      setProperty(res.data);
    } catch {
      showToast('error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
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

  const canSubmit = property?.status === 'DRAFT' || property?.status === 'REJECTED';
  const stepIndex = STATUS_STEPS.indexOf(property?.status ?? '');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <NavBar portalName="Landlord Portal" />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Landlord Portal" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-[14px] font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-[#6B7280] mb-6">
          <Link href="/dashboard/landlord" className="hover:text-[#2563EB] transition-colors flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            My Properties
          </Link>
          <span>›</span>
          <span className="text-[#111827] font-medium">House #{property.house_number}</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] font-bold text-[#111827]">House #{property.house_number}</h1>
            <StatusBadge status={property.status} />
          </div>
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shadow-sm"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>Submit for Review</>
              )}
            </button>
          )}
        </div>

        {/* Rejection Alert */}
        {property.status === 'REJECTED' && property.review_note && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-red-800 mb-1">Property Rejected</p>
              <p className="text-[13px] text-red-700">{property.review_note}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT COL — span 2 */}
          <div className="col-span-2 space-y-6">

            {/* Property Information */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">🏠</span>
                Property Information
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <InfoItem label="Building Type" value={property.building_type?.replace(/_/g, ' ')} icon="🏢" />
                <InfoItem label="Number of Rooms" value={property.num_rooms} icon="🛏" />
                <InfoItem label="Floor Area" value={property.floor_area_sqm ? `${property.floor_area_sqm} sqm` : null} icon="📐" />
                <InfoItem label="Construction Year" value={property.construction_year} icon="📅" />
                <InfoItem label="Number of Units" value={property.num_units ?? 1} icon="🔑" />
                <InfoItem label="Cadastral UPI" value={property.cadastral_upi} icon="#" />
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">📍</span>
                Location Details
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <InfoItem label="Sub-City" value={typeof property.sub_city === 'object' ? property.sub_city?.name : property.sub_city as any} icon="🗺" />
                <InfoItem label="Woreda" value={typeof property.woreda === 'object' ? property.woreda?.name : property.woreda as any} icon="📌" />
                <InfoItem label="Kebele" value={property.kebele} icon="🏘" />
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">📄</span>
                Documents
                <span className="ml-auto text-[12px] font-normal text-[#6B7280]">{property.documents?.length ?? 0} file(s)</span>
              </h2>
              {!property.documents || property.documents.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-[#6B7280]">
                  <div className="text-3xl mb-2">📂</div>
                  No documents uploaded yet.
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

            {/* Timestamps */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-[17px] font-bold text-[#111827] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-sm">🕐</span>
                Timeline
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Registered On" value={fmt(property.created_at)} icon="📆" />
                <InfoItem label="Last Updated" value={fmt(property.updated_at)} icon="✏️" />
              </div>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="space-y-6">

            {/* Financial */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#EFF6FF] rounded-full opacity-60" />
              <div className="absolute -right-1 -top-1 w-14 h-14 bg-[#DBEAFE] rounded-full opacity-60" />
              <p className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 relative">Monthly Rent</p>
              <p className="text-[28px] font-black text-[#2563EB] leading-tight relative">
                ETB {Number(property.monthly_rent_etb).toLocaleString()}
              </p>
              <p className="text-[12px] text-[#9CA3AF] mt-1 relative">per month</p>
            </div>

            {/* Review Status */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h3 className="text-[15px] font-bold text-[#111827] mb-4">Review Progress</h3>
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const isDone = stepIndex > i;
                  const isCurrent = stepIndex === i;
                  const isPending = stepIndex < i;
                  return (
                    <div key={step} className="flex items-stretch gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                          isDone ? 'bg-green-500 border-green-500 text-white' :
                          isCurrent ? 'bg-[#2563EB] border-[#2563EB] text-white' :
                          'bg-white border-[#E5E7EB] text-[#9CA3AF]'
                        }`}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 my-0.5 ${
                            isDone ? 'bg-green-300' : 'bg-[#E5E7EB]'
                          }`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-[13px] font-semibold mt-1 ${
                          isDone ? 'text-green-600' : isCurrent ? 'text-[#2563EB]' : 'text-[#9CA3AF]'
                        }`}>
                          {step.replace(/_/g, ' ')}
                        </p>
                        {isCurrent && <p className="text-[11px] text-[#6B7280]">Current status</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Landlord Info */}
            {property.landlord_detail && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-[15px] font-bold text-[#111827] mb-4">Landlord Info</h3>
                <div className="flex items-center gap-3">
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
          </div>
        </div>
      </main>
    </div>
  );
}
