import type { AppStep } from '../types';

const steps: { key: AppStep; label: string }[] = [
  { key: 'broken', label: 'Broken file' },
  { key: 'reference', label: 'Reference file' },
  { key: 'repairing', label: 'Repairing' },
  { key: 'preview', label: 'Preview' },
  { key: 'export', label: 'Export' },
];

const stepOrder: AppStep[] = ['broken', 'reference', 'repairing', 'preview', 'export'];

interface Props {
  currentStep: AppStep;
}

export function StepTabs({ currentStep }: Props) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="flex border border-neutral-200 rounded-xl overflow-hidden mb-5">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div
            key={step.key}
            className={[
              'flex-1 py-2 px-3 text-center text-xs font-medium border-r border-neutral-200 last:border-r-0',
              isDone ? 'bg-white text-[#1D9E75]' : '',
              isActive ? 'bg-white text-neutral-700' : '',
              !isDone && !isActive ? 'bg-neutral-50 text-neutral-500' : '',
            ].join(' ')}
          >
            {isDone ? 'Done ' : ''}
            {step.label}
          </div>
        );
      })}
    </div>
  );
}
