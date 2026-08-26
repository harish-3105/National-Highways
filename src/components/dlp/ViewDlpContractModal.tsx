'use client';

import React from 'react';
import { DlpCorridor, DlpWorkStretch, DlpWorkCategory } from '@/types/dlp';
import { X, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Layers, MapPin, Calendar } from 'lucide-react';

interface ViewDlpContractModalProps {
  corridor: DlpCorridor | null;
  onClose: () => void;
}

const CATEGORY_BADGES: Record<
  DlpWorkCategory,
  { label: string; bg: string; text: string }
> = {
  DLP: { label: 'Under DLP', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-800 dark:text-emerald-200' },
  CONSTRUCTION: { label: 'Construction', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-800 dark:text-blue-200' },
  STMC: { label: 'STMC', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-800 dark:text-amber-200' },
  PBMC: { label: 'PBMC', bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-800 dark:text-purple-200' },
  NO_DLP: { label: 'No DLP', bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200' },
};

export const ViewDlpContractModal: React.FC<ViewDlpContractModalProps> = ({ corridor, onClose }) => {
  if (!corridor) return null;

  const renderStatusBadge = (stretch: DlpWorkStretch) => {
    const days = stretch.days_remaining;
    if (stretch.category === 'CONSTRUCTION') {
      const pct = stretch.physical_progress_pct ?? 0;
      return (
        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[11px]">
          {pct >= 100 ? '100% Completed' : `${pct}% In Progress`}
        </span>
      );
    }

    if (days === undefined || days === null) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
          N/A
        </span>
      );
    }

    if (days <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-[11px]">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Expired</span>
        </span>
      );
    }
    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[11px]">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{days}d left</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800 text-[11px]">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span>{days}d left</span>
      </span>
    );
  };

  const stretches = corridor.work_stretches || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                DLP Corridor Master Record &amp; 2D Work Stretches
              </h3>
              <span className="text-xs text-slate-300">
                {corridor.highway_code} &bull; {corridor.division_name} Division &bull; Km {corridor.from_km} to {corridor.to_km} ({corridor.total_length_km} km)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* Corridor Identity Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <strong className="text-slate-500 block">Highway Identifier:</strong>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                {corridor.highway_code}
              </span>
            </div>
            <div>
              <strong className="text-slate-500 block">Division Jurisdiction:</strong>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {corridor.division_name} Division
              </span>
            </div>
            <div>
              <strong className="text-slate-500 block">Corridor Chainage Limits:</strong>
              <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                Km {corridor.from_km} &rarr; Km {corridor.to_km} ({corridor.total_length_km} km)
              </span>
            </div>
          </div>

          {/* Granular Sub-Work Stretches */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Granular Sub-Work Stretches ({stretches.length} Recorded)
            </h4>

            {stretches.length === 0 ? (
              <p className="text-slate-500 italic text-xs p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                No individual work stretches recorded for this corridor.
              </p>
            ) : (
              <div className="space-y-3">
                {stretches.map((s, idx) => {
                  const badge = CATEGORY_BADGES[s.category] || CATEGORY_BADGES.DLP;
                  return (
                    <div
                      key={s.id || idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-extrabold text-xs ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {s.work_name || s.scheme || 'Untitled Work'}
                          </span>
                        </div>
                        {renderStatusBadge(s)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div>
                          <strong className="text-slate-500 block">Chainage Span:</strong>
                          <span className="font-mono font-bold">
                            Km {s.chainage_from_km} &rarr; Km {s.chainage_to_km} ({s.length_km} km)
                          </span>
                        </div>

                        <div>
                          <strong className="text-slate-500 block">Road Width Bounds:</strong>
                          <span className="font-mono font-bold">
                            {s.road_width_from_m}m &rarr; {s.road_width_to_m}m from Centerline
                          </span>
                        </div>

                        <div>
                          <strong className="text-slate-500 block">Contractor Agency:</strong>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {s.contractor_name || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <strong className="text-slate-500 block">
                            {s.category === 'CONSTRUCTION' ? 'Completion & DLP:' : s.category === 'NO_DLP' ? 'Ended Date:' : 'Expiry Date:'}
                          </strong>
                          <span className="font-bold font-mono">
                            {s.category === 'CONSTRUCTION'
                              ? `${s.actual_completion_date || 'In Progress'} (${s.dlp_period_years ?? 5}y DLP)`
                              : s.category === 'NO_DLP'
                              ? s.dlp_ended_on_date || 'N/A'
                              : s.dlp_till_date || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {s.remarks && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                          Remarks: {s.remarks}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Corridor Universal Remarks */}
          {corridor.remarks && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Overall Corridor Remarks (Col AC)
              </h4>
              <p className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                {corridor.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDlpContractModal;
