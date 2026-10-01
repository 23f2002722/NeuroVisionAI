// ============================================================
// SegmentationWorkspace.tsx — Brain Tumor Segmentation Studio
// UniMatch / iPixMatch semi-supervised segmentation workflow
// BraTS2020 · Multi-class: WT / TC / ET
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Brain, Eye, Sliders, CheckCircle, ChevronDown } from 'lucide-react';
import MRICanvas from '../components/MRICanvas';
import MetricCard from '../components/MetricCard';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { apiSegment, DEMO_CASES, DEMO_SEGMENTATION_B } from '../services/api';
import type { SegmentationResult } from '../types';

// ── Experiment Comparison Data ────────────────────────────
const EXP_A_ORIGINAL = {
  ipixmatch: { dice_wt: 0.8234, dice_tc: 0.7891, dice_et: 0.7412, mean_dice: 0.7846 },
  unimatch:  { dice_wt: 0.8196, dice_tc: 0.7843, dice_et: 0.7381, mean_dice: 0.7807 },
};
const EXP_B_DDPM = {
  ipixmatch: { dice_wt: 0.8683, dice_tc: 0.8093, dice_et: 0.7837, mean_dice: 0.8204 },
  unimatch:  { dice_wt: 0.8647, dice_tc: 0.8042, dice_et: 0.7861, mean_dice: 0.8183 },
};

type ModelKey = 'ipixmatch' | 'unimatch';

// ── Helper: format delta ──────────────────────────────────
function formatDelta(a: number, b: number): { text: string; positive: boolean } {
  const d = b - a;
  return { text: (d >= 0 ? '+' : '') + (d * 100).toFixed(2) + '%', positive: d >= 0 };
}

// ── Sub-components ────────────────────────────────────────

interface RadioPillProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  accent?: 'cyan' | 'emerald' | 'violet';
}

const RadioPill: React.FC<RadioPillProps> = ({ checked, onChange, label, accent = 'cyan' }) => {
  const accentMap = {
    cyan:    { bg: 'var(--cyan-dim)',    border: 'var(--cyan)',    color: 'var(--cyan-light)' },
    emerald: { bg: 'var(--emerald-dim)', border: 'var(--emerald)', color: 'var(--emerald)' },
    violet:  { bg: 'var(--violet-dim)',  border: 'var(--violet)',  color: 'var(--violet)' },
  };
  const s = accentMap[accent];
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '6px 16px', borderRadius: 999,
        border: `1px solid ${checked ? s.border : '#F3EFE0'}`,
        background: checked ? s.bg : 'transparent',
        color: checked ? s.color : 'var(--sage-light)',
        fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
        cursor: 'pointer', transition: 'all 150ms ease',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: checked ? s.color : 'rgba(255,255,255,0.2)',
        flexShrink: 0,
        boxShadow: checked ? `0 0 6px ${s.color}` : 'none',
        transition: 'all 150ms ease',
      }} />
      {label}
    </button>
  );
};

// ── Delta chip in comparison table ────────────────────────
const DeltaChip: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const { text, positive } = formatDelta(a, b);
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11,
      fontFamily: 'var(--font-mono)', fontWeight: 600,
      background: positive ? 'rgba(128, 231, 184, 0.35)' : 'rgba(217, 107, 82, 0.22)',
      color: positive ? 'var(--tc-color)' : 'var(--et-color)',
      border: `1px solid ${positive ? 'rgba(128, 231, 184, 0.35)' : 'rgba(217, 107, 82, 0.22)'}`,
    }}>
      {text}
    </span>
  );
};

// ── Loading Overlay ───────────────────────────────────────
const LoadingOverlay: React.FC<{ model: ModelKey }> = ({ model }) => (
  <div style={{
    position: 'absolute', inset: 0, borderRadius: 8,
    background: 'var(--surface)', backdropFilter: 'blur(4px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
    zIndex: 10,
  }}>
    <div className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--tc-color)' }} />
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tc-color)' }}>
        Running {model === 'ipixmatch' ? 'iPixMatch' : 'UniMatch'} Segmentation
      </div>
      <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 4 }}>
        Generating WT / TC / ET masks…
      </div>
    </div>
    <div className="progress-neuro" style={{ width: 160 }}>
      <div className="progress-neuro-bar" style={{ width: '65%', background: '#80E7B8' }} />
    </div>
  </div>
);

