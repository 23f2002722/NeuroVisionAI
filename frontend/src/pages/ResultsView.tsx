// ============================================================
// ResultsView — Synchronized Pipeline Results Page
// 3-Panel MRI viewer: Degraded | DDPM Reconstructed | Segmented
// ============================================================

import React, { useState } from 'react';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Sliders,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';
import MRICanvas from '../components/MRICanvas';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { DEMO_RECONSTRUCTION, DEMO_SEGMENTATION_B } from '../services/api';

// ── Pipeline steps ────────────────────────────────────────
interface PipelineStep {
  id: string;
  label: string;
  sublabel: string;
  status: 'completed' | 'active' | 'pending';
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'input',
    label: 'Degraded MRI Input',
    sublabel: 'T1ce / T2 / FLAIR',
    status: 'completed',
    color: '#94A3B8',
  },
  {
    id: 'detection',
    label: 'Motion Artifact Detection',
    sublabel: 'k-space analysis',
    status: 'completed',
    color: 'var(--tc-color)',
  },
  {
    id: 'denoising',
    label: 'DDPM Denoising',
    sublabel: 'T=1000 → 1',
    status: 'completed',
    color: '#3B82F6',
  },
  {
    id: 'reconstruction',
    label: 'Reconstruction',
    sublabel: 'PSNR 29.69 dB',
    status: 'completed',
    color: '#1F7A58',
  },
  {
    id: 'segmentation',
    label: 'Semi-Supervised Segmentation',
    sublabel: 'iPixMatch / UniMatch',
    status: 'active',
    color: 'var(--et-color)',
  },
  {
    id: 'output',
    label: 'Multi-Class Mask Output',
    sublabel: 'WT / TC / ET',
    status: 'pending',
    color: '#F59E0B',
  },
];

// ── Metrics comparison data ───────────────────────────────
const METRICS_TABLE = [
  {
    metric: 'MSE',
    unit: '(↓ better)',
    original: '0.00312',
    reconstructed: '0.00110',
    improvement: '−64.7%',
    positive: true,
  },
  {
    metric: 'PSNR',
    unit: '(↑ better)',
    original: '25.06 dB',
    reconstructed: '29.69 dB',
    improvement: '+18.5%',
    positive: true,
  },
  {
    metric: 'SSIM',
    unit: '(↑ better)',
    original: '0.4218',
    reconstructed: '0.5732',
    improvement: '+35.9%',
    positive: true,
  },
];

