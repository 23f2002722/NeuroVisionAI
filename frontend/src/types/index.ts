export interface CaseRecord {
  id: string;
  label: string;
  modality: 'T1' | 'T1ce' | 'T2' | 'FLAIR' | string;
  source: string;
  date: string;
  status: 'done' | 'reconstructing' | 'segmenting' | 'pending' | 'error' | string;
  created_at: string;
}

export interface ReconstructionResult {
  case_id: string;
  mse: number;
  ssim: number;
  psnr: number;
  model_version: string;
  preprocessing_version?: string;
  timesteps?: number;
  noise_steps: number[];
  timestamp: string;
}

export interface SegmentationResult {
  case_id: string;
  input_source: 'original' | 'reconstructed';
  experiment: 'A' | 'B' | 'C' | string;
  dice_wt: number;
  dice_tc: number;
  dice_et: number;
  mean_dice: number;
  wt_pixels: number;
  tc_pixels: number;
  et_pixels: number;
  model_version: string;
  timestamp: string;
}

export interface ExperimentRecord {
  experiment: string;
  label: string;
  model: string;
  input: string;
  dice_wt: number;
  dice_tc: number;
  dice_et: number;
  mean_dice: number;
  mse?: number;
  ssim?: number;
  psnr?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: string;
}

export interface ReportData {
  case_id: string;
  generated_at: string;
  disclaimer: string;
  model_versions: {
    ddpm: string;
    segmentation: string;
    preprocessing?: string;
  };
  reconstruction?: ReconstructionResult;
  segmentation?: SegmentationResult;
  summary?: string;
}