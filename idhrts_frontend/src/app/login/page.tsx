'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';


export default function LoginPage() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login/', { phone_number: phone, pin });
      setAuth(res.data.access, res.data.role);
      // FR-AUTH-006: Force PIN change on first officer login
      if (res.data.requires_pin_change) {
        router.push('/change-pin');
        return;
      }
      if (res.data.role === 'LANDLORD') router.push('/dashboard/landlord');
      else if (res.data.role === 'TENANT') router.push('/dashboard/tenant');
      else if (res.data.role === 'WOREDA_OFFICER') router.push('/dashboard/woreda');
      else if (res.data.role === 'TAX_OFFICER') router.push('/dashboard/tax');
      else if (res.data.role === 'ADMIN' || res.data.role === 'SYSTEM_ADMIN') router.push('/dashboard/admin');
    } catch (err: any) {
      console.error("Login Error:", err?.response?.status, err?.response?.data);
      if (err?.response?.status === 423) {
        setError(`Account locked. Try again in ${err.response.data.minutes_remaining || 30} minutes.`);
      } else if (err?.response?.status === 401 && err?.response?.data?.attempts_remaining !== undefined) {
        setError(`Invalid PIN. ${err.response.data.attempts_remaining} attempts remaining.`);
      } else {
        setError('Invalid phone number or PIN');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-[440px] p-6 sm:p-10 relative">

        {/* Language Toggle */}
        <div className="absolute top-4 right-5 rounded-full border border-gray-200 flex overflow-hidden">
          <button
            type="button"
            onClick={() => i18n.changeLanguage('en')}
            className={`text-[12px] font-medium px-3.5 py-1.5 transition-colors ${
              i18n.language === 'en' ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            English
          </button>
          <span className="w-px bg-gray-200 self-stretch" />
          <button
            type="button"
            onClick={() => i18n.changeLanguage('am')}
            className={`text-[12px] font-medium px-3.5 py-1.5 transition-colors ${
              i18n.language === 'am' ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            አማርኛ
          </button>
        </div>

        {/* Logo + Brand */}
        <div className="mt-8 mb-2 flex flex-col items-center text-center">
          <div className="w-[52px] h-[52px] rounded-full border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A2B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="10" width="20" height="11" rx="1"/>
              <polyline points="12 2 22 10 2 10"/>
              <line x1="7" y1="21" x2="7" y2="14"/>
              <line x1="12" y1="21" x2="12" y2="14"/>
              <line x1="17" y1="21" x2="17" y2="14"/>
            </svg>
          </div>
          <h1 className="text-[30px] font-black text-[#111827] tracking-tight">IDHRTS</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Integrated Digital Housing &amp; Rental Tax System</p>
        </div>

        {/* Horizontal Rule */}
        <div className="h-px bg-gray-100 mt-6 mb-7" />

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+251 9__ ___-___"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">4-Digit PIN</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              maxLength={6}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[20px] tracking-[0.25em] text-gray-900 placeholder-gray-400 placeholder:tracking-normal placeholder:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-[15px] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {error && (
            <div className="flex items-center gap-1.5 mt-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="text-[13px] text-[#DC2626] font-medium">{error}</span>
            </div>
          )}

          <div className="mt-5 text-center text-[13px] text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#2563EB] font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </form>


      </div>
    </div>
  );
}
