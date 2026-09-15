'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ChangePinPage() {
  const router = useRouter();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPin.length < 4 || newPin.length > 6) {
      setError('PIN must be 4–6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/pin/change/', { new_pin: newPin });
      router.push('/login?pin_changed=1');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827]">Set Your PIN</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            You must set a new PIN before continuing. This is a one-time requirement for new accounts.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">New PIN (4–6 digits)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              placeholder="••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[15px] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              placeholder="••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[15px] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A5F] hover:bg-[#162D4A] text-white py-3 rounded-lg font-semibold text-[15px] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Set New PIN & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
