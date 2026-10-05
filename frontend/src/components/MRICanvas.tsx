import React, { useEffect, useRef, useState } from 'react';
import { useActiveScan } from '../services/scanState';

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
  const [activeScan] = useActiveScan();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [overlayLoaded, setOverlayLoaded] = useState(false);

  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  const hasMask = showWT || showTC || showET || mode === 'segmented';

  // Determine base scan source
  let defaultBaseSrc = '/images/mri-reconstructed.jpg';
  if (mode === 'degraded') {
    defaultBaseSrc = activeScan.isCustom ? activeScan.degradedUrl : '/images/mri-degraded.jpg';
  } else if (mode === 'original') {
    defaultBaseSrc = activeScan.isCustom ? activeScan.inputUrl : '/images/mri-segmentation-input.png';
  } else if (hasMask || mode === 'segmented') {
    defaultBaseSrc = activeScan.isCustom
      ? (activeScan.inputUrl || activeScan.reconUrl)
      : '/images/mri-segmentation-input.png';
  } else {
    defaultBaseSrc = activeScan.isCustom
      ? (activeScan.reconUrl || activeScan.inputUrl)
      : '/images/mri-reconstructed.jpg';
  }

  // If imageSrc is a generic demo path, override with active custom scan when active
  let activeBaseSrc = defaultBaseSrc;
  if (imageSrc) {
    if (activeScan.isCustom && imageSrc.startsWith('/images/mri-')) {
      activeBaseSrc = defaultBaseSrc;
    } else {
      activeBaseSrc = imageSrc;
    }
  }

  const overlaySrc = (activeScan.isCustom && activeScan.segUrl)
    ? activeScan.segUrl
    : '/images/mri-segmentation-overlay.png';

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
        try {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = width;
          offCanvas.height = height;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(overlayImgRef.current, 0, 0, width, height);
            const imgData = offCtx.getImageData(0, 0, width, height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const a = d[i + 3];
              if (a === 0) continue;
              const r = d[i];
              const g = d[i + 1];
              const b = d[i + 2];

              // Yellow (WT): high red & green, low blue
              const isWT = r > 180 && g > 140 && b < 110;
              // Blue (TC): high blue, low red
              const isTC = b > 160 && r < 130;
              // Red (ET): high red, low green & blue
              const isET = r > 180 && g < 130 && b < 130;

              if (isET) {
                if (!showET) {
                  if (showTC) {
                    d[i] = 59; d[i + 1] = 130; d[i + 2] = 246; // fallback to TC (Blue)
                  } else if (showWT) {
                    d[i] = 250; d[i + 1] = 204; d[i + 2] = 21; // fallback to WT (Yellow)
                  } else {
                    d[i + 3] = 0;
                  }
                }
              } else if (isTC) {
                if (!showTC) {
                  if (showWT) {
                    d[i] = 250; d[i + 1] = 204; d[i + 2] = 21; // fallback to WT (Yellow)
                  } else {
                    d[i + 3] = 0;
                  }
                }
              } else if (isWT) {
                if (!showWT) {
                  d[i + 3] = 0;
                }
              }
            }
            offCtx.putImageData(imgData, 0, 0);

            ctx.save();
            ctx.globalAlpha = maskOpacity;
            ctx.drawImage(offCanvas, 0, 0);
            ctx.restore();
          }
        } catch {
          ctx.save();
          ctx.globalAlpha = maskOpacity;
          ctx.drawImage(overlayImgRef.current, 0, 0, width, height);
          ctx.restore();
        }
      } else if (!activeScan.isCustom) {
        // Fallback procedural multi-class mask only for demo placeholder when no custom scan active
        ctx.save();
        ctx.globalAlpha = maskOpacity;
        const tx = cx + rx * 0.30;
        const ty = cy - ry * 0.10;
        if (showWT) {
          ctx.beginPath();
          ctx.ellipse(tx, ty, rx * 0.32, ry * 0.28, 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
          ctx.fill();
        }
        if (showTC) {
          ctx.beginPath();
          ctx.ellipse(tx, ty, rx * 0.20, ry * 0.18, 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.75)';
          ctx.fill();
        }
        if (showET) {
          ctx.beginPath();
          ctx.ellipse(tx, ty, rx * 0.11, ry * 0.10, 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
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