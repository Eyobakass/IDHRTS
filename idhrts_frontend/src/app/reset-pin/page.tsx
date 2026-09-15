'use client';
import { useState, useEffect, Suspense } from 'react';
import { api } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/pin/confirm-reset/', { phone_number: phone, otp, new_pin: newPin });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 text-center">
        <h2 className="text-2xl font-bold text-green-600">PIN Reset Successfully!</h2>
        <p className="mt-2">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset PIN</h2>
        <p className="mt-2 text-center text-sm text-gray-600">For phone: {phone}</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">OTP Code</label>
              <div className="mt-1">
                <input id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="newPin" className="block text-sm font-medium text-gray-700">New 4-Digit PIN</label>
              <div className="mt-1">
                <input id="newPin" type="password" required maxLength={4} minLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset PIN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPinContent />
    </Suspense>
  );
}
