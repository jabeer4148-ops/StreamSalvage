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
  | { type: 'UNDO_SKIP_REFERENCE' }
  | { type: 'START_REPAIR' }
  | { type: 'SET_REPAIR_PROGRESS'; progress: number }
  | { type: 'REPAIR_PROGRESS'; progress: number; log: string }
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
  licenseKey: null,
  licenseValid: false,
};

function reducer(state: RepairState, action: Action): RepairState {
  switch (action.type) {
    case 'SET_BROKEN_FILE':
      return { ...state, brokenFilePath: action.path, step: 'reference' };
    case 'SET_REFERENCE_FILE':
      return {
        ...state,
        referenceFilePath: action.path,
        hasReferenceFile: true,
        skippedReference: false,
      };
    case 'SKIP_REFERENCE':
      return {
        ...state,
        referenceFilePath: null,
        hasReferenceFile: false,
        skippedReference: true,
      };
    case 'UNDO_SKIP_REFERENCE':
      return { ...state, skippedReference: false };
    case 'START_REPAIR':
      return { ...state, step: 'repairing', repairProgress: 0, repairLog: [] };
    case 'SET_REPAIR_PROGRESS':
      return { ...state, repairProgress: action.progress };
    case 'REPAIR_PROGRESS':
      return {
        ...state,
        repairProgress: action.progress,
        repairLog: [...state.repairLog, action.log],
      };
    case 'REPAIR_SUCCESS':
      return {
        ...state,
        step: 'preview',
        repairSuccess: true,
        repairedFilePath: action.outputPath,
        repairLog: [...state.repairLog, ...action.log],
        repairProgress: 100,
      };
    case 'REPAIR_FAILED':
      return {
        ...state,
        step: 'reference',
        repairSuccess: false,
        repairLog: [...state.repairLog, ...action.log],
        repairProgress: 0,
      };
    case 'SHOW_EXPORT':
      return { ...state, step: 'export' };
    case 'LICENSE_VALID':
      return { ...state, licenseKey: action.key, licenseValid: true, step: 'export' };
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
    dispatch({ type: 'UNDO_SKIP_REFERENCE' });
  }, []);

  const startRepair = useCallback(async () => {
    if (!state.brokenFilePath) return;
    dispatch({ type: 'START_REPAIR' });
    stopProgressTimer();

    const startedAt = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const simulatedProgress = Math.min((elapsed / 3000) * 90, 90);
      dispatch({ type: 'SET_REPAIR_PROGRESS', progress: simulatedProgress });
    }, 100);

    try {
      const result =
        state.hasReferenceFile && state.referenceFilePath
          ? await repairWithReference(state.brokenFilePath, state.referenceFilePath)
          : await repairNoReference(state.brokenFilePath);

      if (result.success && result.output_path) {
        stopProgressTimer();
        dispatch({ type: 'REPAIR_SUCCESS', outputPath: result.output_path, log: result.log });
      } else {
        stopProgressTimer();
        dispatch({
          type: 'REPAIR_FAILED',
          error: result.error ?? 'Unknown error',
          log: result.log,
        });
      }
    } catch (err) {
      stopProgressTimer();
      dispatch({
        type: 'REPAIR_FAILED',
        error: String(err),
        log: [String(err)],
      });
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

  const checkLicense = useCallback(async (key: string) => {
    const valid = await validateLicense(key);
    if (valid) {
      dispatch({ type: 'LICENSE_VALID', key });
    } else {
      dispatch({ type: 'LICENSE_INVALID' });
    }
    return valid;
  }, []);

  const exportFile = useCallback(async () => {
    if (!state.repairedFilePath) return;
    const dest = await pickSaveLocation('repaired_recording.mp4');
    if (dest) await saveRepairedFile(state.repairedFilePath, dest);
  }, [state.repairedFilePath]);

  const previewFile = useCallback(async () => {
    if (state.repairedFilePath) await openFileInPlayer(state.repairedFilePath);
  }, [state.repairedFilePath]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

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