// ── Color Legend Row ──────────────────────────────────────
const LegendRow: React.FC<{ color: string; label: string; desc: string }> = ({ color, label, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F3EFE0' }}>
    <div style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}88` }} />
    <div>
      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--forest)' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--sage)', marginLeft: 8 }}>{desc}</span>
    </div>
  </div>
);

// ── Main Page Component ───────────────────────────────────

const SegmentationWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramModel = searchParams.get('model');
  const paramSource = searchParams.get('source');

  // ── State ────────────────────────────────────────────────
  const [selectedCase, setSelectedCase] = useState(DEMO_CASES[0].id);
  const [selectedSource, setSelectedSource] = useState<'original' | 'reconstructed'>(
    paramSource === 'reconstructed' ? 'reconstructed' : 'original'
  );
  const [selectedModel, setSelectedModel] = useState<ModelKey>(
    paramModel === 'unimatch' ? 'unimatch' : 'ipixmatch'
  );
  const [showWT, setShowWT] = useState(true);
  const [showTC, setShowTC] = useState(true);
  const [showET, setShowET] = useState(true);
  const [maskOpacity, setMaskOpacity] = useState(72);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SegmentationResult | null>(null);
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCaseDropdownOpen(false);
      }
    }
    if (caseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [caseDropdownOpen]);

  // ── Derived helpers ──────────────────────────────────────
  const caseObj = DEMO_CASES.find(c => c.id === selectedCase) ?? DEMO_CASES[0];
  const caseIdx  = DEMO_CASES.indexOf(caseObj);
  const seed = 42 + caseIdx * 13;

  const canvasMode: 'original' | 'reconstructed' =
    selectedSource === 'reconstructed' ? 'reconstructed' : 'original';

  const modelLabel = selectedModel === 'ipixmatch' ? 'iPixMatch' : 'UniMatch';
  const modelVersion = selectedModel === 'ipixmatch' ? 'iPixMatch-BraTS2020' : 'UniMatch-BraTS2020';

  // Default display result while idle (from DEMO data or run result)
  const displayResult: SegmentationResult = result ?? {
    ...DEMO_SEGMENTATION_B,
    case_id: selectedCase,
    input_source: selectedSource,
    model_version: modelVersion,
    experiment: selectedSource === 'reconstructed' ? 'B' : 'A',
    ...(selectedSource === 'original'
      ? { dice_wt: EXP_A_ORIGINAL[selectedModel].dice_wt, dice_tc: EXP_A_ORIGINAL[selectedModel].dice_tc, dice_et: EXP_A_ORIGINAL[selectedModel].dice_et, mean_dice: EXP_A_ORIGINAL[selectedModel].mean_dice }
      : { dice_wt: EXP_B_DDPM[selectedModel].dice_wt, dice_tc: EXP_B_DDPM[selectedModel].dice_tc, dice_et: EXP_B_DDPM[selectedModel].dice_et, mean_dice: EXP_B_DDPM[selectedModel].mean_dice }),
  };

  // Pixel counts
  const wtPx = displayResult.wt_pixels ?? 4821;
  const tcPx = displayResult.tc_pixels ?? 2103;
  const etPx = displayResult.et_pixels ?? 987;

  // Experiment comparison rows
  const expA = EXP_A_ORIGINAL[selectedModel];
  const expB = EXP_B_DDPM[selectedModel];

  // ── Handlers ─────────────────────────────────────────────
  const handleRunSegmentation = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await apiSegment(selectedCase, selectedSource);
      // Patch model version to match selected model
      setResult({
        ...res,
        model_version: modelVersion,
        experiment: selectedSource === 'reconstructed' ? 'B' : 'A',
        ...(selectedSource === 'original'
          ? { dice_wt: EXP_A_ORIGINAL[selectedModel].dice_wt, dice_tc: EXP_A_ORIGINAL[selectedModel].dice_tc, dice_et: EXP_A_ORIGINAL[selectedModel].dice_et, mean_dice: EXP_A_ORIGINAL[selectedModel].mean_dice }
          : { dice_wt: EXP_B_DDPM[selectedModel].dice_wt, dice_tc: EXP_B_DDPM[selectedModel].dice_tc, dice_et: EXP_B_DDPM[selectedModel].dice_et, mean_dice: EXP_B_DDPM[selectedModel].mean_dice }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Top Disclaimer ── */}
      <DisclaimerBanner position="top" />

      {/* ── Page Body ── */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 32px 32px' }}>

        {/* ── Page Header ─────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(128, 231, 184, 0.35), rgba(245,158,11,0.15))',
              border: '1px solid rgba(128, 231, 184, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={22} style={{ color: 'var(--tc-color)' }} />
            </div>
            <div>
              <h1 style={{
                margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em',
                fontFamily: 'var(--font-serif)',
                background: 'linear-gradient(135deg, #80E7B8 0%, #D96B52 60%, #D96B52 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: '#1A2421',
              }}>
                Brain Tumor Segmentation Studio
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--sage)' }}>
                BraTS2020 · Semi-supervised multi-class segmentation · WT / TC / ET
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ══ LEFT COLUMN ══════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Case Selector */}
            <div className="glass-card" style={{ padding: 18, position: 'relative' }} ref={dropdownRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={14} style={{ color: 'var(--tc-color)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage)' }}>
                    Patient Case
                  </span>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, background: '#EAE5D7',
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--forest)', fontWeight: 600,
                }}>
                  {caseObj.id}
                </span>
              </div>

              {/* Custom Dropdown Trigger */}
              <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => setCaseDropdownOpen(prev => !prev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#FAF8F2',
                    border: caseDropdownOpen ? '1px solid #80E7B8' : '1px solid #E2DDD0',
                    color: 'var(--forest)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: caseDropdownOpen ? '0 0 0 3px rgba(128, 231, 184, 0.2)' : 'none',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 600,
                      color: 'var(--forest)',
                      fontSize: 13,
                    }}>
                      {caseObj.label}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--sage)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                    }}>
                      {caseObj.modality}
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    color="var(--sage)"
                    style={{
                      transform: caseDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Dropdown Options Menu */}
                {caseDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      zIndex: 60,
                      background: '#FAF8F2',
                      border: '1px solid #E2DDD0',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: '0 12px 32px rgba(26, 36, 33, 0.12)',
                      boxSizing: 'border-box',
                    }}
                  >
                    {DEMO_CASES.map(c => {
                      const isSelected = c.id === selectedCase;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCase(c.id);
                            setResult(null);
                            setCaseDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            background: isSelected ? 'rgba(128, 231, 184, 0.35)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #F3EFE0',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            display: 'block',
                            boxSizing: 'border-box',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F3EFE0';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(128, 231, 184, 0.35)' : 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{
                              fontWeight: isSelected ? 700 : 600,
                              fontSize: 13,
                              color: isSelected ? 'var(--tc-color)' : 'var(--forest)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              minWidth: 0,
                            }}>
                              {c.label}
                            </div>
                            <span style={{
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--sage)',
                              background: '#EAE5D7',
                              padding: '2px 6px',
                              borderRadius: 4,
                              flexShrink: 0,
                            }}>
                              {c.id}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: 'var(--sage)',
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {c.modality} · {c.source}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span className="badge-neuro badge-gray">{caseObj.modality}</span>
                <span className="badge-neuro badge-gray">{caseObj.source}</span>
                <span className={`badge-neuro ${caseObj.status === 'done' ? 'badge-green' : 'badge-amber'}`}>
                  {caseObj.status}
                </span>
              </div>
            </div>

            {/* Input Source Toggle */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Eye size={14} style={{ color: 'var(--tc-color)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage)' }}>
                  Input Source
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <RadioPill
                  checked={selectedSource === 'original'}
                  onChange={() => { setSelectedSource('original'); setResult(null); }}
                  label="Original MRI"
                  accent="cyan"
                />
                <RadioPill
                  checked={selectedSource === 'reconstructed'}
                  onChange={() => { setSelectedSource('reconstructed'); setResult(null); }}
                  label="DDPM-Reconstructed MRI"
                  accent="emerald"
                />
              </div>
              {selectedSource === 'reconstructed' && (
                <div style={{
                  marginTop: 10, padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(128, 231, 184, 0.35)', border: '1px solid rgba(128, 231, 184, 0.35)',
                  fontSize: 11, color: 'var(--tc-color)',
                }}>
                  ⟳ Using Conditional DDPM-v1 reconstructed output as segmentation input (Exp B pipeline)
                </div>
              )}
            </div>

            {/* Model Selector */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Layers size={14} style={{ color: 'var(--violet)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage)' }}>
                  Segmentation Model
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <RadioPill
                  checked={selectedModel === 'ipixmatch'}
                  onChange={() => { setSelectedModel('ipixmatch'); setResult(null); }}
                  label="iPixMatch"
                  accent="violet"
                />
                <RadioPill
                  checked={selectedModel === 'unimatch'}
                  onChange={() => { setSelectedModel('unimatch'); setResult(null); }}
                  label="UniMatch"
                  accent="violet"
                />
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--sage-light)' }}>
                {selectedModel === 'ipixmatch'
                  ? 'iPixMatch: pixel-level consistency with pseudo-label iteration — highest WT/TC on BraTS2020'
                  : 'UniMatch: unified feature-level + prediction-level consistency regularization'}
              </div>
            </div>

            {/* MRI Canvas */}
            <div className="glass-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Brain size={14} style={{ color: 'var(--tc-color)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage)' }}>
                  MRI Viewer — Axial Slice
                </span>
                <span style={{ marginLeft: 'auto' }} className="badge-neuro badge-emerald">
                  {canvasMode === 'reconstructed' ? 'DDPM RECON' : 'ORIGINAL'}
                </span>
              </div>

              {/* Canvas wrapper with possible loading overlay */}
              <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', lineHeight: 0, display: 'flex', justifyContent: 'center' }}>
                <MRICanvas
                  width={360}
                  height={360}
                  mode={canvasMode}
                  showWT={showWT}
                  showTC={showTC}
                  showET={showET}
                  maskOpacity={maskOpacity / 100}
                  seed={seed}
                  style={{ maxWidth: '100%', height: 'auto', aspectRatio: '1 / 1' }}
                />
                {isLoading && <LoadingOverlay model={selectedModel} />}
              </div>

              {/* Mask region toggles */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)', marginBottom: 8 }}>
                  Mask Overlays
                </div>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-pill ${showWT ? 'active-emerald' : ''}`}
                    onClick={() => setShowWT(v => !v)}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    WT — Whole Tumor
                  </button>
                  <button
                    type="button"
                    className={`toggle-pill ${showTC ? 'active-amber' : ''}`}
                    onClick={() => setShowTC(v => !v)}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    TC — Tumor Core
                  </button>
                  <button
                    type="button"
                    className={`toggle-pill ${showET ? 'active-coral' : ''}`}
                    onClick={() => setShowET(v => !v)}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    ET — Enhancing
                  </button>
                </div>
              </div>

              {/* Opacity slider */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sliders size={12} style={{ color: 'var(--sage)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)' }}>
                      Mask Opacity
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--tc-color)',
                    background: 'var(--emerald-dim)', padding: '2px 8px', borderRadius: 6,
                    border: '1px solid rgba(128, 231, 184, 0.35)',
                  }}>
                    {maskOpacity}%
                  </span>
                </div>
                <input
                  type="range" min={0} max={100} step={1}
                  value={maskOpacity}
                  onChange={e => setMaskOpacity(Number(e.target.value))}
                  style={{ accentColor: 'var(--tc-color)' }}
                />
              </div>
            </div>

            {/* Run Segmentation */}
            <button
              type="button"
              className="btn-neuro btn-emerald"
              onClick={handleRunSegmentation}
              disabled={isLoading}
              style={{
                width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 14,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading
                ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Running Segmentation…</>
                : <><Layers size={16} /> Run Segmentation — {modelLabel}</>
              }
            </button>

          </div>
          {/* ══ END LEFT COLUMN ══════════════════════════════ */}

          {/* ══ RIGHT COLUMN ═════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── Dice Score Metric Cards ── */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)', marginBottom: 12 }}>
                Dice Scores — {modelLabel} · Exp {displayResult.experiment}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MetricCard
                  value={displayResult.dice_wt}
                  label="Dice WT"
                  sub="Whole Tumor"
                  accent="emerald"
                  icon={<div style={{ width: 10, height: 10, borderRadius: '50%', background: '#80E7B8', boxShadow: '0 0 8px #80E7B8' }} />}
                />
                <MetricCard
                  value={displayResult.dice_tc}
                  label="Dice TC"
                  sub="Tumor Core"
                  accent="amber"
                  icon={<div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--et-color)', boxShadow: '0 0 8px var(--et-color)' }} />}
                />
                <MetricCard
                  value={displayResult.dice_et}
                  label="Dice ET"
                  sub="Enhancing Tumor"
                  accent="coral"
                  icon={<div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--et-color)', boxShadow: '0 0 8px var(--et-color)' }} />}
                />
                <MetricCard
                  value={displayResult.mean_dice}
                  label="Mean Dice"
                  sub="All sub-regions"
                  accent="cyan"
                  icon={<CheckCircle size={16} />}
                />
              </div>
            </div>

            {/* ── Voxel Count Table ── */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sliders size={14} style={{ color: 'var(--tc-color)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage)' }}>
                  Voxel Counts &amp; Area
                </span>
                <span className="badge-neuro badge-gray" style={{ marginLeft: 'auto' }}>1 mm³ / voxel</span>
              </div>
              <table className="table-neuro">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Label</th>
                    <th>Voxels</th>
                    <th>Area (mm²)</th>
                    <th>% of WT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FACC15', boxShadow: '0 0 6px rgba(250, 204, 21, 0.6)', flexShrink: 0 }} />
                        <span style={{ color: '#CA8A04', fontWeight: 600 }}>WT</span>
                      </div>
                    </td>
                    <td className="text-muted font-mono" style={{ fontSize: 11 }}>Whole Tumor</td>
                    <td className="font-mono" style={{ color: '#CA8A04' }}>{wtPx.toLocaleString()}</td>
                    <td className="font-mono" style={{ color: 'var(--forest)' }}>{wtPx.toLocaleString()}</td>
                    <td className="font-mono text-muted">100%</td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#3B82F6', boxShadow: '0 0 6px rgba(59, 130, 246, 0.6)', flexShrink: 0 }} />
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>TC</span>
                      </div>
                    </td>
                    <td className="text-muted font-mono" style={{ fontSize: 11 }}>Tumor Core</td>
                    <td className="font-mono" style={{ color: '#2563EB' }}>{tcPx.toLocaleString()}</td>
                    <td className="font-mono" style={{ color: 'var(--forest)' }}>{tcPx.toLocaleString()}</td>
                    <td className="font-mono text-muted">{((tcPx / wtPx) * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)', flexShrink: 0 }} />
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>ET</span>
                      </div>
                    </td>
                    <td className="text-muted font-mono" style={{ fontSize: 11 }}>Enhancing Tumor</td>
                    <td className="font-mono" style={{ color: '#DC2626' }}>{etPx.toLocaleString()}</td>
                    <td className="font-mono" style={{ color: 'var(--forest)' }}>{etPx.toLocaleString()}</td>
                    <td className="font-mono text-muted">{((etPx / wtPx) * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Color Legend + Traceability (side by side) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Color Legend */}
              <div className="glass-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)', marginBottom: 12 }}>
                  Segmentation Legend
                </div>
                <LegendRow
                  color="#FACC15"
                  label="WT — Whole Tumor"
                  desc="Yellow · Edema + infiltration"
                />
                <LegendRow
                  color="#3B82F6"
                  label="TC — Tumor Core"
                  desc="Blue · Non-enhancing necrotic core"
                />
                <LegendRow
                  color="#EF4444"
                  label="ET — Enhancing"
                  desc="Red · Active gadolinium enhancing rim"
                />
                <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'var(--ivory)', fontSize: 10, color: 'var(--sage-light)', lineHeight: 1.5 }}>
                  Labels follow BraTS2020 hierarchical convention. WT ⊇ TC ⊇ ET.
                </div>
              </div>

              {/* Model Traceability */}
              <div className="glass-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sage-light)', marginBottom: 12 }}>
                  Model Traceability
                </div>
                {[
                  { label: 'Model', value: modelVersion },
                  { label: 'Experiment', value: `Exp ${displayResult.experiment} — ${selectedSource === 'reconstructed' ? 'DDPM→Seg' : 'Baseline'}` },
                  { label: 'Case ID', value: selectedCase.split('-').pop() ?? selectedCase },
                  { label: 'Input', value: selectedSource === 'reconstructed' ? 'DDPM Reconstructed' : 'Original MRI' },
                  { label: 'Dataset', value: 'BraTS2020' },
                  { label: 'Timestamp', value: new Date(displayResult.timestamp).toLocaleTimeString() },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    padding: '5px 0', borderBottom: '1px solid #F3EFE0', gap: 8,
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--forest)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Experiment Comparison ── */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: 'rgba(100,116,139,0.15)', color: 'var(--sage)',
                    border: '1px solid rgba(100,116,139,0.25)',
                  }}>Exp A — Original MRI</span>
                  <span style={{ color: 'var(--sage-light)', fontSize: 14 }}>vs</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: 'rgba(128, 231, 184, 0.35)', color: 'var(--tc-color)',
                    border: '1px solid rgba(128, 231, 184, 0.35)',
                  }}>Exp B — DDPM→Seg</span>
                </div>
                <span className="badge-neuro badge-violet" style={{ marginLeft: 'auto' }}>{modelLabel}</span>
              </div>

              <table className="table-neuro">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ color: 'var(--sage-light)' }}>Exp A (Original)</th>
                    <th style={{ color: 'var(--tc-color)' }}>Exp B (DDPM)</th>
                    <th>Δ Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Dice WT', key: 'dice_wt' as const, a: expA.dice_wt, b: expB.dice_wt, color: '#80E7B8' },
                    { label: 'Dice TC', key: 'dice_tc' as const, a: expA.dice_tc, b: expB.dice_tc, color: 'var(--et-color)' },
                    { label: 'Dice ET', key: 'dice_et' as const, a: expA.dice_et, b: expB.dice_et, color: 'var(--et-color)' },
                    { label: 'Mean Dice', key: 'mean_dice' as const, a: expA.mean_dice, b: expB.mean_dice, color: 'var(--tc-color)' },
                  ].map(({ label, a, b, color }) => (
                    <tr key={label}>
                      <td>
                        <span style={{ fontWeight: 700, color, fontSize: 12 }}>{label}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--sage)' }}>
                          {a.toFixed(4)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color, fontWeight: 700 }}>
                          {b.toFixed(4)}
                        </span>
                      </td>
                      <td><DeltaChip a={a} b={b} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(128, 231, 184, 0.35)', border: '1px solid rgba(128, 231, 184, 0.35)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--tc-color)', fontWeight: 700, marginBottom: 3 }}>
                  ✓ DDPM Reconstruction improves downstream segmentation accuracy
                </div>
                <div style={{ fontSize: 11, color: 'var(--sage)', lineHeight: 1.5 }}>
                  Exp B ({modelLabel} + DDPM) Mean Dice <strong style={{ color: 'var(--tc-color)' }}>{expB.mean_dice.toFixed(4)}</strong> vs
                  Exp A baseline <strong style={{ color: 'var(--sage)' }}>{expA.mean_dice.toFixed(4)}</strong> —
                  Δ <strong style={{ color: 'var(--tc-color)' }}>+{((expB.mean_dice - expA.mean_dice) * 100).toFixed(2)}%</strong> uplift.
                  Confirms clinical hypothesis that high-fidelity reconstruction enhances segmentation boundary delineation.
                </div>
              </div>
            </div>

          </div>
          {/* ══ END RIGHT COLUMN ═════════════════════════════ */}

        </div>
      </div>

      {/* ── Bottom Disclaimer ── */}
      <DisclaimerBanner position="bottom" />
    </div>
  );
};

export default SegmentationWorkspace;
