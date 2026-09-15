"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface Contract {
  contract_reg_number?: string;
  monthly_rent_etb: number;
  advance_payment_etb?: number;
  lease_duration_months: number;
  status: string;
  start_date?: string;
  end_date?: string;
  property?: { house_number?: string; building_type?: string };
  landlord?: { full_name_en?: string };
}

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

export default function ReviewPage() {
  const params = useParams();
  const token = params.token as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const requestOtp = async () => {
    if (!agreed) return;
    setSigning(true);
    try {
      await api.post(`/contracts/public/review/${token}/request-otp/`);
      setOtpSent(true);
      setOtpError("");
    } catch {
      setError("Failed to request OTP.");
    } finally {
      setSigning(false);
    }
  };

  const verifyAndSign = async () => {
    /* istanbul ignore next — button is disabled when otp.length !== 6; this guard is defensive-only */
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP.");
      return;
    }

    setSigning(true);
    try {
      await api.post(`/contracts/public/review/${token}/sign/`, { otp });
      setSigned(true);
      setContract((prev) => (prev ? { ...prev, status: "SIGNED" } : prev));
      setOtpSent(false);
    } catch {
      setOtpError("Invalid or expired OTP.");
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    api
      .get(`/contracts/public/review/${token}/`)
      .then((res) => setContract(res.data))
      .catch(() => setError("This contract link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">Loading contract...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </div>
          <h2 className="text-[17px] font-bold text-[#111827] mb-2">Invalid Contract Link</h2>
          <p className="text-[13px] text-gray-500">{error}</p>
        </div>
      </div>
    );

  const alreadySigned = contract?.status !== "PENDING_TENANT_SIGNATURE";

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Green security banner */}
      <div className="bg-green-50 border-b border-green-200 py-2 text-center">
        <span className="text-[13px] text-green-800 font-medium flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          This is a secure, one-time contract review link
        </span>
      </div>

      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center">
        <span className="text-[20px] font-black text-[#111827] tracking-tight">IDHRTS</span>
        <div className="flex-1 flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          <span className="text-[14px] text-gray-600 font-medium">Secure Contract Review</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
      </header>

      <main className="max-w-[520px] mx-auto px-4 py-8 space-y-4">
        {/* Card 1: Contract Header */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold text-[#111827]">
                {contract?.contract_reg_number
                  ? `${contract.contract_reg_number}: Rental Contract Review`
                  : "Rental Contract Review"}
              </h1>
              <p className="text-[13px] text-gray-400 mt-1">Contract reference number if available.</p>
            </div>
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded whitespace-nowrap ${
              signed || alreadySigned ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
            }`}>
              {signed || alreadySigned ? "Signed" : "PENDING YOUR SIGNATURE"}
            </span>
          </div>
        </div>

        {/* Card 2: Contract Terms */}
        {contract && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-[18px] font-bold text-[#111827] mb-4">Contract Terms</h2>
            <table className="w-full text-[14px]">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-500 w-[40%]">Monthly Rent</td>
                  <td className="py-2.5 font-medium text-[#111827]">ETB {contract.monthly_rent_etb?.toLocaleString()}</td>
                  <td className="py-2.5 text-gray-500 pl-6 w-[30%]">Advance Payment</td>
                  <td className="py-2.5 font-medium text-[#111827]">{contract.advance_payment_etb ? `ETB ${contract.advance_payment_etb.toLocaleString()}` : "—"}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-500">Lease Duration</td>
                  <td className="py-2.5 font-medium text-[#111827]">{contract.lease_duration_months} months</td>
                  <td className="py-2.5 text-gray-500 pl-6">Start Date</td>
                  <td className="py-2.5 font-medium text-[#111827]">{fmt(contract.start_date)}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-500">End Date</td>
                  <td className="py-2.5 font-medium text-[#111827]">{fmt(contract.end_date)}</td>
                  <td className="py-2.5 text-gray-500 pl-6">Property</td>
                  <td className="py-2.5 font-medium text-[#111827]">
                    {contract.property ? `House #${contract.property.house_number}, ${contract.property.building_type}` : "—"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-500">Landlord</td>
                  <td className="py-2.5 font-medium text-[#111827]">{contract.landlord?.full_name_en ?? "—"}</td>
                  <td className="py-2.5 text-gray-500 pl-6">Landlord</td>
                  <td className="py-2.5 font-medium text-[#111827]">{contract.landlord?.full_name_en ?? "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Legal Notice */}
        <div className="border-l-4 border-[#2563EB] bg-blue-50 rounded-r-xl px-5 py-4">
          <p className="text-[14px] font-bold text-[#111827]">Legal Notice</p>
          <p className="text-[13px] text-[#374151] mt-1 leading-relaxed">
            By signing this contract, you acknowledge and agree to the terms above in accordance with Ethiopian Rental Housing Law. This constitutes a legally binding digital signature.
          </p>
        </div>

        {/* Signature Action Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <p className="text-[15px] font-semibold text-[#111827] mb-4">Signature action</p>

          {signed ? (
            <div className="text-center py-4">
              <svg className="w-10 h-10 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <p className="text-[15px] font-semibold text-green-700">Contract Signed Successfully</p>
              <p className="text-[13px] text-green-600 mt-1">Your signature has been recorded. The contract will be sent for Woreda authentication.</p>
            </div>
          ) : alreadySigned ? (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-3 rounded-xl font-semibold text-[14px] cursor-not-allowed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Contract Already Signed
            </button>
          ) : (
            <>
              <label className="flex items-start gap-3 cursor-pointer mb-4">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-[#2563EB]" />
                <span className="text-[14px] text-gray-700">I have read and understood all contract terms</span>
              </label>
              <button onClick={requestOtp} disabled={!agreed || signing}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-[15px] transition-colors">
                {signing ? "Requesting OTP..." : "I Agree & Sign Digitally"}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-3">Once signed, this action cannot be undone. The contract will be sent for Woreda authentication.</p>
            </>
          )}
        </div>
      </main>

      {/* OTP Modal */}
      {otpSent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Enter OTP</h3>
            <p className="text-sm text-gray-500 mb-4">
              We've sent a 6-digit OTP to your phone number. It will expire in 5 minutes.
            </p>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-600 mb-2"
            />
            {otpError && <p className="text-sm text-red-600 mb-4 text-center">{otpError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOtpSent(false)} disabled={signing}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={verifyAndSign} disabled={signing || otp.length !== 6}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {signing ? "Verifying..." : "Verify & Sign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
