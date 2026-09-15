interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE:                    { label: "ACTIVE",        className: "bg-green-100 text-green-800" },
  PENDING_REVIEW:            { label: "Pending Review", className: "bg-amber-100 text-amber-800" },
  DRAFT:                     { label: "DRAFT",          className: "bg-gray-100 text-gray-600" },
  REJECTED:                  { label: "REJECTED",       className: "bg-red-100 text-red-700" },
  SIGNED:                    { label: "SIGNED",         className: "bg-blue-100 text-blue-700" },
  REGISTERED:                { label: "REGISTERED",     className: "bg-green-100 text-green-700" },
  PENDING_TENANT_SIGNATURE:  { label: "Awaiting Signature", className: "bg-amber-100 text-amber-800" },
  PENDING:                   { label: "PENDING",        className: "bg-amber-100 text-amber-800" },
  PAID:                      { label: "PAID",           className: "bg-green-100 text-green-700" },
  CONFIRMED:                 { label: "PAID",           className: "bg-green-100 text-green-700" },
  PROCESSING:                { label: "PROCESSING",     className: "bg-blue-100 text-blue-700" },
  // Dispute lifecycle (FR-DISP-003)
  FILED:                     { label: "FILED",           className: "bg-amber-100 text-amber-800" },
  UNDER_REVIEW:              { label: "Under Review",    className: "bg-blue-100 text-blue-700" },
  DECISION_ISSUED:           { label: "Decision Issued", className: "bg-indigo-100 text-indigo-700" },
  APPEALED:                  { label: "APPEALED",        className: "bg-orange-100 text-orange-800" },
  CLOSED:                    { label: "CLOSED",          className: "bg-gray-100 text-gray-600" },
  // Property lifecycle additions (FR-PROP-007)
  SUSPENDED:                 { label: "SUSPENDED",       className: "bg-red-100 text-red-700" },
  ARCHIVED:                  { label: "ARCHIVED",        className: "bg-gray-200 text-gray-500" },
  // Contract lifecycle additions
  TERMINATED:                { label: "TERMINATED",      className: "bg-red-100 text-red-700" },
  OVERDUE:                   { label: "OVERDUE",         className: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${config.className} ${className ?? ""}`}>
      {config.label}
    </span>
  );
}
