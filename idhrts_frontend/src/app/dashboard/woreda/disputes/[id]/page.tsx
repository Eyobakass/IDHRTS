"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import NavBar from "@/components/NavBar";
import StatusBadge from "@/components/StatusBadge";

interface Dispute {
  id: string;
  dispute_type: string;
  description: string;
  status: string;
  incident_date?: string;
  created_at?: string;
  ruling_text?: string;
  ruling_at?: string;
  appeal_deadline?: string;
  filer_detail?: { full_name_en?: string; phone_number?: string };
  respondent_detail?: { full_name_en?: string; phone_number?: string };
  contract_detail?: { contract_reg_number?: string };
}

// FR-DISP-005: administrative rulings require a substantive explanation.
const MIN_RULING_LENGTH = 50;

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [rulingText, setRulingText] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!disputeId) return;
    api
      .get(`/disputes/${disputeId}/`)
      .then((res) => setDispute(res.data))
      .catch((err) => {
        console.error("Failed to load dispute:", err);
        showToast("Failed to load dispute details", "error");
      })
      .finally(() => setLoading(false));
  }, [disputeId]);

  const runAction = async (
    action: "acknowledge" | "resolve" | "close",
    body: Record<string, unknown>,
    successText: string,
    failureText: string
  ) => {
    setResolving(true);
    setError("");

    try {
      await api.post(`/disputes/${disputeId}/${action}/`, body);
      showToast(successText, "success");

      // Refresh dispute data
      const res = await api.get(`/disputes/${disputeId}/`);
      setDispute(res.data);
      setRulingText("");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || failureText;
      showToast(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setResolving(false);
    }
  };

  // FR-DISP-003: FILED -> UNDER_REVIEW is the only transition out of FILED.
  const handleAcknowledge = () =>
    runAction("acknowledge", {}, "Dispute is now under review", "Failed to start review");

  const handleResolve = async () => {
    if (!rulingText || rulingText.length < MIN_RULING_LENGTH) {
      setError(`Ruling text must be at least ${MIN_RULING_LENGTH} characters`);
      return;
    }
    await runAction(
      "resolve",
      { ruling_text: rulingText },
      "Dispute resolved successfully",
      "Failed to resolve dispute"
    );
  };

  const handleClose = () =>
    runAction("close", {}, "Dispute closed", "Failed to close dispute");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <NavBar portalName="Woreda Officer Portal" variant="dark" />
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center">
            <p className="text-gray-500">Dispute not found</p>
            <button
              onClick={() => router.push("/dashboard/woreda")}
              className="mt-4 text-[#2563EB] hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canAcknowledge = dispute.status === "FILED";
  const canResolve = dispute.status === "UNDER_REVIEW";
  const canClose = dispute.status === "DECISION_ISSUED" || dispute.status === "APPEALED";

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <NavBar portalName="Woreda Officer Portal" variant="dark" />

      {toast && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-8 py-8">
        <button
          onClick={() => router.push("/dashboard/woreda")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-[14px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-[#E5E7EB] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-[20px] font-bold text-[#111827]">Dispute Details</h1>
            <StatusBadge status={dispute.status} />
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Dispute Information */}
            <div>
              <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Dispute Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Type</p>
                  <p className="text-[14px] text-[#111827] font-medium">
                    {dispute.dispute_type?.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Incident Date</p>
                  <p className="text-[14px] text-[#111827]">
                    {dispute.incident_date
                      ? new Date(dispute.incident_date).toLocaleDateString("en-US")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Filed By</p>
                  <p className="text-[14px] text-[#111827]">
                    {dispute.filer_detail?.full_name_en || dispute.filer_detail?.phone_number || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Against</p>
                  <p className="text-[14px] text-[#111827]">
                    {dispute.respondent_detail?.full_name_en || dispute.respondent_detail?.phone_number || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Description */}
            <div>
              <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Description</h2>
              <p className="text-[14px] text-gray-700 leading-relaxed">{dispute.description}</p>
            </div>

            {/* Ruling (if resolved) */}
            {dispute.ruling_text && (
              <>
                <div className="h-px bg-gray-200" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Ruling</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-[14px] text-gray-800 leading-relaxed">{dispute.ruling_text}</p>
                    {dispute.ruling_at && (
                      <p className="text-[12px] text-gray-500 mt-2">
                        Resolved on {new Date(dispute.ruling_at).toLocaleDateString("en-US")}
                      </p>
                    )}
                    {dispute.appeal_deadline && (
                      <p className="text-[12px] text-gray-700 mt-1 font-medium">
                        Appeal deadline:{" "}
                        {new Date(dispute.appeal_deadline).toLocaleDateString("en-US")} (15
                        working days)
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Begin Review (FILED -> UNDER_REVIEW) */}
            {canAcknowledge && (
              <>
                <div className="h-px bg-gray-200" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Begin Review</h2>
                  <p className="text-[13px] text-gray-600 mb-3">
                    Acknowledge this dispute to move it to UNDER_REVIEW. Both parties are
                    notified, and a ruling can then be entered.
                  </p>
                  {error && <p className="text-[13px] text-red-600 mb-2">{error}</p>}
                  <button
                    onClick={handleAcknowledge}
                    disabled={resolving}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
                  >
                    {resolving ? "Starting review..." : "Acknowledge & Begin Review"}
                  </button>
                </div>
              </>
            )}

            {/* Close Dispute (DECISION_ISSUED / APPEALED -> CLOSED) */}
            {canClose && (
              <>
                <div className="h-px bg-gray-200" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Close Dispute</h2>
                  <p className="text-[13px] text-gray-600 mb-3">
                    Close this dispute once the ruling stands and no appeal is pending.
                  </p>
                  {error && <p className="text-[13px] text-red-600 mb-2">{error}</p>}
                  <button
                    onClick={handleClose}
                    disabled={resolving}
                    className="bg-[#111827] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
                  >
                    {resolving ? "Closing..." : "Close Dispute"}
                  </button>
                </div>
              </>
            )}

            {/* Ruling entry form (UNDER_REVIEW only) */}
            {canResolve && (
              <>
                <div className="h-px bg-gray-200" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Resolve Dispute</h2>
                  <textarea
                    id="ruling-text"
                    value={rulingText}
                    onChange={(e) => {
                      setRulingText(e.target.value);
                      setError("");
                    }}
                    placeholder={`Enter your ruling and decision... (minimum ${MIN_RULING_LENGTH} characters)`}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                  />
                  {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-3">
                    <p className="text-[12px] text-gray-500">
                      {rulingText.length} / {MIN_RULING_LENGTH} characters minimum
                    </p>
                    <button
                      onClick={handleResolve}
                      disabled={resolving || rulingText.length < MIN_RULING_LENGTH}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
                    >
                      {resolving ? "Resolving..." : "Submit Resolution"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
