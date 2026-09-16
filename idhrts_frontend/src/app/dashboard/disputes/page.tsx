'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import SkeletonCard from '@/components/SkeletonCard';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

interface Dispute {
  id: string;
  title?: string;
  description: string;
  status: string;
  filed_at?: string;
  filer_detail?: { full_name_en?: string };
}

export default function DisputesDashboard() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDisputes = () => {
    api.get('/disputes/')
      .then(res => setDisputes(Array.isArray(res.data) ? res.data : res.data.results ?? []))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    setSubmitLoading(true);
    try {
      await api.post('/disputes/', { title, description });
      showToast("Dispute filed successfully.", "success");
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchDisputes();
    } catch {
      showToast("Failed to file dispute.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Dispute Management" />

      {toast && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.text}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[22px] sm:text-[32px] font-black text-[#111827] leading-tight">My Disputes</h1>
            <p className="text-[14px] text-gray-500 mt-1">View and manage your filed disputes</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            File New Dispute
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : disputes.length === 0 ? (
          <EmptyState title="No Disputes" description="You have not filed any disputes." />
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden overflow-x-auto">
            <table className="w-full text-[14px] min-w-[480px]">
              <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filed At</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-[#111827]">{d.title || 'Untitled Dispute'}</td>
                    <td className="px-4 py-4 text-gray-600 max-w-xs truncate">{d.description}</td>
                    <td className="px-4 py-4 text-gray-500 text-[13px]">{d.filed_at ? new Date(d.filed_at).toLocaleDateString('en-US') : '\u2014'}</td>
                    <td className="px-4 py-4"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="File a Dispute">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#2563EB] focus:border-[#2563EB] outline-none"
              placeholder="Brief title of the issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#2563EB] focus:border-[#2563EB] outline-none resize-none"
              placeholder="Provide full details about the dispute..."
              rows={4}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitLoading || !description}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {submitLoading ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
