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
} from 'lucide-react';
import { SubChainageStretch } from '@/app/api/sub-chainages/route';

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
  const [showTowns, setShowTowns] = useState<boolean>(true);
  const [showPcu, setShowPcu] = useState<boolean>(true);
  const [showRow, setShowRow] = useState<boolean>(true);
  const [showDpr, setShowDpr] = useState<boolean>(true);
  const [hoveredStretch, setHoveredStretch] = useState<SubChainageStretch | null>(null);

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

  // Calculate Chainage Span
  const { minKm, maxKm, totalSpan } = useMemo(() => {
    if (activeStretches.length === 0) {
      const len = highway?.length_km || 10;
      return { minKm: 0, maxKm: len, totalSpan: len };
    }
    const min = Math.min(...activeStretches.map((s) => s.from_km));
    const max = Math.max(...activeStretches.map((s) => s.to_km));
    const span = Math.max(1, max - min);
    return { minKm: min, maxKm: max, totalSpan: span };
  }, [activeStretches, highway]);

  // Equal Cell Column Width (Excel-like Grid Cells for Maximum Human Readability)
  const colWidthPx = useMemo(() => {
    return Math.max(150, Math.round(150 * zoomLevel));
  }, [zoomLevel]);

  // Total Canvas Width based on number of split columns
  const canvasWidthPx = useMemo(() => {
    const numCols = Math.max(1, activeStretches.length);
    return Math.max(1000, numCols * colWidthPx);
  }, [activeStretches.length, colWidthPx]);

  // Helper for Excel bar height specs (Colors neutral, reserved for DLP contract status)
  const getLaneStyle = (laneConfig: string) => {
    const norm = (laneConfig || '').toLowerCase();
    const neutralStyle = {
      bg: 'bg-slate-700/80 hover:bg-slate-600/90 text-slate-200',
      border: 'border-slate-500/70',
    };

    if (norm.includes('6l') || norm.includes('6-lane')) {
      return {
        ...neutralStyle,
        label: '6-Lane (6L)',
        heightPx: 150,
      };
    }
    if (norm.includes('4l') || norm.includes('4-lane')) {
      return {
        ...neutralStyle,
        label: '4-Lane / 4L+PS',
        heightPx: 110,
      };
    }
    if (norm.includes('2l+ps') || norm.includes('paved')) {
      return {
        ...neutralStyle,
        label: '2L + Paved Shoulder',
        heightPx: 75,
      };
    }
    if (norm.includes('2l') || norm.includes('2-lane')) {
      return {
        ...neutralStyle,
        label: '2-Lane (2L)',
        heightPx: 40,
      };
    }
    return {
      ...neutralStyle,
      label: '< 2-Lane',
      heightPx: 22,
    };
  };

  // Traffic PCU Badge Color
  const getPcuColor = (pcu: number) => {
    if (!pcu || pcu <= 0) return 'bg-slate-900/60 text-slate-500 border-slate-800';
    if (pcu < 5000) return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
    if (pcu <= 15000) return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
    return 'bg-red-950/70 text-red-300 border-red-500/50 font-bold';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading Interactive Straight-Line Diagram (SLD)...</h2>
        <p className="text-sm text-slate-400 mt-1">Retrieving linear asset geometry and sub-chainage metrics...</p>
      </div>
    );
  }

  if (error || !highway) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-red-400">SLD Diagram Unavailable</h2>
        <p className="text-sm text-slate-300 mt-1 max-w-md">{error}</p>
        <Link
          href="/highways"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Corridors Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans print:bg-white print:text-black">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Corridor Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/highways"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0"
              title="Back to Highways Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-extrabold text-xs rounded">
                  {highway.road_code}
                </span>
                {highway.old_nh_no && (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded border border-slate-700">
                    Old NH: {highway.old_nh_no}
                  </span>
                )}
                <h1 className="text-sm md:text-base font-extrabold text-white">
                  {highway.corridor_name}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Span: <strong>Km {minKm} → Km {maxKm}</strong> ({totalSpan.toFixed(2)} km)</span>
                <span>&bull;</span>
                <span>Sub-Chainage Split Columns: <strong>{activeStretches.length}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Pills */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setViewType('MICRO_LANE')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewType === 'MICRO_LANE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" /> Micro Splits SLD
              </button>
              <button
                type="button"
                onClick={() => setViewType('MACRO_PCU')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewType === 'MACRO_PCU'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Macro Census SLD
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-bold text-blue-400 min-w-[40px] text-center">
                {zoomLevel}x
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))}
                disabled={zoomLevel >= 4}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 md:p-6 space-y-4 flex flex-col">
        {/* Layer Visibility Filters Bar */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between flex-wrap gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Interactive Split Track Layers:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/60">
              <input
                type="checkbox"
                checked={showTowns}
                onChange={(e) => setShowTowns(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Towns &amp; Landmarks</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/60">
              <input
                type="checkbox"
                checked={showPcu}
                onChange={(e) => setShowPcu(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Traffic PCU</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/60">
              <input
                type="checkbox"
                checked={showRow}
                onChange={(e) => setShowRow(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Right of Way (ROW)</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/60">
              <input
                type="checkbox"
                checked={showDpr}
                onChange={(e) => setShowDpr(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <Info className="w-3.5 h-3.5 text-purple-400" />
              <span>DPR &amp; Schemes</span>
            </label>
          </div>
        </div>

        {/* FULL SCREEN DYNAMICALLY STRETCHED MATRIX SLD BOARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-1 min-h-[500px] print:border-black print:bg-white">
          
          {/* LEFT FIXED SIDEBAR: Row Labels Locked 1-to-1 to Right Canvas Rows */}
          <div className="w-56 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col z-30 select-none">
            {/* Row 1: Important Towns */}
            {showTowns && (
              <div className="h-12 border-b border-slate-800 px-3 flex items-center gap-2 text-amber-400 text-xs font-bold shrink-0">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Important Towns</span>
              </div>
            )}

            {/* Row 2: Chainage Splits Header */}
            <div className="h-11 border-b border-slate-800 px-3 flex items-center gap-2 text-blue-400 text-xs font-bold shrink-0">
              <Ruler className="w-4 h-4 shrink-0" />
              <span>Chainage Splits</span>
            </div>

            {/* Row 3: Height-Matched Clean Carriageway Width Dimension Arrow Gauge */}
            <div className="flex-1 min-h-[200px] border-b border-slate-800 px-2 py-2 flex flex-col justify-between shrink-0 select-none relative overflow-hidden bg-slate-950">
              {/* Horizontal Centerline Axis Guide Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/25 z-0 pointer-events-none" />

              <div className="absolute top-2 left-2 text-[9.5px] font-extrabold uppercase text-indigo-400 flex items-center gap-1 z-20">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span>Carriageway Gauge</span>
              </div>

              {/* Height-Matched Clean Dimension Arrow Columns (Centered EXACTLY at Y=50%) */}
              <div className="absolute inset-0 flex items-center justify-around z-10 px-1">
                {[
                  { label: '6L', width: '20m', heightPx: 150, color: 'text-purple-400 border-purple-400' },
                  { label: '4L', width: '14m', heightPx: 110, color: 'text-blue-400 border-blue-400' },
                  { label: '2L+PS', width: '10m', heightPx: 75, color: 'text-emerald-400 border-emerald-400' },
                  { label: '2L', width: '7m', heightPx: 40, color: 'text-amber-400 border-amber-400' },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center relative flex-1 h-full"
                    title={`${spec.label} (${spec.width} width) - Height: ${spec.heightPx}px`}
                  >
                    {/* 100% CLEAN UNBROKEN VERTICAL ARROW LINE (Exact Height Match) */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 left-1 w-0.5 bg-current flex flex-col justify-between items-center ${spec.color}`}
                      style={{ height: `${spec.heightPx}px` }}
                    >
                      {/* Top Arrowhead at exact top boundary of lane height */}
                      <div className="w-1.5 h-1.5 border-t-2 border-l-2 border-current rotate-45 -mt-1 shrink-0" />
                      {/* Bottom Arrowhead at exact bottom boundary of lane height */}
                      <div className="w-1.5 h-1.5 border-b-2 border-r-2 border-current rotate-45 -mb-1 shrink-0" />
                    </div>

                    {/* SIDE TEXT LABEL (Placed to the right side of arrow line) */}
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex flex-col items-start leading-none space-y-0.5 pointer-events-none">
                      <span className={`text-[8.5px] font-extrabold font-mono tracking-tighter ${spec.color}`}>
                        {spec.label}
                      </span>
                      <span className="text-[7.5px] font-mono font-bold text-slate-400">
                        {spec.width}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Traffic PCU Volume */}
            {showPcu && (
              <div className="h-11 border-b border-slate-800 px-3 flex items-center gap-2 text-emerald-400 text-xs font-bold shrink-0">
                <Car className="w-4 h-4 shrink-0" />
                <span>Traffic PCU Volume</span>
              </div>
            )}

            {/* Row 5: Right of Way (ROW) */}
            {showRow && (
              <div className="h-11 border-b border-slate-800 px-3 flex items-center gap-2 text-teal-400 text-xs font-bold shrink-0">
                <Maximize2 className="w-4 h-4 shrink-0" />
                <span>Right of Way (ROW)</span>
              </div>
            )}

            {/* Row 6: Sanctioned DPR Proposals & Remarks */}
            {showDpr && (
              <div className="h-12 border-b border-slate-800 px-3 flex items-center gap-2 text-purple-400 text-xs font-bold shrink-0">
                <Info className="w-4 h-4 shrink-0" />
                <span>DPR &amp; Schemes</span>
              </div>
            )}
          </div>

          {/* RIGHT HORIZONTAL SCROLL AREA: Matrix Tracks Matching Sidebar Rows */}
          <div className="flex-1 overflow-x-auto bg-slate-900 flex flex-col">
            <div
              className="relative transition-all duration-300 flex flex-col flex-1"
              style={{ width: `${canvasWidthPx}px` }}
            >
              {/* TRACK 1: Important Towns Grid Row (Height 48px / h-12) */}
              {showTowns && (
                <div className="relative h-12 border-b border-slate-800 bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const leftPx = i * colWidthPx;

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-800 flex items-center justify-center px-1 text-[11px] font-bold text-amber-300 truncate cursor-pointer hover:bg-amber-950/40 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${colWidthPx}px` }}
                        onClick={() => setHoveredStretch(st)}
                      >
                        {st.important_town ? (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md flex items-center gap-1 truncate max-w-full shadow-xs">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{st.important_town}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 2: Chainage Splits Header Row (Height 44px / h-11) */}
              <div className="relative h-11 border-b border-slate-800 bg-slate-850 dark:bg-slate-950/90 flex items-center shrink-0">
                {activeStretches.map((st, i) => {
                  const leftPx = i * colWidthPx;

                  return (
                    <div
                      key={st.id || i}
                      className="absolute h-full border-r border-slate-700 flex items-center justify-between px-2 text-[10px] font-mono font-bold text-blue-300 truncate"
                      style={{ left: `${leftPx}px`, width: `${colWidthPx}px` }}
                    >
                      <span className="truncate">Km {st.from_km}</span>
                      <span className="text-slate-400 text-[9px] bg-slate-900 px-1 py-0.5 rounded border border-slate-700 shrink-0 font-sans">
                        {st.length_km}k
                      </span>
                      <span className="truncate">Km {st.to_km}</span>
                    </div>
                  );
                })}
              </div>

              {/* TRACK 3: CENTERLINE-ALIGNED ROAD CORRIDOR (STRETCHED DYNAMICALLY) */}
              <div className="relative flex-1 min-h-[200px] border-b border-slate-800 bg-slate-950/90 flex items-center shrink-0 overflow-hidden">
                {/* Horizontal Road Centerline Guide Line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/25 z-0 pointer-events-none" />

                {activeStretches.length === 0 ? (
                  <div className="w-full text-center text-xs text-slate-500 py-8">
                    No micro sub-chainage stretches defined for this corridor. Add stretches in Level 2 to render the SLD timeline.
                  </div>
                ) : (
                  activeStretches.map((st, i) => {
                    const leftPx = i * colWidthPx;
                    const style = getLaneStyle(st.lane_configuration);

                    return (
                      <div
                        key={st.id || i}
                        className={`absolute top-1/2 -translate-y-1/2 border-r border-white/25 border-y transition-all duration-200 cursor-pointer hover:brightness-125 hover:z-30 shadow-md ${style.bg} ${style.border}`}
                        style={{
                          left: `${leftPx}px`,
                          width: `${colWidthPx}px`,
                          height: `${style.heightPx}px`,
                        }}
                        onMouseEnter={() => setHoveredStretch(st)}
                        onClick={() => setHoveredStretch(st)}
                        title={`Road Stretch Km ${st.from_km} → Km ${st.to_km} (${st.length_km} km, ${st.lane_configuration}) - Neutral Baseline Box (Colors reserved for DLP contract data)`}
                      >
                        {/* 100% EMPTY INSIDE - NEUTRAL COLOR FILL (RESERVED FOR DLP CONTRACT DATA) */}
                      </div>
                    );
                  })
                )}
              </div>

              {/* TRACK 4: Traffic PCU Volume Grid Row (Height 44px / h-11) */}
              {showPcu && (
                <div className="relative h-11 border-b border-slate-800 bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const leftPx = i * colWidthPx;
                    const pcuStyle = getPcuColor(st.pcu_count);

                    return (
                      <div
                        key={st.id || i}
                        className={`absolute h-full top-0 border-r border-slate-800 flex items-center justify-center px-1 text-[10px] font-mono font-bold truncate ${pcuStyle}`}
                        style={{ left: `${leftPx}px`, width: `${colWidthPx}px` }}
                      >
                        {st.pcu_count && st.pcu_count > 0 ? (
                          <span className="truncate">{st.pcu_count.toLocaleString()} PCU</span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 5: Right of Way (ROW) Grid Row (Height 44px / h-11) */}
              {showRow && (
                <div className="relative h-11 border-b border-slate-800 bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const leftPx = i * colWidthPx;

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-800 flex items-center justify-center px-1 text-[10px] font-bold text-teal-300 truncate"
                        style={{ left: `${leftPx}px`, width: `${colWidthPx}px` }}
                      >
                        {st.row_width ? (
                          <span className="px-2 py-0.5 bg-teal-950/70 text-teal-300 border border-teal-500/40 rounded truncate max-w-full">
                            RoW: {st.row_width}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TRACK 6: Sanctioned DPR Proposals & Remarks Grid Row (Height 48px / h-12) */}
              {showDpr && (
                <div className="relative h-12 border-b border-slate-800 bg-slate-950/60 flex items-center shrink-0">
                  {activeStretches.map((st, i) => {
                    const leftPx = i * colWidthPx;

                    return (
                      <div
                        key={st.id || i}
                        className="absolute h-full top-0 border-r border-slate-800 flex items-center justify-center px-1.5 text-[10px] font-semibold text-purple-200 truncate cursor-pointer hover:bg-purple-950/40 transition-colors"
                        style={{ left: `${leftPx}px`, width: `${colWidthPx}px` }}
                        onClick={() => setHoveredStretch(st)}
                      >
                        {st.dpr_status ? (
                          <span className="px-2 py-1 bg-purple-950/80 text-purple-200 border border-purple-500/50 rounded-md flex items-center gap-1 truncate max-w-full shadow-xs">
                            <Info className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">{st.dpr_status}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stretch Hover Detail Card */}
        {hoveredStretch && (
          <div className="bg-slate-900 border border-blue-500/50 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded">
                  Km {hoveredStretch.from_km} → Km {hoveredStretch.to_km}
                </span>
                <span className="text-xs font-extrabold text-slate-200">
                  Length: {hoveredStretch.length_km} km
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded border border-slate-700">
                  {hoveredStretch.lane_configuration}
                </span>
              </div>
              <p className="text-xs text-slate-300 pt-1 flex items-center gap-4 flex-wrap">
                {hoveredStretch.important_town && (
                  <span className="text-amber-400 font-bold">
                    📍 Town: {hoveredStretch.important_town}
                  </span>
                )}
                {hoveredStretch.row_width && (
                  <span className="text-teal-400 font-bold">
                    Right of Way: {hoveredStretch.row_width}
                  </span>
                )}
                {hoveredStretch.carriageway_width && (
                  <span className="text-indigo-400 font-bold">
                    Carriageway Width: {hoveredStretch.carriageway_width}
                  </span>
                )}
                {hoveredStretch.pcu_count > 0 && (
                  <span className="text-emerald-400 font-bold">
                    Traffic: {hoveredStretch.pcu_count.toLocaleString()} PCU
                  </span>
                )}
              </p>
              {hoveredStretch.dpr_status && (
                <p className="text-xs italic text-purple-300 pt-0.5">
                  &quot;{hoveredStretch.dpr_status}&quot;
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setHoveredStretch(null)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Dismiss Details
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
