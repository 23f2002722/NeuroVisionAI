// ============================================================
// Dashboard.tsx — Imaging Studies & Pipeline Overview
// NeuroAI Clinical MRI Workstation Platform
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Activity, Brain, Clock, ShieldCheck, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import MethodologySection from '../components/MethodologySection';
import { DEMO_CASES, DEMO_RECONSTRUCTION, DEMO_SEGMENTATION_B } from '../services/api';
import { useActiveScan } from '../services/scanState';

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  done:           { cls: 'badge-neuro badge-green',   label: 'Completed' },
  reconstructing: { cls: 'badge-neuro badge-cyan',    label: 'Reconstructing' },
  segmenting:     { cls: 'badge-neuro badge-amber',   label: 'Segmenting' },
  pending:        { cls: 'badge-neuro badge-gray',    label: 'Pending' },
  error:          { cls: 'badge-neuro badge-coral',   label: 'Failed' },
};

function StatusBadge({ status }: { status: string }) {
  const { cls, label } = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return <span className={cls}>{label}</span>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeScan, , resetActiveScan] = useActiveScan();
  const [selectedPipelineModel, setSelectedPipelineModel] = useState<'ipixmatch' | 'unimatch'>('ipixmatch');

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  return (
    <div className="page-enter" style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 48px' }}>

      {/* ── Workstation Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              BraTS2020 Multi-Sequence Platform
            </span>
          </div>
          <h1 className="section-title">
            Clinical Studies &amp; Pipeline Overview
          </h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Conditional diffusion-based MRI reconstruction and semi-supervised multi-class brain tumor segmentation.
          </p>
        </div>

        {/* Global Pipeline Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-neuro btn-outline-glass"
            onClick={() => navigate('/report')}
            style={{ fontSize: 12.5 }}
          >
            <FileText size={14} />
            Diagnostic Report
          </button>
          <button
            className="btn-neuro"
            onClick={() => navigate(`/segmentation?model=${selectedPipelineModel}&source=reconstructed`)}
            style={{ fontSize: 12.5 }}
          >
            Launch Active Workflow
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Active Custom Scan Banner ── */}
      {activeScan.isCustom && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 18px',
            borderRadius: 6,
            background: 'var(--bg-secondary)',
            border: '1px solid #80E7B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <CheckCircle2 size={16} color="#186A4B" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Active Patient Scan:
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#186A4B', background: '#EAE5D7', padding: '2px 8px', borderRadius: 4 }}>
              {activeScan.fileName || activeScan.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Synchronized across Reconstruction &amp; Segmentation modules.
            </span>
          </div>
          <button
            type="button"
            onClick={resetActiveScan}
            className="btn-neuro btn-outline-glass"
            style={{ fontSize: 11.5, padding: '4px 10px' }}
          >
            Reset to Default Study
          </button>
        </div>
      )}

      {/* ── Workflow Module Cards (Clean Clinical Workstations) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Module 1: Reconstruction */}
        <div className="workstation-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-section" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Module 01
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  MRI Quality &amp; Reconstruction Studio
                </div>
              </div>
              <span className="badge-neuro badge-green">Conditional DDPM</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
              Restores under-sampled, noisy, or artifacted multi-modal brain scans through 1,000-step stochastic reverse diffusion.
            </p>

            {/* Spec rows */}
            <div style={{ background: '#EDE8D8', borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target Sequences</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>T1ce, T2, FLAIR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Quality Index</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>PSNR 29.69 dB · SSIM 0.5732</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sampling Budget</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>1000 Denoising Steps</span>
              </div>
            </div>

            <button
              className="btn-neuro btn-outline-glass"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/reconstruction')}
            >
              Open Reconstruction Studio
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Module 2: Segmentation */}
        <div className="workstation-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-section" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Module 02
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  Tumor Sub-Region Segmentation
                </div>
              </div>
              <span className="badge-neuro badge-green">Teacher-Student</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
              Identifies and delineates Whole Tumor (WT), Tumor Core (TC), and Enhancing Tumor (ET) contours with dual-stream consistency.
            </p>

            {/* Spec rows */}
            <div style={{ background: '#EDE8D8', borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Checkpoint</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>iPixMatch (Exp B)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Dice (Exp B)</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>0.8204 (WT: 0.8683)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target Modality</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>4-Channel Tensor (1×4×240×240)</span>
              </div>
            </div>

            <button
              className="btn-neuro"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/segmentation')}
            >
              Open Segmentation Studio
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ── Key Quantitative Metrics ── */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
          Validation Benchmark Metrics (BraTS2020)
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          Comparative evaluation results across test sets comparing original vs. DDPM-reconstructed inputs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
        <MetricCard
          value={DEMO_RECONSTRUCTION.mse}
          label="Reconstruction MSE"
          sub="Mean Squared Error ↓"
          accent="cyan"
          icon={<Activity size={16} />}
        />
        <MetricCard
          value={DEMO_RECONSTRUCTION.ssim}
          label="Structural SSIM"
          sub="Index to Reference ↑"
          accent="cyan"
          icon={<ShieldCheck size={16} />}
        />
        <MetricCard
          value={`${DEMO_RECONSTRUCTION.psnr.toFixed(2)} dB`}
          label="Peak SNR"
          sub="Signal-to-Noise Ratio ↑"
          accent="violet"
          icon={<Brain size={16} />}
        />
        <MetricCard
          value={DEMO_SEGMENTATION_B.mean_dice}
          label="Mean Dice Score"
          sub="iPixMatch (Exp B) ↑"
          accent="emerald"
          icon={<Layers size={16} />}
        />
      </div>

      {/* ── Studies & Patient Worklist Table ── */}
      <div className="workstation-panel" style={{ marginBottom: 28, overflow: 'hidden' }}>
        <div className="panel-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              BraTS2020 Patient Studies Worklist
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Verified clinical multi-sequence cases available in local repository
            </div>
          </div>
          <button
            className="btn-neuro btn-outline-glass"
            style={{ fontSize: 11.5, padding: '5px 12px' }}
            onClick={() => navigate('/results')}
          >
            <Clock size={13} />
            Comparative Viewer
          </button>
        </div>

        <table className="table-neuro">
          <thead>
            <tr>
              <th>Case Identifier</th>
              <th>Clinical Label</th>
              <th>Sequences</th>
              <th>Acquisition Source</th>
              <th>Registered Date</th>
              <th>Pipeline Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_CASES.map((c) => (
              <tr key={c.id}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#186A4B' }}>
                    {c.id}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {c.label}
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {c.modality}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {c.source}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {fmtDate(c.created_at)}
                  </span>
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => navigate(`/segmentation?case=${c.id}`)}
                    className="btn-neuro btn-outline-glass"
                    style={{ fontSize: 11, padding: '4px 9px' }}
                  >
                    Inspect
                    <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Research Methodology ── */}
      <MethodologySection />

      {/* ── Clinical Notice ── */}
      <div
        style={{
          marginTop: 32,
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          fontSize: 11.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>RESEARCH PROTOCOL:</span>
        <span>
          Developed for academic evaluation on BraTS2020. Diffusion outputs and tumor segmentations require certified radiological oversight before clinical decision-making.
        </span>
      </div>

    </div>
  );
};

export default Dashboard;
