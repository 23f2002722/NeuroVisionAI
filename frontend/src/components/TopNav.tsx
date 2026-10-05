import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brain } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',               label: 'Overview' },
  { to: '/reconstruction', label: 'Reconstruction' },
  { to: '/segmentation',   label: 'Segmentation' },
  { to: '/results',        label: 'Comparative Viewer' },
  { to: '/report',         label: 'Clinical Report' },
];

const TopNav: React.FC = () => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(243, 239, 224, 0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 32px',
      }}
    >
      <div
        style={{
          maxWidth: 1360,
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
            gap: 10,
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#80E7B8',
              border: '1px solid #2D8A6B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={18} color="#1A2421" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              NeuroAI Workstation
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              BraTS2020 Multi-Modal Research Platform
            </div>
          </div>
        </NavLink>

        {/* Workstation Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 3,
            borderRadius: 6,
            background: '#EAE5D7',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                padding: '6px 14px',
                borderRadius: 4,
                textDecoration: 'none',
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? '#FAF8F2' : 'transparent',
                boxShadow: isActive ? '0 1px 2px rgba(26, 36, 33, 0.06)' : 'none',
                transition: 'all 0.12s ease',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* System & Hardware Telemetry */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            borderRadius: 4,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#186A4B' }} />
          <span>Local Engine · RTX 3050 CUDA</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;