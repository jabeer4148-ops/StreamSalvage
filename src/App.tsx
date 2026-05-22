import { useRepair } from './hooks/useRepair';
import { StepTabs } from './components/StepTabs';
import { DropZone } from './components/DropZone';

export default function App() {
  const { state, selectBrokenFile } = useRepair();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-[system-ui]">
      <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100">
          <h1 className="text-base font-semibold text-neutral-700">StreamSalvage</h1>
          <p className="text-xs text-neutral-500 mt-0.5">MP4 crash recovery · local · no upload</p>
        </div>

        <div className="px-6 py-5">
          <StepTabs currentStep={state.step} />

          <h2 className="text-sm font-medium text-neutral-700 mb-3">
            Select your corrupted recording
          </h2>

          <DropZone
            variant="broken"
            filePath={state.brokenFilePath}
            onClick={selectBrokenFile}
          />

          <button
            type="button"
            onClick={selectBrokenFile}
            disabled={!!state.brokenFilePath}
            className={[
              'mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
              state.brokenFilePath
                ? 'bg-[#1D9E75] text-white cursor-default'
                : 'bg-neutral-100 text-neutral-500 cursor-not-allowed',
            ].join(' ')}
          >
            {state.brokenFilePath ? '✓ File selected - continue below' : 'Select a file first'}
          </button>
        </div>
      </div>
    </div>
  );
}
