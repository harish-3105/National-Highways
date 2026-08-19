'use client';

import React from 'react';
import { X, Eye, Edit3, Printer, IndianRupee, Building2, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';

interface ViewMajorProjectModalProps {
  project: MajorProject | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: MajorProject) => void;
}

export const ViewMajorProjectModal: React.FC<ViewMajorProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !project) return null;

  const isTender = project.work_stage === 'TENDER_STAGE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded font-mono font-extrabold text-xs">
                  S.No. {project.s_no}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs border border-slate-200 dark:border-slate-700">
                  {project.division} Division
                </span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                  isTender
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}>
                  {isTender ? '🟡 Tender Stage' : '🟢 Under Execution'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                {project.scheme}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(project);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Edit Project"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Project Cost</span>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                <span>₹ {Number(project.project_cost_cr).toFixed(2)} Cr</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sanction Scheme</span>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                {project.scheme}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Executive Division</span>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1">
                {project.division} Division
              </div>
            </div>
          </div>

          {/* Project Title / Scope Description */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" /> Name of Work &amp; Project Scope
            </h4>
            <p className="text-xs leading-relaxed font-medium text-slate-900 dark:text-slate-100">
              {project.name_of_work}
            </p>
          </div>

          {/* Execution Progress OR Tender Stage Details */}
          {isTender ? (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Tender Stage Status &amp; Milestone Information
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                {project.stage_remarks || 'Tender invited / Scrutiny under process.'}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Physical Execution Progress
                </h4>
                <span className="font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                  {project.progress_percent || 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, project.progress_percent || 0))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Target Completion Date:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  📅 {project.probable_completion_date || 'Target date not specified'}
                </span>
              </div>

              {project.stage_remarks && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 text-[11px] text-slate-600 dark:text-slate-400 italic">
                  Note: &quot;{project.stage_remarks}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[11px] text-slate-400 font-mono">
            Ongoing Infrastructure Works &bull; Stage Monitoring &amp; Project Passports
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Passport
          </button>
        </div>
      </div>
    </div>
  );
};
