// ============================================================
// MethodologySection.tsx — In-Page Methodology & Dual Pipeline
// Explains the Dual-Branch H5 processing, tumor margin preservation,
// semi-supervised segmentation, and diffusion MRI reconstruction.
// ============================================================

import React from 'react';
import { BookOpen, Layers, Zap, Brain, ShieldCheck, CheckCircle2, Split } from 'lucide-react';

const MethodologySection: React.FC = () => {
  return (
    <section
      style={{
        marginTop: 48,
        borderTop: '1px solid #E2DDD0',
        paddingTop: 36,
        paddingBottom: 24,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#80E7B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookOpen size={18} color="#1A2421" />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--forest)',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '-0.02em',
              }}
            >
              Research Methodology &amp; Dual-Branch Architecture
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--sage)' }}>
              BraTS2020 Multi-Modal H5 Ingestion · Tumor Margin Preservation · Semi-Supervised Consistency
            </p>
          </div>
        </div>

        {/* ── Key Architecture Card: The Dual-Branch H5 Duplication Rationale ── */}
        <div
          className="glass-card"
          style={{
            padding: 24,
            marginBottom: 20,
            border: '1.5px solid #80E7B8',
            background: 'linear-gradient(180deg, rgba(128, 231, 184, 0.12) 0%, rgba(250, 248, 242, 0.9) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Split size={20} color="var(--tc-color)" />
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--forest)' }}>
              Dual-Branch Pipeline Rationale — Preventing Diffusion-Induced Tumor Removal
            </span>
            <span className="badge-neuro badge-emerald" style={{ marginLeft: 'auto' }}>
              Core Research Design
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--forest)', lineHeight: 1.7, margin: '0 0 16px' }}>
            In neuro-oncological MRI, generative diffusion models (such as Conditional DDPM) learn high-dimensional priors of brain anatomy. While highly effective at denoising healthy tissue and removing artifacts, <strong>diffusion inpainting can inadvertently smooth, attenuate, or treat abnormal hyper-intense tumor borders as noise</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Branch 1 */}
            <div
              style={{
                background: '#FAF8F2',
                border: '1px solid #80E7B8',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F7A58' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1F7A58', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Branch 1 · Direct Pathology Segmentation
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', marginBottom: 6 }}>
                Raw Multi-Modal H5 Ingestion
              </div>
              <p style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.55, margin: 0 }}>
                The raw <code style={{ background: '#EAE5D7', padding: '1px 5px', borderRadius: 4 }}>.h5</code> tensor (T1, T1ce, T2, FLAIR) feeds directly into the semi-supervised segmentation networks (<strong>iPixMatch</strong> / <strong>UniMatch</strong>). This preserves uncompromised micro-vascular boundaries:
                <br />• <strong>Whole Tumor (WT):</strong> Peritumoral vasogenic edema (FLAIR)
                <br />• <strong>Tumor Core (TC):</strong> Non-enhancing necrotic mass
                <br />• <strong>Enhancing Tumor (ET):</strong> Active contrast rim on T1ce
              </p>
            </div>

            {/* Branch 2 */}
            <div
              style={{
                background: '#FAF8F2',
                border: '1px solid #38BDF8',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284C7' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Branch 2 · Structural Denoising
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', marginBottom: 6 }}>
                Parallel Conditional DDPM Reconstruction
              </div>
              <p style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.55, margin: 0 }}>
                In parallel, a duplicate of the scan undergoes reverse diffusion sampling (<span style={{ fontFamily: 'var(--font-mono)' }}>T=1000 → 1</span>) to output an enhanced, high-SNR anatomical view (PSNR &gt; 29 dB). Clinicians can review high-resolution anatomy alongside genuine untouched pathology.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3-Column Pillars: Technical Details ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Pillar 1 */}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Brain size={16} color="var(--tc-color)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                H5 Format &amp; Modalities
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.6, margin: '0 0 10px' }}>
              Multi-modal input is stored as HDF5 arrays (<span style={{ fontFamily: 'var(--font-mono)' }}>4 × 240 × 240</span>). The 4 channels capture complementary physical properties:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--sage)', lineHeight: 1.6 }}>
              <li><strong>T1:</strong> Native anatomical tissue contrast</li>
              <li><strong>T1ce:</strong> Gadolinium contrast hyper-intensity (ET)</li>
              <li><strong>T2:</strong> Free water and hyper-intense core signals</li>
              <li><strong>FLAIR:</strong> Suppressed CSF; delineates infiltrative edema</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Layers size={16} color="var(--tc-color)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Semi-Supervised Learning
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.6, margin: '0 0 10px' }}>
              Trained under an annotation-efficient regime with only <strong>10% labeled data</strong>:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--sage)', lineHeight: 1.6 }}>
              <li><strong>iPixMatch:</strong> Teacher-student network enforcing pixel-level boundary consistency across perturbations.</li>
              <li><strong>UniMatch:</strong> Dual-stream weak-to-strong perturbations for robust feature regularization.</li>
              <li>Achieves <strong>&gt;0.82 Mean Dice</strong> without requiring 100% manual contouring.</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ShieldCheck size={16} color="var(--tc-color)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Evaluation Protocol
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.6, margin: '0 0 10px' }}>
              Rigorous quantitative validation against official BraTS2020 ground truth annotations:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--sage)', lineHeight: 1.6 }}>
              <li><strong>Dice Similarity Coefficient (DSC):</strong> Overlap ratio for WT, TC, and ET compartments.</li>
              <li><strong>Structural Metrics:</strong> MSE, SSIM, and PSNR for diffusion denoising accuracy.</li>
              <li><strong>Traceability:</strong> Every inference execution logs model checkpoint hashes and timestamps.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;
