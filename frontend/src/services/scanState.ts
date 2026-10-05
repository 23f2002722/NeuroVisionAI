// ============================================================
// scanState.ts — Centralized Active MRI Scan State Management
// Synchronizes uploaded MRI scan & reconstructed output across
// Reconstruction Studio, Segmentation Studio, and Dashboard panels.
// ============================================================

import { useState, useEffect } from 'react';

export interface ActiveScan {
  caseId: string;
  label: string;
  fileName?: string;
  inputUrl: string;
  degradedUrl: string;
  reconUrl: string;
  segUrl?: string;
  isCustom: boolean;
}

export const DEFAULT_DEMO_SCAN: ActiveScan = {
  caseId: 'BRATS-2020-042',
  label: 'High-Grade Glioma (HGG) — Right Temporal',
  inputUrl: '/images/mri-segmentation-input.png',
  degradedUrl: '/images/mri-degraded.jpg',
  reconUrl: '/images/mri-reconstructed.jpg',
  segUrl: '/images/mri-segmentation-overlay.png',
  isCustom: false,
};

const STORAGE_KEY = 'neuro_active_mri_scan';
const EVENT_NAME = 'neuro-active-scan-changed';

export function getActiveScan(): ActiveScan {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.inputUrl === 'string') {
        return parsed as ActiveScan;
      }
    }
  } catch (e) {
    console.warn('Failed reading active scan from storage:', e);
  }
  return DEFAULT_DEMO_SCAN;
}

export function setActiveScan(scan: Partial<ActiveScan> & { inputUrl: string }): ActiveScan {
  const fullScan: ActiveScan = {
    caseId: scan.caseId || `CASE-${Date.now()}`,
    label: scan.label || scan.fileName || 'Uploaded MRI Scan',
    fileName: scan.fileName,
    inputUrl: scan.inputUrl,
    degradedUrl: scan.degradedUrl || scan.inputUrl,
    reconUrl: scan.reconUrl || scan.inputUrl,
    segUrl: scan.segUrl || '/images/mri-segmentation-overlay.png',
    isCustom: true,
  };

  try {
    const serialized = JSON.stringify(fullScan);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(STORAGE_KEY, serialized);
    // Legacy compatibility for any direct readers
    sessionStorage.setItem('current_mri_image', fullScan.reconUrl);
    sessionStorage.setItem('current_mri_case', fullScan.caseId);
  } catch (e) {
    console.warn('Failed saving active scan to storage:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: fullScan }));
  }

  return fullScan;
}

export function resetActiveScan(): ActiveScan {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('current_mri_image');
    sessionStorage.removeItem('current_mri_case');
  } catch (e) {
    console.warn('Failed resetting active scan:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: DEFAULT_DEMO_SCAN }));
  }

  return DEFAULT_DEMO_SCAN;
}

export function useActiveScan(): [ActiveScan, (scan: Partial<ActiveScan> & { inputUrl: string }) => ActiveScan, () => ActiveScan] {
  const [scan, setScan] = useState<ActiveScan>(getActiveScan);

  useEffect(() => {
    const handleUpdate = () => {
      setScan(getActiveScan());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return [scan, setActiveScan, resetActiveScan];
}
