import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { RepairState } from '../types';
import {
  pickBrokenFile,
  pickReferenceFile,
  pickSaveLocation,
  repairNoReference,
  repairWithReference,
  validateLicense,
  openFileInPlayer,
  saveRepairedFile,
} from '../lib/tauriCommands';

type Action =
  | { type: 'SET_BROKEN_FILE'; path: string }
  | { type: 'SET_REFERENCE_FILE'; path: string }
  | { type: 'SKIP_REFERENCE' }
  | { type: 'UNDO_SKIP' }
  | { type: 'START_REPAIR' }
  | { type: 'REPAIR_PROGRESS'; progress: number; log?: string }
  | { type: 'REPAIR_SUCCESS'; outputPath: string; log: string[] }
  | { type: 'REPAIR_FAILED'; error: string; log: string[] }
  | { type: 'SHOW_EXPORT' }
  | { type: 'LICENSE_VALID'; key: string }
  | { type: 'LICENSE_INVALID' }
  | { type: 'RESET' };

const initialState: RepairState = {
  step: 'broken',
  brokenFilePath: null,
  referenceFilePath: null,
  hasReferenceFile: false,
  skippedReference: false,
  repairProgress: 0,
  repairLog: [],
  repairedFilePath: null,
  repairSuccess: false,
  repairError: null,
  licenseKey: null,
  licenseValid: false,
  showExport: false,
};

