export type AppStep = 'broken' | 'reference' | 'repairing' | 'preview' | 'export';

export interface RepairState {
  step: AppStep;
  brokenFilePath: string | null;
  referenceFilePath: string | null;
  hasReferenceFile: boolean;
  skippedReference: boolean;
  repairProgress: number;
  repairLog: string[];
  repairedFilePath: string | null;
  repairSuccess: boolean;
  repairError: string | null;
  licenseKey: string | null;
  licenseValid: boolean;
  showExport: boolean;
}

export interface TauriRepairResult {
  success: boolean;
  output_path: string | null;
  log: string[];
  error: string | null;
}
