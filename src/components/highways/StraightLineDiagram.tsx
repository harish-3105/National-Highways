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
  Sparkles,
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

  // Calculate Canvas Base Width in Pixels for Smooth Scrollable View
  const canvasWidthPx = useMemo(() => {
    // Grant at least 50px per kilometer at 1x zoom, multiplied by zoomLevel
    return Math.max(1400, Math.round(totalSpan * 50 * zoomLevel));
  }, [totalSpan, zoomLevel]);

  // Generate Chainage Ruler Ticks (Every 5 km or 10 km depending on total span)
  const rulerTicks = useMemo(() => {
    const step = totalSpan > 150 ? 20 : totalSpan > 60 ? 10 : totalSpan > 25 ? 5 : 2;
    const ticks: number[] = [];
    const startTick = Math.floor(minKm / step) * step;
    for (let k = startTick; k <= maxKm + step / 2; k += step) {
      if (k >= minKm && k <= maxKm) {
        ticks.push(Math.round(k * 100) / 100);
      }
    }
    if (!ticks.includes(minKm)) ticks.unshift(minKm);
    if (!ticks.includes(maxKm)) ticks.push(maxKm);
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [minKm, maxKm, totalSpan]);

  // Helper for lane color styling along continuous horizontal highway strip
  const getLaneStyle = (laneConfig: string) => {
    const norm = (laneConfig || '').toLowerCase();
    if (norm.includes('6l') || norm.includes('6-lane')) {
      return {
        bg: 'bg-purple-600 dark:bg-purple-500 text-white',
        border: 'border-purple-700',
        label: '6-Lane (6L)',
      };
    }
    if (norm.includes('4l') || norm.includes('4-lane')) {
      return {
        bg: 'bg-blue-600 dark:bg-blue-500 text-white',
        border: 'border-blue-700',
        label: '4-Lane (4L)',
      };
    }
    if (norm.includes('2l+ps') || norm.includes('paved')) {
      return {
        bg: 'bg-emerald-600 dark:bg-emerald-500 text-white',
        border: 'border-emerald-700',
        label: '2L + Paved Shoulder',
      };
    }
    if (norm.includes('2l') || norm.includes('2-lane')) {
      return {
        bg: 'bg-amber-600 dark:bg-amber-500 text-white',
        border: 'border-amber-700',
        label: '2-Lane (2L)',
      };
    }
    return {
      bg: 'bg-slate-600 dark:bg-slate-500 text-white',
      border: 'border-slate-700',
      label: '< 2-Lane',
    };
  };

  // Traffic PCU Badge Color
  const getPcuColor = (pcu: number) => {
    if (!pcu || pcu <= 0) return 'bg-slate-100 text-slate-600 border-slate-300';
    if (pcu < 5000) return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300';
    if (pcu <= 15000) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300';
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/70 dark:text-red-300 font-bold';
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
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 print:hidden">
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
                <span>Sub-Stretches: <strong>{activeStretches.length}</strong></span>
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
                <GitCommit className="w-3.5 h-3.5" /> Micro Lane SLD
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Layer Visibility Filters Bar */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Interactive SLD Track Layers:</span>
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

        {/* Legend & Stepped Height Explanation Panel */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Excel Stepped Bar Profile Legend:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-white" /> 4-Lane / 4L+PS (Tall)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-white" /> 2-Lane + Paved Shoulder (Mid-Tall)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-white" /> 2-Lane (Standard)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-600 text-white rounded text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-white" /> 6-Lane (Extra Tall)
            </span>
          </div>

          {/* Modular DLP Slot Notice */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 text-amber-300 border border-amber-500/30 rounded-lg text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>DLP Overlay: <strong>Modular Slots Ready</strong> (Awaiting DLP Module Finalization)</span>
          </div>
        </div>

        {/* Dynamic Scrollable SLD Timeline Canvas Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl overflow-x-auto print:border-black print:bg-white print:p-0">
          <div
            className="relative transition-all duration-300"
            style={{ width: `${canvasWidthPx}px` }}
          >
            {/* TRACK 1: Towns & Major Landmarks Row */}
            {showTowns && (
              <div className="relative h-16 mb-4 border-b border-dashed border-slate-800">
                <div className="absolute left-0 top-0 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30 z-30">
                  Towns &amp; Major Landmarks
                </div>
                {activeStretches.map((st, i) => {
                  if (!st.important_town) return null;
                  const leftPct = ((st.from_km - minKm) / totalSpan) * 100;
                  return (
                    <div
                      key={st.id || i}
                      className="absolute bottom-1 transform -translate-x-1/2 flex flex-col items-center group z-20 cursor-pointer"
                      style={{ left: `${Math.min(98, Math.max(2, leftPct))}%` }}
                      onClick={() => setHoveredStretch(st)}
                    >
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-lg border border-amber-300 whitespace-nowrap flex items-center gap-1 group-hover:scale-110 transition-transform">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {st.important_town}
                      </span>
                      <div className="w-0.5 h-4 bg-amber-400/80" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* TRACK 2: Chainage Scale Ruler Axis */}
            <div className="relative h-11 border-y border-slate-700 bg-slate-850 dark:bg-slate-950/80 flex items-center mb-6">
              <div className="absolute left-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-slate-900/90 px-2 py-0.5 rounded border border-blue-500/30 z-30">
                Chainage Ruler Axis (Km)
              </div>
              {rulerTicks.map((tick, i) => {
                const leftPct = ((tick - minKm) / totalSpan) * 100;
                return (
                  <div
                    key={i}
                    className="absolute bottom-0 top-0 flex flex-col items-center justify-between"
                    style={{ left: `${Math.min(99, Math.max(0.5, leftPct))}%` }}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700">
                      Km {tick}
                    </span>
                    <div className="w-0.5 h-3 bg-blue-400" />
                  </div>
                );
              })}
            </div>

            {/* TRACK 3: Core Continuous Horizontal Highway Carriageway Bar */}
            <div className="relative mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded font-extrabold">
                    Continuous Carriageway Highway Strip
                  </span>
                  <span className="text-slate-400">(End-to-end connected horizontal stretch segments)</span>
                </span>
                <span>Linear Alignment: Km {minKm} → Km {maxKm} ({totalSpan.toFixed(2)} km)</span>
              </div>

              {/* The Unbroken Linear Highway Bar Span Container */}
              <div className="relative h-24 bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center p-1">
                {activeStretches.length === 0 ? (
                  <div className="w-full text-center text-xs text-slate-500 py-8">
                    No micro sub-chainage stretches defined for this corridor. Add stretches in Level 2 to render the SLD timeline.
                  </div>
                ) : (
                  activeStretches.map((st, i) => {
                    const leftPct = ((st.from_km - minKm) / totalSpan) * 100;
                    const widthPct = Math.max(0.2, ((st.to_km - st.from_km) / totalSpan) * 100);
                    const style = getLaneStyle(st.lane_configuration);

                    return (
                      <div
                        key={st.id || i}
                        className={`absolute top-1 bottom-1 border-r last:border-r-0 transition-all duration-200 cursor-pointer flex flex-col justify-between p-2 hover:ring-2 hover:ring-white hover:z-30 shadow-md group ${style.bg} ${style.border}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        onMouseEnter={() => setHoveredStretch(st)}
                        onClick={() => setHoveredStretch(st)}
                      >
                        {/* Top: Carriageway Lane Configuration & Width Label */}
                        <div className="flex items-center justify-between text-[11px] font-extrabold truncate">
                          <span className="truncate">
                            {st.lane_configuration}
                          </span>
                          {st.carriageway_width && (
                            <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200 border border-white/20 font-bold ml-1 shrink-0">
                              {st.carriageway_width}
                            </span>
                          )}
                        </div>

                        {/* Middle: Stretch Span Length */}
                        <div className="text-[10px] font-mono font-bold tracking-tight truncate text-center my-auto opacity-90">
                          {st.length_km} km stretch
                        </div>

                        {/* Bottom: MODULAR DLP CONTRACT SLOT (Reserved for DLP Module) */}
                        <div className="mt-auto pt-1 border-t border-white/25 flex items-center justify-center text-[9px] font-semibold text-amber-100 bg-black/25 rounded px-1.5 py-0.5 border border-amber-300/30">
                          <Sparkles className="w-3 h-3 text-amber-300 mr-1 shrink-0" />
                          <span className="truncate">DLP Contract Info (Pending Config)</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* TRACK 4: Traffic PCU Volume Row */}
            {showPcu && (
              <div className="relative h-13 mb-4 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 flex items-center">
                <div className="absolute left-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30 z-30">
                  Traffic PCU Volume
                </div>
                {activeStretches.map((st, i) => {
                  if (!st.pcu_count || st.pcu_count <= 0) return null;
                  const leftPct = ((st.from_km - minKm) / totalSpan) * 100;
                  const widthPct = Math.max(0.5, ((st.to_km - st.from_km) / totalSpan) * 100);
                  const pcuStyle = getPcuColor(st.pcu_count);

                  return (
                    <div
                      key={st.id || i}
                      className={`absolute h-8 top-2 rounded-lg border px-2 flex items-center justify-center text-[10px] font-mono font-bold truncate ${pcuStyle}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`Traffic Volume: ${st.pcu_count.toLocaleString()} PCU`}
                    >
                      {st.pcu_count.toLocaleString()} PCU
                    </div>
                  );
                })}
              </div>
            )}

            {/* TRACK 5: Right of Way (ROW) Width Row */}
            {showRow && (
              <div className="relative h-13 mb-4 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 flex items-center">
                <div className="absolute left-2 text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-teal-500/30 z-30">
                  Right of Way (ROW)
                </div>
                {activeStretches.map((st, i) => {
                  if (!st.row_width) return null;
                  const leftPct = ((st.from_km - minKm) / totalSpan) * 100;
                  const widthPct = Math.max(0.5, ((st.to_km - st.from_km) / totalSpan) * 100);

                  return (
                    <div
                      key={st.id || i}
                      className="absolute h-8 top-2 rounded-lg border border-teal-500/40 bg-teal-950/70 text-teal-300 px-2 flex items-center justify-center text-[10px] font-bold truncate"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      RoW: {st.row_width}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TRACK 6: DPR Proposals & Remarks Row */}
            {showDpr && (
              <div className="relative h-15 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 flex items-center">
                <div className="absolute left-2 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-purple-500/30 z-30">
                  Sanctioned DPR &amp; Schemes
                </div>
                {activeStretches.map((st, i) => {
                  if (!st.dpr_status) return null;
                  const leftPct = ((st.from_km - minKm) / totalSpan) * 100;
                  const widthPct = Math.max(1, ((st.to_km - st.from_km) / totalSpan) * 100);

                  return (
                    <div
                      key={st.id || i}
                      className="absolute h-9 top-2 rounded-lg border border-purple-500/50 bg-purple-950/80 text-purple-200 px-2.5 flex items-center text-[10px] font-semibold truncate hover:z-30 cursor-pointer shadow-md"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      onClick={() => setHoveredStretch(st)}
                    >
                      <Info className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
                      <span className="truncate">{st.dpr_status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stretch Hover Detail Card */}
        {hoveredStretch && (
          <div className="bg-slate-900 border border-blue-500/50 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
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
