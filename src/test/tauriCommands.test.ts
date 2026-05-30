import { describe, test, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));

import {
  repairNoReference,
  repairWithReference,
  validateLicense,
  openFileInPlayer,
  saveRepairedFile,
  pickBrokenFile,
  pickReferenceFile,
  pickSaveLocation,
} from '../lib/tauriCommands';

const mockInvoke = vi.mocked(invoke);
const mockOpen = vi.mocked(open);
const mockSave = vi.mocked(save);

describe('tauriCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── repairNoReference ─────────────────────────────────────────────────

  test('repairNoReference calls invoke with correct command and param', async () => {
    const mockResult = { success: true, output_path: 'fixed.mp4', log: [], error: null };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await repairNoReference('test.mp4');

    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('repair_no_reference', { brokenPath: 'test.mp4' });
    expect(result).toEqual(mockResult);
  });

  test('repairNoReference returns error result on invoke failure (does not throw)', async () => {
    mockInvoke.mockRejectedValue(new Error('Rust panic'));

    const result = await repairNoReference('test.mp4');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Rust panic');
    expect(result.output_path).toBeNull();
    expect(result.log).toHaveLength(1);
  });

  test('repairNoReference forwards log array from result', async () => {
    const mockResult = {
      success: true,
      output_path: 'out.mp4',
      log: ['Starting...', 'FFmpeg done'],
      error: null,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await repairNoReference('test.mp4');
    expect(result.log).toEqual(['Starting...', 'FFmpeg done']);
  });

  // ── repairWithReference ───────────────────────────────────────────────

  test('repairWithReference calls correct command with both paths', async () => {
    mockInvoke.mockResolvedValue({ success: true, output_path: 'out.mp4', log: [], error: null });

    await repairWithReference('broken.mp4', 'ref.mp4');

    expect(mockInvoke).toHaveBeenCalledWith('repair_with_reference', {
      brokenPath: 'broken.mp4',
      referencePath: 'ref.mp4',
    });
  });

  test('repairWithReference returns safe error result on invoke failure', async () => {
    mockInvoke.mockRejectedValue(new Error('FFmpeg not found'));

    const result = await repairWithReference('broken.mp4', 'ref.mp4');

    expect(result.success).toBe(false);
    expect(result.error).toContain('FFmpeg not found');
  });

  // ── validateLicense ───────────────────────────────────────────────────

  test('validateLicense calls correct command with key', async () => {
    mockInvoke.mockResolvedValue(true);

    const result = await validateLicense('TEST-1234');

    expect(mockInvoke).toHaveBeenCalledWith('validate_license', { licenseKey: 'TEST-1234' });
    expect(result).toBe(true);
  });

  test('validateLicense returns false on invoke failure (does not throw)', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'));

    const result = await validateLicense('SOME-KEY');

    expect(result).toBe(false);
  });

  test('validateLicense returns false when API returns false', async () => {
    mockInvoke.mockResolvedValue(false);

    const result = await validateLicense('INVALID-KEY');

    expect(result).toBe(false);
  });

  // ── openFileInPlayer ──────────────────────────────────────────────────

  test('openFileInPlayer calls correct command with path', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await openFileInPlayer('video.mp4');

    expect(mockInvoke).toHaveBeenCalledWith('open_file_in_player', { path: 'video.mp4' });
  });

  test('openFileInPlayer swallows errors (does not rethrow)', async () => {
    mockInvoke.mockRejectedValue(new Error('Player not found'));

    // Should not throw
    await expect(openFileInPlayer('video.mp4')).resolves.toBeUndefined();
  });

  // ── saveRepairedFile ──────────────────────────────────────────────────

  test('saveRepairedFile calls correct command with both paths', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await saveRepairedFile('source.mp4', 'dest.mp4');

    expect(mockInvoke).toHaveBeenCalledWith('save_repaired_file', {
      sourcePath: 'source.mp4',
      destinationPath: 'dest.mp4',
    });
  });

  test('saveRepairedFile rethrows on failure (unlike other commands)', async () => {
    mockInvoke.mockRejectedValue(new Error('Copy failed: permission denied'));

    await expect(saveRepairedFile('source.mp4', 'dest.mp4')).rejects.toThrow(
      'Copy failed: permission denied',
    );
  });

  // ── Dialog wrappers ───────────────────────────────────────────────────

  test('pickBrokenFile returns path string when user selects file', async () => {
    mockOpen.mockResolvedValue('C:\\recordings\\stream.mp4');

    const result = await pickBrokenFile();

    expect(result).toBe('C:\\recordings\\stream.mp4');
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ extensions: expect.arrayContaining(['mp4', 'mov', 'm4v']) }),
        ]),
      }),
    );
  });

  test('pickBrokenFile returns null when user cancels dialog', async () => {
    mockOpen.mockResolvedValue(null);

    const result = await pickBrokenFile();

    expect(result).toBeNull();
  });

  test('pickReferenceFile returns null when user cancels', async () => {
    mockOpen.mockResolvedValue(null);
    expect(await pickReferenceFile()).toBeNull();
  });

  test('pickSaveLocation returns null when user cancels', async () => {
    mockSave.mockResolvedValue(null);
    expect(await pickSaveLocation('repaired_recording.mp4')).toBeNull();
  });

  test('pickSaveLocation passes suggested filename to dialog', async () => {
    mockSave.mockResolvedValue('/dest/repaired.mp4');

    await pickSaveLocation('repaired_recording.mp4');

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPath: 'repaired_recording.mp4' }),
    );
  });

  test('pickBrokenFile returns null on dialog exception (does not throw)', async () => {
    mockOpen.mockRejectedValue(new Error('dialog crashed'));
    const result = await pickBrokenFile();
    expect(result).toBeNull();
  });

  test('pickReferenceFile returns null on dialog exception (does not throw)', async () => {
    mockOpen.mockRejectedValue(new Error('dialog crashed'));
    const result = await pickReferenceFile();
    expect(result).toBeNull();
  });

  test('pickSaveLocation returns null on dialog exception (does not throw)', async () => {
    mockSave.mockRejectedValue(new Error('dialog crashed'));
    const result = await pickSaveLocation('file.mp4');
    expect(result).toBeNull();
  });
});
