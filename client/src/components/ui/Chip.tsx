interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, selected, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer
        ${
          selected
            ? "bg-primary text-white shadow-md"
            : "bg-surface text-text-light border border-gray-200 hover:border-primary hover:text-primary"
        } ${className}`}
    >
      {label}
    </button>
  );
}
