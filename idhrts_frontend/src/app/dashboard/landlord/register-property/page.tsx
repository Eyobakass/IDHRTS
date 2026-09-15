'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

function getTokenPayload() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return {};
    let base64 = token.split('.')[1];
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    return JSON.parse(atob(base64));
  } catch { return {}; }
}

export default function RegisterProperty() {
  const router = useRouter();
  const [formData, setFormData] = useState({ house_number: '', kebele: '', building_type: 'VILLA', monthly_rent_etb: '' });
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) {
      alert('Please upload a proof of ownership document.');
      return;
    }
    setLoading(true);
    try {
      const payload = getTokenPayload();
      const res = await api.post('/properties/', { ...formData, sub_city: payload.sub_city_id || undefined, woreda: payload.woreda_id || undefined });
      
      const fileData = new FormData();
      fileData.append('document', document);
      await api.post(`/properties/${res.data.id}/upload_document/`, fileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await api.post(`/properties/${res.data.id}/submit/`);
      router.push('/dashboard/landlord');
    } catch (err: any) {
      console.error('Property registration error:', err.response?.data || err);
      alert('Error registering property.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar
        portalName="Landlord Portal"
        links={[
          { label: 'Property Management', href: '/dashboard/landlord' },
          { label: 'Lease Agreements', href: '#' },
          { label: 'Applications', href: '#' },
        ]}
        showProfile={true}
      />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
          <Link href="/dashboard/landlord" className="hover:text-gray-700">Dashboard</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="text-gray-700 font-medium">Register Property</span>
        </nav>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
          <h2 className="text-[22px] font-bold text-[#111827]">Register New Property</h2>
          <p className="text-[13px] text-gray-500 mt-1 mb-6">Fill in the details of the property to register it for review</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1 */}
            <div>
              <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-1">SECTION 1</p>
              <h3 className="text-[17px] font-bold text-[#111827] mb-4">Property Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">House / Unit Number</label>
                  <input type="text" required placeholder="e.g. A-205"
                    onChange={e => setFormData({...formData, house_number: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Building Type</label>
                  <select onChange={e => setFormData({...formData, building_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] appearance-none">
                    <option value="VILLA">Villa</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="CONDOMINIUM">Condominium</option>
                    <option value="COMMERCIAL_RESIDENTIAL">Commercial/Residential</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Kebele</label>
                <input type="text" placeholder="Enter kebele name or number"
                  onChange={e => setFormData({...formData, kebele: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-1">SECTION 2</p>
              <h3 className="text-[17px] font-bold text-[#111827] mb-4">Financial Details</h3>
              <div>
                <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Monthly Rent (ETB)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 font-medium">ETB</span>
                  <input type="number" required min="1"
                    onChange={e => setFormData({...formData, monthly_rent_etb: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg pl-12 pr-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-1">SECTION 3</p>
              <h3 className="text-[17px] font-bold text-[#111827] mb-4">Proof of Ownership</h3>
              <div>
                <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Upload Title Deed / Certificate (PDF/JPG/PNG max 10MB)</label>
                <input type="file" required accept=".pdf, .jpg, .jpeg, .png"
                  onChange={e => e.target.files && setDocument(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[13px] file:font-semibold file:bg-[#EFF6FF] file:text-[#1E40AF] hover:file:bg-[#DBEAFE]" />
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-1">SECTION 4</p>
              <h3 className="text-[17px] font-bold text-[#111827] mb-4">Location</h3>
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="text-[13px] text-[#1E40AF]">Location will be set to your registered Woreda automatically</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <Link href="/dashboard/landlord" className="text-[14px] text-[#2563EB] font-medium hover:underline">Cancel</Link>
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={loading}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors">
                    Register & Submit for Review
                  </button>
                  {loading && (
                    <div className="flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2.5 rounded-lg text-[14px] font-medium">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      Loading
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-3">Your property will be reviewed by your Woreda Office before activation</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
