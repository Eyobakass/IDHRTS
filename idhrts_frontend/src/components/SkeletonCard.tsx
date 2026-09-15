export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden animate-pulse">
      <div className="h-2.5 w-full bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-px bg-gray-100" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-7 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
