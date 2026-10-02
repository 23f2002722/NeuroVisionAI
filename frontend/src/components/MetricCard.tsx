import React from 'react';

interface MetricCardProps {
  value: string | number;
  label: string;
  sub?: string;
  accent?: 'cyan' | 'emerald' | 'amber' | 'coral' | 'violet' | string;
  icon?: React.ReactNode;
}

const ACCENT_MAP: Record<string, { color: string; bg: string; border: string }> = {
  cyan:    { color: '#1F7A58', bg: 'rgba(6, 182, 212, 0.08)',   border: 'rgba(6, 182, 212, 0.25)' },
  emerald: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.25)' },
  amber:   { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)',  border: 'rgba(245, 158, 11, 0.25)' },
  coral:   { color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.08)',   border: 'rgba(244, 63, 94, 0.25)' },
  violet:  { color: '#1F7A58', bg: 'rgba(139, 92, 246, 0.08)',  border: 'rgba(139, 92, 246, 0.25)' },
};

const MetricCard: React.FC<MetricCardProps> = ({ value, label, sub, accent = 'cyan', icon }) => {
  const theme = ACCENT_MAP[accent] ?? ACCENT_MAP.cyan;
  const formatted = typeof value === 'number' ? value.toFixed(4) : value;

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 18px',
        borderLeft: `3px solid ${theme.color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && <div style={{ color: theme.color }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: theme.color }}>
        {formatted}
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
          {sub}
        </div>
      )}
    </div>
  );
};

export default MetricCard;