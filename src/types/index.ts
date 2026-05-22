export type AppStep = 'broken' | 'reference' | 'repairing' | 'preview' | 'export';

export interface RepairState {
  step: AppStep;
  brokenFilePath: string | null;
  referenceFilePath: string | null;
  hasReferenceFile: boolean;
  repairProgress: number;
  repairLog: string[];
  repairedFilePath: string | null;
  repairSuccess: boolean;
  licenseKey: string | null;
  licenseValid: boolean;
}

export interface TauriRepairResult {
  success: boolean;
  output_path: string | null;
  log: string[];
  error: string | null;
}
