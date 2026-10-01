// MRICanvas — Canvas-based MRI renderer with real scan support & clinical mask overlays

import React, { useEffect, useRef, useState } from 'react';

interface MRICanvasProps {
  width?: number;
  height?: number;
  mode?: 'degraded' | 'reconstructed' | 'original' | 'segmented' | string;
  imageSrc?: string;
  showWT?: boolean;
  showTC?: boolean;
  showET?: boolean;
  maskOpacity?: number;
  showHeatmap?: boolean;
  seed?: number;
  style?: React.CSSProperties;
  className?: string;
}

const MRICanvas: React.FC<MRICanvasProps> = ({
  width = 300,
  height = 240,
  mode = 'reconstructed',
  imageSrc,
  showWT = false,
  showTC = false,
  showET = false,
  maskOpacity = 0.85,
  showHeatmap = false,
  seed = 42,
  style,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [overlayLoaded, setOverlayLoaded] = useState(false);

  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  const hasMask = showWT || showTC || showET || mode === 'segmented';

  // Determine base scan source
  let defaultBaseSrc = '/images/mri-reconstructed.jpg';
  if (mode === 'degraded') {
    defaultBaseSrc = '/images/mri-degraded.jpg';
  } else if (hasMask || mode === 'segmented') {
    defaultBaseSrc = '/images/mri-segmentation-input.png';
  }

  const activeBaseSrc = imageSrc || defaultBaseSrc;
  const overlaySrc = '/images/mri-segmentation-overlay.png';

  // Preload base image
  useEffect(() => {
    const img = new Image();
    img.src = activeBaseSrc;
    img.onload = () => {
      baseImgRef.current = img;
      setBaseLoaded(true);
    };
    img.onerror = () => {
      baseImgRef.current = null;
      setBaseLoaded(false);
    };
  }, [activeBaseSrc]);

  // Preload overlay image if segmentation is active
  useEffect(() => {
    if (hasMask) {
      const img = new Image();
      img.src = overlaySrc;
      img.onload = () => {
        overlayImgRef.current = img;
        setOverlayLoaded(true);
      };
      img.onerror = () => {
        overlayImgRef.current = null;
        setOverlayLoaded(false);
      };
    }
  }, [hasMask, overlaySrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const rx = Math.min(width, height) * 0.39;
    const ry = Math.min(width, height) * 0.44;

    // ── 1. Draw Base MRI Scan ─────────────────────────────────
    if (baseImgRef.current && baseImgRef.current.complete && baseImgRef.current.naturalWidth > 0) {
      ctx.save();
      if (mode === 'degraded') {
        ctx.filter = 'blur(0.8px) contrast(0.92)';
      }
      ctx.drawImage(baseImgRef.current, 0, 0, width, height);
      ctx.restore();
    } else {
      // Fallback procedural anatomy if image is loading
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.restore();
    }

    // ── 2. Draw Real Segmentation Mask Overlay ────────────────
    if (hasMask) {
      if (overlayImgRef.current && overlayImgRef.current.complete && overlayImgRef.current.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = maskOpacity;
        ctx.drawImage(overlayImgRef.current, 0, 0, width, height);
        ctx.restore();
      } else {
        // Fallback procedural mask
        ctx.save();
        ctx.globalAlpha = maskOpacity;
        const tx = cx + rx * 0.30;
        const ty = cy - ry * 0.10;
        if (showWT) {
          ctx.beginPath();
          ctx.ellipse(tx, ty, rx * 0.30, ry * 0.25, 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(128, 231, 184, 0.50)';
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // ── 3. Heatmap (if toggled) ──────────────────────────────
    if (showHeatmap) {
      const tx = cx + rx * 0.32 + ((seed % 7) - 3);
      const ty = cy - ry * 0.10 + ((seed % 5) - 2);
      const heatGrad = ctx.createRadialGradient(tx, ty, 4, tx, ty, rx * 0.45);
      heatGrad.addColorStop(0, 'rgba(217, 107, 82, 0.65)');
      heatGrad.addColorStop(0.5, 'rgba(128, 231, 184, 0.35)');
      heatGrad.addColorStop(1, 'rgba(128, 231, 184, 0)');
      ctx.fillStyle = heatGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // ── 4. Clinical Scanner Annotation HUD ───────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.font = `600 9px 'JetBrains Mono', monospace`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;

    ctx.fillText('T1ce · TR:2000', 8, 14);
    ctx.fillText(`${width}×${height} · 1.0mm³`, 8, 26);

    ctx.textAlign = 'right';
    let modeBadge = 'ORIGINAL SCAN';
    if (mode === 'degraded') modeBadge = 'DEGRADED INPUT';
    else if (mode === 'reconstructed') modeBadge = 'DDPM RECON';
    else if (hasMask) modeBadge = 'SEG MASK OVERLAY';

    ctx.fillText(modeBadge, width - 8, 14);
    ctx.fillText('BraTS2020', width - 8, 26);

    ctx.restore();
  }, [
    width,
    height,
    mode,
    showWT,
    showTC,
    showET,
    hasMask,
    maskOpacity,
    showHeatmap,
    seed,
    baseLoaded,
    overlayLoaded,
    activeBaseSrc,
    overlaySrc,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        display: 'block',
        borderRadius: 10,
        border: '1px solid rgba(226, 221, 208, 0.6)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    />
  );
};

export default MRICanvas;