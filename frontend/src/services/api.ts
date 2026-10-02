import type {
  CaseRecord,
  ReconstructionResult,
  SegmentationResult,
  ExperimentRecord,
  ChatMessage,
  ReportData,
} from '../types';

export const DEMO_CASES: CaseRecord[] = [
  {
    id: 'BRATS-2020-042',
    label: 'High-Grade Glioma (HGG) — Right Temporal',
    modality: 'T1ce + FLAIR (2D Axial Slice #78)',
    source: 'BraTS2020',
    date: '2026-09-28',
    created_at: '2026-09-28T10:30:00Z',
    status: 'done',
  },
  {
    id: 'BRATS-2020-108',
    label: 'Glioblastoma Multiforme — Left Parietal',
    modality: 'FLAIR + T2 (2D Axial Slice #92)',
    source: 'BraTS2020',
    date: '2026-09-28',
    created_at: '2026-09-28T10:30:00Z',
    status: 'done',
  },
  {
    id: 'BRATS-2020-215',
    label: 'Low-Grade Glioma (LGG) — Frontal Cortex',
    modality: 'T1ce (2D Axial Slice #64)',
    source: 'BraTS2020',
    date: '2026-09-27',
    created_at: '2026-09-27T14:15:00Z',
    status: 'reconstructing',
  },
  {
    id: 'KVASIR-CAP-019',
    label: 'Cross-Domain Structural Consistency Evaluation',
    modality: '2D Frame Validation',
    source: 'Kvasir-Capsule',
    date: '2026-09-26',
    created_at: '2026-09-26T09:00:00Z',
    status: 'done',
  },
];

export const DEMO_RECONSTRUCTION: ReconstructionResult = {
  case_id: 'BRATS-2020-042',
  mse: 0.0011,
  ssim: 0.5732,
  psnr: 29.6911,
  model_version: 'Conditional-DDPM-v1.0 (PyTorch T4)',
  preprocessing_version: 'v2.1.0 — BraTS2020 Z-Score Normalization',
  timesteps: 1000,
  noise_steps: [1000, 800, 600, 400, 200, 100, 50, 10, 1],
  timestamp: new Date().toISOString(),
};

export const DEMO_SEGMENTATION_B: SegmentationResult = {
  case_id: 'BRATS-2020-042',
  input_source: 'reconstructed',
  experiment: 'B',
  dice_wt: 0.8683,
  dice_tc: 0.8093,
  dice_et: 0.7837,
  mean_dice: 0.8204,
  wt_pixels: 4820,
  tc_pixels: 2390,
  et_pixels: 1140,
  model_version: 'iPixMatch-TeacherStudent-BraTS2020',
  timestamp: new Date().toISOString(),
};

