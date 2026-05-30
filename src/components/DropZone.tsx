interface Props {
  variant: 'broken' | 'reference';
  filePath: string | null;
  onClick: () => void;
  disabled?: boolean;
}

const config = {
  broken: {
    borderColor: 'border-[#E24B4A]',
    bgColor: 'bg-white',
    filledBorder: 'border-neutral-200',
    filledBg: 'bg-neutral-50',
    icon: '🎬',
    emptyTitle: 'Drop your corrupted recording here',
    emptySubtitle: 'or click to browse - .mp4, .mov, .m4v supported',
    filledLabel: 'Corrupted file:',
    textColor: 'text-[#E24B4A]',
  },
  reference: {
    borderColor: 'border-[#378ADD]',
    bgColor: 'bg-white',
    filledBorder: 'border-neutral-200',
    filledBg: 'bg-neutral-50',
    icon: '📹',
    emptyTitle: 'Drop your reference recording here',
    emptySubtitle: 'Any healthy .mp4 recorded with identical OBS settings',
    filledLabel: 'Reference file:',
    textColor: 'text-[#378ADD]',
  },
};

export function DropZone({ variant, filePath, onClick, disabled }: Props) {
  const c = config[variant];
  const hasFile = !!filePath;
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1D9E75]',
        hasFile
          ? `${c.filledBorder} ${c.filledBg} border-solid`
          : `${c.borderColor} ${c.bgColor} hover:bg-neutral-50`,
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <div className="text-3xl mb-2">{c.icon}</div>
      {hasFile ? (
        <>
          <p className="text-xs text-neutral-500 mb-1">{c.filledLabel}</p>
          <p
            className="text-sm font-medium text-neutral-700 truncate max-w-[40ch] mx-auto"
            title={filePath ?? undefined}
          >
            {fileName}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Click to change</p>
        </>
      ) : (
        <>
          <p className={`text-sm font-medium ${c.textColor} mb-1`}>{c.emptyTitle}</p>
          <p className="text-xs text-neutral-500">{c.emptySubtitle}</p>
        </>
      )}
    </button>
  );
}