function reducer(state: RepairState, action: Action): RepairState {
  switch (action.type) {
    case 'SET_BROKEN_FILE':
      return { ...state, brokenFilePath: action.path, step: 'reference', repairError: null };
    case 'SET_REFERENCE_FILE':
      return {
        ...state,
        referenceFilePath: action.path,
        hasReferenceFile: true,
        skippedReference: false,
        repairError: null,
      };
    case 'SKIP_REFERENCE':
      return {
        ...state,
        referenceFilePath: null,
        hasReferenceFile: false,
        skippedReference: true,
        repairError: null,
      };
    case 'UNDO_SKIP':
      return { ...state, skippedReference: false, repairError: null };
    case 'START_REPAIR':
      return {
        ...state,
        step: 'repairing',
        repairProgress: 0,
        repairLog: [],
        repairError: null,
        repairSuccess: false,
      };
    case 'REPAIR_PROGRESS':
      return {
        ...state,
        repairProgress: action.progress,
        repairLog: action.log ? [...state.repairLog, action.log] : state.repairLog,
      };
    case 'REPAIR_SUCCESS':
      return {
        ...state,
        step: 'preview',
        repairSuccess: true,
        repairedFilePath: action.outputPath,
        repairLog: [...state.repairLog, ...action.log],
        repairProgress: 100,
        repairError: null,
      };
    case 'REPAIR_FAILED':
      return {
        ...state,
        step: 'reference',
        repairSuccess: false,
        repairLog: [...state.repairLog, ...action.log],
        repairProgress: 0,
        repairError: action.error,
      };
    case 'SHOW_EXPORT':
      return { ...state, step: 'export', showExport: true };
    case 'LICENSE_VALID':
      return { ...state, licenseKey: action.key, licenseValid: true, step: 'export', showExport: true };
    case 'LICENSE_INVALID':
      return { ...state, licenseValid: false };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function useRepair() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repairRunIdRef = useRef(0);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopProgressTimer, [stopProgressTimer]);

  const selectBrokenFile = useCallback(async () => {
    const path = await pickBrokenFile();
    if (path) dispatch({ type: 'SET_BROKEN_FILE', path });
  }, []);

  const selectReferenceFile = useCallback(async () => {
    const path = await pickReferenceFile();
    if (path) dispatch({ type: 'SET_REFERENCE_FILE', path });
  }, []);

  const skipReference = useCallback(() => {
    dispatch({ type: 'SKIP_REFERENCE' });
  }, []);

  const undoSkipReference = useCallback(() => {
    dispatch({ type: 'UNDO_SKIP' });
  }, []);

  const startRepair = useCallback(async () => {
    if (!state.brokenFilePath) return;
    const repairRunId = repairRunIdRef.current + 1;
    repairRunIdRef.current = repairRunId;
    dispatch({ type: 'START_REPAIR' });
    stopProgressTimer();

    let simulatedProgress = 0;
    const progressMessages = [
      { at: 3, text: 'Launching FFmpeg repair process...' },
      { at: 30, text: 'Reading damaged MP4 container...' },
      {
        at: 60,
        text: state.hasReferenceFile
          ? 'Applying reference file stream map...'
          : 'Attempting stream copy recovery...',
      },
      { at: 90, text: 'Waiting for FFmpeg to finish...' },
    ];
    const emittedMessages = new Set<number>();
    const interval = setInterval(() => {
      if (repairRunIdRef.current !== repairRunId) {
        clearInterval(interval);
        return;
      }

      simulatedProgress = Math.min(simulatedProgress + 3, 90);
      const message = progressMessages.find(
        ({ at }) => simulatedProgress >= at && !emittedMessages.has(at),
      );
      if (message) emittedMessages.add(message.at);

      dispatch({
        type: 'REPAIR_PROGRESS',
        progress: simulatedProgress,
        log: message?.text,
      });
    }, 100);
    progressTimerRef.current = interval;

    try {
      const result =
        state.hasReferenceFile && state.referenceFilePath
          ? await repairWithReference(state.brokenFilePath, state.referenceFilePath)
          : await repairNoReference(state.brokenFilePath);

      if (repairRunIdRef.current !== repairRunId) return;

      if (result.success && result.output_path) {
        dispatch({ type: 'REPAIR_SUCCESS', outputPath: result.output_path, log: result.log });
      } else {
        dispatch({
          type: 'REPAIR_FAILED',
          error: result.error ?? 'Unknown error',
          log: result.log,
        });
      }
    } catch (err) {
      if (repairRunIdRef.current !== repairRunId) return;

      dispatch({
        type: 'REPAIR_FAILED',
        error: String(err),
        log: [String(err)],
      });
    } finally {
      clearInterval(interval);
      if (progressTimerRef.current === interval) {
        progressTimerRef.current = null;
      }
    }
  }, [
    state.brokenFilePath,
    state.referenceFilePath,
    state.hasReferenceFile,
    stopProgressTimer,
  ]);

  const showExport = useCallback(() => {
    dispatch({ type: 'SHOW_EXPORT' });
  }, []);

  const checkLicense = useCallback(async (key: string): Promise<boolean> => {
    try {
      const valid = await validateLicense(key);
      if (valid) {
        dispatch({ type: 'LICENSE_VALID', key });
      } else {
        dispatch({ type: 'LICENSE_INVALID' });
      }
      return valid;
    } catch (err) {
      console.error('License check failed:', err);
      dispatch({ type: 'LICENSE_INVALID' });
      return false;
    }
  }, []);

  const exportFile = useCallback(async () => {
    if (!state.repairedFilePath) return;
    try {
      const dest = await pickSaveLocation('repaired_recording.mp4');
      if (dest) {
        await saveRepairedFile(state.repairedFilePath, dest);
      }
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, [state.repairedFilePath]);

  const previewFile = useCallback(async () => {
    if (!state.repairedFilePath) return;

    try {
      await openFileInPlayer(state.repairedFilePath);
    } catch (err) {
      console.error('Preview open failed:', err);
    }
  }, [state.repairedFilePath]);

  const reset = useCallback(() => {
    repairRunIdRef.current += 1;
    stopProgressTimer();
    dispatch({ type: 'RESET' });
  }, [stopProgressTimer]);

  return {
    state,
    selectBrokenFile,
    selectReferenceFile,
    skipReference,
    undoSkipReference,
    startRepair,
    checkLicense,
    exportFile,
    previewFile,
    showExport,
    reset,
  };
}
