import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { TauriRepairResult } from '../types';

export async function pickBrokenFile(): Promise<string | null> {
  const result = await open({
    multiple: false,
    filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'm4v'] }],
    title: 'Select your corrupted recording',
  });
  return typeof result === 'string' ? result : null;
}

export async function pickReferenceFile(): Promise<string | null> {
  const result = await open({
    multiple: false,
    filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'm4v'] }],
    title: 'Select a healthy reference recording (same OBS settings)',
  });
  return typeof result === 'string' ? result : null;
}

export async function pickSaveLocation(suggestedName: string): Promise<string | null> {
  const result = await save({
    defaultPath: suggestedName,
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    title: 'Save repaired video',
  });
  return result ?? null;
}

export async function repairNoReference(brokenPath: string): Promise<TauriRepairResult> {
  return invoke<TauriRepairResult>('repair_no_reference', { brokenPath });
}

export async function repairWithReference(
  brokenPath: string,
  referencePath: string,
): Promise<TauriRepairResult> {
  return invoke<TauriRepairResult>('repair_with_reference', { brokenPath, referencePath });
}

export async function validateLicense(licenseKey: string): Promise<boolean> {
  return invoke<boolean>('validate_license', { licenseKey });
}

export async function openFileInPlayer(path: string): Promise<void> {
  return invoke('open_file_in_player', { path });
}

export async function saveRepairedFile(sourcePath: string, destinationPath: string): Promise<void> {
  return invoke('save_repaired_file', { sourcePath, destinationPath });
}
