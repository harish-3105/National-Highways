'use client';

import React from 'react';
import { Route, Ruler, Layers, ShieldCheck } from 'lucide-react';

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
  corridorsWithDlp: number;
  loading?: boolean;
}

export const KpiHeaderCards: React.FC<KpiHeaderCardsProps> = ({
  totalCorridors,
  totalLengthKm,
  laneDistribution,
  laneLengthsKm,
  corridorsWithDlp,
  loading = false,
}) => {
  const formatNumber = (num: number) =>
    num.toLocaleString('en-IN', { maximumFractionDigits: 1 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Registered Corridors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
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

      {/* Card 3: Multi-Lane Configuration Breakdown (km) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lane Breakdown (km)
          </span>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : laneLengthsKm ? (
            <div className="flex items-center gap-1 flex-wrap text-[11px]">
              {laneLengthsKm.lessThan2l > 0 && (
                <span className="px-1.5 py-0.5 font-semibold rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200">
                  &lt;2L: {laneLengthsKm.lessThan2l}km
                </span>
              )}
              <span className="px-1.5 py-0.5 font-semibold rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300">
                2L: {laneLengthsKm.lane2l}km
              </span>
              <span className="px-1.5 py-0.5 font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                2L+PS: {laneLengthsKm.lane2lPs}km
              </span>
              <span className="px-1.5 py-0.5 font-bold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200">
                4L: {laneLengthsKm.lane4l}km
              </span>
              {laneLengthsKm.lane6l > 0 && (
                <span className="px-1.5 py-0.5 font-bold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200">
                  6L: {laneLengthsKm.lane6l}km
                </span>
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
          State-wide Multi-Lane Distribution
        </div>
      </div>

      {/* Card 4: Active Maintenance DLP Coverage */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Maintenance DLP Active
          </span>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {corridorsWithDlp} <span className="text-sm font-normal text-slate-500">Highways</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          Linked Warranty Stretches
        </div>
      </div>
    </div>
  );
};
