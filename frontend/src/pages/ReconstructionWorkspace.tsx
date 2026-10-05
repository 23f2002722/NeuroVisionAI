// ============================================================
// ReconstructionWorkspace.tsx — Diffusion MRI Reconstruction Studio
// Conditional DDPM reconstruction workflow page
// ============================================================

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Activity,
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
  X,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import WipeSlider from '../components/WipeSlider';
import MetricCard from '../components/MetricCard';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { apiReconstruct, apiUploadFile, DEMO_CASES, DEMO_RECONSTRUCTION } from '../services/api';
import { useActiveScan, setActiveScan, resetActiveScan } from '../services/scanState';
import type { CaseRecord, ReconstructionResult } from '../types';

const NOISE_STEPS = [1000, 800, 600, 400, 200, 100, 50, 10, 1];

const ReconstructionWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [activeScan] = useActiveScan();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allCases, setAllCases] = useState<CaseRecord[]>(DEMO_CASES);
  const [selectedCase, setSelectedCase] = useState<string>(DEMO_CASES[0].id);
  const [selectedNextModel, setSelectedNextModel] = useState<'ipixmatch' | 'unimatch'>('ipixmatch');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReconstructionResult | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeNoiseStep, setActiveNoiseStep] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const selectedCaseRecord = allCases.find(c => c.id === selectedCase) ?? allCases[0];

  const handleFileChange = async (file: File) => {
    setUploadedFile(file);
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);
    try {
      const res = await apiUploadFile(file);
      setAllCases(prev => [res.case, ...prev]);
      setSelectedCase(res.case.id);
      setActiveScan({
        caseId: res.case.id,
        label: res.case.label,
        fileName: file.name,
        inputUrl: res.input_url || res.preview_url || '',
        degradedUrl: res.degraded_url || res.preview_url || '',
        reconUrl: res.recon_url || res.preview_url || '',
        segUrl: res.seg_url,
      });
      setUploadSuccess(`✓ Uploaded "${file.name}" (${(res.size_bytes / 1024).toFixed(1)} KB)`);
      setResult(null);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveNoiseStep(null);

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
    const targetCase = allCases.find(c => c.id === id);
    if (targetCase && (targetCase.input_url || targetCase.preview_url)) {
      setActiveScan({
        caseId: targetCase.id,
        label: targetCase.label,
        fileName: targetCase.label,
        inputUrl: targetCase.input_url || targetCase.preview_url || '',
        degradedUrl: targetCase.degraded_url || targetCase.preview_url || '',
        reconUrl: targetCase.recon_url || targetCase.preview_url || '',
        segUrl: targetCase.seg_url,
      });
    } else {
      resetActiveScan();
    }
  };

  const displayResult = result ?? DEMO_RECONSTRUCTION;

  return (
    <div className="main-content page-enter" style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 48px' }}>
      <DisclaimerBanner position="top" />

      {/* ── Studio Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Reconstruction Studio · Module 01
            </span>
          </div>
          <h1 className="section-title">
            Diffusion MRI Reconstruction Studio
          </h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Conditional DDPM 1,000-step stochastic reverse denoising on multi-sequence BraTS scans.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge-neuro badge-green">Conditional DDPM-v1</span>
          <span className="badge-neuro badge-gray" style={{ fontFamily: 'var(--font-mono)' }}>T=1000 Steps</span>
        </div>
      </div>

      {/* ── Two-Column Workstation Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ══ LEFT COLUMN: Clinical Inspector ══════════════ */}
        <div className="workstation-panel">

          {/* Section 1: Patient Case & Ingestion */}
          <div className="panel-section" style={{ position: 'relative' }}>
            <div className="panel-section-title">
              <Activity size={13} />
              <span>Study Selection &amp; Upload</span>
            </div>

            {/* Case Dropdown */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                className="input-neuro"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedCaseRecord.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {selectedCaseRecord.id} · {selectedCaseRecord.modality}
                  </div>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 60,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(26, 36, 33, 0.12)',
                  }}
                >
                  {allCases.map(c => {
                    const isSelected = c.id === selectedCase;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCaseSelect(c.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          background: isSelected ? 'rgba(128, 231, 184, 0.2)' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'block',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{c.label}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {c.id} · {c.modality}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upload Area */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".h5,.hdf5,.nii,.gz,.dcm,.zip,.png,.jpg"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
                e.target.value = '';
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: uploadedFile || activeScan.isCustom ? '1px solid #186A4B' : '1px dashed var(--border-strong)',
                borderRadius: 6,
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                background: uploadedFile || activeScan.isCustom ? 'rgba(128, 231, 184, 0.12)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Upload size={14} color="#186A4B" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isUploading ? 'Uploading...' : activeScan.isCustom ? 'Replace Uploaded Scan' : 'Upload Degraded MRI Scan'}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                .h5 BraTS tensors or DICOM slice series
              </div>
            </div>

            {activeScan.isCustom && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#186A4B', fontWeight: 600 }}>Active: {activeScan.fileName || activeScan.label}</span>
                <button
                  onClick={() => { resetActiveScan(); setSelectedCase(DEMO_CASES[0].id); setUploadedFile(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', textDecoration: 'underline' }}
                >
                  Reset
                </button>
              </div>
            )}

            {uploadSuccess && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#186A4B' }}>{uploadSuccess}</div>
            )}
            {uploadError && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--coral)' }}>⚠ {uploadError}</div>
            )}
          </div>

          {/* Section 2: Diffusion Sampling Parameters */}
          <div className="panel-section">
            <div className="panel-section-title">
              <Sliders size={13} />
              <span>Diffusion Model Settings</span>
            </div>

            <div style={{ background: '#EDE8D8', borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Diffusion Steps:</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>1000 Steps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Variance Schedule:</span>
                <span style={{ fontWeight: 600 }}>Cosine (Improved DDPM)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Conditioning:</span>
                <span style={{ fontWeight: 600 }}>Multi-sequence (T1ce/T2/FLAIR)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Precision:</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>FP32 / CUDA 12.1</span>
              </div>
            </div>
          </div>

          {/* Section 3: Run Button */}
          <div className="panel-section">
            <button
              className="btn-neuro"
              onClick={handleRun}
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  Reconstructing (T=1000→1)…
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Run DDPM Reconstruction
                </>
              )}
            </button>

            {error && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--coral)' }}>
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Section 4: Workflow Forwarding Actions */}
          <div className="panel-section" style={{ background: '#FAF8F2' }}>
            <div className="panel-section-title">
              <Layers size={13} />
              <span>Downstream Pipeline Options</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Option A */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '10px', background: 'var(--bg-card)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Route A: Direct Scan Export</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Save restored image directly for diagnostic viewing.
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a
                    href={activeScan.isCustom ? activeScan.reconUrl : '/images/mri-reconstructed.jpg'}
                    download={`Reconstructed_${selectedCase}.png`}
                    className="btn-neuro btn-outline-glass"
                    style={{ fontSize: 11, padding: '5px 10px', textDecoration: 'none' }}
                  >
                    <Download size={12} />
                    Download
                  </a>
                  <button
                    onClick={() => navigate('/report')}
                    className="btn-neuro btn-outline-glass"
                    style={{ fontSize: 11, padding: '5px 10px' }}
                  >
                    <FileText size={12} />
                    Report
                  </button>
                </div>
              </div>

              {/* Option B */}
              <div style={{ border: '1px solid #80E7B8', borderRadius: 6, padding: '10px', background: 'rgba(128, 231, 184, 0.14)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Route B: Downstream Segmentation (Exp B)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Feed the DDPM-restored output to semi-supervised tumor segmentation.
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedNextModel('ipixmatch')}
                    className={`toggle-pill ${selectedNextModel === 'ipixmatch' ? 'active-emerald' : ''}`}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 8px' }}
                  >
                    iPixMatch
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNextModel('unimatch')}
                    className={`toggle-pill ${selectedNextModel === 'unimatch' ? 'active-emerald' : ''}`}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 8px' }}
                  >
                    UniMatch
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/segmentation?model=${selectedNextModel}&source=reconstructed&case=${selectedCase}`)}
                  className="btn-neuro"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 11.5, padding: '6px 12px' }}
                >
                  Forward to Segmentation
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ══ RIGHT COLUMN: Viewport & Performance ═════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Viewport Frame */}
          <div className="workstation-panel" style={{ padding: 18 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  Interactive Wipe Comparison
                </span>
                <span className="badge-neuro badge-gray" style={{ fontFamily: 'var(--font-mono)' }}>
                  {selectedCase}
                </span>
              </div>

              {/* Heatmap Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={e => setShowHeatmap(e.target.checked)}
                  style={{ accentColor: '#186A4B' }}
                />
                <span>Residual Difference Heatmap</span>
              </label>
            </div>

            {/* Darkroom Bezel */}
            <div className="viewport-frame" style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <div className="viewport-tag viewport-tag-tl">
                BEFORE: DEGRADED ACQUISITION
              </div>
              <div className="viewport-tag viewport-tag-tr">
                AFTER: DDPM RECONSTRUCTED
              </div>
              <div className="viewport-tag viewport-tag-bl">
                MODALITY: {selectedCaseRecord.modality}
              </div>
              <div className="viewport-tag viewport-tag-br">
                PSNR: {displayResult.psnr.toFixed(2)} dB · SSIM: {displayResult.ssim.toFixed(4)}
              </div>

              <div style={{ width: 440, height: 440, maxWidth: '100%' }}>
                <WipeSlider
                  width={440}
                  height={440}
                  beforeImage={activeScan.isCustom ? activeScan.degradedUrl : undefined}
                  afterImage={activeScan.isCustom ? activeScan.reconUrl : undefined}
                  beforeMode="degraded"
                  afterMode="reconstructed"
                  seed={parseInt(selectedCase.replace(/\D/g, '').slice(-3)) || 42}
                />
              </div>
            </div>

            {/* Denoising Schedule Timeline */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Stochastic Denoising Schedule (T=1000 → T=1)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {NOISE_STEPS.map((step, i) => {
                  const isDone = result !== null;
                  const isActive = activeNoiseStep !== null && step >= activeNoiseStep;
                  const isCurrent = activeNoiseStep === step;

                  return (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: 4,
                        textAlign: 'center',
                        background: isCurrent ? '#80E7B8' : isDone || isActive ? 'rgba(128, 231, 184, 0.25)' : '#EDE8D8',
                        color: isCurrent ? '#1A2421' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        fontWeight: 600,
                        border: '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {step === 1000 ? 'T=1000' : step === 1 ? 'T=1' : step}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Performance Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <MetricCard
              value={displayResult.mse.toFixed(4)}
              label="Mean Squared Error"
              sub="MSE (Reconstruction Residual ↓)"
              accent="cyan"
              icon={<Activity size={16} />}
            />
            <MetricCard
              value={displayResult.ssim.toFixed(4)}
              label="Structural Index"
              sub="SSIM (Anatomical Fidelity ↑)"
              accent="cyan"
              icon={<CheckCircle2 size={16} />}
            />
            <MetricCard
              value={`${displayResult.psnr.toFixed(2)} dB`}
              label="Peak Signal-to-Noise"
              sub="PSNR (Decibel Gain ↑)"
              accent="violet"
              icon={<Zap size={16} />}
            />
          </div>

        </div>

      </div>

    </div>
  );
};

export default ReconstructionWorkspace;
