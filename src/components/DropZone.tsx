interface DropZoneProps {
  label: string;
  selectedPath: string | null;
  onSelect: () => void;
}

export function DropZone({ label, selectedPath, onSelect }: DropZoneProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-white p-6 text-center hover:border-blue-500"
    >
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="mt-2 text-xs text-slate-500">{selectedPath ?? "No file selected"}</span>
    </button>
  );
}
