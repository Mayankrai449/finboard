interface StatRowProps {
  label: string;
  value: string;
  showDivider?: boolean;
}

export default function StatRow({ label, value, showDivider = false }: StatRowProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 py-2.5">
        <span className="text-xs text-gray-400 font-medium shrink-0 max-w-[40%] wrap-break-word">
          {label}
        </span>
        <span className="text-sm font-semibold text-white text-right wrap-break-word overflow-wrap-anywhere min-w-0">
          {value}
        </span>
      </div>
      {showDivider && <div className="h-px bg-[#333]/30"></div>}
    </div>
  );
}
