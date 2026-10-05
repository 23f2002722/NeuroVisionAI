import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const FLOW_STEPS = [
  { path: '/',               title: 'Dual-Gateway Overview',           nextLabel: 'Step 1: Open DDPM Reconstruction Studio' },
  { path: '/reconstruction', title: 'Step 1: DDPM MRI Reconstruction', nextLabel: 'Step 2: Segment Brain Tumor Regions' },
  { path: '/segmentation',   title: 'Step 2: Tumor Segmentation',      nextLabel: 'Step 3: Inspect 3-Panel Synchronized Results' },
  { path: '/results',        title: 'Step 3: 3-Panel Sync Viewer',     nextLabel: 'Step 4: Compare Experiment A vs Experiment B' },
  { path: '/analysis',       title: 'Step 4: Scientific Evaluation',   nextLabel: 'Step 5: Ask Evidence-Grounded AI Assistant' },
  { path: '/assistant',      title: 'Step 5: Grounded Q&A Assistant',  nextLabel: 'Step 6: Export Printable Research Report' },
  { path: '/report',         title: 'Step 6: Clinical Research Report',nextLabel: 'Review Methodology & Architecture' },
  { path: '/methodology',    title: 'Methodology & Architecture',      nextLabel: 'Return to Home Overview' },
];

const GuidedFooter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = FLOW_STEPS.findIndex((s) => s.path === location.pathname);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;
  const current = FLOW_STEPS[activeIdx];
  const nextStep = FLOW_STEPS[(activeIdx + 1) % FLOW_STEPS.length];
  const prevStep = activeIdx > 0 ? FLOW_STEPS[activeIdx - 1] : null;

  return (
    <footer
      className="no-print"
      style={{
        maxWidth: 1280,
        width: '100%',
        margin: '0 auto 48px',
        padding: '0 32px',
      }}
    >
      <div
        style={{
          background: '#FAF8F2',
          border: '1px solid #E2DDD0',
          borderRadius: 12,
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 1px 4px rgba(26, 36, 33, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#80E7B8',
              border: '1px solid #2D8A6B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={16} color="#1A2421" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#52605B' }}>
              Guided Capstone Workflow · Step {activeIdx + 1} of {FLOW_STEPS.length}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 21, color: '#1A2421' }}>
              {current.title}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {prevStep && (
            <button
              onClick={() => navigate(prevStep.path)}
              className="btn-neuro btn-outline-glass"
              style={{ padding: '10px 18px' }}
            >
              <ArrowLeft size={15} />
              Previous
            </button>
          )}
          <button
            onClick={() => navigate(nextStep.path)}
            className="btn-neuro"
            style={{ padding: '11px 22px' }}
          >
            <span>{current.nextLabel}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default GuidedFooter;