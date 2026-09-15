interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({ title = "No items yet", description }: EmptyStateProps) {
  return (
    <div className="w-full bg-white rounded-xl border border-[#E5E7EB] px-8 py-16 flex flex-col items-center justify-center">
      <p className="text-[15px] text-gray-400 text-center">{title}</p>
      {description && (
        <p className="text-[13px] text-gray-400 text-center mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}
