import StatusBadge from "./StatusBadge";
import Link from 'next/link';


interface Property {
  id: string;
  house_number: string;
  building_type: string;
  monthly_rent_etb: number;
  status: string;
  kebele?: string;
}

const STRIP_COLOR: Record<string, string> = {
  ACTIVE:         "bg-[#16A34A]",
  PENDING_REVIEW: "bg-[#D97706]",
  DRAFT:          "bg-[#6B7280]",
  REJECTED:       "bg-[#DC2626]",
};

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const strip = STRIP_COLOR[property.status] ?? "bg-[#6B7280]";

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Colored status strip */}
      <div className={`h-2.5 w-full ${strip}`} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-center gap-2.5 mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h3 className="text-[18px] font-bold text-[#111827] leading-tight">
            House #{property.house_number}
          </h3>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-3" />

        {/* Type + Rent */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {property.building_type}
          </span>
          <span className="text-[14px] font-medium text-[#111827]">
            ETB {property.monthly_rent_etb?.toLocaleString()}/mo
          </span>
        </div>

        {/* Location row */}
        <div className="flex items-start justify-between mb-5">
          <div className="text-[13px] text-[#6B7280] leading-snug">
            <div>Sub-city</div>
            <div>Woreda{property.kebele ? ` · Kebele ${property.kebele}` : ""}</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <StatusBadge status={property.status} />
          <Link href={`/dashboard/landlord/properties/${property.id}`} className="px-3.5 py-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">View Details</Link>
        </div>
      </div>
    </div>
  );
}
