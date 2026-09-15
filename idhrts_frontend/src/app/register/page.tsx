'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Step = 'details' | 'verify';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [role, setRole] = useState('LANDLORD');
  const [phone, setPhone] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [fullNameAm, setFullNameAm] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length < 4 || pin.length > 6) { setError('PIN must be 4–6 digits.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register/', { phone_number: phone, role });
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/verify/', {
        phone_number: phone,
        otp,
        pin,
        role,
        full_name_en: fullNameEn,
        full_name_am: fullNameAm,
      });
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.');
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827]">
            {step === 'details' ? 'Create Account' : 'Verify Phone Number'}
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {step === 'details'
              ? 'Register as a landlord or tenant on IDHRTS'
              : `Enter the 6-digit OTP sent to ${phone}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Account Details', 'Verify OTP'].map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                (i === 0 && step === 'details') || (i === 1 && step === 'verify')
                  ? 'text-[#2563EB]' : 'text-gray-400'
              }`}>{label}</div>
              <div className={`h-1 rounded-full ${
                (i === 0) || (i === 1 && step === 'verify') ? 'bg-[#2563EB]' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">I am a</label>
              <div className="flex gap-3">
                {['LANDLORD', 'TENANT'].map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg border text-[14px] font-medium transition-colors ${
                      role === r ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'border-gray-300 text-gray-600 hover:border-[#1E3A5F]'
                    }`}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Full Name (English)</label>
              <input type="text" required value={fullNameEn} onChange={e => setFullNameEn(e.target.value)}
                placeholder="e.g. Abebe Girma" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Full Name (Amharic)</label>
              <input type="text" value={fullNameAm} onChange={e => setFullNameAm(e.target.value)}
                placeholder="ለምሳሌ፡ አበበ ግርማ" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">Phone Number</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+251..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">PIN (4–6 digits)</label>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={pin} onChange={e => setPin(e.target.value)}
                placeholder="••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1E3A5F] hover:bg-[#162D4A] text-white py-3 rounded-lg font-semibold text-[15px] transition-colors disabled:opacity-50">
              {loading ? 'Sending OTP...' : 'Send Verification OTP →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#111827] mb-1.5">6-Digit OTP</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="_ _ _ _ _ _" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[20px] tracking-[0.5em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
              <p className="text-[12px] text-gray-400 mt-1 text-center">Check your phone for the 6-digit code</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1E3A5F] hover:bg-[#162D4A] text-white py-3 rounded-lg font-semibold text-[15px] transition-colors disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            <button type="button" onClick={() => setStep('details')}
              className="w-full text-gray-500 text-[14px] hover:text-gray-700">
              ← Back to edit details
            </button>
          </form>
        )}

        <p className="text-center text-[13px] text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
