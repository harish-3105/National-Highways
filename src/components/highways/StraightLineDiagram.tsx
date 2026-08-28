'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Printer,
  MapPin,
  BarChart2,
  GitCommit,
  Layers,
  Info,
  ShieldAlert,
  Car,
  Maximize2,
  Ruler,
  ArrowUpDown,
  ArrowLeftRight,
} from 'lucide-react';
import { SubChainageStretch } from '@/app/api/sub-chainages/route';
import { DlpWorkStretch, DlpWorkCategory } from '@/types/dlp';
import { formatDateIndian } from '@/lib/formatters';

interface HighwayMaster {
  id: string;
  road_code: string;
  corridor_name: string;
  from_location?: string;
  to_location?: string;
  old_nh_no?: string;
  new_nh_no?: string;
  length_km: number;
  configuration?: string;
  length_less_than_2l?: number;
  length_2l?: number;
  length_2l_ps?: number;
  length_4l?: number;
  length_6l?: number;
}

interface StraightLineDiagramProps {
  highwayIdOrCode: string;
}

export default function StraightLineDiagram({ highwayIdOrCode }: StraightLineDiagramProps) {
  const [highway, setHighway] = useState<HighwayMaster | null>(null);
  const [subChainages, setSubChainages] = useState<SubChainageStretch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // UI Controls State
  const [viewType, setViewType] = useState<'MICRO_LANE' | 'MACRO_PCU'>('MICRO_LANE');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 1.5x, 2x, 3x, 4x
  const [isReversed, setIsReversed] = useState<boolean>(false); // Normal (From -> To) vs Reversed (To -> From)
  const [showTowns, setShowTowns] = useState<boolean>(true);
  const [showCw, setShowCw] = useState<boolean>(true);
  const [showPcu, setShowPcu] = useState<boolean>(true);
  const [showRow, setShowRow] = useState<boolean>(true);
  const [showDpr, setShowDpr] = useState<boolean>(true);
  const [hoveredStretch, setHoveredStretch] = useState<SubChainageStretch | null>(null);
  const [dlpStretches, setDlpStretches] = useState<DlpWorkStretch[]>([]);
  const [hoveredDlpStretch, setHoveredDlpStretch] = useState<DlpWorkStretch | null>(null);

  // Fetch Highway and Sub-chainage Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch Highway master info
      const hwRes = await fetch(`/api/highways`);
      const hwData = await hwRes.json();
      
      let foundHighway: HighwayMaster | null = null;
      const corridorsList: HighwayMaster[] = hwData.corridors || hwData.highways || [];
      
      if (hwData.success && Array.isArray(corridorsList)) {
        const searchTarget = decodeURIComponent(highwayIdOrCode).trim().toUpperCase();
        const searchNum = searchTarget.replace(/[^0-9A-Z]/gi, '');

        foundHighway = corridorsList.find((h: HighwayMaster) => {
          const idMatch = h.id === highwayIdOrCode;
          const codeMatch = (h.road_code || '').toUpperCase() === searchTarget;
          const codeNormMatch = searchNum ? (h.road_code || '').toUpperCase().replace(/[^0-9A-Z]/gi, '') === searchNum : false;
          const newNhMatch = searchNum ? (h.new_nh_no || '').toUpperCase().replace(/[^0-9A-Z]/gi, '') === searchNum : false;
          const oldNhMatch = searchNum ? (h.old_nh_no || '').toUpperCase().replace(/[^0-9A-Z]/gi, '') === searchNum : false;
          return idMatch || codeMatch || codeNormMatch || newNhMatch || oldNhMatch;
        }) || null;
      }

      if (!foundHighway) {
        setError(`Highway corridor '${highwayIdOrCode}' not found.`);
        setLoading(false);
        return;
      }

      setHighway(foundHighway);

      // 2. Fetch Sub-chainage Stretches
      const subRes = await fetch(
        `/api/sub-chainages?code=${encodeURIComponent(foundHighway.road_code)}`
      );
      const subData = await subRes.json();

      if (subData.success) {
        setSubChainages(subData.subChainages || []);
      }

      // 3. Fetch DLP Corridors & Stretches
      try {
        const dlpRes = await fetch(`/api/dlp?highway_code=${encodeURIComponent(foundHighway.road_code)}`);
        const dlpData = await dlpRes.json();
        if (dlpData.success && Array.isArray(dlpData.corridors)) {
          const allDlp: DlpWorkStretch[] = [];
          dlpData.corridors.forEach((c: any) => {
            (c.work_stretches || []).forEach((s: DlpWorkStretch) => allDlp.push(s));
          });
          setDlpStretches(allDlp);
        }
      } catch (dlpErr) {
        console.warn('DLP fetch note in SLD:', dlpErr);
      }
    } catch (err: any) {
      console.error('Error loading SLD data:', err);
      setError(err.message || 'Failed to load Straight-Line Diagram data.');
    } finally {
      setLoading(false);
    }
  }, [highwayIdOrCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter stretches by viewType & active status
  const activeStretches = useMemo(() => {
    return subChainages.filter(
      (s) =>
        (!s.breakdown_type || s.breakdown_type === viewType) &&
        s.delete_status !== 'DELETED' &&
        s.delete_status !== 'SOFT_DELETE'
    );
  }, [subChainages, viewType]);

  // Compute total corridor physical span and min/max chainage
  const { minKm, maxKm, totalSpan } = useMemo(() => {
    if (activeStretches.length === 0) {
      const hLen = highway?.length_km || 10;
      return { minKm: 0, maxKm: hLen, totalSpan: hLen };
    }

    let min = Infinity;
    let max = -Infinity;

    activeStretches.forEach((s) => {
      if (s.from_km < min) min = s.from_km;
      if (s.to_km > max) max = s.to_km;
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = highway?.length_km || 10;

    const span = Math.max(0.1, max - min);
    return { minKm: min, maxKm: max, totalSpan: span };
  }, [activeStretches, highway]);

  // Dynamic Canvas Width calculation based on zoom level
  const pixelsPerKm = useMemo(() => {
    return Math.max(25, Math.round(100 * zoomLevel));
  }, [zoomLevel]);

  // Total Canvas Width based on physical distance totalSpan (km)
  const canvasWidthPx = useMemo(() => {
    return Math.max(1000, Math.round(totalSpan * pixelsPerKm));
  }, [totalSpan, pixelsPerKm]);

  // Minimum bar width to guarantee chainage splits and text render legibly without overlap
  const minBarWidthPx = useMemo(() => {
    return Math.max(150, Math.round(150 * zoomLevel));
  }, [zoomLevel]);

  // Pre-calculate stretch positions with minimum bar width protection and zero overlaps
  const stretchPositions = useMemo(() => {
    const normalPosMap = new Map<string | number, { leftPx: number; widthPx: number }>();
    const posMap = new Map<string | number, { leftPx: number; widthPx: number }>();
    let currentLeft = 0;

    activeStretches.forEach((st, i) => {
      const propWidth = Math.round(((st.length_km || 1) / totalSpan) * canvasWidthPx);
      const widthPx = Math.max(minBarWidthPx, propWidth);
      const key = st.id || i;
      normalPosMap.set(key, { leftPx: currentLeft, widthPx });
      posMap.set(key, { leftPx: currentLeft, widthPx });
      currentLeft += widthPx;
    });

    const totalCanvasWidth = Math.max(canvasWidthPx, currentLeft);

    if (isReversed) {
      activeStretches.forEach((st, i) => {
        const key = st.id || i;
        const orig = normalPosMap.get(key);
        if (orig) {
          const revLeft = totalCanvasWidth - (orig.leftPx + orig.widthPx);
          posMap.set(key, { leftPx: revLeft, widthPx: orig.widthPx });
        }
      });
    }

    return { posMap, normalPosMap, totalCanvasWidth };
  }, [activeStretches, totalSpan, canvasWidthPx, minBarWidthPx, isReversed]);

  const canvasWidthPxActual = stretchPositions.totalCanvasWidth;

  const getStretchPos = useCallback(
    (st: SubChainageStretch, index: number) => {
      const key = st.id || index;
      return (
        stretchPositions.posMap.get(key) || {
          leftPx: index * minBarWidthPx,
          widthPx: minBarWidthPx,
        }
      );
    },
    [stretchPositions, minBarWidthPx]
  );

  // Dynamic Print Scale Factor so SLD matrix fits landscape PDF/print page without horizontal truncation
  const printScale = useMemo(() => {
    const totalW = 224 + canvasWidthPxActual;
    if (totalW <= 1000) return 1;
    return Math.max(0.35, Math.round((1000 / totalW) * 100) / 100);
  }, [canvasWidthPxActual]);

  // Helper for Excel bar height specs (Scaled: 10px per meter width)
  const getLaneStyle = (laneConfig: string) => {
    const norm = (laneConfig || '').toLowerCase();
    const neutralStyle = {
      bg: 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100',
    };

    if (norm.includes('6l') || norm.includes('6-lane')) {
      return {
        ...neutralStyle,
        border: 'border-y-2 border-y-purple-400 dark:border-y-purple-600',
        label: '6-Lane (6L)',
        heightPx: 200,
      };
    }
    if (norm.includes('4l') || norm.includes('4-lane')) {
      return {
        ...neutralStyle,
        border: 'border-y-2 border-y-blue-400 dark:border-y-blue-600',
        label: '4-Lane / 4L+PS',
        heightPx: 140,
      };
    }
    if (norm.includes('2l+ps') || norm.includes('paved')) {
      return {
        ...neutralStyle,
        border: 'border-y-2 border-y-emerald-400 dark:border-y-emerald-600',
        label: '2L + Paved Shoulder',
        heightPx: 100,
      };
    }
    if (norm.includes('2l') || norm.includes('2-lane')) {
      return {
        ...neutralStyle,
        border: 'border-y-2 border-y-amber-400 dark:border-y-amber-600',
        label: '2-Lane (2L)',
        heightPx: 70,
      };
    }
    return {
      ...neutralStyle,
      border: 'border-y-2 border-y-slate-500 dark:border-y-slate-400',
      label: '< 2-Lane',
      heightPx: 38,
    };
  };

  // DLP Category Visual Styling (Soft / Muted Tones)
  const getDlpCategoryStyle = (cat: DlpWorkCategory) => {
    switch (cat) {
      case 'DLP':
        return {
          bg: 'bg-lime-700 dark:bg-lime-600',
          border: 'border border-lime-400 dark:border-lime-400',
          text: 'text-white',
          badgeBg: 'bg-lime-50 dark:bg-lime-950/40 text-lime-800 dark:text-lime-200 border border-lime-200 dark:border-lime-800',
          label: 'Under DLP',
        };
      case 'CONSTRUCTION':
        return {
          bg: 'bg-emerald-800 dark:bg-emerald-700',
          border: 'border border-emerald-400 dark:border-emerald-400',
          text: 'text-white',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800',
          label: 'Under Construction',
        };
      case 'STMC':
        return {
          bg: 'bg-amber-500 dark:bg-amber-600',
          border: 'border border-amber-300 dark:border-amber-400',
          text: 'text-white',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
          label: 'Under STMC',
        };
      case 'PBMC':
        return {
          bg: 'bg-purple-600 dark:bg-purple-500',
          border: 'border border-purple-300 dark:border-purple-400',
          text: 'text-white',
          badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800',
          label: 'Under PBMC',
        };
      case 'NO_DLP':
      default:
        return {
          bg: 'bg-rose-600 dark:bg-rose-500',
          border: 'border border-rose-300 dark:border-rose-400',
          text: 'text-white',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
          label: 'Under NO DLP',
        };
    }
  };

  // Traffic PCU Badge Color
  const getPcuColor = (pcu?: number | null) => {
    if (!pcu || pcu <= 0) return 'text-slate-400 dark:text-slate-600';
    if (pcu < 5000) return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40';
    if (pcu <= 15000) return 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/40';
    return 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/50 font-bold';
  };

  // Converts lateral road width from centerline (in meters) to vertical pixel offset from centerline
  // Scaled: 10 pixels per meter (1m = 10px) across all road elements:
  // 2L (7m total width / 3.5m half-width) -> 35px offset (70px total height)
  // 2L+PS (10m total width / 5.0m half-width) -> 50px offset (100px total height)
  // 4L (14m total width / 7.0m half-width) -> 70px offset (140px total height)
  // 6L (20m total width / 10.0m half-width) -> 100px offset (200px total height)
  const getLateralOffsetPx = (metersFromCenterline: number): number => {
    return Math.max(0, Number(metersFromCenterline || 0)) * 10;
  };

  // Continuous 2D DLP Position Calculator
  const getDlpPosition = useCallback(
    (dlp: DlpWorkStretch) => {
      const sFrom = Number(dlp.chainage_from_km || 0);
      const sTo = Number(dlp.chainage_to_km || 0);

      if (activeStretches.length > 0) {
        let startPx = 0;
        let endPx = canvasWidthPxActual;

        for (let i = 0; i < activeStretches.length; i++) {
          const st = activeStretches[i];
          const pos = stretchPositions.normalPosMap.get(st.id || i) || { leftPx: 0, widthPx: 0 };
          if (sFrom >= st.from_km && sFrom <= st.to_km) {
            const ratio = st.to_km > st.from_km ? (sFrom - st.from_km) / (st.to_km - st.from_km) : 0;
            startPx = pos.leftPx + ratio * pos.widthPx;
            break;
          } else if (sFrom < st.from_km && i === 0) {
            startPx = 0;
            break;
          }
        }

        for (let i = 0; i < activeStretches.length; i++) {
          const st = activeStretches[i];
          const pos = stretchPositions.normalPosMap.get(st.id || i) || { leftPx: 0, widthPx: 0 };
          if (sTo >= st.from_km && sTo <= st.to_km) {
            const ratio = st.to_km > st.from_km ? (sTo - st.from_km) / (st.to_km - st.from_km) : 1;
            endPx = pos.leftPx + ratio * pos.widthPx;
            break;
          } else if (sTo > st.to_km && i === activeStretches.length - 1) {
            endPx = pos.leftPx + pos.widthPx;
          }
        }

        const widthPx = Math.max(40, endPx - startPx);

        if (isReversed) {
          const revLeft = canvasWidthPxActual - (startPx + widthPx);
          return { leftPx: revLeft, widthPx };
        }

        return { leftPx: startPx, widthPx };
      }

      const startRatio = totalSpan > 0 ? Math.max(0, sFrom - minKm) / totalSpan : 0;
      const lenRatio = totalSpan > 0 ? Math.min(1, Number(dlp.length_km || 1) / totalSpan) : 1;
      const widthPx = Math.max(40, lenRatio * canvasWidthPxActual);
      const normalLeft = startRatio * canvasWidthPxActual;

      if (isReversed) {
        return {
          leftPx: canvasWidthPxActual - (normalLeft + widthPx),
          widthPx,
        };
      }

      return {
        leftPx: normalLeft,
        widthPx,
      };
    },
    [activeStretches, stretchPositions, minKm, totalSpan, canvasWidthPxActual, isReversed]
  );

  // Unique top-aligned DLP boundary milestone pins
  const uniqueDlpPins = useMemo(() => {
    if (!dlpStretches || dlpStretches.length === 0) return [];
    const map = new Map<number, { km: string | number; xPx: number }>();
    dlpStretches.forEach((dlp) => {
      const sFrom = Number(dlp.chainage_from_km || 0);
      const sTo = Number(dlp.chainage_to_km || 0);
      const pos = getDlpPosition(dlp);

      if (!isReversed) {
        // Normal mode: sFrom is on left, sTo is on right
        if (!Array.from(map.keys()).some((k) => Math.abs(k - sFrom) < 0.005)) {
          map.set(sFrom, { km: dlp.chainage_from_km, xPx: pos.leftPx });
        }
        if (!Array.from(map.keys()).some((k) => Math.abs(k - sTo) < 0.005)) {
          map.set(sTo, { km: dlp.chainage_to_km, xPx: pos.leftPx + pos.widthPx });
        }
      } else {
        // Reversed mode: sTo is on left, sFrom is on right
        if (!Array.from(map.keys()).some((k) => Math.abs(k - sTo) < 0.005)) {
          map.set(sTo, { km: dlp.chainage_to_km, xPx: pos.leftPx });
        }
        if (!Array.from(map.keys()).some((k) => Math.abs(k - sFrom) < 0.005)) {
          map.set(sFrom, { km: dlp.chainage_from_km, xPx: pos.leftPx + pos.widthPx });
        }
      }
    });

    return Array.from(map.values());
  }, [dlpStretches, getDlpPosition, isReversed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading Interactive Straight-Line Diagram (SLD)...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Retrieving linear asset geometry and sub-chainage metrics...</p>
      </div>
    );
  }

  if (error || !highway) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">SLD Diagram Unavailable</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md">{error}</p>
        <Link
          href="/highways"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Corridors Catalog
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans print:bg-white print:text-black print:p-2"
      style={{ '--sld-print-scale': printScale } as React.CSSProperties}
    >
      {/* Printable Document Header */}
      <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-extrabold text-xs rounded-xs">
                {highway.road_code}
              </span>
              {highway.old_nh_no && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-xs font-bold rounded-xs border border-slate-400">
                  Old NH: {highway.old_nh_no}
                </span>
              )}
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {highway.corridor_name}
              </h1>
            </div>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              National Highway Corridor Linear Asset &amp; Straight-Line Diagram (SLD) Official Report
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold text-slate-900">Tamil Nadu National Highways Division</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Report Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-xs text-slate-800 font-semibold">
          <span>Corridor Span: <strong>{isReversed ? `Km ${maxKm} → Km ${minKm}` : `Km ${minKm} → Km ${maxKm}`}</strong> ({totalSpan.toFixed(2)} km)</span>
          <span>&bull;</span>
          <span>Direction: <strong>{isReversed ? 'Reverse (Decreasing Chainage)' : 'Normal (Increasing Chainage)'}</strong></span>
          <span>&bull;</span>
          <span>Sub-Chainage Splits: <strong>{activeStretches.length} Stretches</strong></span>
          <span>&bull;</span>
          <span>Diagram Mode: <strong>{viewType === 'MICRO_LANE' ? 'Micro Splits SLD' : 'Macro Census SLD'}</strong></span>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Corridor Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/highways"
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xs transition-colors shrink-0 border border-slate-200 dark:border-slate-700"
              title="Back to Highways Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-extrabold text-xs rounded-xs">
                  {highway.road_code}
                </span>
                {highway.old_nh_no && (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] rounded-xs border border-slate-200 dark:border-slate-700 font-semibold">
                    Old NH: {highway.old_nh_no}
                  </span>
                )}
                <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white">
                  {highway.corridor_name}
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Span: <strong>{isReversed ? `Km ${maxKm} → Km ${minKm}` : `Km ${minKm} → Km ${maxKm}`}</strong> ({totalSpan.toFixed(2)} km)</span>
                <span>&bull;</span>
                <span>Sub-Chainage Split Columns: <strong>{activeStretches.length}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Pills */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xs border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewType('MICRO_LANE')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xs text-xs font-bold transition-all cursor-pointer ${
                  viewType === 'MICRO_LANE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" /> Micro Splits SLD
              </button>
              <button
                type="button"
                onClick={() => setViewType('MACRO_PCU')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xs text-xs font-bold transition-all cursor-pointer ${
                  viewType === 'MACRO_PCU'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Macro Census SLD
              </button>
            </div>

            {/* Direction Inversion Toggle */}
            <button
              type="button"
              onClick={() => setIsReversed((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold transition-all cursor-pointer border ${
                isReversed
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isReversed ? "Switch to Normal Direction (From Km → To Km)" : "Switch to Reverse Direction (To Km → From Km)"}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isReversed ? 'Reverse: To → From' : 'Normal: From → To'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xs border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 min-w-[40px] text-center">
                {zoomLevel}x
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))}
                disabled={zoomLevel >= 4}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 md:p-6 space-y-4 flex flex-col print:p-0 print:max-w-none print:w-full print:m-0 print:space-y-2">
        {/* Layer Visibility Filters Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xs flex items-center justify-between flex-wrap gap-3 print:hidden shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Interactive Split Track Layers:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={showTowns}
                onChange={(e) => setShowTowns(e.target.checked)}
                className="rounded-xs border-slate-300 text-blue-600 focus:ring-0"
              />
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Towns &amp; Landmarks</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={showCw}
                onChange={(e) => setShowCw(e.target.checked)}
                className="rounded-xs border-slate-300 text-blue-600 focus:ring-0"
              />
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Carriageway Specs</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={showPcu}
                onChange={(e) => setShowPcu(e.target.checked)}
                className="rounded-xs border-slate-300 text-blue-600 focus:ring-0"
              />
              <Car className="w-3.5 h-3.5 text-emerald-500" />
              <span>Traffic PCU</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={showRow}
                onChange={(e) => setShowRow(e.target.checked)}
                className="rounded-xs border-slate-300 text-blue-600 focus:ring-0"
              />
              <Maximize2 className="w-3.5 h-3.5 text-teal-500" />
              <span>Right of Way (ROW)</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={showDpr}
                onChange={(e) => setShowDpr(e.target.checked)}
                className="rounded-xs border-slate-300 text-blue-600 focus:ring-0"
              />
              <Info className="w-3.5 h-3.5 text-purple-500" />
              <span>DPR &amp; Schemes</span>
            </label>
          </div>
        </div>

        {/* FULL SCREEN DYNAMICALLY STRETCHED MATRIX SLD BOARD */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs shadow-md overflow-hidden flex print:border-slate-400 print:bg-white print:shadow-none print:rounded-none print:min-h-0 print:overflow-visible sld-matrix-board-print-scale"
        >
          {/* LEFT FIXED SIDEBAR: Row Labels Locked 1-to-1 to Right Canvas Rows */}
          <div className="w-56 shrink-0 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-30 select-none">
            {/* Row 1: Important Towns */}
            {showTowns && (
              <div className="h-12 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Important Towns</span>
              </div>
            )}

            {/* Row 2: Chainage Splits Header */}
            <div className="h-11 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold shrink-0">
              <Ruler className="w-4 h-4 shrink-0" />
              <span>Chainage Splits</span>
            </div>

            {/* Row 3: Height-Matched Clean Carriageway Width Dimension Arrow Gauge */}
            <div className="h-[340px] border-b border-slate-200 dark:border-slate-800 px-2 shrink-0 select-none relative overflow-hidden bg-slate-100/50 dark:bg-slate-950">
              {/* Horizontal Centerline Axis Guide Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-400/40 dark:border-white/25 z-0 pointer-events-none" />

              <div className="absolute top-2 left-2 text-[9.5px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 flex items-center gap-1 z-20">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Carriageway Gauge</span>
              </div>

              {/* Right-Facing Caliper Docking Gauge */}
              <div className="absolute inset-0 flex items-center z-10 pointer-events-none">
                {[
                  { label: '6L', width: '20m', heightPx: 200, leftOffset: '12px', color: 'text-purple-400 dark:text-purple-600 border-purple-400 dark:border-purple-600' },
                  { label: '4L / 4L+PS', width: '14m', heightPx: 140, leftOffset: '50px', color: 'text-blue-400 dark:text-blue-600 border-blue-400 dark:border-blue-600' },
                  { label: '2L+PS', width: '10m', heightPx: 100, leftOffset: '115px', color: 'text-emerald-400 dark:text-emerald-600 border-emerald-400 dark:border-emerald-600' },
                  { label: '2L', width: '7m', heightPx: 70, leftOffset: '165px', color: 'text-amber-400 dark:text-amber-600 border-amber-400 dark:border-amber-600' },
                ].map((spec) => (
                  <React.Fragment key={spec.label}>
                    {/* 1. Vertical Line */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-0.5 bg-current ${spec.color}`}
                      style={{ left: spec.leftOffset, height: `${spec.heightPx}px` }}
                    />

                    {/* 2. Top Horizontal Line */}
                    <div
                      className={`absolute h-0 overflow-visible border-t-2 ${spec.color}`}
                      style={{
                        top: `calc(50% - ${spec.heightPx / 2}px)`,
                        left: spec.leftOffset,
                        right: 0,
                      }}
                    />

                    {/* 3. Bottom Horizontal Line */}
                    <div
                      className={`absolute h-0 overflow-visible border-t-2 ${spec.color}`}
                      style={{
                        top: `calc(50% + ${spec.heightPx / 2}px - 2px)`,
                        left: spec.leftOffset,
                        right: 0,
                      }}
                    />

                    {/* 4. Bracket Text Label */}
                    <div
                      className="absolute flex flex-col items-start leading-none pointer-events-none z-20"
                      style={{
                        left: `calc(${spec.leftOffset} + 6px)`,
                        top: `calc(50% - ${spec.heightPx / 2}px + 4px)`,
                      }}
                    >
                      <span className={`text-[8.5px] font-extrabold font-mono tracking-tighter ${spec.color}`}>
                        {spec.label}
                      </span>
                      <span className="text-[7.5px] font-mono font-bold text-slate-500 dark:text-slate-400">
                        {spec.width}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Row 4: Carriageway Specs / Width */}
            {showCw && (
              <div className="h-11 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold shrink-0">
                <ArrowUpDown className="w-4 h-4 shrink-0" />
                <span>Carriageway Specs</span>
              </div>
            )}

            {/* Row 5: Traffic PCU Volume */}
            {showPcu && (
              <div className="h-11 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                <Car className="w-4 h-4 shrink-0" />
                <span>Traffic PCU Volume</span>
              </div>
            )}

            {/* Row 6: Right of Way (ROW) */}
            {showRow && (
              <div className="h-11 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold shrink-0">
                <Maximize2 className="w-4 h-4 shrink-0" />
                <span>Right of Way (ROW)</span>
              </div>
            )}

            {/* Row 7: Sanctioned DPR Proposals & Remarks */}
            {showDpr && (
              <div className="h-12 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold shrink-0">
                <Info className="w-4 h-4 shrink-0" />
                <span>DPR &amp; Schemes</span>
              </div>
            )}
          </div>

          {/* RIGHT HORIZONTAL SCROLL AREA: Matrix Tracks Matching Sidebar Rows */}
          <div className="flex-1 overflow-x-auto bg-white dark:bg-slate-900 flex flex-col">
            <div
              className="relative transition-all duration-300 flex flex-col shrink-0"
              style={{ width: `${canvasWidthPxActual}px` }}
            >
              {/* TRACK 1: Important Towns Grid Row (Height 48px / h-12) */}
              {showTowns && (
                <div className="relative h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const { leftPx, widthPx } = getStretchPos(st, i);

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center px-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        onMouseEnter={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                        onClick={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                      >
                        {st.important_town ? (
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded-xs flex items-center gap-1 truncate max-w-full shadow-2xs font-semibold">
                            <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate">{st.important_town}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 2: Chainage Splits Header Row (Height 44px / h-11) */}
              <div className="relative h-11 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/90 flex items-center shrink-0">
                {/* Baseline Corridor Sub-Chainages */}
                {activeStretches.map((st, i) => {
                  const { leftPx, widthPx } = getStretchPos(st, i);

                  return (
                    <div
                      key={st.id || i}
                      className="absolute h-full border-r border-slate-300 dark:border-slate-700 flex items-center justify-between px-2 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 overflow-hidden cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
                      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                      onMouseEnter={() => {
                        setHoveredDlpStretch(null);
                        setHoveredStretch(st);
                      }}
                      onClick={() => {
                        setHoveredDlpStretch(null);
                        setHoveredStretch(st);
                      }}
                    >
                      <span className="truncate">Km {isReversed ? st.to_km : st.from_km}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-[9px] bg-white dark:bg-slate-900 px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 shrink-0 font-sans font-semibold">
                        {st.length_km} km
                      </span>
                      <span className="truncate">Km {isReversed ? st.from_km : st.to_km}</span>
                    </div>
                  );
                })}
              </div>

              {/* TRACK 3: CENTERLINE-ALIGNED ROAD CORRIDOR */}
              <div className="relative h-[340px] border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/90 flex items-center shrink-0 overflow-hidden">
                {/* Horizontal Road Centerline Guide Line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-400/40 dark:border-white/25 z-0 pointer-events-none" />

                {/* Top-Ceiling Uniform Milestone Pins for DLP Work Boundaries (Edge-Aware Clamped) */}
                {uniqueDlpPins.map((pin) => {
                  const isLeftEdge = pin.xPx <= 24;
                  const isRightEdge = canvasWidthPxActual - pin.xPx <= 24;

                  const translateClass = isLeftEdge
                    ? 'translate-x-0 items-start'
                    : isRightEdge
                    ? '-translate-x-full items-end'
                    : '-translate-x-1/2 items-center';

                  const guidelinePos = isLeftEdge
                    ? 'left-0'
                    : isRightEdge
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2';

                  return (
                    <div
                      key={`dlp-pin-${pin.km}`}
                      className={`absolute top-2 z-40 pointer-events-none flex flex-col select-none ${translateClass}`}
                      style={{ left: `${pin.xPx}px` }}
                    >
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 rounded-sm text-[8.5px] font-mono font-black shadow-md flex items-center gap-0.5 whitespace-nowrap border border-white/40">
                        📍 Km {pin.km}
                      </span>
                      <div className={`w-px h-10 border-l border-dashed border-slate-400/60 dark:border-slate-500/60 relative ${guidelinePos}`} />
                    </div>
                  );
                })}

                {activeStretches.length === 0 && dlpStretches.length === 0 ? (
                  <div className="w-full text-center text-xs text-slate-400 py-8">
                    No micro sub-chainage stretches or DLP works defined for this corridor.
                  </div>
                ) : (
                  <>
                    {/* Baseline Carriageway Lane Spans */}
                    {activeStretches.map((st, i) => {
                      const { leftPx, widthPx } = getStretchPos(st, i);
                      const style = getLaneStyle(st.lane_configuration);

                      return (
                        <div
                          key={st.id || i}
                          className={`absolute top-1/2 -translate-y-1/2 border-r border-slate-300 dark:border-white/20 border-y transition-all duration-200 cursor-pointer hover:brightness-110 dark:hover:brightness-125 hover:z-20 shadow-xs ${style.bg} ${style.border} print:bg-slate-200 print:border-slate-500 flex items-center justify-center overflow-hidden px-1`}
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                            height: `${style.heightPx}px`,
                          }}
                          onMouseEnter={() => {
                            setHoveredDlpStretch(null);
                            setHoveredStretch(st);
                          }}
                          onClick={() => {
                            setHoveredDlpStretch(null);
                            setHoveredStretch(st);
                          }}
                          title={`Road Stretch Km ${st.from_km} → Km ${st.to_km} (${st.length_km} km, ${st.lane_configuration}) - ${st.dpr_status || st.important_town || 'Baseline Stretch'}`}
                        >
                          <span className="text-[10px] font-extrabold font-mono text-slate-800 dark:text-slate-200 print:text-slate-900 truncate select-none px-1">
                            {st.dpr_status || st.important_town || `${st.lane_configuration} (${st.length_km}km)`}
                          </span>
                        </div>
                      );
                    })}

                    {/* 2D DLP Continuous Work Boundaries Overlay (Intelligent Boundary Splitting) */}
                    {dlpStretches.map((dlp, dIdx) => {
                      const { leftPx, widthPx } = getDlpPosition(dlp);
                      const style = getDlpCategoryStyle(dlp.category);
                      const workTitle = dlp.work_name || dlp.scheme || dlp.category;
                      const contractorTitle = dlp.contractor_name || 'Assigned Agency';
                      const wFrom = Number(dlp.road_width_from_m ?? 0);
                      const wTo = Number(dlp.road_width_to_m ?? 3.5);

                      const rightDateLabel = dlp.category === 'NO_DLP'
                        ? `DLP Ended: ${formatDateIndian(dlp.dlp_ended_on_date || dlp.dlp_till_date)}`
                        : dlp.category === 'CONSTRUCTION'
                        ? `Progress: ${dlp.physical_progress_pct ?? 0}%`
                        : `DLP Till: ${formatDateIndian(dlp.dlp_till_date)}`;

                      // Center Carriageway Work (0m to Width): 1 Continuous Symmetrical Central Band
                      if (wFrom === 0) {
                        const offsetToPx = getLateralOffsetPx(wTo);
                        const heightPx = Math.max(20, offsetToPx * 2);

                        return (
                          <div
                            key={dlp.id || dIdx}
                            className={`absolute top-1/2 -translate-y-1/2 rounded-xs shadow-md transition-all duration-150 cursor-pointer hover:brightness-110 hover:z-40 flex items-center justify-between overflow-hidden px-2 z-30 ${style.bg} ${style.border} ${style.text}`}
                            style={{
                              left: `${leftPx}px`,
                              width: `${widthPx}px`,
                              height: `${heightPx}px`,
                            }}
                            onMouseEnter={() => {
                              setHoveredStretch(null);
                              setHoveredDlpStretch(dlp);
                            }}
                            onClick={() => {
                              setHoveredStretch(null);
                              setHoveredDlpStretch(dlp);
                            }}
                            title={`${dlp.category} | Contractor: ${contractorTitle} | Work: ${workTitle} | ${rightDateLabel} (Km ${dlp.chainage_from_km} → Km ${dlp.chainage_to_km}, Width 0 to ${wTo}m)`}
                          >
                            {/* Left: Contractor Name */}
                            <span className="text-[9.5px] md:text-[10.5px] font-black uppercase tracking-tight text-white/90 drop-shadow-xs shrink-0 max-w-[28%] truncate pr-1 select-none">
                              {contractorTitle}
                            </span>

                            {/* Middle: Name of the Work (Wrapped so everything fits inside boundary) */}
                            <span className="text-[10px] md:text-[11px] font-black tracking-tight text-center px-1 break-words line-clamp-2 drop-shadow-xs flex-1 min-w-0 leading-tight select-none">
                              {workTitle}
                            </span>

                            {/* Right: DLP Ended / Till Date based on type */}
                            <span className="text-[9px] md:text-[10px] font-mono font-black text-white/95 drop-shadow-xs shrink-0 max-w-[32%] text-right truncate pl-1 select-none">
                              {rightDateLabel}
                            </span>
                          </div>
                        );
                      }

                      // Widening Work: 2 Symmetrical Parallel Boundary Strips (LHS & RHS)
                      const offsetFromPx = getLateralOffsetPx(wFrom);
                      const offsetToPx = getLateralOffsetPx(wTo);
                      const stripHeightPx = Math.max(14, offsetToPx - offsetFromPx);
                      const topUpperPx = `calc(50% - ${offsetToPx}px)`;
                      const topLowerPx = `calc(50% + ${offsetFromPx}px)`;

                      return (
                        <React.Fragment key={dlp.id || dIdx}>
                          {/* Upper LHS Strip */}
                          <div
                            className={`absolute rounded-xs shadow-md transition-all duration-150 cursor-pointer hover:brightness-110 hover:z-40 flex items-center justify-between overflow-hidden px-1.5 z-30 ${style.bg} ${style.border} ${style.text}`}
                            style={{
                              left: `${leftPx}px`,
                              width: `${widthPx}px`,
                              top: topUpperPx,
                              height: `${stripHeightPx}px`,
                            }}
                            onMouseEnter={() => {
                              setHoveredStretch(null);
                              setHoveredDlpStretch(dlp);
                            }}
                            onClick={() => {
                              setHoveredStretch(null);
                              setHoveredDlpStretch(dlp);
                            }}
                            title={`LHS Widening | Contractor: ${contractorTitle} | Work: ${workTitle} | ${rightDateLabel}`}
                          >
                            <span className="text-[8.5px] font-black uppercase tracking-tight text-white/90 drop-shadow-xs shrink-0 max-w-[28%] truncate pr-1 select-none">
                              {contractorTitle}
                            </span>
                            <span className="text-[9px] font-black tracking-tight text-center px-1 break-words line-clamp-1 drop-shadow-xs flex-1 min-w-0 leading-tight select-none">
                              {workTitle}
                            </span>
                            <span className="text-[8.5px] font-mono font-black text-white/95 drop-shadow-xs shrink-0 max-w-[32%] text-right truncate pl-1 select-none">
                              {rightDateLabel}
                            </span>
                          </div>

                          {/* Lower RHS Strip */}
                          <div
                            className={`absolute rounded-xs shadow-md transition-all duration-150 cursor-pointer hover:brightness-110 hover:z-40 flex items-center justify-between overflow-hidden px-1.5 z-30 ${style.bg} ${style.border} ${style.text}`}
                            style={{
                              left: `${leftPx}px`,
                              width: `${widthPx}px`,
                              top: topLowerPx,
                              height: `${stripHeightPx}px`,
                            }}
                            onMouseEnter={() => {
                              setHoveredStretch(null);
                              setHoveredDlpStretch(dlp);
                            }}
                            onClick={() => {
                              setHoveredStretch(null);
                              setHoveredDlpStretch(dlp);
                            }}
                            title={`RHS Widening | Contractor: ${contractorTitle} | Work: ${workTitle} | ${rightDateLabel}`}
                          >
                            <span className="text-[8.5px] font-black uppercase tracking-tight text-white/90 drop-shadow-xs shrink-0 max-w-[28%] truncate pr-1 select-none">
                              {contractorTitle}
                            </span>
                            <span className="text-[9px] font-black tracking-tight text-center px-1 break-words line-clamp-1 drop-shadow-xs flex-1 min-w-0 leading-tight select-none">
                              {workTitle}
                            </span>
                            <span className="text-[8.5px] font-mono font-black text-white/95 drop-shadow-xs shrink-0 max-w-[32%] text-right truncate pl-1 select-none">
                              {rightDateLabel}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>

              {/* TRACK 4: Carriageway Specs / Width Grid Row (Height 44px / h-11) */}
              {showCw && (
                <div className="relative h-11 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const { leftPx, widthPx } = getStretchPos(st, i);
                    const norm = (st.lane_configuration || '').toLowerCase();
                    
                    let badgeStyle = 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40';
                    let widthNum = '7m';

                    if (norm.includes('6l') || norm.includes('6-lane')) {
                      badgeStyle = 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/50';
                      widthNum = '20m';
                    } else if (norm.includes('4l') || norm.includes('4-lane')) {
                      badgeStyle = 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/50';
                      widthNum = '14m';
                    } else if (norm.includes('2l+ps') || norm.includes('paved')) {
                      badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/50';
                      widthNum = '10m';
                    } else if (norm.includes('2l') || norm.includes('2-lane')) {
                      badgeStyle = 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/50';
                      widthNum = '7m';
                    }

                    const specLabel = st.carriageway_width
                      ? `CW: ${st.carriageway_width}`
                      : st.lane_configuration
                      ? `${st.lane_configuration} (${widthNum})`
                      : '';

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center px-1 text-[10px] font-bold truncate cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        onMouseEnter={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                        onClick={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                      >
                        {specLabel ? (
                          <span className={`px-2 py-1 border rounded-xs truncate max-w-full font-mono shadow-2xs flex items-center justify-center gap-1 ${badgeStyle}`}>
                            <span className="truncate">{specLabel}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 5: Traffic PCU Volume Grid Row (Height 44px / h-11) */}
              {showPcu && (
                <div className="relative h-11 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const { leftPx, widthPx } = getStretchPos(st, i);
                    const pcuStyle = getPcuColor(st.pcu_count);

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center px-1 text-[10px] font-mono font-bold truncate cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        onMouseEnter={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                        onClick={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                      >
                        {st.pcu_count && st.pcu_count > 0 ? (
                          <span className={`px-2 py-0.5 border rounded-xs truncate ${pcuStyle}`}>
                            {st.pcu_count.toLocaleString()} PCU
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 6: Right of Way (ROW) Grid Row (Height 44px / h-11) */}
              {showRow && (
                <div className="relative h-11 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const { leftPx, widthPx } = getStretchPos(st, i);

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center px-1 text-[10px] font-bold truncate cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        onMouseEnter={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                        onClick={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                      >
                        {st.row_width ? (
                          <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 rounded-xs truncate max-w-full font-mono">
                            RoW: {st.row_width}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 7: Sanctioned DPR Proposals & Remarks Grid Row (Height 48px / h-12) */}
              {showDpr && (
                <div className="relative h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const { leftPx, widthPx } = getStretchPos(st, i);

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center px-1.5 text-[10px] font-semibold truncate cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-950/40 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        onMouseEnter={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                        onClick={() => {
                          setHoveredDlpStretch(null);
                          setHoveredStretch(st);
                        }}
                      >
                        {st.dpr_status ? (
                          <span className="px-2 py-1 bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-500/50 rounded-xs flex items-center gap-1 truncate max-w-full shadow-2xs">
                            <Info className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span className="truncate">{st.dpr_status}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover / Selection Detail Passport Card */}
        {(hoveredDlpStretch || hoveredStretch) && (
          <div className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 p-4 rounded-xs shadow-xl flex flex-col gap-3 animate-in fade-in duration-150 shrink-0 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* If a DLP work boundary is hovered/clicked */}
              {hoveredDlpStretch ? (
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded font-extrabold text-xs ${getDlpCategoryStyle(hoveredDlpStretch.category).badgeBg}`}>
                      {getDlpCategoryStyle(hoveredDlpStretch.category).label}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {hoveredDlpStretch.work_name || hoveredDlpStretch.scheme || 'Untitled Work Stretch'}
                    </span>
                  </div>

                  {/* 2D Dimensions & Timeline Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Chainage Span:</strong>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                        Km {hoveredDlpStretch.chainage_from_km} &rarr; Km {hoveredDlpStretch.chainage_to_km} ({hoveredDlpStretch.length_km} km)
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Road Width (Centerline):</strong>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {hoveredDlpStretch.road_width_from_m}m &rarr; {hoveredDlpStretch.road_width_to_m}m
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Contractor / Agency:</strong>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {hoveredDlpStretch.contractor_name || 'Assigned Agency'}
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">
                        {hoveredDlpStretch.category === 'CONSTRUCTION'
                          ? 'Progress & Completion:'
                          : hoveredDlpStretch.category === 'NO_DLP'
                          ? 'DLP Ended On:'
                          : 'DLP Till Date:'}
                      </strong>
                      <span className="font-bold font-mono">
                        {hoveredDlpStretch.category === 'CONSTRUCTION'
                          ? `${hoveredDlpStretch.physical_progress_pct ?? 0}% (${formatDateIndian(hoveredDlpStretch.actual_completion_date) === '—' ? 'In Progress' : formatDateIndian(hoveredDlpStretch.actual_completion_date)})`
                          : hoveredDlpStretch.category === 'NO_DLP'
                          ? formatDateIndian(hoveredDlpStretch.dlp_ended_on_date)
                          : formatDateIndian(hoveredDlpStretch.dlp_till_date)}
                      </span>
                    </div>
                  </div>

                  {hoveredDlpStretch.remarks && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                      Remarks: {hoveredDlpStretch.remarks}
                    </p>
                  )}
                </div>
              ) : hoveredStretch ? (
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded font-extrabold text-xs bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                      {hoveredStretch.dpr_status ? 'DPR Proposal' : 'Corridor Sub-Section'}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {hoveredStretch.important_town ? `Town / Landmark: ${hoveredStretch.important_town}` : `${hoveredStretch.lane_configuration} Corridor Stretch`}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                      {hoveredStretch.lane_configuration}
                    </span>
                  </div>

                  {/* 2D Dimensions & Technical Specifications Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Chainage Span:</strong>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                        Km {hoveredStretch.from_km} &rarr; Km {hoveredStretch.to_km} ({hoveredStretch.length_km} km)
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Carriageway / ROW:</strong>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        CW: {hoveredStretch.carriageway_width || '—'} | ROW: {hoveredStretch.row_width || '—'}
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">Traffic Volume:</strong>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {hoveredStretch.pcu_count > 0 ? `${hoveredStretch.pcu_count.toLocaleString()} PCU` : '—'}
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-500 block text-[10px] uppercase">DPR Sanction Status:</strong>
                      <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">
                        {hoveredStretch.dpr_status || 'No Active DPR Proposal'}
                      </span>
                    </div>
                  </div>

                  {hoveredStretch.stretch_name && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                      Section: {hoveredStretch.stretch_name}
                    </p>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setHoveredStretch(null);
                  setHoveredDlpStretch(null);
                }}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xs transition-colors shrink-0 cursor-pointer self-start md:self-auto border border-slate-200 dark:border-slate-700"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        )}

        {/* Printable Report Technical Legend */}
        <div className="hidden print:block mt-6 pt-4 border-t-2 border-slate-800 text-xs text-slate-900">
          <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">
            SLD Technical Legend &amp; Operational Reference Guide
          </h3>
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xs border border-slate-300">
            <div>
              <span className="font-bold text-slate-900 block mb-1">Carriageway Gauge Heights:</span>
              <ul className="space-y-0.5 text-[10px] text-slate-700">
                <li>&bull; <strong>6L (20m):</strong> 6-Lane Dual Carriageway</li>
                <li>&bull; <strong>4L / 4L+PS (14m):</strong> 4-Lane / Paved Shoulder</li>
                <li>&bull; <strong>2L+PS (10m):</strong> 2-Lane + Paved Shoulder</li>
                <li>&bull; <strong>2L (7m):</strong> Standard 2-Lane Carriageway</li>
              </ul>
            </div>
            <div>
              <span className="font-bold text-slate-900 block mb-1">Traffic PCU Volume Range:</span>
              <ul className="space-y-0.5 text-[10px] text-slate-700">
                <li>&bull; <strong>Low Volume:</strong> &lt; 5,000 PCU / day</li>
                <li>&bull; <strong>Medium Volume:</strong> 5,000 – 15,000 PCU / day</li>
                <li>&bull; <strong>High Traffic:</strong> &gt; 15,000 PCU / day</li>
              </ul>
            </div>
            <div>
              <span className="font-bold text-slate-900 block mb-1">Official Verification:</span>
              <p className="text-[10px] text-slate-700">
                Linear asset matrix verified against Level 1 corridor master record &amp; Level 2 sub-chainage breakdown data.
              </p>
              <p className="text-[9px] text-slate-500 mt-2 font-mono">
                Generated via TN National Highways Management System
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
