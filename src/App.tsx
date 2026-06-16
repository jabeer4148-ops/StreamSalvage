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
    checkLicense,
    changeLicense,
    exportFile,
    previewFile,
    showExport,
    reset,
  } = useRepair();

  const canStartRepair = state.referenceFilePath !== null || state.skippedReference;
  const brokenFileName = state.brokenFilePath?.split(/[\\/]/).pop() ?? null;

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

          {brokenFileName && (
            <div className="flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 mb-4">
              <span className="text-xs text-neutral-500">Corrupted file:</span>
              <span
                className="text-xs font-medium text-neutral-700 truncate"
                title={state.brokenFilePath ?? undefined}
              >
                {brokenFileName}
              </span>
            </div>
          )}

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

          {state.repairError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-red-700">{state.repairError}</p>
            </div>
          )}

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
          <RepairProgress
            progress={state.repairProgress}
            log={state.repairLog}
            hasReferenceFile={state.hasReferenceFile}
            repairError={state.repairError ?? null}
          />
        </section>
      );
    }

    if (state.step === 'preview') {
      return (
        <section>
          <VideoPreview
            repairedFilePath={state.repairedFilePath}
            onPlayInPlayer={previewFile}
            onProceedToExport={showExport}
          />
        </section>
      );
    }

    if (state.step === 'export') {
      return (
        <ExportPanel
          licenseValid={state.licenseValid}
          onCheckLicense={checkLicense}
          onChangeLicense={changeLicense}
          onExport={exportFile}
          onReset={reset}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-[system-ui]">
      <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-neutral-700">StreamSalvage</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                MP4 crash recovery - local - no upload
              </p>
            </div>
            {state.step !== 'broken' && (
              <button
                type="button"
                onClick={reset}
                className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
              >
                Start over
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5">
          <StepTabs currentStep={state.step} />
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
