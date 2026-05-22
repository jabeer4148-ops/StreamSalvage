interface Props {
  onSkip: () => void;
  onUndo: () => void;
  skipped: boolean;
}

export function NoReferenceWarning({ onSkip, onUndo, skipped }: Props) {
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={skipped ? onUndo : onSkip}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <span className="text-sm text-neutral-600 text-left">
          I don't have a reference file - skip this step
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
          {skipped ? 'Skipped - undo?' : 'Lower success rate'}
        </span>
      </button>

      {skipped && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-xs text-amber-700 leading-relaxed">
            Without a reference file, recovery uses FFmpeg stream repair - success rate ~40%.
            With a reference file, success rate rises to ~85%. We strongly recommend creating
            one first (10 seconds in OBS).
          </p>
        </div>
      )}
    </div>
  );
}
