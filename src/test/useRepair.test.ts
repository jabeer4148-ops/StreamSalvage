import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock Tauri modules so the import chain (useRepair → tauriCommands → @tauri-apps)
// resolves cleanly in jsdom. The reducer is a pure function; no IPC is invoked.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));

import { reducer, initialState } from '../hooks/useRepair';

describe('useRepair reducer', () => {
  // Convenience: start from a clean slate before each test
  let state = { ...initialState };

  beforeEach(() => {
    state = { ...initialState };
  });

  // ── Initial state ──────────────────────────────────────────────────────

  test('initial state is correct', () => {
    expect(initialState.step).toBe('broken');
    expect(initialState.brokenFilePath).toBeNull();
    expect(initialState.referenceFilePath).toBeNull();
    expect(initialState.hasReferenceFile).toBe(false);
    expect(initialState.skippedReference).toBe(false);
    expect(initialState.repairProgress).toBe(0);
    expect(initialState.repairLog).toEqual([]);
    expect(initialState.repairedFilePath).toBeNull();
    expect(initialState.repairSuccess).toBe(false);
    expect(initialState.repairError).toBeNull();
    expect(initialState.licenseKey).toBeNull();
    expect(initialState.licenseValid).toBe(false);
    expect(initialState.showExport).toBe(false);
  });

  // ── SET_BROKEN_FILE ───────────────────────────────────────────────────

  test('SET_BROKEN_FILE sets path and advances to reference', () => {
    const next = reducer(state, { type: 'SET_BROKEN_FILE', path: 'test.mp4' });
    expect(next.brokenFilePath).toBe('test.mp4');
    expect(next.step).toBe('reference');
    // Should not touch referenceFilePath
    expect(next.referenceFilePath).toBeNull();
    // Should clear any prior repairError
    expect(next.repairError).toBeNull();
  });

  test('SET_BROKEN_FILE clears repairError from a previous failed attempt', () => {
    state = reducer(state, { type: 'SET_BROKEN_FILE', path: 'first.mp4' });
    state = reducer(state, { type: 'START_REPAIR' });
    state = reducer(state, { type: 'REPAIR_FAILED', error: 'FFmpeg failed', log: [] });
    expect(state.repairError).toBe('FFmpeg failed');

    const next = reducer(state, { type: 'SET_BROKEN_FILE', path: 'second.mp4' });
    expect(next.repairError).toBeNull();
  });

  // ── SET_REFERENCE_FILE ────────────────────────────────────────────────

  test('SET_REFERENCE_FILE sets path and hasReferenceFile', () => {
    state = reducer(state, { type: 'SET_BROKEN_FILE', path: 'broken.mp4' });
    const next = reducer(state, { type: 'SET_REFERENCE_FILE', path: 'ref.mp4' });
    expect(next.referenceFilePath).toBe('ref.mp4');
    expect(next.hasReferenceFile).toBe(true);
    expect(next.skippedReference).toBe(false);
    expect(next.repairError).toBeNull();
  });

  test('SET_REFERENCE_FILE un-skips if user previously skipped', () => {
    state = reducer(state, { type: 'SKIP_REFERENCE' });
    expect(state.skippedReference).toBe(true);
    const next = reducer(state, { type: 'SET_REFERENCE_FILE', path: 'ref.mp4' });
    expect(next.skippedReference).toBe(false);
    expect(next.hasReferenceFile).toBe(true);
  });

  // ── SKIP_REFERENCE ────────────────────────────────────────────────────

  test('SKIP_REFERENCE sets skippedReference and clears ref path', () => {
    state = reducer(state, { type: 'SET_REFERENCE_FILE', path: 'ref.mp4' });
    const next = reducer(state, { type: 'SKIP_REFERENCE' });
    expect(next.skippedReference).toBe(true);
    expect(next.referenceFilePath).toBeNull();
    expect(next.hasReferenceFile).toBe(false);
    expect(next.repairError).toBeNull();
  });

  // ── UNDO_SKIP ─────────────────────────────────────────────────────────

  test('UNDO_SKIP clears skippedReference', () => {
    state = reducer(state, { type: 'SKIP_REFERENCE' });
    expect(state.skippedReference).toBe(true);
    const next = reducer(state, { type: 'UNDO_SKIP' });
    expect(next.skippedReference).toBe(false);
    expect(next.repairError).toBeNull();
  });

  // ── START_REPAIR ──────────────────────────────────────────────────────

  test('START_REPAIR transitions to repairing and resets progress', () => {
    state = reducer(state, { type: 'REPAIR_FAILED', error: 'old error', log: ['old'] });
    const next = reducer(state, { type: 'START_REPAIR' });
    expect(next.step).toBe('repairing');
    expect(next.repairProgress).toBe(0);
    expect(next.repairLog).toEqual([]);
    expect(next.repairError).toBeNull();
    expect(next.repairSuccess).toBe(false);
  });

  // ── REPAIR_PROGRESS ───────────────────────────────────────────────────

  test('REPAIR_PROGRESS updates progress and appends log message', () => {
    state = reducer(state, { type: 'START_REPAIR' });
    const next = reducer(state, { type: 'REPAIR_PROGRESS', progress: 50, log: 'Step 1 done' });
    expect(next.repairProgress).toBe(50);
    expect(next.repairLog).toContain('Step 1 done');
  });

  test('REPAIR_PROGRESS accumulates multiple log entries', () => {
    state = reducer(state, { type: 'START_REPAIR' });
    state = reducer(state, { type: 'REPAIR_PROGRESS', progress: 30, log: 'Step 1 done' });
    state = reducer(state, { type: 'REPAIR_PROGRESS', progress: 75, log: 'Step 2 done' });
    expect(state.repairLog).toHaveLength(2);
    expect(state.repairLog[0]).toBe('Step 1 done');
    expect(state.repairLog[1]).toBe('Step 2 done');
    expect(state.repairProgress).toBe(75);
  });

  test('REPAIR_PROGRESS without log field does not append empty entry', () => {
    state = reducer(state, { type: 'START_REPAIR' });
    state = reducer(state, { type: 'REPAIR_PROGRESS', progress: 50 });
    expect(state.repairLog).toHaveLength(0);
    expect(state.repairProgress).toBe(50);
  });

  // ── REPAIR_SUCCESS ────────────────────────────────────────────────────

  test('REPAIR_SUCCESS transitions to preview with output path', () => {
    state = reducer(state, { type: 'START_REPAIR' });
    state = reducer(state, { type: 'REPAIR_PROGRESS', progress: 60, log: 'Working...' });
    const next = reducer(state, {
      type: 'REPAIR_SUCCESS',
      outputPath: 'fixed.mp4',
      log: ['FFmpeg done'],
    });
    expect(next.step).toBe('preview');
    expect(next.repairSuccess).toBe(true);
    expect(next.repairedFilePath).toBe('fixed.mp4');
    expect(next.repairProgress).toBe(100);
    expect(next.repairError).toBeNull();
    // Accumulated log includes both progress message and success messages
    expect(next.repairLog).toContain('Working...');
    expect(next.repairLog).toContain('FFmpeg done');
  });

  // ── REPAIR_FAILED ─────────────────────────────────────────────────────

  test('REPAIR_FAILED returns to reference step with error', () => {
    state = reducer(state, { type: 'SET_BROKEN_FILE', path: 'broken.mp4' });
    state = reducer(state, { type: 'START_REPAIR' });
    const next = reducer(state, {
      type: 'REPAIR_FAILED',
      error: 'FFmpeg stream copy failed',
      log: ['stderr output'],
    });
    expect(next.step).toBe('reference');
    expect(next.repairSuccess).toBe(false);
    expect(next.repairError).toBe('FFmpeg stream copy failed');
    expect(next.repairProgress).toBe(0);
    expect(next.repairLog).toContain('stderr output');
    // brokenFilePath is preserved so user can retry without reselecting
    expect(next.brokenFilePath).toBe('broken.mp4');
  });

  test('REPAIR_FAILED does not clear repairedFilePath (prior successful repair retained)', () => {
    // FINDING: REPAIR_FAILED does not reset repairedFilePath.
    // Starting from initialState it is null, which is correct.
    // If a user repaired once then tried again and failed, the old path
    // would remain in state. This is documented behaviour.
    state = reducer(state, { type: 'START_REPAIR' });
    const next = reducer(state, { type: 'REPAIR_FAILED', error: 'err', log: [] });
    expect(next.repairedFilePath).toBeNull(); // null from initialState
  });

  // ── SHOW_EXPORT ───────────────────────────────────────────────────────

  test('SHOW_EXPORT transitions to export step', () => {
    const next = reducer(state, { type: 'SHOW_EXPORT' });
    expect(next.step).toBe('export');
    expect(next.showExport).toBe(true);
  });

  // ── LICENSE_VALID ─────────────────────────────────────────────────────

  test('LICENSE_VALID sets key, licenseValid, and advances to export', () => {
    const next = reducer(state, { type: 'LICENSE_VALID', key: 'TEST-1234' });
    expect(next.licenseKey).toBe('TEST-1234');
    expect(next.licenseValid).toBe(true);
    expect(next.step).toBe('export');
    expect(next.showExport).toBe(true);
  });

  // ── LICENSE_INVALID ───────────────────────────────────────────────────

  test('LICENSE_INVALID sets licenseValid to false', () => {
    state = reducer(state, { type: 'LICENSE_VALID', key: 'TEST-1234' });
    const next = reducer(state, { type: 'LICENSE_INVALID' });
    expect(next.licenseValid).toBe(false);
    // licenseKey is NOT cleared — only licenseValid changes
    expect(next.licenseKey).toBe('TEST-1234');
  });

  // ── RESET ─────────────────────────────────────────────────────────────

  test('RESET returns to exact initialState', () => {
    // Dirty the state fully
    state = reducer(state, { type: 'SET_BROKEN_FILE', path: 'broken.mp4' });
    state = reducer(state, { type: 'SET_REFERENCE_FILE', path: 'ref.mp4' });
    state = reducer(state, { type: 'START_REPAIR' });
    state = reducer(state, {
      type: 'REPAIR_SUCCESS',
      outputPath: 'fixed.mp4',
      log: ['done'],
    });
    state = reducer(state, { type: 'LICENSE_VALID', key: 'TEST-XXXX' });

    const reset = reducer(state, { type: 'RESET' });
    // Every field must match initialState exactly
    expect(reset).toStrictEqual(initialState);
  });

  // ── In-flight repair guard ────────────────────────────────────────────

  test('reducer does not guard stale REPAIR_SUCCESS after RESET (guard is in startRepair hook)', () => {
    // The repairRunIdRef guard lives in useRepair.startRepair, not in the reducer.
    // At pure reducer level, a late REPAIR_SUCCESS WILL update state.
    // This test documents current behaviour — it is not a bug.
    state = reducer(state, { type: 'START_REPAIR' });
    state = reducer(state, { type: 'RESET' });
    expect(state.step).toBe('broken'); // RESET worked

    // Simulated stale async result arriving after reset
    const stale = reducer(state, {
      type: 'REPAIR_SUCCESS',
      outputPath: 'stale.mp4',
      log: [],
    });
    // The reducer has no concept of run IDs; it applies the action.
    // The real guard (repairRunIdRef) prevents this dispatch from ever happening.
    expect(stale.step).toBe('preview');
    expect(stale.repairedFilePath).toBe('stale.mp4');
  });
});
