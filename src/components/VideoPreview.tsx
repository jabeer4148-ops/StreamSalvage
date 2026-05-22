interface VideoPreviewProps {
  filePath: string | null;
}

export function VideoPreview({ filePath }: VideoPreviewProps) {
  return (
    <section className="rounded border border-slate-200 p-4">
      <h2 className="text-base font-semibold text-slate-900">Preview</h2>
      <p className="mt-2 text-sm text-slate-600">{filePath ?? "No repaired video available"}</p>
    </section>
  );
}
