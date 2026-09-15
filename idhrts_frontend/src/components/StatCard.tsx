interface StatCardProps {
  label: string;
  value: number | string;
  variant?: "inline" | "metric";
  icon?: "document" | "clock" | "check";
  valueColor?: "default" | "amber" | "green";
}

const icons = {
  document: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  clock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  check: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

const iconBgMap = {
  document: "bg-gray-100 text-gray-500",
  clock: "bg-amber-50 text-amber-500",
  check: "bg-green-50 text-green-600",
};

const valueColorMap = {
  default: "text-[#111827]",
  amber: "text-[#D97706]",
  green: "text-[#16A34A]",
};

export default function StatCard({ label, value, variant = "inline", icon, valueColor = "default" }: StatCardProps) {
  if (variant === "metric") {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-start justify-between shadow-sm">
        <div>
          <p className="text-[14px] text-gray-500 font-medium mb-2">{label}</p>
          <p className={`text-[42px] font-black leading-none ${valueColorMap[valueColor]}`}>{value}</p>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgMap[icon]}`}>
            {icons[icon]}
          </div>
        )}
      </div>
    );
  }

  // inline variant: "Label: value"
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] px-5 py-4 flex items-center shadow-sm">
      <span className="text-[15px] font-semibold text-[#111827]">{label}:</span>
      <span className="text-[15px] text-gray-600 ml-1.5">{value}</span>
    </div>
  );
}
