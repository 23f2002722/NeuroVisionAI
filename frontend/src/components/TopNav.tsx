import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';

const STEPS = [
  { to: '/',               label: 'Overview' },
  { to: '/reconstruction', label: '1. Reconstruction' },
  { to: '/segmentation',   label: '2. Segmentation' },
  { to: '/results',        label: '3. Side-by-Side Viewer' },
  { to: '/analysis',       label: '4. Exp A vs B' },
  { to: '/assistant',      label: '5. Grounded Q&A' },
  { to: '/report',         label: '6. Clinical Report' },
  { to: '/methodology',    label: 'Methodology' },
];

const TopNav: React.FC = () => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(243, 239, 224, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2DDD0',
        padding: '14px 32px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Brand */}
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: '#1A2421',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: '#80E7B8',
              border: '1px solid #5MC896',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={20} color="#1A2421" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1.05, color: '#1A2421' }}>
              NeuroAI Studio
            </div>
            <div style={{ fontSize: 11, color: '#52605B' }}>
              MRI Reconstruction &amp; Brain Tumor Segmentation
            </div>
          </div>
        </NavLink>

        {/* Minimalist Step Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {STEPS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                padding: '8px 14px',
                borderRadius: 999,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: '#1A2421',
                background: isActive ? '#80E7B8' : 'transparent',
                border: isActive ? '1px solid #65D6A3' : '1px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Prototype Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 999,
            background: '#FAF8F2',
            border: '1px solid #E2DDD0',
            fontSize: 11.5,
            color: '#52605B',
            fontWeight: 600,
          }}
        >
          <Sparkles size={13} color="#1F7A58" />
          <span>Decision-Support Prototype</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;