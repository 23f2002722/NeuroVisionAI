// ============================================================
// ReconstructionWorkspace.tsx — Diffusion MRI Reconstruction Studio
// Conditional DDPM reconstruction workflow page
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Upload,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  ArrowRight,
  FileText,
  Layers,
} from 'lucide-react';
import WipeSlider from '../components/WipeSlider';
import MRICanvas from '../components/MRICanvas';
import MetricCard from '../components/MetricCard';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { apiReconstruct, DEMO_CASES, DEMO_RECONSTRUCTION } from '../services/api';
import type { ReconstructionResult } from '../types';

// ── Constants ──────────────────────────────────────────────
const NOISE_STEPS = [1000, 800, 600, 400, 200, 100, 50, 10, 1];

const PIPELINE_STEPS = [
  { id: 1, label: 'Upload',       sub: 'MRI ingestion' },
  { id: 2, label: 'Preprocess',   sub: 'Normalize & pad' },
  { id: 3, label: 'Denoise',      sub: 'T=1000 → 1' },
  { id: 4, label: 'Reconstruct',  sub: 'DDPM sampling' },
  { id: 5, label: 'Evaluate',     sub: 'MSE / SSIM / PSNR' },
];

// ── Component ──────────────────────────────────────────────
const ReconstructionWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<string>(DEMO_CASES[0].id);
  const [selectedNextModel, setSelectedNextModel] = useState<'ipixmatch' | 'unimatch'>('ipixmatch');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReconstructionResult | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeNoiseStep, setActiveNoiseStep] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCaseRecord = DEMO_CASES.find(c => c.id === selectedCase) ?? DEMO_CASES[0];

  // ── Handlers ───────────────────────────────────────────
  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveNoiseStep(null);

    // Animate noise steps sequentially before the API resolves
    const stepDelay = 2500 / NOISE_STEPS.length;
    NOISE_STEPS.forEach((step, i) => {
      setTimeout(() => setActiveNoiseStep(step), i * stepDelay);
    });

    try {
      const res = await apiReconstruct(selectedCase);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconstruction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseSelect = (id: string) => {
    setSelectedCase(id);
    setDropdownOpen(false);
    setResult(null);
    setActiveNoiseStep(null);
    setError(null);
  };

  // Derive pipeline step progress
  const pipelineStep = isLoading
    ? (activeNoiseStep !== null && activeNoiseStep <= 100 ? 4 : activeNoiseStep !== null ? 3 : 2)
    : result
    ? 5
    : 0;

  const ts = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="main-content page-enter" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 32px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Disclaimer ──────────────────────────────────── */}
      <DisclaimerBanner position="top" />

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{
        padding: '28px 32px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--grad-ddpm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0,
            }}>
              <Zap size={22} color="#fff" />
            </div>
            <div>
              <h1
                className="gradient-text-ddpm"
                style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', margin: 0, fontFamily: 'var(--font-serif)' }}
              >
                Diffusion MRI Reconstruction Studio
              </h1>
              <p style={{ margin: '2px 0 0', color: 'var(--sage)', fontSize: 13 }}>
                Conditional DDPM · BraTS2020 · Semi-supervised denoising pipeline
              </p>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge-neuro badge-cyan">Conditional-DDPM-v1</span>
            <span className="badge-neuro badge-gray" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {ts}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '28px 32px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ══════════════════════════════════════════════
            LEFT COLUMN  (7/12 ≈ 58.3%)
        ══════════════════════════════════════════════ */}
        <div style={{ flex: '0 0 58.33%', maxWidth: '58.33%', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Case Selector ──────────────────────────── */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
                Case Selection
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Dropdown */}
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--bg-input)', border: 'var(--border)',
                    color: 'var(--forest)', fontFamily: 'var(--font-sans)', fontSize: 14,
                    cursor: 'pointer', transition: 'border-color 150ms',
                  }}
                >
                  <span>{selectedCaseRecord.label}</span>
                  <ChevronDown size={16} color="var(--sage)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                    background: 'var(--surface-raised)', border: 'var(--border)',
                    borderRadius: 10, overflow: 'hidden', backdropFilter: 'blur(16px)',
                    boxShadow: 'var(--shadow-md)',
                  }}>
                    {DEMO_CASES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleCaseSelect(c.id)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          background: c.id === selectedCase ? 'rgba(128, 231, 184, 0.35)' : 'transparent',
                          border: 'none', color: c.id === selectedCase ? 'var(--tc-color)' : 'var(--forest)',
                          fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                          transition: 'background 150ms',
                          borderBottom: '1px solid #F3EFE0',
                        }}
                        onMouseEnter={e => { if (c.id !== selectedCase) (e.currentTarget as HTMLElement).style.background = '#F3EFE0'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.id === selectedCase ? 'rgba(128, 231, 184, 0.35)' : 'transparent'; }}
                      >
                        <div style={{ fontWeight: 600 }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 1 }}>
                          {c.modality} · {c.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Case ID chip */}
              <div style={{
                padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mono)', whiteSpace: 'nowrap',
              }}>
                {selectedCase}
              </div>
            </div>
          </div>

          {/* ── Upload MRI ─────────────────────────────── */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
              Upload MRI Volume
            </div>
            <div
              style={{
                border: '2px dashed rgba(128,231,184,0.4)',
                borderRadius: 12, padding: '28px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, cursor: 'default', background: 'rgba(128, 231, 184, 0.35)',
                transition: 'border-color 200ms, background 200ms',
              }}
              onDragOver={e => e.preventDefault()}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(128, 231, 184, 0.35)', border: '1px solid rgba(128,231,184,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={20} color="var(--tc-color)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--forest)', fontSize: 14 }}>
                  Drag &amp; drop NIfTI / DICOM files
                </p>
                <p style={{ margin: '4px 0 0', color: 'var(--sage)', fontSize: 12 }}>
                  .nii · .nii.gz · .dcm · .zip accepted &nbsp;·&nbsp;
                  <span style={{ color: 'var(--tc-color)', fontWeight: 600, cursor: 'pointer' }}>Browse files</span>
                </p>
              </div>
              <span className="badge-neuro badge-cyan" style={{ marginTop: 4 }}>
                DEMO MODE — pre-loaded BraTS2020 volume
              </span>
            </div>
          </div>

          {/* ── Wipe Slider ───────────────────────────── */}
          <div className="glass-card glow-cyan" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
                  Before / After Comparison
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--sage)' }}>
                  Drag the handle to compare degraded input with DDPM reconstruction
                </p>
              </div>
              {/* Heatmap toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setShowHeatmap(h => !h)}
                  style={{
                    width: 36, height: 20, borderRadius: 999,
                    background: showHeatmap ? 'var(--tc-color)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 200ms', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: showHeatmap ? 18 : 3,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#fff', transition: 'left 200ms',
                    boxShadow: 'var(--shadow-md)',
                  }} />
                </div>
                {showHeatmap
                  ? <Eye size={14} color="var(--tc-color)" />
                  : <EyeOff size={14} color="var(--sage-light)" />}
                <span style={{ fontSize: 12, color: showHeatmap ? 'var(--tc-color)' : 'var(--sage-light)', fontWeight: 600 }}>
                  Heatmap
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <WipeSlider
                width={380}
                height={380}
                beforeMode="degraded"
                afterMode="reconstructed"
                seed={parseInt(selectedCase.replace(/\D/g, '').slice(-3)) || 42}
              />
            </div>
          </div>

          {/* ── Noise Schedule ────────────────────────── */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
              Noise Schedule — T Steps
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {NOISE_STEPS.map((step, i) => {
                const isActive = activeNoiseStep !== null && step >= activeNoiseStep;
                const isDone = result !== null;
                const isAnimating = isLoading && isActive;
                const color = isDone ? 'var(--tc-color)' : isAnimating ? 'var(--tc-color)' : '#E2DDD0';

                return (
                  <React.Fragment key={step}>
                    {/* Dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: isDone || isAnimating ? 14 : 10,
                        height: isDone || isAnimating ? 14 : 10,
                        borderRadius: '50%',
                        background: color,
                        border: isAnimating ? '2px solid rgba(128,231,184,0.4)' : '2px solid transparent',
                        boxShadow: isAnimating ? '0 0 10px rgba(128, 231, 184, 0.35)' : isDone ? '0 0 8px rgba(128, 231, 184, 0.35)' : 'none',
                        transition: 'all 300ms ease',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                        color: isDone ? 'var(--tc-color)' : isAnimating ? 'var(--tc-color)' : 'var(--sage-light)',
                        transition: 'color 300ms',
                      }}>
                        {step === 1000 ? 'T=1000' : step === 1 ? 'T=1' : `${step}`}
                      </span>
                    </div>
                    {/* Connector line */}
                    {i < NOISE_STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: 2, borderRadius: 999, margin: '0 2px',
                        marginBottom: 20,
                        background: isDone
                          ? 'var(--tc-color)'
                          : (isLoading && activeNoiseStep !== null && NOISE_STEPS[i + 1] >= activeNoiseStep)
                          ? 'var(--tc-color)'
                          : '#F3EFE0',
                        transition: 'background 300ms ease',
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Run Button ────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="btn-neuro btn-cyan"
              onClick={handleRun}
              disabled={isLoading}
              style={{
                flex: 1, justifyContent: 'center', padding: '13px 24px', fontSize: 15,
                opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Running DDPM denoising (T=1000→1)…
                </>
              ) : (
                <>
                  <Zap size={17} />
                  Run DDPM Reconstruction
                </>
              )}
            </button>
            {result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tc-color)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                <CheckCircle size={18} />
                Done
              </div>
            )}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--coral)', fontWeight: 600, fontSize: 13 }}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}
          </div>

          {/* ── Workflow Direction Card (Dual Route Decision) ── */}
          <div className="glass-card" style={{ padding: 20, border: '1.5px solid rgba(128, 231, 184, 0.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#80E7B8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Layers size={17} color="#1A2421" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>
                  Workflow Direction · Choose Next Action
                </div>
                <div style={{ fontSize: 11, color: 'var(--sage)' }}>
                  Export the direct reconstruction output or proceed to downstream tumor segmentation.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              {/* Route A: Direct Output */}
              <div style={{
                background: '#FAF8F2',
                border: '1px solid #E2DDD0',
                borderRadius: 12,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#1F7A58', letterSpacing: '0.06em' }}>
                    Route A · Direct Output
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', marginTop: 4, marginBottom: 4 }}>
                    Standalone MRI Restoration
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--sage)', lineHeight: 1.45 }}>
                    Export enhanced scan directly for manual anatomical inspection without AI tumor masks.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href="/images/mri-reconstructed.jpg"
                    download={`Reconstructed_${selectedCase}.jpg`}
                    className="btn-neuro btn-outline-glass"
                    style={{ padding: '7px 12px', fontSize: 11.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={13} />
                    Download Scan
                  </a>
                  <button
                    onClick={() => navigate('/report')}
                    className="btn-neuro btn-outline-glass"
                    style={{ padding: '7px 12px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <FileText size={13} />
                    Report
                  </button>
                </div>
              </div>

              {/* Route B: Downstream Segmentation */}
              <div style={{
                background: 'rgba(128, 231, 184, 0.14)',
                border: '1px solid rgba(128, 231, 184, 0.5)',
                borderRadius: 12,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#2D8A6B', letterSpacing: '0.06em' }}>
                      Route B · Downstream Pipeline
                    </span>
                    <span className="badge-neuro" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                      Capstone
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', marginBottom: 4 }}>
                    Proceed to Tumor Segmentation
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 11.5, color: 'var(--sage)', lineHeight: 1.45 }}>
                    Select model to evaluate downstream Dice accuracy on this restored scan:
                  </p>

                  {/* Model Selector Toggle */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedNextModel('ipixmatch')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 600,
                        border: '1.5px solid',
                        borderColor: selectedNextModel === 'ipixmatch' ? '#1F7A58' : '#D5CFC0',
                        background: selectedNextModel === 'ipixmatch' ? '#80E7B8' : '#FAF8F2',
                        color: '#1A2421',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 180ms ease',
                      }}
                    >
                      <div>iPixMatch</div>
                      <div style={{ fontSize: 9.5, opacity: 0.8 }}>Dice: 0.8204</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNextModel('unimatch')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 600,
                        border: '1.5px solid',
                        borderColor: selectedNextModel === 'unimatch' ? '#1F7A58' : '#D5CFC0',
                        background: selectedNextModel === 'unimatch' ? '#80E7B8' : '#FAF8F2',
                        color: '#1A2421',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 180ms ease',
                      }}
                    >
                      <div>UniMatch</div>
                      <div style={{ fontSize: 9.5, opacity: 0.8 }}>Dice: 0.8183</div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/segmentation?model=${selectedNextModel}&source=reconstructed`)}
                  className="btn-neuro"
                  style={{ width: '100%', padding: '9px 14px', fontSize: 12, gap: 6, justifyContent: 'center' }}
                >
                  <span>Run Segmentation ({selectedNextModel === 'ipixmatch' ? 'iPixMatch' : 'UniMatch'})</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT COLUMN  (5/12 ≈ 41.6%)
        ══════════════════════════════════════════════ */}
        <div style={{ flex: '0 0 41.66%', maxWidth: '41.66%', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Metric Cards ─────────────────────────── */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
              Reconstruction Metrics
            </div>

            {/* Loading state */}
            {isLoading && !result && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px 0', gap: 14,
              }}>
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                <p style={{ margin: 0, color: 'var(--sage)', fontSize: 13, textAlign: 'center' }}>
                  Running DDPM denoising
                  <br />
                  <span className="font-mono" style={{ color: 'var(--tc-color)', fontSize: 12 }}>T=1000 → 1</span>
                </p>
              </div>
            )}

            {/* Idle skeleton */}
            {!isLoading && !result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['MSE', 'SSIM', 'PSNR'].map(label => (
                  <div key={label} className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div>
                      <div className="skeleton" style={{ width: 80, height: 28, marginBottom: 6 }} />
                      <div style={{ fontSize: 12, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    </div>
                  </div>
                ))}
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sage-light)', textAlign: 'center' }}>
                  Run reconstruction to see metrics
                </p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Success banner */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(128, 231, 184, 0.35)', border: '1px solid rgba(128, 231, 184, 0.35)',
                  marginBottom: 4,
                }}>
                  <CheckCircle size={18} color="var(--tc-color)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--tc-color)', fontSize: 13 }}>Reconstruction Complete</div>
                    <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 1 }}>Conditional DDPM · T=1000 steps</div>
                  </div>
                </div>

                <MetricCard
                  value={result.mse.toFixed(4)}
                  label="Mean Squared Error"
                  sub="↓ lower is better"
                  accent="cyan"
                />
                <MetricCard
                  value={result.ssim.toFixed(4)}
                  label="SSIM Index"
                  sub="↑ higher is better · max=1"
                  accent="cyan"
                />
                <MetricCard
                  value={`${result.psnr.toFixed(2)} dB`}
                  label="Peak Signal-to-Noise Ratio"
                  sub="↑ higher is better"
                  accent="cyan"
                />
              </div>
            )}
          </div>

          {/* ── Model Traceability ──────────────────── */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
              Model Traceability
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Model', value: result?.model_version ?? DEMO_RECONSTRUCTION.model_version },
                { label: 'Preprocessing', value: 'v2.1.0 — BraTS2020 Normalization' },
                { label: 'Framework', value: 'PyTorch 2.x · CUDA 12.1' },
                { label: 'Case ID', value: result?.case_id ?? selectedCase },
                { label: 'Timestamp', value: result ? new Date(result.timestamp).toLocaleString('en-GB') : ts },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.025)', border: '1px solid #F3EFE0',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--sage-light)', whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mono)', textAlign: 'right', wordBreak: 'break-all' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pipeline Tracker ─────────────────────── */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
              Pipeline Progress
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PIPELINE_STEPS.map((step, i) => {
                const done = pipelineStep > step.id;
                const active = pipelineStep === step.id;
                const pending = pipelineStep < step.id;

                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
                    {/* Left: dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done
                          ? 'var(--tc-color)'
                          : active
                          ? 'var(--grad-ddpm)'
                          : '#F3EFE0',
                        border: active ? '2px solid rgba(128,231,184,0.4)' : '2px solid transparent',
                        boxShadow: active ? '0 0 14px rgba(128, 231, 184, 0.35)' : done ? '0 0 10px rgba(128, 231, 184, 0.35)' : 'none',
                        transition: 'all 350ms ease',
                        fontSize: 12, fontWeight: 700,
                        color: done || active ? '#fff' : 'var(--sage-light)',
                      }}>
                        {done ? <CheckCircle size={14} /> : step.id}
                      </div>
                      {/* Connector */}
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div style={{
                          width: 2, flex: 1, minHeight: 24,
                          background: done ? 'var(--tc-color)' : '#F3EFE0',
                          borderRadius: 999, margin: '3px 0',
                          transition: 'background 350ms ease',
                        }} />
                      )}
                    </div>

                    {/* Right: text */}
                    <div style={{ paddingBottom: i < PIPELINE_STEPS.length - 1 ? 20 : 0, paddingTop: 4 }}>
                      <div style={{
                        fontWeight: 600, fontSize: 13,
                        color: done ? 'var(--tc-color)' : active ? 'var(--tc-color)' : 'var(--sage)',
                        transition: 'color 300ms',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {step.label}
                        {active && isLoading && (
                          <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sage-light)', marginTop: 1 }}>
                        {step.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="progress-neuro" style={{ marginTop: 16 }}>
              <div
                className="progress-neuro-bar"
                style={{ width: `${(pipelineStep / PIPELINE_STEPS.length) * 100}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--sage-light)' }}>
                {pipelineStep === 0 ? 'Ready' : pipelineStep < PIPELINE_STEPS.length ? 'In progress…' : 'Complete'}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sage-light)' }}>
                {pipelineStep}/{PIPELINE_STEPS.length}
              </span>
            </div>
          </div>

          {/* ── Noise Steps Summary (result only) ─── */}
          {result && (
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
                Sampled Noise Steps
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.noise_steps.map(step => (
                  <span
                    key={step}
                    className="badge-neuro badge-cyan"
                    style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  >
                    T={step}
                  </span>
                ))}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--sage-light)' }}>
                Reverse diffusion sampled at {result.noise_steps.length} key timesteps from T=1000 to T=1.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Disclaimer ──────────────────────────── */}
      <DisclaimerBanner position="bottom" />
    </div>
  );
};

export default ReconstructionWorkspace;
