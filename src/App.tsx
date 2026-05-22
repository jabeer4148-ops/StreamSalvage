import { useRepair } from './hooks/useRepair';
import { StepTabs } from './components/StepTabs';
import { DropZone } from './components/DropZone';
import { ReferenceExplainer } from './components/ReferenceExplainer';
import { NoReferenceWarning } from './components/NoReferenceWarning';
import { RepairProgress } from './components/RepairProgress';
import { VideoPreview } from './components/VideoPreview';
import { ExportPanel } from './components/ExportPanel';

export default function App() {
  const {
    state,
    selectBrokenFile,
    selectReferenceFile,
    skipReference,
    undoSkipReference,
    startRepair,
    exportFile,
    previewFile,
  } = useRepair();

  const canStartRepair = state.referenceFilePath !== null || state.skippedReference;

  const renderStep = () => {
    if (state.step === 'broken') {
      return (
        <section>
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
            {state.brokenFilePath ? 'File selected - continuing' : 'Select a file first'}
          </button>
        </section>
      );
    }

    if (state.step === 'reference') {
      return (
        <section>
          <h2 className="text-sm font-medium text-neutral-700 mb-3">
            Add a short healthy recording
          </h2>

          <ReferenceExplainer />

          <DropZone
            variant="reference"
            filePath={state.referenceFilePath}
            onClick={selectReferenceFile}
          />

          <div className="mt-4">
            <NoReferenceWarning
              onSkip={skipReference}
              onUndo={undoSkipReference}
              skipped={state.skippedReference}
            />
          </div>

          <button
            type="button"
            onClick={startRepair}
            disabled={!canStartRepair}
            className={[
              'w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
              canStartRepair
                ? 'bg-[#1D9E75] text-white hover:bg-[#188866]'
                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed',
            ].join(' ')}
          >
            Start Repair
          </button>
        </section>
      );
    }

    if (state.step === 'repairing') {
      return (
        <section>
          <h2 className="text-sm font-medium text-neutral-700 mb-3">Repairing your recording</h2>
          <RepairProgress progress={state.repairProgress} log={state.repairLog} />
        </section>
      );
    }

    if (state.step === 'preview') {
      return (
        <section className="space-y-4">
          <VideoPreview filePath={state.repairedFilePath} />
          <button
            type="button"
            onClick={previewFile}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#1D9E75] text-white hover:bg-[#188866] transition-colors"
          >
            Open Preview
          </button>
        </section>
      );
    }

    return <ExportPanel repairedFilePath={state.repairedFilePath} onExport={exportFile} />;
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-[system-ui]">
      <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100">
          <h1 className="text-base font-semibold text-neutral-700">StreamSalvage</h1>
          <p className="text-xs text-neutral-500 mt-0.5">MP4 crash recovery - local - no upload</p>
        </div>

        <div className="px-6 py-5">
          <StepTabs currentStep={state.step} />
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
