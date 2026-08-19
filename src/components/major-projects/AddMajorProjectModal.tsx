'use client';

import React, { useState } from 'react';
import { X, Plus, AlertCircle, Building2, Calendar, FileText, IndianRupee } from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';

interface AddMajorProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nextSNo: number;
}

const COMMON_DIVISIONS = ['Vellore', 'Madurai', 'Coimbatore', 'Gobi', 'Chennai', 'Tirunelveli'];
const COMMON_SCHEMES = [
  'Annual Plan 2026-27',
  'Annual Plan 2025-26',
  'Annual Plan 2024-25',
  'Annual Plan 2022-23',
  'Annual Plan 2021-22',
  'Annual Plan 2020-21',
  'CRIF 2025-26',
];

export const AddMajorProjectModal: React.FC<AddMajorProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  nextSNo,
}) => {
  const [sNo, setSNo] = useState<string>(String(nextSNo));
  const [division, setDivision] = useState<string>('Vellore');
  const [scheme, setScheme] = useState<string>('Annual Plan 2025-26');
  const [nameOfWork, setNameOfWork] = useState<string>('');
  const [projectCostCr, setProjectCostCr] = useState<string>('');
  const [workStage, setWorkStage] = useState<'IN_PROGRESS' | 'TENDER_STAGE'>('IN_PROGRESS');
  const [progressPercent, setProgressPercent] = useState<string>('');
  const [probableCompletionDate, setProbableCompletionDate] = useState<string>('');
  const [stageRemarks, setStageRemarks] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nameOfWork.trim()) {
      setError('Name of Work is required.');
      return;
    }
    if (!projectCostCr || isNaN(Number(projectCostCr)) || Number(projectCostCr) <= 0) {
      setError('Valid Total Project Cost (Rs. Cr.) is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/major-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          s_no: Number(sNo) || nextSNo,
          division: division.trim(),
          scheme: scheme.trim(),
          name_of_work: nameOfWork.trim(),
          project_cost_cr: Number(projectCostCr),
          work_stage: workStage,
          progress_percent: workStage === 'IN_PROGRESS' ? (progressPercent ? Number(progressPercent) : 0) : null,
          probable_completion_date: workStage === 'IN_PROGRESS' ? probableCompletionDate.trim() : null,
          stage_remarks: workStage === 'TENDER_STAGE' ? stageRemarks.trim() : (stageRemarks.trim() || null),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to add project.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Server error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add Ongoing Work
              </h2>
              <p className="text-xs text-slate-500">
                Register a capital highway infrastructure work and stage status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: S.No, Division, Scheme */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                S. No.
              </label>
              <input
                type="number"
                value={sNo}
                onChange={(e) => setSNo(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Division
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scheme
              </label>
              <input
                type="text"
                list="scheme-options"
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Annual Plan 2025-26"
                required
              />
              <datalist id="scheme-options">
                {COMMON_SCHEMES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 2: Name of Work */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Name of Work / Project Scope
            </label>
            <textarea
              rows={3}
              value={nameOfWork}
              onChange={(e) => setNameOfWork(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 leading-relaxed"
              placeholder="Full description of bypass, ROB, flyover, or widening work..."
              required
            />
          </div>

          {/* Row 3: Total Project Cost & Work Stage Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Total Project Cost (in Rs. Cr.)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 129.86"
                value={projectCostCr}
                onChange={(e) => setProjectCostCr(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Stage / Status
              </label>
              <select
                value={workStage}
                onChange={(e) => setWorkStage(e.target.value as 'IN_PROGRESS' | 'TENDER_STAGE')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
              >
                <option value="IN_PROGRESS">🟢 In Progress (Under Execution)</option>
                <option value="TENDER_STAGE">🟡 Tender Stage / Pre-Construction</option>
              </select>
            </div>
          </div>

          {/* Dynamic Section based on Work Stage */}
          {workStage === 'IN_PROGRESS' ? (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Execution Progress &amp; Target Timeline
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Physical Progress (in %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="e.g. 75"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Probable Date of Completion
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 31.03.2027 or 2027-03-31"
                    value={probableCompletionDate}
                    onChange={(e) => setProbableCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-3 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                Tender Stage Status &amp; Milestone Remarks (Merged Columns)
              </span>
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tender / Sanction Milestone Details
                </label>
                <textarea
                  rows={2}
                  value={stageRemarks}
                  onChange={(e) => setStageRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs leading-relaxed"
                  placeholder="e.g. Tender invited by MoRTH HQ on 30.07.2026. Bid due date: 15.09.2026. or LOA issued..."
                  required
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Register Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
