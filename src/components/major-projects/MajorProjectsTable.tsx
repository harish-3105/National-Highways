'use client';

import React from 'react';
import { Eye, Edit3, Trash2, Clock, CheckCircle2, IndianRupee, RotateCcw, Archive } from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';

interface MajorProjectsTableProps {
  projects: MajorProject[];
  loading: boolean;
  onView: (project: MajorProject) => void;
  onEdit: (project: MajorProject) => void;
  onDelete: (project: MajorProject) => void;
  onRestore: (project: MajorProject) => void;
}

const getDivisionBadgeColor = (division: string) => {
  const norm = (division || '').toLowerCase();
  if (norm.includes('vellore')) return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (norm.includes('madurai')) return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (norm.includes('coimbatore')) return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (norm.includes('gobi')) return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (norm.includes('chennai')) return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  if (norm.includes('tirunelveli')) return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

export const MajorProjectsTable: React.FC<MajorProjectsTableProps> = ({
  projects,
  loading,
  onView,
  onEdit,
  onDelete,
  onRestore,
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Ongoing Works...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No ongoing works found matching your criteria.</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting your search query, stage, or division filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-3 text-center w-12">S.No.</th>
              <th className="py-3.5 px-3 w-28">Division</th>
              <th className="py-3.5 px-3 w-36">Scheme</th>
              <th className="py-3.5 px-4 min-w-[280px]">Name of Work</th>
              <th className="py-3.5 px-3 text-right w-28">Total Cost</th>
              <th className="py-3.5 px-3 text-center w-36">Progress (%)</th>
              <th className="py-3.5 px-3 w-40">Probable Completion / Remarks</th>
              <th className="py-3.5 px-3 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {projects.map((item) => {
              const isTender = item.work_stage === 'TENDER_STAGE';
              const isDeleted = item.delete_status === 'DELETED' || item.delete_status === 'SOFT_DELETE';
              const divBadge = getDivisionBadgeColor(item.division);

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isDeleted
                      ? 'bg-red-50/40 dark:bg-red-950/20 opacity-80'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] border ${divBadge} ${isDeleted ? 'line-through' : ''}`}>
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
                  </td>

                  {/* Total Project Cost in Rs. Cr. */}
                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-xs">
                    <span className={isDeleted ? 'line-through opacity-70' : ''}>
                      ₹ {Number(item.project_cost_cr).toFixed(2)} Cr
                    </span>
                  </td>

                  {/* DYNAMIC PROGRESS & COMPLETION CELLS (WITH COLSPAN=2 MERGE FOR TENDER STAGE) */}
                  {isTender ? (
                    <td colSpan={2} className="py-3.5 px-3">
                      <div className={`p-2.5 rounded-xl border space-y-1 ${
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
                  ) : (
                    <>
                      {/* Progress in % */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-xs">
                            {item.progress_percent || 0}%
                          </span>
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, item.progress_percent || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Probable Date of Completion */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                          📅 {item.probable_completion_date || '—'}
                        </span>
                      </td>
                    </>
                  )}

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {isDeleted ? (
                        <button
                          onClick={() => onRestore(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
                          title="Restore Record to Active View"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onView(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                            title="View Work Passport"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Edit Work"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
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
