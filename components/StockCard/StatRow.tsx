interface StatRowProps {
  label: string;
  value: string;
  showDivider?: boolean;
}

export default function StatRow({ label, value, showDivider = false }: StatRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-400 font-medium">
          {label}
        </span>
        <span className="text-xl font-bold text-white">
          {value}
        </span>
      </div>
      {showDivider && <div className="h-px bg-[#333]/30"></div>}
    </div>
  );
}
