import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  position?: 'top' | 'bottom' | 'inline';
  className?: string;
}

const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ position = 'top', className = '' }) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        marginBottom: position === 'top' ? 18 : 0,
        marginTop: position === 'bottom' ? 24 : 0,
        borderRadius: 12,
        background: 'rgba(217, 107, 82, 0.08)',
        border: '1px solid rgba(217, 107, 82, 0.25)',
        color: '#9E3E2A',
        fontSize: 12,
        lineHeight: 1.45,
        boxShadow: '0 2px 8px rgba(217, 107, 82, 0.04)',
      }}
    >
      <ShieldAlert size={16} style={{ flexShrink: 0, color: '#D96B52' }} />
      <div>
        <strong>Clinical Safety Notice:</strong> AI-generated segmentation / model-predicted region —{' '}
        <span style={{ color: '#52605B' }}>
          Research &amp; Decision-Support Prototype Only. Not an autonomous diagnostic system; outputs require qualified clinical interpretation.
        </span>
      </div>
    </div>
  );
};

export default DisclaimerBanner;