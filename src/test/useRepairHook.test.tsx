import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Must mock before importing the hook
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));

// Mock the full tauriCommands module so hook tests don't hit real IPC
vi.mock('../lib/tauriCommands', () => ({
  pickBrokenFile: vi.fn(),
  pickReferenceFile: vi.fn(),
  pickSaveLocation: vi.fn(),
  repairNoReference: vi.fn(),
  repairWithReference: vi.fn(),
  validateLicense: vi.fn(),
  getStoredLicense: vi.fn(),
  saveStoredLicense: vi.fn(),
  clearStoredLicense: vi.fn(),
  openFileInPlayer: vi.fn(),
  saveRepairedFile: vi.fn(),
}));

import { useRepair } from '../hooks/useRepair';
import * as cmd from '../lib/tauriCommands';

const mockPickBroken = vi.mocked(cmd.pickBrokenFile);
const mockPickReference = vi.mocked(cmd.pickReferenceFile);
const mockPickSave = vi.mocked(cmd.pickSaveLocation);
const mockRepairNoRef = vi.mocked(cmd.repairNoReference);
const mockRepairWithRef = vi.mocked(cmd.repairWithReference);
const mockValidate = vi.mocked(cmd.validateLicense);
const mockGetStoredLicense = vi.mocked(cmd.getStoredLicense);
const mockSaveStoredLicense = vi.mocked(cmd.saveStoredLicense);
const mockClearStoredLicense = vi.mocked(cmd.clearStoredLicense);
const mockOpenPlayer = vi.mocked(cmd.openFileInPlayer);
const mockSaveFile = vi.mocked(cmd.saveRepairedFile);

const SUCCESS_RESULT = {
  success: true,
  output_path: 'fixed.mp4',
  log: ['done'],
  error: null,
};

const FAILURE_RESULT = {
  success: false,
  output_path: null,
  log: ['FFmpeg failed'],
  error: 'FFmpeg stream copy could not recover this file.',
};