// ── Main Component ────────────────────────────────────────
const ResultsView: React.FC = () => {
  const [sliceIndex, setSliceIndex] = useState(77);
  const [zoom, setZoom] = useState(1.0);
  const [showWT, setShowWT] = useState(true);
  const [showTC, setShowTC] = useState(true);
  const [showET, setShowET] = useState(true);
  const [maskOpacity, setMaskOpacity] = useState(0.72);
  const [contrastLevel, setContrastLevel] = useState(50);
  const [brightnessLevel, setBrightnessLevel] = useState(50);

  const TOTAL_SLICES = 154;
  const rec = DEMO_RECONSTRUCTION;
  const seg = DEMO_SEGMENTATION_B;

  // Use sliceIndex as a seed offset so canvases evolve with navigation
  const seedOffset = Math.floor(sliceIndex / 10);

  const handleSliceChange = (delta: number) => {
    setSliceIndex((s) => Math.max(0, Math.min(TOTAL_SLICES, s + delta)));
  };

  return (
    <div className="main-content page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top disclaimer */}
      <DisclaimerBanner />

      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 32px 32px', width: '100%' }}>

        {/* ── Page Header ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#80E7B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 1px rgba(128, 231, 184, 0.28), 0 4px 20px rgba(128, 231, 184, 0.28)',
                }}
              >
                <Brain size={20} color="#fff" />
              </div>
              <h1
                className="section-title"
                style={{ margin: 0, fontSize: 26, letterSpacing: '-0.025em', fontFamily: 'var(--font-serif)' }}
              >
                <span className="gradient-text-ai">Synchronized</span>{' '}
                Pipeline Results
              </h1>
            </div>
            <p className="section-subtitle" style={{ margin: 0 }}>
              Case&nbsp;
              <span className="font-mono text-cyan">{rec.case_id}</span>
              &nbsp;·&nbsp;BraTS2020 · T1ce/T2/FLAIR · Model&nbsp;
              <span className="font-mono text-violet">{rec.model_version}</span>
            </p>
          </div>

          {/* Slice navigator */}
          <div
            className="glass-card"
            style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <button
              className="btn-neuro btn-outline-glass"
              style={{ padding: '6px 10px', minWidth: 0 }}
              onClick={() => handleSliceChange(-1)}
              disabled={sliceIndex <= 0}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ textAlign: 'center', minWidth: 110 }}>
              <div
                className="font-mono"
                style={{ fontSize: 15, fontWeight: 700, color: 'var(--cyan-light)', letterSpacing: '0.04em' }}
              >
                Slice {sliceIndex}/{TOTAL_SLICES}
              </div>
              <input
                type="range"
                min={0}
                max={TOTAL_SLICES}
                value={sliceIndex}
                onChange={(e) => setSliceIndex(Number(e.target.value))}
                style={{ width: 110, marginTop: 4 }}
              />
            </div>

            <button
              className="btn-neuro btn-outline-glass"
              style={{ padding: '6px 10px', minWidth: 0 }}
              onClick={() => handleSliceChange(1)}
              disabled={sliceIndex >= TOTAL_SLICES}
            >
              <ChevronRight size={16} />
            </button>

            {/* Zoom */}
            <div
              style={{
                borderLeft: '1px solid var(--border-subtle)',
                paddingLeft: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Zoom
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn-neuro btn-outline-glass"
                  style={{ padding: '3px 8px', minWidth: 0, fontSize: 14 }}
                  onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))}
                >
                  −
                </button>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--forest)', minWidth: 36, textAlign: 'center' }}>
                  {zoom.toFixed(1)}×
                </span>
                <button
                  className="btn-neuro btn-outline-glass"
                  style={{ padding: '3px 8px', minWidth: 0, fontSize: 14 }}
                  onClick={() => setZoom((z) => Math.min(3.0, parseFloat((z + 0.1).toFixed(1))))}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Three Panels ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
            alignItems: 'stretch',
          }}
        >
          {/* Panel A — Original Degraded MRI */}
          <div
            className="glass-card"
            style={{
              flex: 1,
              padding: 0,
              overflow: 'hidden',
              border: '1px solid rgba(148,163,184,0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(148,163,184,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.01em' }}>
                  A &nbsp;· &nbsp;Original Degraded MRI
                </div>
                <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 2 }}>
                  Motion-corrupted input · k-space artifact
                </div>
              </div>
              <span className="badge-neuro badge-gray">DEGRADED</span>
            </div>

            {/* Canvas */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                background: 'var(--ivory)',
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: 'transform 200ms ease',
                  filter: `contrast(${0.7 + contrastLevel / 100}) brightness(${0.6 + brightnessLevel / 100})`,
                }}
              >
                <MRICanvas
                  mode="degraded"
                  width={260}
                  height={260}
                  seed={42 + seedOffset}
                  showWT={false}
                  showTC={false}
                  showET={false}
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>

            {/* Panel footer metrics */}
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--cream)',
                display: 'flex',
                gap: 16,
              }}
            >
              <div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: '#94A3B8' }}>
                  0.00312
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  MSE (input)
                </div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: '#94A3B8' }}>
                  25.06 dB
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  PSNR (input)
                </div>
              </div>
            </div>
          </div>

          {/* Panel B — DDPM Reconstructed */}
          <div
            className="glass-card glow-cyan"
            style={{
              flex: 1,
              padding: 0,
              overflow: 'hidden',
              border: '1px solid var(--mint-border)',
              boxShadow: '0 0 0 1px rgba(128,231,184,0.2), var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(128,231,184,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(128,231,184,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan-light)', letterSpacing: '0.01em' }}>
                  B &nbsp;· &nbsp;DDPM Reconstructed MRI
                </div>
                <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 2 }}>
                  Conditional DDPM · T=1000→1 · {rec.noise_steps.length} checkpoints
                </div>
              </div>
              <span className="badge-neuro badge-cyan">DDPM RECON</span>
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                background: 'var(--ivory)',
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: 'transform 200ms ease',
                  filter: `contrast(${0.7 + contrastLevel / 100}) brightness(${0.6 + brightnessLevel / 100})`,
                }}
              >
                <MRICanvas
                  mode="reconstructed"
                  width={260}
                  height={260}
                  seed={42 + seedOffset}
                  showWT={false}
                  showTC={false}
                  showET={false}
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid rgba(128,231,184,0.15)',
                background: 'var(--cream)',
                display: 'flex',
                gap: 16,
              }}
            >
              <div>
                <div className="font-mono gradient-text-ddpm" style={{ fontSize: 18, fontWeight: 700 }}>
                  {rec.mse.toFixed(5)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  MSE ↓
                </div>
              </div>
              <div>
                <div className="font-mono gradient-text-ddpm" style={{ fontSize: 18, fontWeight: 700 }}>
                  {rec.psnr.toFixed(2)} dB
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  PSNR ↑
                </div>
              </div>
              <div>
                <div className="font-mono gradient-text-ddpm" style={{ fontSize: 18, fontWeight: 700 }}>
                  {rec.ssim.toFixed(4)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  SSIM ↑
                </div>
              </div>
            </div>
          </div>

          {/* Panel C — Segmented Overlay */}
          <div
            className="glass-card glow-emerald"
            style={{
              flex: 1,
              padding: 0,
              overflow: 'hidden',
              border: '1px solid rgba(45,138,107,0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(45,138,107,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(45,138,107,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-color)', letterSpacing: '0.01em' }}>
                  C &nbsp;· &nbsp;Segmented Overlay (WT/TC/ET)
                </div>
                <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 2 }}>
                  iPixMatch semi-supervised · Exp B
                </div>
              </div>
              <span className="badge-neuro badge-emerald">SEG MASK</span>
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                background: 'var(--ivory)',
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: 'transform 200ms ease',
                  filter: `contrast(${0.7 + contrastLevel / 100}) brightness(${0.6 + brightnessLevel / 100})`,
                }}
              >
                <MRICanvas
                  mode="segmented"
                  width={260}
                  height={260}
                  imageSrc="/images/mri-segmentation-overlay.png"
                  seed={42 + seedOffset}
                  showWT={showWT}
                  showTC={showTC}
                  showET={showET}
                  maskOpacity={maskOpacity}
                  style={{ borderRadius: 8 }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid rgba(45,138,107,0.15)',
                background: 'var(--cream)',
                display: 'flex',
                gap: 16,
              }}
            >
              <div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--tc-color)' }}>
                  {seg.dice_wt.toFixed(4)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  Dice WT
                </div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
                  {seg.dice_tc.toFixed(4)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  Dice TC
                </div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--et-color)' }}>
                  {seg.dice_et.toFixed(4)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  Dice ET
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="font-mono gradient-text-seg" style={{ fontSize: 18, fontWeight: 700 }}>
                  {seg.mean_dice.toFixed(4)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  Mean Dice
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pipeline Progress Tracker ────────────────────────── */}
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Sliders size={16} color="var(--violet)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', letterSpacing: '0.01em' }}>
              Pipeline Progress Tracker
            </span>
            <span className="badge-neuro badge-emerald" style={{ marginLeft: 'auto' }}>
              5 / 6 COMPLETE
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 0,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {PIPELINE_STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
                {/* Step node */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 8px',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${step.status === 'pending' ? 'rgba(100,116,139,0.3)' : step.color}`,
                      background:
                        step.status === 'completed'
                          ? `rgba(${step.color === 'var(--tc-color)' ? '128,231,184' : step.color === '#3B82F6' ? '59,130,246' : step.color === '#1F7A58' ? '139,92,246' : '148,163,184'},0.15)`
                          : step.status === 'active'
                          ? `rgba(128,231,184,0.18)`
                          : 'rgba(100,116,139,0.08)',
                      boxShadow:
                        step.status === 'active'
                          ? `0 0 0 3px rgba(128,231,184,0.2), 0 0 16px rgba(128,231,184,0.2)`
                          : step.status === 'completed'
                          ? `var(--shadow-sm)`
                          : 'none',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                    }}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle size={18} color={step.color} />
                    ) : step.status === 'active' ? (
                      <div className="spinner" style={{ borderTopColor: 'var(--et-color)', width: 18, height: 18 }} />
                    ) : (
                      <Circle size={18} color="rgba(100,116,139,0.5)" />
                    )}
                  </div>

                  {/* Labels */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          step.status === 'completed'
                            ? step.color
                            : step.status === 'active'
                            ? 'var(--et-color)'
                            : 'var(--sage-light)',
                        letterSpacing: '0.01em',
                        lineHeight: 1.3,
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--sage-light)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: 2,
                      }}
                    >
                      {step.sublabel}
                    </div>
                    {/* Status chip */}
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          background:
                            step.status === 'completed'
                              ? 'rgba(128,231,184,0.12)'
                              : step.status === 'active'
                              ? 'rgba(128,231,184,0.2)'
                              : 'rgba(100,116,139,0.1)',
                          color:
                            step.status === 'completed'
                              ? 'var(--tc-color)'
                              : step.status === 'active'
                              ? 'var(--et-color)'
                              : 'var(--sage-light)',
                          border: `1px solid ${
                            step.status === 'completed'
                              ? 'rgba(128,231,184,0.25)'
                              : step.status === 'active'
                              ? 'rgba(128,231,184,0.4)'
                              : 'rgba(100,116,139,0.2)'
                          }`,
                        }}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow connector */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: 0,
                      paddingBottom: 40,
                      color: PIPELINE_STEPS[i + 1].status === 'pending' ? 'rgba(100,116,139,0.3)' : 'rgba(128,231,184,0.5)',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowRight size={14} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div className="progress-neuro">
              <div className="progress-neuro-bar" style={{ width: `${(5 / 6) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--sage-light)', fontFamily: 'var(--font-mono)' }}>
                Pipeline progress
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--tc-color)' }}>
                83.3% complete
              </span>
            </div>
          </div>
        </div>

        {/* ── Controls Row ─────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '18px 24px', marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Sliders size={15} color="var(--tc-color)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
              Viewer Controls
            </span>
            {/* Model version badge */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <span className="badge-neuro badge-cyan">
                {rec.model_version}
              </span>
              <span className="badge-neuro badge-emerald">
                {seg.model_version}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* Contrast slider */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}>
                  Contrast
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--tc-color)' }}>
                  {contrastLevel}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={contrastLevel}
                onChange={(e) => setContrastLevel(Number(e.target.value))}
              />
            </div>

            {/* Brightness slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}>
                  Brightness
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--tc-color)' }}>
                  {brightnessLevel}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={brightnessLevel}
                onChange={(e) => setBrightnessLevel(Number(e.target.value))}
              />
            </div>

            {/* Mask opacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}>
                  Mask Opacity
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--tc-color)' }}>
                  {Math.round(maskOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(maskOpacity * 100)}
                onChange={(e) => setMaskOpacity(Number(e.target.value) / 100)}
                style={{ accentColor: 'var(--tc-color)' }}
              />
            </div>

            {/* Mask toggles */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600, marginBottom: 10 }}>
                Overlay Masks
              </div>
              <div className="toggle-group">
                <button
                  className={`toggle-pill ${showWT ? 'active-emerald' : ''}`}
                  onClick={() => setShowWT((v) => !v)}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: showWT ? 'var(--tc-color)' : 'var(--sage-light)',
                      display: 'inline-block',
                    }}
                  />
                  WT
                </button>
                <button
                  className={`toggle-pill ${showTC ? 'active-amber' : ''}`}
                  onClick={() => setShowTC((v) => !v)}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: showTC ? 'var(--amber)' : 'var(--sage-light)',
                      display: 'inline-block',
                    }}
                  />
                  TC
                </button>
                <button
                  className={`toggle-pill ${showET ? 'active-coral' : ''}`}
                  onClick={() => setShowET((v) => !v)}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: showET ? 'var(--et-color)' : 'var(--sage-light)',
                      display: 'inline-block',
                    }}
                  />
                  ET
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Metrics Comparison Table ──────────────────────────── */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--tc-color)',
                boxShadow: '0 0 8px var(--tc-color)',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', fontFamily: 'var(--font-serif)' }}>
              Reconstruction Quality — Metrics Comparison
            </span>
            <span
              className="badge-neuro badge-violet"
              style={{ marginLeft: 'auto' }}
            >
              Exp B · DDPM → Seg
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table-neuro">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>
                    <span style={{ color: '#94A3B8' }}>Original (Degraded)</span>
                  </th>
                  <th>
                    <span className="gradient-text-ddpm">DDPM Reconstructed</span>
                  </th>
                  <th>Improvement</th>
                </tr>
              </thead>
              <tbody>
                {METRICS_TABLE.map((row) => (
                  <tr key={row.metric}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--forest)', fontSize: 13 }}>
                          {row.metric}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--sage-light)', marginTop: 1 }}>
                          {row.unit}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: '#94A3B8', fontSize: 14 }}>
                        {row.original}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono gradient-text-ddpm" style={{ fontSize: 14, fontWeight: 700 }}>
                        {row.reconstructed}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge-neuro"
                        style={{
                          background: row.positive ? 'rgba(128,231,184,0.2)' : 'rgba(217, 107, 82, 0.22)',
                          color: row.positive ? '#1A6B4A' : '#FB7185',
                          border: `1px solid ${row.positive ? 'rgba(128,231,184,0.3)' : 'rgba(251,113,133,0.3)'}`,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {row.improvement}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Mean Dice summary row */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--forest)', fontSize: 13 }}>
                        Mean Dice
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--sage-light)', marginTop: 1 }}>
                        (↑ better) · downstream
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono" style={{ color: '#94A3B8', fontSize: 14 }}>
                      0.7846 (Exp A)
                    </span>
                  </td>
                  <td>
                    <span className="font-mono gradient-text-seg" style={{ fontSize: 14, fontWeight: 700 }}>
                      {seg.mean_dice.toFixed(4)} (Exp B)
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge-neuro"
                      style={{
                        background: 'rgba(128,231,184,0.2)',
                        color: '#1A6B4A',
                        border: '1px solid rgba(128,231,184,0.3)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      +4.56%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sub-region Dice breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 20,
            }}
          >
            {/* WT */}
            <div className="metric-card" style={{ borderColor: 'rgba(45,138,107,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--tc-color)' }} />
                <span style={{ fontSize: 11, color: 'var(--tc-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Whole Tumor (WT)
                </span>
              </div>
              <div className="metric-value" style={{ color: 'var(--tc-color)', fontSize: 26 }}>
                {seg.dice_wt.toFixed(4)}
              </div>
              <div className="metric-sub">{seg.wt_pixels.toLocaleString()} px · Dice WT</div>
            </div>

            {/* TC */}
            <div className="metric-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)' }} />
                <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tumor Core (TC)
                </span>
              </div>
              <div className="metric-value" style={{ color: 'var(--amber)', fontSize: 26 }}>
                {seg.dice_tc.toFixed(4)}
              </div>
              <div className="metric-sub">{seg.tc_pixels.toLocaleString()} px · Dice TC</div>
            </div>

            {/* ET */}
            <div className="metric-card" style={{ borderColor: 'rgba(217, 107, 82, 0.22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--et-color)' }} />
                <span style={{ fontSize: 11, color: 'var(--et-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Enhancing Tumor (ET)
                </span>
              </div>
              <div className="metric-value" style={{ color: 'var(--et-color)', fontSize: 26 }}>
                {seg.dice_et.toFixed(4)}
              </div>
              <div className="metric-sub">{seg.et_pixels.toLocaleString()} px · Dice ET</div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom disclaimer */}
      <DisclaimerBanner className="bottom" />
    </div>
  );
};

export default ResultsView;
