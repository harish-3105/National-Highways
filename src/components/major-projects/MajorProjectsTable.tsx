'use client';

import React from 'react';
import { Eye, Edit3, Trash2, Clock, RotateCcw, History, CheckCircle2 } from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import {
  calculateProjectDelay,
  calculateFinancialProgress,
} from '@/lib/formatters';

interface MajorProjectsTableProps {
  projects: MajorProject[];
  loading: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onView: (project: MajorProject) => void;
  onEdit: (project: MajorProject) => void;
  onDelete: (project: MajorProject) => void;
  onRestore: (project: MajorProject) => void;
  onHistory: (project: MajorProject) => void;
}

const getDivisionBadgeColor = (division: string) => {
  const norm = (division || '').toLowerCase();
  if (norm.includes('vellore')) return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (norm.includes('madurai')) return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (norm.includes('coimbatore')) return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (norm.includes('gobi')) return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (norm.includes('chennai')) return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  if (norm.includes('tirunelveli')) return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
  if (norm.includes('villupuram')) return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

export const MajorProjectsTable: React.FC<MajorProjectsTableProps> = ({
  projects,
  loading,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onHistory,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Ongoing Works...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No ongoing works found matching your criteria.</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting your search query, stage, division, or &ge; ₹50 Cr filters.</p>
      </div>
    );
  }

  const allVisibleSelected = projects.length > 0 && projects.every((p) => selectedIds.includes(p.id));
  const someVisibleSelected = projects.some((p) => selectedIds.includes(p.id));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              {onToggleSelect && (
                <th className="py-3.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }}
                    onChange={() => onToggleSelectAll && onToggleSelectAll()}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3.5 px-3 text-center w-12">S.No.</th>
              <th className="py-3.5 px-3 w-28">Division</th>
              <th className="py-3.5 px-3 w-36">Scheme</th>
              <th className="py-3.5 px-4 min-w-[280px]">Name of Work</th>
              <th className="py-3.5 px-3 text-right w-32">Budget (₹ Cr)</th>
              <th className="py-3.5 px-3 text-center w-40">Progress (Phy / Fin)</th>
              <th className="py-3.5 px-3 w-44">Likely Completion / Delay</th>
              <th className="py-3.5 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {projects.map((item) => {
              const isTender = item.work_stage === 'TENDER_STAGE';
              const isCompleted = item.work_stage === 'COMPLETED';
              const isDeleted = item.delete_status === 'DELETED' || item.delete_status === 'SOFT_DELETE';
              const isRowSelected = selectedIds.includes(item.id);
              const divBadge = getDivisionBadgeColor(item.division);

              // Dynamic Delay Calculation
              const delayInfo = calculateProjectDelay(
                item.scheduled_completion_date,
                item.likely_completion_date || item.probable_completion_date,
                item.progress_percent
              );

              // Dynamic Financial Progress Calculation
              const finPct = calculateFinancialProgress(
                item.cumm_financial_expenditure_cr,
                item.revised_cost_cr,
                item.project_cost_cr
              );

              const effectiveCost = Number(
                item.revised_cost_cr && Number(item.revised_cost_cr) > 0
                  ? item.revised_cost_cr
                  : item.project_cost_cr || 0
              );

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isRowSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/30'
                      : isDeleted
                      ? 'bg-red-50/40 dark:bg-red-950/20 opacity-80'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Row Checkbox */}
                  {onToggleSelect && (
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                    </td>
                  )}

                  {/* S.No */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex flex-col items-center">
                      <span className={isDeleted ? 'line-through text-red-600' : ''}>{item.s_no}</span>
                      {isDeleted && (
                        <span className="px-1 py-0.2 text-[8.5px] font-extrabold uppercase rounded bg-red-600 text-white mt-0.5">
                          Archived
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Division */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-xs font-bold text-[11px] border ${divBadge} ${isDeleted ? 'line-through' : ''}`}>
                      {item.division}
                    </span>
                  </td>

                  {/* Scheme */}
                  <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    <span className={isDeleted ? 'line-through opacity-70' : ''}>{item.scheme}</span>
                  </td>

                  {/* Name of Work */}
                  <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                    <p className={`line-clamp-3 font-medium ${isDeleted ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                      {item.name_of_work}
                    </p>
                    {effectiveCost >= 50 && (
                      <span className="inline-block mt-1 px-1.5 py-0.2 text-[9.5px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-xs border border-amber-200 dark:border-amber-800">
                        &ge; ₹50 Cr Mega Project
                      </span>
                    )}
                  </td>

                  {/* Total Project Cost in Rs. Cr. */}
                  <td className="py-3.5 px-3 text-right font-mono text-xs">
                    <div className={`flex flex-col items-end ${isDeleted ? 'line-through opacity-70' : ''}`}>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        ₹ {Number(item.project_cost_cr || 0).toFixed(2)} Cr
                      </span>
                      {item.revised_cost_cr && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          Rev: ₹{Number(item.revised_cost_cr).toFixed(2)} Cr
                        </span>
                      )}
                    </div>
                  </td>

                  {/* DYNAMIC PROGRESS & COMPLETION CELLS */}
                  {isTender ? (
                    <td colSpan={2} className="py-3.5 px-3">
                      <div className={`p-2 rounded-xs border space-y-1 ${
                        isDeleted
                          ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-[10.5px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Tender Stage / Sanction Status</span>
                        </div>
                        <p className="text-[11px] leading-snug font-medium line-clamp-2">
                          {item.stage_remarks || 'Tender / Sanction process ongoing.'}
                        </p>
                      </div>
                    </td>
                  ) : isCompleted ? (
                    <td colSpan={2} className="py-3.5 px-3">
                      <div className={`p-2 rounded-xs border space-y-1 ${
                        isDeleted
                          ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          : 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60 text-teal-900 dark:text-teal-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-[10.5px] uppercase tracking-wider text-teal-800 dark:text-teal-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>Work Completed (100%)</span>
                          </div>
                          {item.likely_completion_date || item.probable_completion_date ? (
                            <span className="font-mono text-[10.5px] font-bold text-teal-700 dark:text-teal-300">
                              📅 {item.likely_completion_date || item.probable_completion_date}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] leading-snug font-medium line-clamp-1 text-teal-800/80 dark:text-teal-200/80">
                          {item.progress_remarks || item.detailed_stage_status || 'Execution completed & delivered.'}
                        </p>
                      </div>
                    </td>
                  ) : (
                    <>
                      {/* Dual Progress: Physical & Financial */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                          {/* Physical */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">Phy</span>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                                {item.progress_percent !== null && item.progress_percent !== undefined ? `${item.progress_percent}%` : '0%'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-xs overflow-hidden shadow-inner">
                              <div
                                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-xs transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, item.progress_percent || 0))}%` }}
                              />
                            </div>
                          </div>

                          {/* Financial */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">Fin</span>
                              <span className="font-extrabold text-blue-700 dark:text-blue-400">
                                {finPct !== null ? `${finPct}%` : '—'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-xs overflow-hidden shadow-inner">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-full rounded-xs transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, finPct || 0))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Likely Date of Completion & Dynamic Delay */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-xs border border-slate-200 dark:border-slate-700 w-fit">
                            📅 {item.likely_completion_date || item.probable_completion_date || '—'}
                          </span>
                          {delayInfo.isDelayed && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                              ⚠️ {delayInfo.compactText}
                            </span>
                          )}
                        </div>
                      </td>
                    </>
                  )}

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {isDeleted ? (
                        <button
                          onClick={() => onRestore(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-xs cursor-pointer transition-colors shadow-2xs"
                          title="Restore Record to Active View"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onHistory(item)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-xs transition-colors cursor-pointer"
                            title="View Historical Snapshot & Trendline Chart"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onView(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xs transition-colors cursor-pointer"
                            title="View Single-Page Work Passport"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xs transition-colors cursor-pointer"
                            title="Edit Work"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xs transition-colors cursor-pointer"
                            title="Soft Delete Work"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
