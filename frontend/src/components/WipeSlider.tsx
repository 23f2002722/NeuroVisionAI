// WipeSlider — Interactive before/after MRI comparison slider
// Displays real degraded vs DDPM reconstructed MRI scans with pixel-perfect alignment

import React, { useState, useRef, useEffect } from 'react';
import { useActiveScan } from '../services/scanState';

interface WipeSliderProps {
  width?: number | string;
  height?: number | string;
  beforeImage?: string;
  afterImage?: string;
  beforeMode?: string;
  afterMode?: string;
  seed?: number;
}

const WipeSlider: React.FC<WipeSliderProps> = ({
  width = 340,
  height = 340,
  beforeImage,
  afterImage,
}) => {
  const [activeScan] = useActiveScan();
  const currentBefore = beforeImage || (activeScan.isCustom ? activeScan.degradedUrl : '/images/mri-degraded.jpg');
  const currentAfter = afterImage || (activeScan.isCustom ? activeScan.reconUrl : '/images/mri-reconstructed.jpg');

  const [split, setSplit] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    w: typeof width === 'number' ? width : 340,
    h: typeof height === 'number' ? height : 340,
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSize({ w: rect.width, h: rect.height });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        height,
        maxWidth: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 14,
        overflow: 'hidden',
        userSelect: 'none',
        border: '1px solid rgba(128, 231, 184, 0.4)',
        background: '#050811',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* ── Base Layer: DDPM Reconstructed (After) ── */}
      <img
        src={currentAfter}
        alt="DDPM Reconstructed MRI"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* ── Clipped Layer: Degraded Input (Before) ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${split}%`,
          height: '100%',
          overflow: 'hidden',
          borderRight: '2px solid #80E7B8',
          boxShadow: '2px 0 12px rgba(128, 231, 184, 0.6)',
        }}
      >
        <img
          src={currentBefore}
          alt="Degraded Input MRI"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size.w,
            height: size.h,
            maxWidth: 'none',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {/* ── Slider Handle Graphic ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${split}%`,
          transform: 'translate(-50%, -50%)',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#FAF8F2',
          border: '2px solid #80E7B8',
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '5px solid #1A2421' }} />
          <span style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '5px solid #1A2421' }} />
        </div>
      </div>

      {/* ── Badges ── */}
      <span
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: 6,
          background: 'rgba(250, 248, 242, 0.94)',
          color: '#D96B52',
          border: '1px solid rgba(217, 107, 82, 0.35)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          zIndex: 5,
        }}
      >
        Degraded Input
      </span>
      <span
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: 6,
          background: 'rgba(250, 248, 242, 0.94)',
          color: '#2D8A6B',
          border: '1px solid rgba(128, 231, 184, 0.5)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          zIndex: 5,
        }}
      >
        DDPM Reconstructed
      </span>

      {/* ── Interactive Range Input Overlay ── */}
      <input
        type="range"
        min={2}
        max={98}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label="Comparison slider"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'ew-resize',
          margin: 0,
          zIndex: 20,
        }}
      />
    </div>
  );
};

export default WipeSlider;