export const EXPERIMENT_RESULTS: ExperimentRecord[] = [
  {
    experiment: 'A',
    label: 'Exp A — Baseline (iPixMatch)',
    model: 'iPixMatch (Semi-Supervised)',
    input: 'Original Degraded MRI',
    dice_wt: 0.8234,
    dice_tc: 0.7891,
    dice_et: 0.7412,
    mean_dice: 0.7846,
  },
  {
    experiment: 'B',
    label: 'Exp B — Integrated DDPM → iPixMatch',
    model: 'Conditional DDPM + iPixMatch',
    input: 'DDPM Reconstructed',
    dice_wt: 0.8683,
    dice_tc: 0.8093,
    dice_et: 0.7837,
    mean_dice: 0.8204,
    mse: 0.0011,
    ssim: 0.5732,
    psnr: 29.6911,
  },
  {
    experiment: 'A2',
    label: 'Exp A2 — Baseline (UniMatch)',
    model: 'UniMatch (Semi-Supervised)',
    input: 'Original Degraded MRI',
    dice_wt: 0.8196,
    dice_tc: 0.7843,
    dice_et: 0.7381,
    mean_dice: 0.7807,
  },
  {
    experiment: 'B2',
    label: 'Exp B2 — Integrated DDPM → UniMatch',
    model: 'Conditional DDPM + UniMatch',
    input: 'DDPM Reconstructed',
    dice_wt: 0.8647,
    dice_tc: 0.8042,
    dice_et: 0.7861,
    mean_dice: 0.8183,
    mse: 0.0011,
    ssim: 0.5732,
    psnr: 29.6911,
  },
  {
    experiment: 'C',
    label: 'Exp C — Fast DDPM Ablation (T=250)',
    model: 'cDDPM (250-step) + iPixMatch',
    input: 'DDPM Reconstructed',
    dice_wt: 0.8512,
    dice_tc: 0.7988,
    dice_et: 0.7695,
    mean_dice: 0.8065,
    mse: 0.0016,
    ssim: 0.5510,
    psnr: 28.4200,
  },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function apiReconstruct(caseId: string): Promise<ReconstructionResult> {
  await delay(650);
  return {
    ...DEMO_RECONSTRUCTION,
    case_id: caseId,
    timestamp: new Date().toISOString(),
  };
}

export async function apiSegment(
  caseId: string,
  inputSource: 'original' | 'reconstructed' = 'reconstructed'
): Promise<SegmentationResult> {
  await delay(600);
  if (inputSource === 'original') {
    return {
      case_id: caseId,
      input_source: 'original',
      experiment: 'A',
      dice_wt: 0.8234,
      dice_tc: 0.7891,
      dice_et: 0.7412,
      mean_dice: 0.7846,
      wt_pixels: 4510,
      tc_pixels: 2180,
      et_pixels: 995,
      model_version: 'iPixMatch-TeacherStudent-BraTS2020',
      timestamp: new Date().toISOString(),
    };
  }
  return {
    ...DEMO_SEGMENTATION_B,
    case_id: caseId,
    timestamp: new Date().toISOString(),
  };
}

export async function apiCreateReport(caseId: string): Promise<ReportData> {
  await delay(500);
  return {
    case_id: caseId,
    generated_at: new Date().toISOString(),
    disclaimer:
      'AI-generated segmentation / model-predicted region — Research & Decision-Support Prototype Only. Not an autonomous diagnostic system; outputs require qualified clinical interpretation.',
    model_versions: {
      ddpm: 'Conditional-DDPM-v1.0 (MSE 0.0011 | PSNR 29.69 dB)',
      segmentation: 'iPixMatch-BraTS2020 (Mean Dice 0.8204)',
      preprocessing: 'v2.1.0 — BraTS2020 2D Axial Normalization',
    },
    reconstruction: {
      ...DEMO_RECONSTRUCTION,
      case_id: caseId,
    },
    segmentation: {
      ...DEMO_SEGMENTATION_B,
      case_id: caseId,
    },
  };
}

export async function apiChat(
  promptOrHistory: string | ChatMessage[],
  maybePrompt?: string | ChatMessage[]
): Promise<ChatMessage & { reply: string; sources: string[] }> {
  await delay(550);
  const raw =
    typeof promptOrHistory === 'string'
      ? promptOrHistory
      : typeof maybePrompt === 'string'
      ? maybePrompt
      : promptOrHistory[promptOrHistory.length - 1]?.content ?? '';
  const q = raw.toLowerCase();
  let content = '';
  let sources = ['BraTS2020 Challenge Papers', 'iPixMatch Capstone Results'];

  if (q.includes('wt') || q.includes('tc') || q.includes('et') || q.includes('region')) {
    content =
      "**BraTS2020 Tumor Sub-Regions:**\n- **Whole Tumor (WT — Yellow `#FACC15`):** Encompasses all abnormal hyper-intense signal on T2/FLAIR, including peritumoral edema, non-enhancing solid core, and enhancing rim (`Dice: 0.8683`).\n- **Tumor Core (TC — Blue `#3B82F6`):** Represents the bulk resectable lesion comprising the necrotic/non-enhancing core plus the enhancing tumor (`Dice: 0.8093`).\n- **Enhancing Tumor (ET — Red `#EF4444`):** Captures active blood-brain barrier breakdown visible on T1ce contrast-enhanced MRI (`Dice: 0.7837`).";
    sources = ['BraTS2020 Challenge Papers', 'BraTS2020 Evaluation Metrics'];
  } else if (q.includes('ipixmatch') || q.includes('unimatch') || q.includes('compare')) {
    content =
      "**iPixMatch vs. UniMatch on BraTS2020:**\n- **iPixMatch** achieves a Best Mean Dice of **0.8204** (`WT: 0.8683`, `TC: 0.8093`, `ET: 0.7837`) by enforcing pixel-aware teacher-student consistency regularization at tumor boundaries.\n- **UniMatch** achieves a Best Mean Dice of **0.8183** (`WT: 0.8647`, `TC: 0.8042`, `ET: 0.7861`) using dual-stream weak-to-strong feature perturbation.\n- Both models operate in an annotation-efficient semi-supervised regime.";
    sources = ['Yang et al. 2023 (UniMatch)', 'iPixMatch Capstone Results'];
  } else if (q.includes('ddpm') || q.includes('experiment b') || q.includes('improve')) {
    content =
      "**Impact of Conditional DDPM Reconstruction on Downstream Segmentation (Experiment A vs. B):**\n- **Reconstruction Quality:** Conditional DDPM restores motion-degraded MRI slices to **MSE `0.0011`**, **SSIM `0.5732`**, and **PSNR `29.6911 dB`**.\n- **Downstream Segmentation Gain:** Feeding DDPM-reconstructed MRI into iPixMatch (**Experiment B**) lifts Mean Dice from **0.7846** (Baseline Exp A) to **0.8204** (**+4.56% relative gain**), proving that diffusion restoration sharpens tumor boundary delineation rather than merely improving visual appearance.";
    sources = ['Ho et al. 2020 (DDPM)', 'iPixMatch Capstone Results'];
  } else {
    content =
      "Based on the approved **NeuroAI Capstone Documentation**, the integrated workflow processes 2D MRI slices through **Conditional DDPM reconstruction** (`MSE 0.0011`, `SSIM 0.5732`, `PSNR 29.6911 dB`) followed by **UniMatch (`0.8183` Dice)** and **iPixMatch (`0.8204` Dice)** segmentation.\n\n- All outputs are strictly labeled as **AI-generated research decision-support predictions** and require qualified clinical interpretation.";
  }

  return {
    role: 'assistant',
    content,
    reply: content,
    sources,
    timestamp: new Date().toISOString(),
  };
}