import { useEffect, useState } from 'react';

interface Props {
  progress: number;
  log: string[];
  hasReferenceFile: boolean;
  repairError: string | null;
}

export function RepairProgress({ progress, log, hasReferenceFile, repairError }: Props) {
  const displayProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  useEffect(() => {
    setShowLongWaitMessage(false);

    if (progress >= 100 || repairError) return undefined;

    const timeout = setTimeout(() => {
      setShowLongWaitMessage(true);
    }, 60000);

    return () => clearTimeout(timeout);
  }, [progress, repairError]);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-neutral-700">Repairing your recording...</p>
        <span className="text-sm font-medium text-[#1D9E75]">{displayProgress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-100 rounded-full h-2 mb-4">
        <div
          className="bg-[#1D9E75] h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {showLongWaitMessage && progress < 100 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-neutral-600">
            Still working... Large files can take a few minutes.
          </p>
        </div>
      )}

      {!hasReferenceFile && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-amber-700">
            Running without reference file - if this fails, try again with one.
          </p>
        </div>
      )}

      {repairError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-red-700">{repairError}</p>
        </div>
      )}

      {/* Log output */}
      <div className="bg-neutral-900 rounded-lg p-3 h-32 overflow-y-auto font-mono">
        {log.map((line, i) => (
          <p key={i} className="text-xs text-green-400 leading-relaxed">
            {line}
          </p>
        ))}
        {log.length === 0 && (
          <p className="text-xs text-neutral-500">Starting repair engine...</p>
        )}
      </div>
    </div>
  );
}
