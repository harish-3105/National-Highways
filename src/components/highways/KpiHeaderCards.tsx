'use client';

import React from 'react';
import { Route, Ruler, Layers, TrendingUp } from 'lucide-react';

interface KpiHeaderCardsProps {
  totalCorridors: number;
  totalLengthKm: number;
  laneDistribution: Record<string, number>;
  laneLengthsKm?: {
    lessThan2l: number;
    lane2l: number;
    lane2lPs: number;
    lane4l: number;
    lane6l: number;
  };
  corridorsWithDlp?: number;
  loading?: boolean;
  activeLaneFilter?: string | null;
  onSelectLaneFilter?: (laneKey: string | null) => void;
}

export const KpiHeaderCards: React.FC<KpiHeaderCardsProps> = ({
  totalCorridors,
  totalLengthKm,
  laneDistribution,
  laneLengthsKm,
  corridorsWithDlp: _corridorsWithDlp,
  loading = false,
  activeLaneFilter = null,
  onSelectLaneFilter,
}) => {
  const formatNumber = (num: number) =>
    num.toLocaleString('en-IN', { maximumFractionDigits: 1 });

  const highCapacityKm =
    Math.round(((laneLengthsKm?.lane4l || 0) + (laneLengthsKm?.lane6l || 0)) * 1000) / 1000;
  const highCapacityPercent =
    totalLengthKm > 0 ? (highCapacityKm / totalLengthKm) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Card 1: Total Registered Corridors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Master Corridors
          </span>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
            <Route className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalCorridors} <span className="text-sm font-normal text-slate-500">Corridors</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
          Level 1 Ground-Truth Verified
        </div>
      </div>

      {/* Card 2: Combined Distance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            State PWD Length
          </span>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Ruler className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(totalLengthKm)} <span className="text-sm font-normal text-slate-500">km</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          Full TN State NH Network
        </div>
      </div>

      {/* Card 3: Multi-Lane Configuration Breakdown (km) with Interactive Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            Lane Breakdown (km)
            {activeLaneFilter && (
              <span className="normal-case text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200">
                Filtered View Active
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {activeLaneFilter && onSelectLaneFilter && (
              <button
                type="button"
                onClick={() => onSelectLaneFilter(null)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : laneLengthsKm ? (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              {laneLengthsKm.lessThan2l > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectLaneFilter && onSelectLaneFilter('lessThan2l')}
                  className={`px-2 py-1 font-semibold rounded transition-all cursor-pointer ${
                    activeLaneFilter === 'lessThan2l'
                      ? 'bg-amber-600 text-white font-bold ring-2 ring-amber-500 shadow-sm'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Click to isolate & filter <2L corridors in table"
                >
                  &lt;2L: {laneLengthsKm.lessThan2l}km
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectLaneFilter && onSelectLaneFilter('lane2l')}
                className={`px-2 py-1 font-semibold rounded transition-all cursor-pointer ${
                  activeLaneFilter === 'lane2l'
                    ? 'bg-amber-600 text-white font-bold ring-2 ring-amber-500 shadow-sm'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 hover:bg-amber-200'
                }`}
                title="Click to isolate & filter 2L corridors in table"
              >
                2L: {laneLengthsKm.lane2l}km
              </button>
              <button
                type="button"
                onClick={() => onSelectLaneFilter && onSelectLaneFilter('lane2lPs')}
                className={`px-2 py-1 font-semibold rounded transition-all cursor-pointer ${
                  activeLaneFilter === 'lane2lPs'
                    ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-500 shadow-sm'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Click to isolate & filter 2L+PS corridors in table"
              >
                2L+PS: {laneLengthsKm.lane2lPs}km
              </button>
              <button
                type="button"
                onClick={() => onSelectLaneFilter && onSelectLaneFilter('lane4l')}
                className={`px-2 py-1 font-bold rounded transition-all cursor-pointer ${
                  activeLaneFilter === 'lane4l'
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-500 shadow-sm'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 hover:bg-blue-100'
                }`}
                title="Click to isolate & filter 4L corridors in table"
              >
                4L: {laneLengthsKm.lane4l}km
              </button>
              {laneLengthsKm.lane6l > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectLaneFilter && onSelectLaneFilter('lane6l')}
                  className={`px-2 py-1 font-bold rounded transition-all cursor-pointer ${
                    activeLaneFilter === 'lane6l'
                      ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-500 shadow-sm'
                      : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 hover:bg-purple-100'
                  }`}
                  title="Click to isolate & filter 6L corridors in table"
                >
                  6L: {laneLengthsKm.lane6l}km
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(laneDistribution).map(([cfg, count]) => (
                <span
                  key={cfg}
                  className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {cfg}: <span className="text-blue-600 dark:text-blue-400">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          {activeLaneFilter ? 'Click active badge again to return to full multi-lane list' : 'Click any lane configuration badge to filter table'}
        </div>
      </div>

      {/* Card 4: High-Capacity / Divided Carriageway Share (4L & 6L) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Divided Carriageway (4L+)
          </span>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(highCapacityKm)} <span className="text-sm font-normal text-slate-500">km</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {highCapacityPercent.toFixed(1)}% Share
              </span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          <span>High-Capacity 4L & 6L Network</span>
          {laneLengthsKm && (
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-normal">
              4L: {formatNumber(laneLengthsKm.lane4l)}km • 6L: {formatNumber(laneLengthsKm.lane6l)}km
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
