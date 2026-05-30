interface Props {
  repairedFilePath: string | null;
  onPlayInPlayer: () => void;
  onProceedToExport: () => void;
}

export function VideoPreview({ repairedFilePath, onPlayInPlayer, onProceedToExport }: Props) {
  if (!repairedFilePath) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">
          Repair completed but output file path is missing. Please restart and try again.
        </p>
      </div>
    );
  }

  const fileName = repairedFilePath.split('\\').pop()?.split('/').pop() ?? 'repaired file';

  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
        <span className="text-green-600 text-xs font-semibold mt-0.5" aria-hidden="true">
          OK
        </span>
        <div>
          <p className="text-sm font-medium text-green-800">Repair successful</p>
          <p className="text-xs text-green-600 mt-0.5">
            Your recording has been recovered. Preview the first 30 seconds below for free,
            then unlock the full video with a one-time purchase.
          </p>
        </div>
      </div>

      {/* Preview block */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-200 gap-3">
          <span className="text-xs text-neutral-500 font-medium">
            Free preview — first 30 seconds
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
            🔒 Full video locked
          </span>
        </div>
        <div className="bg-neutral-900 h-28 flex items-center justify-center">
          <button
            onClick={onPlayInPlayer}
            className="flex flex-col items-center gap-2 text-white opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Play preview in system media player"
          >
            <div className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-xs font-semibold">
              Play
            </div>
            <span className="text-xs text-white/70">Open in media player</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-400 text-center mb-3 truncate">Saved to: {fileName}</p>

      <button
        onClick={onProceedToExport}
        className="w-full py-2.5 rounded-lg bg-[#1D9E75] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Unlock full video — $29 one-time →
      </button>

      <p className="text-xs text-neutral-400 text-center mt-2">
        No subscription · instant license key via email
      </p>
    </div>
  );
}
