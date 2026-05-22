interface RepairProgressProps {
  progress: number;
  log: string[];
}

export function RepairProgress({ progress, log }: RepairProgressProps) {
  return (
    <section className="space-y-3">
      <div className="h-2 overflow-hidden rounded bg-slate-200">
        <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
      </div>
      <pre className="max-h-48 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
        {log.join("\n")}
      </pre>
    </section>
  );
}
