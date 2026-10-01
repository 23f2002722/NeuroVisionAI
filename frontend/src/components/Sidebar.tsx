import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Layers,
  Columns,
  BarChart3,
  MessageSquare,
  FileText,
  BookOpen,
  Brain,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',               label: 'Dual-Gateway Home',       icon: LayoutDashboard, color: '#1F7A58' },
  { to: '/reconstruction', label: '1. DDPM Reconstruction',  icon: Zap,             color: '#1F7A58' },
  { to: '/segmentation',   label: '2. Tumor Segmentation',   icon: Layers,          color: '#10B981' },
  { to: '/results',        label: '3-Panel Sync Results',    icon: Columns,         color: '#1F7A58' },
  { to: '/analysis',       label: 'Exp A vs B Analysis',     icon: BarChart3,       color: '#F59E0B' },
  { to: '/assistant',      label: 'Grounded RAG Assistant',  icon: MessageSquare,   color: '#1F7A58' },
  { to: '/report',         label: 'Research & Demo Report',  icon: FileText,        color: '#F43F5E' },
  { to: '/methodology',    label: 'Methodology & Limits',    icon: BookOpen,        color: '#94A3B8' },
];

const Sidebar: React.FC = () => {
  return (
    <aside
      className="sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        background: '#F3EFE0',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 14px',
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#80E7B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
          }}
        >
          <Brain size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            NeuroAI Platform
          </div>
          <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
            DDPM + iPixMatch / UniMatch
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 18, flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '10px 12px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#F8FAFC' : 'var(--text-secondary)',
              background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
              borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <Icon size={17} style={{ color }} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer safety tag */}
      <div
        style={{
          padding: '12px',
          borderRadius: 10,
          background: '#FAF8F2',
          border: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.45,
        }}
      >
        <div style={{ color: '#FBBF24', fontWeight: 700, marginBottom: 3 }}>
          Decision-Support Prototype
        </div>
        BraTS2020 2D Slice Workflow · Non-diagnostic research tool.
      </div>
    </aside>
  );
};

export default Sidebar;