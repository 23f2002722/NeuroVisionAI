// ============================================================
// Dashboard.tsx — Home / Landing Page
// NeuroAI Clinical MRI Workstation Platform
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Layers, Activity, Brain, TrendingUp, Clock } from 'lucide-react';
import WipeSlider from '../components/WipeSlider';
import MRICanvas from '../components/MRICanvas';
import MetricCard from '../components/MetricCard';
import { DEMO_CASES, DEMO_RECONSTRUCTION, DEMO_SEGMENTATION_B } from '../services/api';

// ── Status badge helper ─────────────────────────────────────
const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  done:           { cls: 'badge-neuro badge-green',   label: 'Done' },
  reconstructing: { cls: 'badge-neuro badge-cyan',    label: 'Reconstructing' },
  segmenting:     { cls: 'badge-neuro badge-amber',   label: 'Segmenting' },
  pending:        { cls: 'badge-neuro badge-gray',    label: 'Pending' },
  error:          { cls: 'badge-neuro badge-coral',   label: 'Error' },
};

function StatusBadge({ status }: { status: string }) {
  const { cls, label } = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return <span className={cls}>{label}</span>;
}

// ── Animated glow border on hover (CSS approach via inline style + state) ──
function GatewayPanel({
  children,
  glowColor,
  hoverShadow,
}: {
  children: React.ReactNode;
  glowColor: string;
  hoverShadow: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="glass-card"
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        border: `1px solid ${hovered ? glowColor : 'rgba(56,189,248,0.18)'}`,
        boxShadow: hovered ? hoverShadow : '0 4px 32px rgba(128, 231, 184, 0.14)',
        transition: 'border-color 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Animated top-edge accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 300ms ease',
        }}
      />
      {children}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPipelineModel, setSelectedPipelineModel] = useState<'ipixmatch' | 'unimatch'>('ipixmatch');

  // Format date helper
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  return (
    <div className="page-enter" style={{ padding: '28px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Page Header ──────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Brain size={22} style={{ color: 'var(--cyan)' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            NeuroAI Workstation · BraTS2020
          </span>
        </div>
        <h1
          className="section-title"
          style={{ fontSize: 30, marginBottom: 6 }}
        >
          Clinical{' '}
          <span className="gradient-text-ddpm">MRI Analysis</span>{' '}
          Dashboard
        </h1>
        <p className="section-subtitle" style={{ marginBottom: 0 }}>
          Conditional DDPM reconstruction pipeline with semi-supervised tumor segmentation.
          Select a studio below or run the full end-to-end pipeline.
        </p>
      </div>

      {/* ── Gateway Panels Row ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>

        {/* Panel 1: DDPM Reconstruction Studio */}
        <GatewayPanel
          glowColor="rgba(128, 231, 184, 0.35)"
          hoverShadow="0 0 0 1px rgba(128, 231, 184, 0.35), 0 8px 48px rgba(128, 231, 184, 0.35), 0 2px 16px rgba(128, 231, 184, 0.14)"
        >
          {/* Panel Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--cyan-dim)',
                  border: '1px solid rgba(128, 231, 184, 0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Zap size={16} style={{ color: 'var(--cyan)' }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 17, fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'var(--grad-ddpm)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: '#1A2421',
                    backgroundClip: 'text',
                  }}
                >
                  DDPM Reconstruction Studio
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                  Denoising Diffusion Probabilistic Models · T1ce/T2/FLAIR
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="chip-row" style={{ marginBottom: 0 }}>
              <span className="badge-neuro badge-cyan">Conditional DDPM</span>
              <span className="badge-neuro badge-cyan">MSE: 0.0011</span>
              <span className="badge-neuro badge-cyan">SSIM: 0.5732</span>
              <span className="badge-neuro badge-cyan">PSNR: 29.69 dB</span>
            </div>
          </div>

          {/* Wipe Slider */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <WipeSlider
              width={340}
              height={340}
              beforeMode="degraded"
              afterMode="reconstructed"
              seed={42}
            />
          </div>

          {/* Caption */}
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(128, 231, 184, 0.35)',
              border: '1px solid rgba(128, 231, 184, 0.35)',
              borderRadius: 8,
              padding: '8px 12px',
              lineHeight: 1.5,
            }}
          >
            ← Drag slider to compare degraded input vs. DDPM-reconstructed MRI output.
            Model: <span style={{ color: 'var(--cyan-light)' }}>Conditional-DDPM-v1</span> · 1000 diffusion steps
          </div>

          {/* Metric row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'MSE', value: DEMO_RECONSTRUCTION.mse.toFixed(4), accent: 'var(--cyan)' },
              { label: 'SSIM', value: DEMO_RECONSTRUCTION.ssim.toFixed(4), accent: 'var(--blue)' },
              { label: 'PSNR', value: `${DEMO_RECONSTRUCTION.psnr.toFixed(2)} dB`, accent: 'var(--cyan-light)' },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  flex: 1,
                  background: '#FAF8F2',
                  border: '1px solid rgba(56,189,248,0.1)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: m.accent }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Launch Button */}
          <div>
            <button
              className="btn-neuro btn-cyan"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
              onClick={() => navigate('/reconstruction')}
            >
              Launch Reconstruction Studio
              <ArrowRight size={16} />
            </button>
          </div>
        </GatewayPanel>

        {/* Panel 2: Tumor Segmentation Studio */}
        <GatewayPanel
          glowColor="rgba(128, 231, 184, 0.35)"
          hoverShadow="0 0 0 1px rgba(128, 231, 184, 0.35), 0 8px 48px rgba(128, 231, 184, 0.35), 0 2px 16px rgba(128, 231, 184, 0.14)"
        >
          {/* Panel Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--emerald-dim)',
                  border: '1px solid rgba(128, 231, 184, 0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Layers size={16} style={{ color: 'var(--emerald)' }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 17, fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'var(--grad-seg)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: '#1A2421',
                    backgroundClip: 'text',
                  }}
                >
                  Tumor Segmentation Studio
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                  Semi-Supervised Teacher-Student · BraTS2020
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="chip-row" style={{ marginBottom: 0 }}>
              <span className="badge-neuro badge-emerald">Teacher-Student</span>
              <span className="badge-neuro badge-emerald">iPixMatch Dice: 0.8204</span>
              <span className="badge-neuro badge-amber">UniMatch Dice: 0.8183</span>
              <span className="badge-neuro badge-emerald">BraTS2020</span>
            </div>
          </div>

          {/* MRI Canvas with segmentation overlay */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                borderRadius: 10, overflow: 'hidden',
                border: '1px solid rgba(128, 231, 184, 0.35)',
                boxShadow: '0 0 24px rgba(128, 231, 184, 0.35)',
              }}
            >
              <MRICanvas
                width={340}
                height={340}
                mode="segmented"
                showWT={true}
                showTC={true}
                showET={true}
                maskOpacity={0.88}
                seed={42}
              />
            </div>
          </div>

          {/* Tumor region legend matching real BraTS mask */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[
              { label: 'Whole Tumor (WT)', color: '#FACC15', dice: `${DEMO_SEGMENTATION_B.dice_wt.toFixed(4)}` },
              { label: 'Tumor Core (TC)',  color: '#3B82F6', dice: `${DEMO_SEGMENTATION_B.dice_tc.toFixed(4)}` },
              { label: 'Enhancing (ET)',   color: '#EF4444', dice: `${DEMO_SEGMENTATION_B.dice_et.toFixed(4)}` },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  flex: 1,
                  background: '#FAF8F2',
                  border: `1px solid ${r.color}30`,
                  borderRadius: 10,
                  padding: '9px 10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: r.color,
                    margin: '0 auto 5px',
                    boxShadow: `0 0 6px ${r.color}88`,
                  }}
                />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: r.color }}>
                  {r.dice}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                  {r.label}
                </div>
              </div>
            ))}
          </div>

          {/* Caption */}
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(128, 231, 184, 0.35)',
              border: '1px solid rgba(128, 231, 184, 0.35)',
              borderRadius: 8,
              padding: '8px 12px',
              lineHeight: 1.5,
            }}
          >
            Multi-class tumor segmentation on DDPM-reconstructed MRI.
            Mean Dice: <span style={{ color: 'var(--emerald)' }}>{DEMO_SEGMENTATION_B.mean_dice.toFixed(4)}</span> · Exp B (iPixMatch)
          </div>

          {/* Launch Button */}
          <div>
            <button
              className="btn-neuro btn-emerald"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
              onClick={() => navigate('/segmentation')}
            >
              Launch Segmentation Studio
              <ArrowRight size={16} />
            </button>
          </div>
        </GatewayPanel>
      </div>

      {/* ── End-to-End Pipeline CTA ───────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(128, 231, 184, 0.35) 0%, rgba(59,130,246,0.12) 40%, rgba(128, 231, 184, 0.35) 100%)',
          border: '1px solid rgba(56,189,248,0.22)',
          borderRadius: 18,
          padding: '26px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background shimmer */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(128, 231, 184, 0.35) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Activity size={18} style={{ color: 'var(--cyan)' }} />
            <span
              style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
              }}
            >
              Full Pipeline
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Run End-to-End Pipeline
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 540 }}>
            Upload an MRI scan, run DDPM reconstruction, then feed the output directly into
            the semi-supervised segmentation model — all in one automated workflow.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['DDPM Reconstruction', '→', 'Quality Assessment', '→', 'Tumor Segmentation', '→', 'Report Generation'].map((step, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  color: step === '→' ? 'var(--text-muted)' : 'var(--text-secondary)',
                  fontFamily: step === '→' ? undefined : 'var(--font-mono)',
                  fontWeight: step === '→' ? 400 : 500,
                }}
              >
                {step}
              </span>
            ))}
          </div>

          {/* Model selection pills for end-to-end pipeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--sage)' }}>
              Segmentation Model:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPipelineModel('ipixmatch')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: '1.5px solid',
                borderColor: selectedPipelineModel === 'ipixmatch' ? '#1F7A58' : '#E2DDD0',
                background: selectedPipelineModel === 'ipixmatch' ? '#80E7B8' : '#FAF8F2',
                color: '#1A2421',
                cursor: 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              <span>iPixMatch</span>
              <span style={{ fontSize: 10.5, opacity: 0.8 }}>(Dice: 0.8204)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPipelineModel('unimatch')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: '1.5px solid',
                borderColor: selectedPipelineModel === 'unimatch' ? '#1F7A58' : '#E2DDD0',
                background: selectedPipelineModel === 'unimatch' ? '#80E7B8' : '#FAF8F2',
                color: '#1A2421',
                cursor: 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              <span>UniMatch</span>
              <span style={{ fontSize: 10.5, opacity: 0.8 }}>(Dice: 0.8183)</span>
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
          <button
            className="btn-neuro btn-cyan"
            style={{ padding: '14px 28px', fontSize: 15, gap: 10 }}
            onClick={() => navigate(`/segmentation?model=${selectedPipelineModel}&source=reconstructed`)}
          >
            Launch Pipeline ({selectedPipelineModel === 'ipixmatch' ? 'iPixMatch' : 'UniMatch'})
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Summary Metric Cards ──────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <h2 className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>
          Key Performance Metrics
        </h2>
        <p className="section-subtitle" style={{ marginBottom: 20 }}>
          Best results from Experiment B — DDPM Reconstructed input pipeline (BraTS2020 validation split)
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 40,
        }}
      >
        <MetricCard
          value={DEMO_RECONSTRUCTION.mse}
          label="Best MSE"
          sub="Reconstruction Error ↓"
          accent="cyan"
          icon={<TrendingUp size={18} />}
        />
        <MetricCard
          value={DEMO_RECONSTRUCTION.ssim}
          label="Best SSIM"
          sub="Structural Similarity ↑"
          accent="cyan"
          icon={<Activity size={18} />}
        />
        <MetricCard
          value={`${DEMO_RECONSTRUCTION.psnr.toFixed(2)} dB`}
          label="Best PSNR"
          sub="Peak Signal-to-Noise Ratio ↑"
          accent="violet"
          icon={<Zap size={18} />}
        />
        <MetricCard
          value={DEMO_SEGMENTATION_B.mean_dice}
          label="Best Mean Dice"
          sub="iPixMatch · Exp B ↑"
          accent="emerald"
          icon={<Layers size={18} />}
        />
      </div>

      {/* ── Recent Research Cases ─────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>
              Recent Research Cases
            </h2>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>
              BraTS2020 demo cases · Last 4 processed entries
            </p>
          </div>
          <button
            className="btn-neuro btn-outline-glass"
            style={{ fontSize: 12, padding: '7px 14px' }}
            onClick={() => navigate('/pipeline')}
          >
            <Clock size={13} />
            View All Cases
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-neuro">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Label</th>
              <th>Modality</th>
              <th>Source</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DEMO_CASES.map((c) => (
              <tr
                key={c.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/pipeline')}
              >
                <td>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--cyan)',
                    }}
                  >
                    {c.id}
                  </span>
                </td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {c.label}
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {c.modality}
                  </span>
                </td>
                <td>
                  <span className="badge-neuro badge-violet" style={{ fontSize: 10 }}>
                    {c.source}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {fmtDate(c.created_at)}
                  </span>
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Research Disclaimer ───────────────────────────────── */}
      <div
        style={{
          marginTop: 40,
          padding: '12px 20px',
          background: 'rgba(217, 107, 82, 0.22)',
          border: '1px solid rgba(217, 107, 82, 0.22)',
          borderRadius: 12,
          fontSize: 11.5,
          color: 'rgba(251,113,133,0.85)',
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        ⚠️ <strong>Research &amp; Decision-Support Prototype Only.</strong> AI-generated outputs require qualified
        clinical interpretation. Not validated for autonomous clinical diagnosis. All cases sourced from BraTS2020
        public dataset.
      </div>
    </div>
  );
};

export default Dashboard;
