// ============================================================
// Methodology.tsx — Research Methodology & Architecture Page
// Neuro-AI Platform | Static visual explainer
// ============================================================

import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Brain,
  Database,
  AlertTriangle,
  ArrowRight,
  Layers,
} from 'lucide-react';

// ── Shared sub-components ──────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  accentColor = 'var(--tc-color)',
}) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
          border: `1px solid ${accentColor}44`,
          color: accentColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: '1.35rem',
          fontWeight: 700,
          color: 'var(--forest)',
          fontFamily: 'var(--font-serif)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
    </div>
    {subtitle && (
      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          color: 'var(--sage)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.6,
          paddingLeft: '52px',
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      background: 'var(--ivory)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'var(--blur-glass)',
      WebkitBackdropFilter: 'var(--blur-glass)',
      padding: '2rem',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Arrow component ────────────────────────────────────────

const FlowArrow: React.FC<{ color?: string; label?: string }> = ({
  color = 'var(--sage-light)',
  label,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      flexShrink: 0,
      minWidth: '44px',
    }}
  >
    {label && (
      <span
        style={{
          fontSize: '0.6rem',
          color: color,
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
          marginBottom: '2px',
        }}
      >
        {label}
      </span>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <div style={{ width: '28px', height: '2px', background: color, opacity: 0.7 }} />
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: `8px solid ${color}`,
          opacity: 0.9,
        }}
      />
    </div>
  </div>
);

// ── Flow Box component ─────────────────────────────────────

interface FlowBoxProps {
  label: string;
  sublabel?: string;
  color?: string;
  icon?: React.ReactNode;
  glowIntensity?: number;
}

const FlowBox: React.FC<FlowBoxProps> = ({
  label,
  sublabel,
  color = 'var(--tc-color)',
  icon,
  glowIntensity = 0.15,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${color}44`,
      background: 'var(--cream)',
      minWidth: '100px',
      maxWidth: '140px',
      gap: '4px',
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    {icon && (
      <div style={{ color: color, marginBottom: '2px', opacity: 0.9 }}>{icon}</div>
    )}
    <span
      style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--forest)',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
    {sublabel && (
      <span
        style={{
          fontSize: '0.6rem',
          color: color,
          fontFamily: 'var(--font-mono)',
          opacity: 0.85,
          lineHeight: 1.2,
        }}
      >
        {sublabel}
      </span>
    )}
  </div>
);

// ── Pill / Tag component ───────────────────────────────────

const Pill: React.FC<{ text: string; color?: string }> = ({
  text,
  color = 'var(--tc-color)',
}) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '99px',
      border: `1px solid ${color}55`,
      background: `${color}18`,
      fontSize: '0.72rem',
      fontFamily: 'var(--font-mono)',
      color: color,
      fontWeight: 500,
      letterSpacing: '0.02em',
      lineHeight: 1.8,
    }}
  >
    {text}
  </span>
);

// ── Stat card ─────────────────────────────────────────────

const StatCard: React.FC<{ value: string; label: string; color?: string }> = ({
  value,
  label,
  color = 'var(--tc-color)',
}) => (
  <div
    style={{
      background: 'var(--cream)',
      border: `1px solid ${color}33`,
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      textAlign: 'center',
      flex: '1 1 160px',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div
      style={{
        fontSize: '1.6rem',
        fontWeight: 800,
        color: color,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1,
        marginBottom: '0.4rem',
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: '0.75rem',
        color: 'var(--sage)',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.4,
      }}
    >
      {label}
    </div>
  </div>
);

// ── Math formula display ───────────────────────────────────

const MathBlock: React.FC<{ formula: string; label?: string }> = ({ formula, label }) => (
  <div
    style={{
      background: 'var(--cream)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1.25rem',
      margin: '0.75rem 0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    {label && (
      <span
        style={{
          fontSize: '0.7rem',
          color: 'var(--sage-light)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}:
      </span>
    )}
    <code
      style={{
        fontSize: '0.875rem',
        color: 'var(--tc-color)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.03em',
        lineHeight: 1.5,
      }}
    >
      {formula}
    </code>
  </div>
);

// ── Section divider ────────────────────────────────────────

const Divider: React.FC = () => (
  <div
    style={{
      height: '1px',
      background:
        'linear-gradient(to right, transparent, var(--border-glass), var(--border-glass), transparent)',
      margin: '2.5rem 0',
    }}
  />
);

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════

const Methodology: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ddpm' | 'seg' | 'data' | 'eval' | 'pipeline'>('ddpm');

  const tabs = [
    { id: 'ddpm' as const, label: 'DDPM', icon: <Cpu size={14} /> },
    { id: 'seg' as const, label: 'Segmentation', icon: <Brain size={14} /> },
    { id: 'data' as const, label: 'Dataset', icon: <Database size={14} /> },
    { id: 'eval' as const, label: 'Evaluation', icon: <AlertTriangle size={14} /> },
    { id: 'pipeline' as const, label: 'Pipeline', icon: <Layers size={14} /> },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        fontFamily: 'var(--font-sans)',
        paddingBottom: '4rem',
      }}
    >
      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(26,107,74,0.08) 0%, rgba(128,231,184,0.08) 50%, rgba(26,107,74,0.05) 100%)',
          borderBottom: '1px solid var(--border-glass)',
          padding: '3rem 2rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-60px',
            right: '10%',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,107,74,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '5%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(128,231,184,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'var(--grad-ddpm)',
                boxShadow: '0 0 32px rgba(26,107,74,0.25)',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <BookOpen size={26} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                  fontWeight: 800,
                  color: 'var(--forest)',
                  fontFamily: 'var(--font-serif)',
                  letterSpacing: '-0.02em',
                }}
              >
                Methodology &amp; Architecture
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--sage)',
                  lineHeight: 1.5,
                }}
              >
                Conditional DDPM reconstruction · Semi-supervised segmentation · BraTS2020
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 1rem',
                  borderRadius: '99px',
                  border: activeTab === tab.id
                    ? '1px solid var(--mint-border)'
                    : '1px solid var(--border-glass)',
                  background: activeTab === tab.id
                    ? 'var(--mint-dim)'
                    : 'var(--cream)',
                  color: activeTab === tab.id ? 'var(--forest)' : 'var(--sage)',
                  fontSize: '0.8rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  letterSpacing: '0.01em',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 32px 32px',
        }}
      >
        {/* ════════════════════════════════════════════════
            SECTION 1 — DDPM
        ════════════════════════════════════════════════ */}
        {activeTab === 'ddpm' && (
          <div>
            <SectionHeader
              icon={<Cpu size={20} />}
              title="Conditional Denoising Diffusion Probabilistic Model (DDPM)"
              subtitle="A score-based generative model that learns to reverse a fixed Markov noising process, conditioned on degraded MRI input to reconstruct diagnostic-quality scans."
              accentColor="var(--tc-color)"
            />

            {/* Forward / Reverse process diagram */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Diffusion Process — Forward &amp; Reverse
              </h3>

              {/* Forward process */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  background: 'rgba(217,107,82,0.08)',
                  border: '1px solid rgba(217,107,82,0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                  }}
                >
                  <FlowBox
                    label="Clean MRI"
                    sublabel="x₀"
                    color="var(--tc-color)"
                    icon={<Brain size={16} />}
                  />
                  <FlowArrow color="var(--sage-light)" label="q(x₁|x₀)" />
                  <FlowBox label="Noisy Step" sublabel="x₁ … xₜ" color="var(--blue)" />
                  <FlowArrow color="var(--sage-light)" label="q(xₜ|xₜ₋₁)" />
                  <FlowBox
                    label="Pure Noise"
                    sublabel="xₜ  (T=1000)"
                    color="#7A5D38"
                    glowIntensity={0.18}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--sage-light)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '6px',
                    paddingLeft: '4px',
                  }}
                >
                  ↑ Forward process q — adds Gaussian noise over T=1000 steps (β schedule: linear 1×10⁻⁴ → 2×10⁻²)
                </div>
              </div>

              {/* Reverse process */}
              <div
                style={{
                  background: 'rgba(128,231,184,0.1)',
                  border: '1px solid var(--mint-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    flexDirection: 'row-reverse',
                  }}
                >
                  <FlowBox
                    label="Reconstructed MRI"
                    sublabel="x̂₀"
                    color="var(--tc-color)"
                    icon={<Brain size={16} />}
                    glowIntensity={0.2}
                  />
                  <div style={{ transform: 'scaleX(-1)' }}>
                    <FlowArrow color="var(--sage-light)" label="p_θ(x₀|x₁)" />
                  </div>
                  <FlowBox
                    label="U-Net Denoise"
                    sublabel="ε_θ(xₜ, t, c)"
                    color="var(--et-color)"
                    icon={<Cpu size={14} />}
                  />
                  <div style={{ transform: 'scaleX(-1)' }}>
                    <FlowArrow color="var(--sage-light)" label="p_θ(xₜ₋₁|xₜ)" />
                  </div>
                  <FlowBox
                    label="Noisy xₜ"
                    sublabel="+ condition c"
                    color="#7A5D38"
                    glowIntensity={0.18}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--sage-light)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '6px',
                    paddingLeft: '4px',
                  }}
                >
                  ↑ Reverse process p_θ — U-Net predicts noise residual conditioned on degraded MRI slice c
                </div>
              </div>
            </GlassCard>

            {/* Math objectives */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Training Objectives (Unicode Notation)
              </h3>
              <MathBlock
                label="L_simple"
                formula="𝓛 = 𝔼[‖ε − ε_θ(xₜ, t)‖²]"
              />
              <MathBlock
                label="Forward kernel"
                formula="q(xₜ|x₀) = 𝒩(xₜ; √ᾱₜ x₀, (1−ᾱₜ)I)"
              />
              <MathBlock
                label="Reverse step"
                formula="p_θ(xₜ₋₁|xₜ) = 𝒩(xₜ₋₁; μ_θ(xₜ,t), Σ_θ(xₜ,t))"
              />
            </GlassCard>

            {/* Hyperparameters */}
            <GlassCard>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Key Hyperparameters &amp; Architecture
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[
                  'T = 1000 diffusion steps',
                  'β₁ = 1×10⁻⁴',
                  'βₜ = 2×10⁻²',
                  'Linear β schedule',
                  'U-Net backbone',
                  'Multi-head self-attention',
                  'Residual blocks',
                  'Group normalization',
                  'Sinusoidal time embeddings',
                  'Conditional cross-attention',
                ].map((p) => (
                  <Pill key={p} text={p} color="var(--tc-color)" />
                ))}
              </div>

              {/* U-Net architecture visual */}
              <div
                style={{
                  background: 'var(--cream)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--sage-light)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '0.75rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  U-NET ENCODER–DECODER WITH SKIP CONNECTIONS
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    overflowX: 'auto',
                    flexWrap: 'nowrap',
                    paddingBottom: '4px',
                  }}
                >
                  {[
                    { label: 'Input 256×256', color: '#1F7A58' },
                    { label: 'Enc 128×128', color: '#3B82F6' },
                    { label: 'Enc 64×64', color: '#6366F1' },
                    { label: 'Bottleneck + Attn', color: '#1F7A58' },
                    { label: 'Dec 64×64', color: '#6366F1' },
                    { label: 'Dec 128×128', color: '#3B82F6' },
                    { label: 'Output 256×256', color: '#1F7A58' },
                  ].map((node, i, arr) => (
                    <React.Fragment key={node.label}>
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${node.color}55`,
                          background: `${node.color}18`,
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          color: node.color,
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {node.label}
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          style={{
                            width: '14px',
                            height: '1px',
                            background: `${arr[i + 1].color}66`,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--sage-light)',
                    marginTop: '8px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Skip connections bridge encoder → decoder at each resolution level
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 2 — SEMI-SUPERVISED SEGMENTATION
        ════════════════════════════════════════════════ */}
        {activeTab === 'seg' && (
          <div>
            <SectionHeader
              icon={<Brain size={20} />}
              title="Teacher-Student Semi-Supervised Learning"
              subtitle="UniMatch and iPixMatch leverage consistency regularization between strongly-augmented views to learn robust segmentation representations with only 10% labeled data."
              accentColor="#1A6B4A"
            />

            {/* Teacher-Student diagram */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Teacher–Student Training Framework
              </h3>

              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                }}
              >
                {/* Labeled branch */}
                <div style={{ flex: '1 1 260px' }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#1A6B4A',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: '0.6rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Labeled Branch
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
                    <FlowBox label="Labeled Data" sublabel="10% of train" color="var(--tc-color)" />
                    <FlowArrow color="var(--sage-light)" />
                    <FlowBox label="Student Model" sublabel="f_θ" color="var(--blue)" icon={<Cpu size={14} />} />
                    <FlowArrow color="var(--sage-light)" />
                    <FlowBox label="Supervised Loss" sublabel="L_sup" color="var(--tc-color)" />
                  </div>
                </div>

                {/* Unlabeled branch */}
                <div style={{ flex: '1 1 360px' }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--et-color)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: '0.6rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Unlabeled Branch
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
                    <FlowBox label="Unlabeled Data" sublabel="90% of train" color="var(--et-color)" />
                    <FlowArrow color="var(--sage-light)" label="Aug₁" />
                    <FlowBox label="Teacher Model" sublabel="f_θ' (EMA)" color="#7A5D38" icon={<Cpu size={14} />} />
                    <FlowArrow color="var(--sage-light)" label="pseudo" />
                    <FlowBox label="Pseudo Labels" sublabel="ŷᵤ" color="var(--et-color)" />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0',
                      flexWrap: 'wrap',
                      marginTop: '8px',
                    }}
                  >
                    <FlowBox label="Unlabeled Data" sublabel="strong aug." color="var(--et-color)" />
                    <FlowArrow color="var(--sage-light)" label="Aug₂" />
                    <FlowBox label="Student Model" sublabel="f_θ" color="var(--blue)" icon={<Cpu size={14} />} />
                    <FlowArrow color="var(--sage-light)" />
                    <FlowBox label="Consistency Loss" sublabel="L_unsup" color="var(--et-color)" />
                  </div>
                </div>
              </div>

              <Divider />

              {/* EMA update */}
              <div
                style={{
                  background: 'rgba(122,93,56,0.08)',
                  border: '1px solid rgba(122,93,56,0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#7A5D38',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Teacher EMA Update
                </div>
                <MathBlock formula="θ'  ←  α·θ'  +  (1−α)·θ" label="EMA" />
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    color: 'var(--sage)',
                    lineHeight: 1.6,
                  }}
                >
                  The teacher model parameters θ' are updated as an exponential moving average of the student parameters θ, with momentum α ≈ 0.999. This produces stable pseudo-labels without separate teacher training.
                </p>
              </div>
            </GlassCard>

            {/* iPixMatch innovation */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                iPixMatch Innovation — Pixel-Level Cross-View Matching
              </h3>
              <p
                style={{
                  margin: '0 0 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--sage)',
                  lineHeight: 1.7,
                }}
              >
                iPixMatch extends UniMatch by enforcing pixel-level feature alignment between two differently-augmented views of the same unlabeled image. A contrastive matching loss pulls corresponding pixels together in feature space, improving spatial precision of pseudo-label boundaries.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  'Pixel contrastive matching',
                  'Cross-view feature alignment',
                  'Boundary-aware pseudo labels',
                  'Dual augmentation paths',
                  'Shared encoder backbone',
                ].map((f) => (
                  <Pill key={f} text={f} color="#1A6B4A" />
                ))}
              </div>
            </GlassCard>

            {/* Key concepts */}
            <GlassCard>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Key Concepts at a Glance
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  {
                    title: 'Consistency Regularization',
                    body: 'Student predictions on strongly-augmented views must match teacher predictions on weakly-augmented views.',
                    color: 'var(--tc-color)',
                  },
                  {
                    title: 'Exponential Moving Average',
                    body: 'Teacher parameters are a slow-moving EMA of student parameters — no extra training gradient flow to teacher.',
                    color: '#7A5D38',
                  },
                  {
                    title: '10% Labeled Regime',
                    body: 'Only 10% of BraTS2020 training cases carry expert annotations; remaining 90% provide unsupervised signal.',
                    color: 'var(--et-color)',
                  },
                  {
                    title: 'Pseudo-Label Confidence Threshold',
                    body: 'Unlabeled pixels with softmax confidence < τ (typically 0.95) are masked from the unsupervised loss.',
                    color: '#1A6B4A',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    style={{
                      background: 'var(--cream)',
                      border: `1px solid ${card.color}33`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: card.color,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {card.title}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--sage)',
                        lineHeight: 1.6,
                      }}
                    >
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 3 — BRATS2020
        ════════════════════════════════════════════════ */}
        {activeTab === 'data' && (
          <div>
            <SectionHeader
              icon={<Database size={20} />}
              title="BraTS2020 Dataset"
              subtitle="Brain Tumor Segmentation 2020 challenge dataset — multi-institutional, pre-operative MRI scans of glioblastoma and lower-grade glioma."
              accentColor="var(--blue)"
            />

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard value="369" label="Training cases" color="var(--tc-color)" />
              <StatCard value="4" label="MRI modalities" color="var(--blue)" />
              <StatCard value="3" label="Tumor sub-regions" color="#1A6B4A" />
              <StatCard value="155" label="Axial slices / case" color="#7A5D38" />
              <StatCard value="240×240" label="Slice resolution" color="var(--et-color)" />
            </div>

            {/* Modalities */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                MRI Modalities
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  {
                    name: 'T1',
                    fullName: 'T1-weighted',
                    desc: 'Structural anatomy, gadolinium non-enhanced. Good grey/white matter contrast.',
                    color: '#1F7A58',
                  },
                  {
                    name: 'T1ce',
                    fullName: 'T1 post-contrast',
                    desc: 'Gadolinium contrast enhanced. Highlights active Tumor (enhancing Tumor ET).',
                    color: '#3B82F6',
                  },
                  {
                    name: 'T2',
                    fullName: 'T2-weighted',
                    desc: 'Oedema and whole Tumor boundary visualisation.',
                    color: '#F59E0B',
                  },
                  {
                    name: 'FLAIR',
                    fullName: 'Fluid Attenuated IR',
                    desc: 'Suppresses CSF signal; emphasises Tumor infiltration margins and oedema.',
                    color: '#10B981',
                  },
                ].map((mod) => (
                  <div
                    key={mod.name}
                    style={{
                      background: 'var(--cream)',
                      border: `1px solid ${mod.color}44`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      borderTop: `3px solid ${mod.color}`,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: mod.color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {mod.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--sage-light)',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {mod.fullName}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--sage)',
                        lineHeight: 1.6,
                      }}
                    >
                      {mod.desc}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Sub-regions */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Expert-Annotated Tumor Sub-Regions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  {
                    abbr: 'WT',
                    name: 'Whole Tumor',
                    includes: 'Labels 1+2+4',
                    desc: 'All Tumor tissue including necrotic core, enhancing Tumor, and oedema.',
                    color: '#1A6B4A',
                  },
                  {
                    abbr: 'TC',
                    name: 'Tumor Core',
                    includes: 'Labels 1+4',
                    desc: 'Necrotic/non-enhancing Tumor core and enhancing Tumor — the surgically relevant region.',
                    color: 'var(--tc-color)',
                  },
                  {
                    abbr: 'ET',
                    name: 'Enhancing Tumor',
                    includes: 'Label 4',
                    desc: 'Active Tumor cells visualised by T1ce gadolinium enhancement — most clinically critical.',
                    color: 'var(--et-color)',
                  },
                ].map((sr) => (
                  <div
                    key={sr.abbr}
                    style={{
                      background: 'var(--cream)',
                      border: `1px solid ${sr.color}44`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          color: sr.color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {sr.abbr}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--forest)' }}>
                          {sr.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: sr.color,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {sr.includes}
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--sage)',
                        lineHeight: 1.6,
                      }}
                    >
                      {sr.desc}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Preprocessing */}
            <GlassCard>
              <h3
                style={{
                  margin: '0 0 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Preprocessing Pipeline
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  'Skull stripping (pre-applied)',
                  'Co-registration to SRI atlas',
                  'Intensity normalization (z-score per modality)',
                  '2D axial slice extraction',
                  'Resize to 256×256',
                  'Flip augmentation',
                  'Gaussian blur augmentation',
                  'Color jitter augmentation',
                ].map((s) => (
                  <Pill key={s} text={s} color="var(--blue)" />
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 4 — EVALUATION & LIMITATIONS
        ════════════════════════════════════════════════ */}
        {activeTab === 'eval' && (
          <div>
            <SectionHeader
              icon={<AlertTriangle size={20} />}
              title="Evaluation Scope &amp; Limitations"
              subtitle="Transparent disclosure of methodological boundaries, evaluation assumptions, and clinical validation status."
              accentColor="var(--et-color)"
            />

            {/* Scope grid */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Evaluation Scope
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {[
                  {
                    title: '2D Axial Slice Processing',
                    body: 'Models operate on individual 2D axial slices extracted from volumetric MRI scans. No 3D spatial context is exploited between slices.',
                    icon: <Layers size={18} />,
                    color: 'var(--blue)',
                  },
                  {
                    title: 'Single Modality Input',
                    body: 'DDPM reconstruction experiments use single-modality 2D slices. Multi-modal fusion is not part of the current evaluation framework.',
                    icon: <Brain size={18} />,
                    color: 'var(--tc-color)',
                  },
                  {
                    title: 'Dice Coefficient Metric',
                    body: 'Primary segmentation metric is volumetric Dice Similarity Coefficient (DSC) averaged over WT, TC, ET sub-regions.',
                    icon: <Cpu size={18} />,
                    color: '#1A6B4A',
                  },
                  {
                    title: 'SSIM / PSNR / MSE',
                    body: 'Reconstruction quality measured by Structural Similarity Index (SSIM), Peak Signal-to-Noise Ratio (PSNR), and Mean Squared Error (MSE).',
                    icon: <BookOpen size={18} />,
                    color: '#7A5D38',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      background: 'var(--cream)',
                      border: `1px solid ${item.color}33`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        color: item.color,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {item.icon}
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.title}</span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--sage)',
                        lineHeight: 1.65,
                      }}
                    >
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Limitations */}
            <GlassCard
              style={{
                borderColor: 'rgba(217,107,82,0.35)',
                background: 'rgba(217,107,82,0.04)',
                marginBottom: '1.5rem',
              }}
            >
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--et-color)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                Known Limitations
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {[
                  {
                    text: 'Not validated for clinical use — this platform is a research prototype only. Results must not be used for diagnostic decisions.',
                    severity: 'high',
                  },
                  {
                    text: 'Single-institution validation on BraTS2020; generalisation to other scanner vendors, field strengths, or institutions is unverified.',
                    severity: 'high',
                  },
                  {
                    text: 'No 3D volumetric consistency constraints; inter-slice inconsistencies may appear in reconstructed volumes.',
                    severity: 'medium',
                  },
                  {
                    text: '2D slice selection bias: slices with minimal or no Tumor signal may disproportionately affect reported metrics.',
                    severity: 'medium',
                  },
                  {
                    text: 'Pseudo-label noise in semi-supervised training may propagate systematic errors for ambiguous Tumor boundaries.',
                    severity: 'medium',
                  },
                  {
                    text: 'DDPM inference latency (~10–30 s / slice on GPU) is not suitable for real-time clinical workflow integration without further optimisation.',
                    severity: 'low',
                  },
                ].map((lim, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--sage)',
                      lineHeight: 1.65,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background:
                          lim.severity === 'high'
                            ? 'var(--et-color)'
                            : lim.severity === 'medium'
                            ? 'var(--et-color)'
                            : 'var(--sage-light)',
                        marginRight: '8px',
                        verticalAlign: 'middle',
                      }}
                    />
                    {lim.text}
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Disclaimer banner */}
            <div
              style={{
                background: 'rgba(217,107,82,0.08)',
                border: '1px solid rgba(217,107,82,0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle
                size={20}
                style={{ color: 'var(--et-color)', flexShrink: 0, marginTop: '2px' }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  color: 'var(--sage)',
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: 'var(--et-color)' }}>RESEARCH PROTOTYPE DISCLAIMER: </strong>
                This system has not been cleared or approved by any regulatory authority (FDA, CE, MHRA or equivalent) for clinical use. It is intended solely for research evaluation of AI methodologies in a controlled academic setting. All outputs are experimental and must not replace professional medical judgement.
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SECTION 5 — INTEGRATED PIPELINE
        ════════════════════════════════════════════════ */}
        {activeTab === 'pipeline' && (
          <div>
            <SectionHeader
              icon={<Layers size={20} />}
              title="Integrated End-to-End Pipeline"
              subtitle="Full clinical workflow from degraded MRI input to automated Tumor segmentation report, integrating quality assessment, DDPM reconstruction, and semi-supervised segmentation."
              accentColor="#7A5D38"
            />

            {/* Main pipeline flow */}
            <GlassCard style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
              <h3
                style={{
                  margin: '0 0 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                End-to-End Pipeline Flow
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0',
                  minWidth: 'max-content',
                  paddingBottom: '4px',
                }}
              >
                <FlowBox
                  label="Degraded MRI"
                  sublabel="Input scan"
                  color="#94A3B8"
                  icon={<Brain size={14} />}
                />
                <FlowArrow color="var(--sage-light)" />
                <FlowBox
                  label="Quality Assessment"
                  sublabel="SSIM / SNR check"
                  color="var(--blue)"
                  icon={<Cpu size={14} />}
                />
                <FlowArrow color="var(--sage-light)" label="if degraded" />
                <FlowBox
                  label="Conditional DDPM"
                  sublabel="T=1000 denoise"
                  color="var(--tc-color)"
                  icon={<Cpu size={14} />}
                />
                <FlowArrow color="var(--sage-light)" />
                <FlowBox
                  label="Reconstructed MRI"
                  sublabel="↑ SSIM / PSNR"
                  color="#1A6B4A"
                  icon={<Brain size={14} />}
                />
                <FlowArrow color="var(--sage-light)" />
                <FlowBox
                  label="iPixMatch / UniMatch"
                  sublabel="Semi-supervised"
                  color="var(--et-color)"
                  icon={<Layers size={14} />}
                />
                <FlowArrow color="var(--sage-light)" />
                <FlowBox
                  label="WT/TC/ET Masks"
                  sublabel="Dice metrics"
                  color="#7A5D38"
                  icon={<Brain size={14} />}
                />
                <FlowArrow color="var(--sage-light)" />
                <FlowBox
                  label="Clinical Report"
                  sublabel="PDF + RAG chat"
                  color="var(--et-color)"
                  icon={<BookOpen size={14} />}
                />
              </div>
            </GlassCard>

            {/* Experiment comparison */}
            <GlassCard style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Experiment Configurations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {[
                  {
                    label: 'Experiment A',
                    tag: 'Baseline',
                    input: 'Original (degraded) MRI',
                    model: 'UniMatch',
                    color: 'var(--blue)',
                    steps: [
                      'Original degraded MRI input',
                      'Skip DDPM reconstruction',
                      'UniMatch semi-supervised segmentation',
                      'Evaluate WT/TC/ET Dice',
                    ],
                  },
                  {
                    label: 'Experiment B',
                    tag: 'Full Pipeline',
                    input: 'DDPM Reconstructed MRI',
                    model: 'iPixMatch',
                    color: 'var(--tc-color)',
                    steps: [
                      'DDPM reconstructs degraded MRI',
                      'Improved SSIM/PSNR input',
                      'iPixMatch semi-supervised segmentation',
                      'Evaluate WT/TC/ET Dice (expected ↑)',
                    ],
                  },
                ].map((exp) => (
                  <div
                    key={exp.label}
                    style={{
                      background: 'var(--cream)',
                      border: `1px solid ${exp.color}44`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: exp.color,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {exp.label}
                      </span>
                      <Pill text={exp.tag} color={exp.color} />
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {exp.steps.map((s, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--sage)',
                            lineHeight: 1.5,
                          }}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Data flow detail */}
            <GlassCard>
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Component Interaction Detail
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  {
                    from: 'FastAPI Backend',
                    to: 'DDPM Model',
                    desc: 'REST endpoint /api/reconstruct accepts case_id, returns reconstructed slice URLs + SSIM/PSNR/MSE metrics.',
                    color: 'var(--tc-color)',
                  },
                  {
                    from: 'DDPM Output',
                    to: 'Segmentation Model',
                    desc: 'Reconstructed MRI PNG served to /api/segment endpoint; model selects UniMatch or iPixMatch based on experiment config.',
                    color: '#1A6B4A',
                  },
                  {
                    from: 'Segmentation Model',
                    to: 'Report Generator',
                    desc: 'Dice scores (WT/TC/ET), mask overlay URLs and model metadata serialised to ReportData struct for PDF/RAG output.',
                    color: '#7A5D38',
                  },
                  {
                    from: 'RAG Chat Assistant',
                    to: 'Clinical Context',
                    desc: 'GPT-4o retrieval-augmented generation over local clinical notes + BraTS2020 literature for case-specific Q&A.',
                    color: 'var(--et-color)',
                  },
                ].map((flow) => (
                  <div
                    key={flow.from}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      background: 'var(--cream)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      border: `1px solid ${flow.color}22`,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0,
                        minWidth: '180px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: flow.color,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {flow.from}
                      </span>
                      <ArrowRight size={12} style={{ color: flow.color, opacity: 0.6 }} />
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--sage)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {flow.to}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--sage-light)',
                        lineHeight: 1.6,
                      }}
                    >
                      {flow.desc}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Methodology;