describe('useRepair hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoredLicense.mockResolvedValue(null);
    mockSaveStoredLicense.mockResolvedValue(undefined);
    mockClearStoredLicense.mockResolvedValue(undefined);
  });

  // ── selectBrokenFile ──────────────────────────────────────────────────

  test('selectBrokenFile: sets brokenFilePath and advances to reference step', async () => {
    mockPickBroken.mockResolvedValue('C:\\stream.mp4');
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });

    expect(result.current.state.brokenFilePath).toBe('C:\\stream.mp4');
    expect(result.current.state.step).toBe('reference');
  });

  test('selectBrokenFile: does nothing when dialog is cancelled (null)', async () => {
    mockPickBroken.mockResolvedValue(null);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });

    expect(result.current.state.brokenFilePath).toBeNull();
    expect(result.current.state.step).toBe('broken');
  });

  // ── selectReferenceFile ───────────────────────────────────────────────

  test('selectReferenceFile: sets referenceFilePath and hasReferenceFile', async () => {
    mockPickReference.mockResolvedValue('C:\\ref.mp4');
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectReferenceFile();
    });

    expect(result.current.state.referenceFilePath).toBe('C:\\ref.mp4');
    expect(result.current.state.hasReferenceFile).toBe(true);
  });

  test('selectReferenceFile: does nothing when dialog is cancelled', async () => {
    mockPickReference.mockResolvedValue(null);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectReferenceFile();
    });

    expect(result.current.state.referenceFilePath).toBeNull();
    expect(result.current.state.hasReferenceFile).toBe(false);
  });

  // ── skipReference / undoSkipReference ─────────────────────────────────

  test('skipReference: sets skippedReference flag', () => {
    const { result } = renderHook(() => useRepair());

    act(() => result.current.skipReference());

    expect(result.current.state.skippedReference).toBe(true);
    expect(result.current.state.hasReferenceFile).toBe(false);
  });

  test('undoSkipReference: clears skippedReference flag', () => {
    const { result } = renderHook(() => useRepair());

    act(() => result.current.skipReference());
    expect(result.current.state.skippedReference).toBe(true);

    act(() => result.current.undoSkipReference());
    expect(result.current.state.skippedReference).toBe(false);
  });

  // ── startRepair (no reference) ────────────────────────────────────────

  test('startRepair: calls repairNoReference when no reference file', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());

    await act(async () => {
      await result.current.startRepair();
    });

    expect(mockRepairNoRef).toHaveBeenCalledWith('broken.mp4');
    expect(mockRepairWithRef).not.toHaveBeenCalled();
  });

  test('startRepair no-ref success: transitions to preview with output path', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });

    expect(result.current.state.step).toBe('preview');
    expect(result.current.state.repairedFilePath).toBe('fixed.mp4');
    expect(result.current.state.repairProgress).toBe(100);
    expect(result.current.state.repairSuccess).toBe(true);
  });

  test('startRepair no-ref failure: returns to reference with error', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(FAILURE_RESULT);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });

    expect(result.current.state.step).toBe('reference');
    expect(result.current.state.repairSuccess).toBe(false);
    expect(result.current.state.repairError).toBeTruthy();
  });

  // ── startRepair (with reference) ──────────────────────────────────────

  test('startRepair: calls repairWithReference when reference file is set', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockPickReference.mockResolvedValue('ref.mp4');
    mockRepairWithRef.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
      await result.current.selectReferenceFile();
    });
    await act(async () => {
      await result.current.startRepair();
    });

    expect(mockRepairWithRef).toHaveBeenCalledWith('broken.mp4', 'ref.mp4');
    expect(mockRepairNoRef).not.toHaveBeenCalled();
  });

  test('startRepair with-ref success: advances to preview', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockPickReference.mockResolvedValue('ref.mp4');
    mockRepairWithRef.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderHook(() => useRepair());

    // Each act flushes state before the next call reads it — required because
    // startRepair captures brokenFilePath/hasReferenceFile in its closure.
    await act(async () => { await result.current.selectBrokenFile(); });
    await act(async () => { await result.current.selectReferenceFile(); });
    await act(async () => { await result.current.startRepair(); });

    expect(result.current.state.step).toBe('preview');
    expect(result.current.state.repairedFilePath).toBe('fixed.mp4');
  });

  test('startRepair: does nothing if no broken file selected', async () => {
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.startRepair();
    });

    expect(mockRepairNoRef).not.toHaveBeenCalled();
    expect(mockRepairWithRef).not.toHaveBeenCalled();
    expect(result.current.state.step).toBe('broken');
  });

  test('startRepair: handles invoke-level exception as REPAIR_FAILED', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockRejectedValue(new Error('Unexpected Rust error'));
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });

    expect(result.current.state.step).toBe('reference');
    expect(result.current.state.repairError).toContain('Unexpected Rust error');
  });

  // ── showExport ────────────────────────────────────────────────────────

  test('showExport: transitions to export step', () => {
    const { result } = renderHook(() => useRepair());

    act(() => result.current.showExport());

    expect(result.current.state.step).toBe('export');
    expect(result.current.state.showExport).toBe(true);
  });

  // ── checkLicense ──────────────────────────────────────────────────────

  test('checkLicense: valid key transitions to export and sets licenseValid', async () => {
    mockValidate.mockResolvedValue(true);
    const { result } = renderHook(() => useRepair());

    let valid: boolean | undefined;
    await act(async () => {
      valid = await result.current.checkLicense('TEST-1234');
    });

    expect(valid).toBe(true);
    expect(result.current.state.licenseValid).toBe(true);
    expect(result.current.state.licenseKey).toBe('TEST-1234');
    expect(result.current.state.step).toBe('export');
    expect(mockSaveStoredLicense).toHaveBeenCalledWith('TEST-1234');
  });

  test('startup: validates stored license silently and marks it valid', async () => {
    mockGetStoredLicense.mockResolvedValue('TEST-1234');
    mockValidate.mockResolvedValue(true);

    const { result } = renderHook(() => useRepair());

    await waitFor(() => expect(result.current.state.licenseValid).toBe(true));
    expect(result.current.state.licenseKey).toBe('TEST-1234');
    expect(result.current.state.step).toBe('broken');
  });

  test('startup: clears stored license when API rejects it', async () => {
    mockGetStoredLicense.mockResolvedValue('BAD-KEY');
    mockValidate.mockResolvedValue(false);

    const { result } = renderHook(() => useRepair());

    await waitFor(() => expect(mockClearStoredLicense).toHaveBeenCalledOnce());
    expect(result.current.state.licenseValid).toBe(false);
  });

  test('checkLicense: invalid key sets licenseValid to false', async () => {
    mockValidate.mockResolvedValue(false);
    const { result } = renderHook(() => useRepair());

    let valid: boolean | undefined;
    await act(async () => {
      valid = await result.current.checkLicense('BAD-KEY');
    });

    expect(valid).toBe(false);
    expect(result.current.state.licenseValid).toBe(false);
  });

  test('checkLicense: exception from validateLicense returns false', async () => {
    mockValidate.mockRejectedValue(new Error('Network'));
    const { result } = renderHook(() => useRepair());

    let valid: boolean | undefined;
    await act(async () => {
      valid = await result.current.checkLicense('ANY-KEY');
    });

    expect(valid).toBe(false);
    expect(result.current.state.licenseValid).toBe(false);
  });

  // ── previewFile ───────────────────────────────────────────────────────

  test('previewFile: calls openFileInPlayer with repairedFilePath', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(SUCCESS_RESULT);
    mockOpenPlayer.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRepair());

    // Get to preview state
    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });

    expect(result.current.state.step).toBe('preview');

    await act(async () => {
      await result.current.previewFile();
    });

    expect(mockOpenPlayer).toHaveBeenCalledWith('fixed.mp4');
  });

  test('previewFile: does nothing if repairedFilePath is null', async () => {
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.previewFile();
    });

    expect(mockOpenPlayer).not.toHaveBeenCalled();
  });

  // ── exportFile ────────────────────────────────────────────────────────

  test('exportFile: calls pickSaveLocation then saveRepairedFile', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(SUCCESS_RESULT);
    mockPickSave.mockResolvedValue('C:\\dest\\output.mp4');
    mockSaveFile.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });
    await act(async () => {
      await result.current.exportFile();
    });

    expect(mockPickSave).toHaveBeenCalledWith('repaired_recording.mp4');
    expect(mockSaveFile).toHaveBeenCalledWith('fixed.mp4', 'C:\\dest\\output.mp4');
  });

  test('exportFile: does not call saveRepairedFile when save dialog cancelled', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(SUCCESS_RESULT);
    mockPickSave.mockResolvedValue(null); // user cancelled
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });
    await act(async () => {
      await result.current.exportFile();
    });

    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  // ── reset ─────────────────────────────────────────────────────────────

  test('reset: returns state to initial values', async () => {
    mockPickBroken.mockResolvedValue('broken.mp4');
    mockRepairNoRef.mockResolvedValue(SUCCESS_RESULT);
    const { result } = renderHook(() => useRepair());

    await act(async () => {
      await result.current.selectBrokenFile();
    });
    act(() => result.current.skipReference());
    await act(async () => {
      await result.current.startRepair();
    });

    expect(result.current.state.step).toBe('preview');

    act(() => result.current.reset());

    expect(result.current.state.step).toBe('broken');
    expect(result.current.state.brokenFilePath).toBeNull();
    expect(result.current.state.repairedFilePath).toBeNull();
    expect(result.current.state.repairLog).toEqual([]);
  });
});
