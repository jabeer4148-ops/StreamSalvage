import type { AppStep } from "../types";

interface StepTabsProps {
  currentStep: AppStep;
  steps: AppStep[];
  onStepChange: (step: AppStep) => void;
}

export function StepTabs({ currentStep, steps, onStepChange }: StepTabsProps) {
  return (
    <div className="flex gap-2">
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          onClick={() => onStepChange(step)}
          className={
            currentStep === step
              ? "rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white"
              : "rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
          }
        >
          {step}
        </button>
      ))}
    </div>
  );
}
