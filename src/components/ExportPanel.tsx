interface ExportPanelProps {
  repairedFilePath: string | null;
  onExport: () => void;
}

export function ExportPanel({ repairedFilePath, onExport }: ExportPanelProps) {
  return (
    <section className="flex items-center justify-between rounded border border-slate-200 p-4">
      <span className="text-sm text-slate-700">{repairedFilePath ?? "Nothing to export yet"}</span>
      <button type="button" onClick={onExport} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Export
      </button>
    </section>
  );
}
