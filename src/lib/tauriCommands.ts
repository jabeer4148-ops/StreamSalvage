import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { TauriRepairResult } from '../types';

export async function pickBrokenFile(): Promise<string | null> {
  try {
    const result = await open({
      multiple: false,
      filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'm4v'] }],
      title: 'Select your corrupted recording',
    });
    return typeof result === 'string' ? result : null;
  } catch (err) {
    console.error('dialog open failed:', err);
    return null;
  }
}

export async function pickReferenceFile(): Promise<string | null> {
  try {
    const result = await open({
      multiple: false,
      filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'm4v'] }],
      title: 'Select a healthy reference recording (same OBS settings)',
    });
    return typeof result === 'string' ? result : null;
  } catch (err) {
    console.error('dialog open failed:', err);
    return null;
  }
}

export async function pickSaveLocation(suggestedName: string): Promise<string | null> {
  try {
    const result = await save({
      defaultPath: suggestedName,
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
      title: 'Save repaired video',
    });
    return result ?? null;
  } catch (err) {
    console.error('dialog save failed:', err);
    return null;
  }
}

export async function repairNoReference(brokenPath: string): Promise<TauriRepairResult> {
  try {
    return await invoke<TauriRepairResult>('repair_no_reference', { brokenPath });
  } catch (err) {
    console.error('repair_no_reference failed:', err);
    return {
      success: false,
      output_path: null,
      log: [String(err)],
      error: String(err),
    };
  }
}

export async function repairWithReference(
  brokenPath: string,
  referencePath: string,
): Promise<TauriRepairResult> {
  try {
    return await invoke<TauriRepairResult>('repair_with_reference', { brokenPath, referencePath });
  } catch (err) {
    console.error('repair_with_reference failed:', err);
    return {
      success: false,
      output_path: null,
      log: [String(err)],
      error: String(err),
    };
  }
}

export async function validateLicense(licenseKey: string): Promise<boolean> {
  try {
    return await invoke<boolean>('validate_license', { licenseKey });
  } catch (err) {
    console.error('validate_license failed:', err);
    return false;
  }
}

export async function openFileInPlayer(path: string): Promise<void> {
  try {
    await invoke('open_file_in_player', { path });
  } catch (err) {
    console.error('open_file_in_player failed:', err);
  }
}

export async function saveRepairedFile(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await invoke('save_repaired_file', { sourcePath, destinationPath });
  } catch (err) {
    console.error('save_repaired_file failed:', err);
  }
}
