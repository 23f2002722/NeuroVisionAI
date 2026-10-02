import React from 'react';
import { Activity, Cpu, CheckCircle2 } from 'lucide-react';

const HealthBar: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 20px',
        background: '#FAF8F2',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span className="badge-neuro badge-emerald">
          <CheckCircle2 size={12} /> System Online (Demo + API Ready)
        </span>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          <Cpu size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--cyan)' }} />
          DDPM Checkpoint: <strong style={{ color: 'var(--cyan)' }}>cDDPM-v1.0 (PSNR 29.69 dB)</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Segmentation: <strong style={{ color: 'var(--emerald)' }}>iPixMatch (0.8204) / UniMatch (0.8183)</strong>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <Activity size={13} color="#10B981" />
        <span>BraTS2020 2D Axial Mode</span>
      </div>
    </div>
  );
};

export default HealthBar;