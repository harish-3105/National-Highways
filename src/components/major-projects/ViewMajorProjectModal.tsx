'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Building2,
  Calendar,
  IndianRupee,
  Activity,
  Clock,
  CheckCircle2,
  FileText,
  Layers,
  AlertTriangle,
  User,
  Phone,
  HardHat,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import {
  calculateProjectDelay,
  calculateFinancialProgress,
  calculateContractProgress,
} from '@/lib/formatters';

interface ViewMajorProjectModalProps {
  project: MajorProject | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (project: MajorProject) => void;
}

export const ViewMajorProjectModal: React.FC<ViewMajorProjectModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const isTender = project.work_stage === 'TENDER_STAGE';
  const isCompleted = project.work_stage === 'COMPLETED';

  // Dynamic delay calculation based on scheduled vs likely/current date
  const delayInfo = calculateProjectDelay(
    project.scheduled_completion_date,
    project.likely_completion_date || project.probable_completion_date,
    project.progress_percent
  );

  // Dynamic financial progress calculation (TPC / RCE)
  const finProgress = calculateFinancialProgress(
    project.cumm_financial_expenditure_cr,
    project.revised_cost_cr,
    project.project_cost_cr
  );

  // Dynamic contract value progress calculation
  const contractProgress = calculateContractProgress(
    project.contract_cum_expenditure_cr,
    project.contract_value_cr
  );

  const effectiveCost = Number(
    project.revised_cost_cr && Number(project.revised_cost_cr) > 0
      ? project.revised_cost_cr
      : project.project_cost_cr || 0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyStageLog = () => {
    if (project.detailed_stage_status) {
      navigator.clipboard.writeText(project.detailed_stage_status);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs shadow-2xl w-full max-w-5xl lg:max-w-6xl h-[92vh] max-h-[95vh] overflow-hidden flex flex-col relative print:border-none print:shadow-none print:max-h-none print:h-auto print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/80 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded-xs">
                #{project.s_no}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xs border border-slate-200 dark:border-slate-700">
                {project.division} Division
              </span>
              <span className="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold text-xs rounded-xs border border-purple-200 dark:border-purple-800">
                {project.scheme}
              </span>
              {project.old_new_nh && (
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] rounded-xs font-bold">
                  NH {project.old_new_nh}
                </span>
              )}
              {project.pmis_id && (
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] rounded-xs border border-indigo-200 dark:border-indigo-800">
                  PMIS: {project.pmis_id}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-xs font-bold text-xs border ${
                  isCompleted
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                    : isTender
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isCompleted ? '✓ Work Completed' : isTender ? 'Tender / Sanction Stage' : 'In Execution'}
              </span>
              {effectiveCost >= 50 && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10.5px] rounded-xs border border-amber-200 dark:border-amber-800">
                  ⚡ Mega Project (&ge; ₹50 Cr)
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
              {project.name_of_work}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xs transition-colors cursor-pointer"
              title="Print Project Passport"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5-Metric Quick Header Ribbon */}
        <div className="px-6 py-3 bg-slate-100/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Sanctioned Cost (TPC)
            </span>
            <div className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
              ₹ {Number(project.project_cost_cr || 0).toFixed(2)} Cr
              {project.revised_cost_cr && (
                <span className="text-[10.5px] font-normal text-slate-500 ml-1">
                  (Rev: ₹{Number(project.revised_cost_cr).toFixed(2)} Cr)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Physical Progress
            </span>
            <div className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <span>{isTender ? '—' : `${project.progress_percent || 0}%`}</span>
              {project.total_completed_length_km ? (
                <span className="text-[11px] font-normal text-slate-500">
                  ({project.total_completed_length_km} / {project.length_km || '—'} km)
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Financial Progress (TPC)
            </span>
            <div className="font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1.5">
              <span>{finProgress !== null ? `${finProgress}%` : '—'}</span>
              <span className="text-[11px] font-normal text-slate-500">
                (₹{Number(project.cumm_financial_expenditure_cr || project.expenditure_prior_cr || 0).toFixed(2)} Cr)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Contract Progress
            </span>
            <div className="font-mono font-extrabold text-purple-700 dark:text-purple-400 text-sm flex items-center gap-1.5">
              <span>{contractProgress !== null ? `${contractProgress}%` : '—'}</span>
              {project.contract_value_cr && (
                <span className="text-[11px] font-normal text-slate-500">
                  (₹{Number(project.contract_cum_expenditure_cr || 0).toFixed(2)} / ₹{Number(project.contract_value_cr).toFixed(2)} Cr)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Likely Completion
            </span>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 flex-wrap">
              <span>📅 {project.likely_completion_date || project.probable_completion_date || '—'}</span>
              {delayInfo.isDelayed && (
                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 text-[10px] font-bold rounded-xs font-mono">
                  ⚠️ {delayInfo.compactText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Single Page Scrollable Passport Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300 scroll-smooth">
          {/* SECTION 1: GENERAL & TECHNICAL SPECIFICATIONS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                1. General & Technical Specifications
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Sanction Job Number
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {project.job_no || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  PMIS / OCMS / PMG ID
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {project.pmis_id || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Total Project Length
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {project.length_km ? `${project.length_km} km` : '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Sanction Date
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  📅 {project.sanction_date || '—'}
                </p>
              </div>
            </div>

            {/* Contract Award & Site Handover Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Date of LOA
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  📅 {project.loa_date || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Date of Agreement
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  📅 {project.agreement_date || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Contract Value
                </span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  {project.contract_value_cr ? `₹ ${Number(project.contract_value_cr).toFixed(2)} Cr` : '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Site Handover Date
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  📅 {project.site_handover_date || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: DUAL PHYSICAL & FINANCIAL PROGRESS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                2. Execution Progress & Financial Metrics
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card A: Physical Progress */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xs border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                      Physical Progress
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                    {isTender ? 'Tender Stage' : `${project.progress_percent || 0}%`}
                  </span>
                </div>

                {!isTender && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-xs overflow-hidden shadow-inner">
                      <div
                        className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-xs transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, project.progress_percent || 0))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0%</span>
                      <span>Target: 100% ({project.length_km || 0} km)</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Prior Completed</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {project.completed_length_prior_km || 0} km
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Current FY</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {project.completed_length_current_fy_km || 0} km
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Total Completed</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                      {project.total_completed_length_km || 0} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Card B: Financial Progress */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xs border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                      Financial Progress
                    </span>
                  </div>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">
                    {finProgress !== null ? `${finProgress}%` : '0%'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-xs overflow-hidden shadow-inner">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-xs transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, finProgress || 0))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Exp: ₹{Number(project.cumm_financial_expenditure_cr || project.expenditure_prior_cr || 0).toFixed(2)} Cr</span>
                    <span>Budget: ₹{effectiveCost.toFixed(2)} Cr</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Prior Exp</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      ₹{Number(project.expenditure_prior_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Current FY Exp</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      ₹{Number(project.expenditure_current_fy_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Cumulative Exp</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                      ₹{Number(project.cumm_financial_expenditure_cr || project.expenditure_prior_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-800">
                    <span className="text-[9.5px] text-slate-400 block uppercase">Contract Exp</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                      ₹{Number(project.contract_cum_expenditure_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                </div>

                {project.revised_cost_cr && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xs border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      Revised Cost Estimate (RCE): ₹{Number(project.revised_cost_cr).toFixed(2)} Cr
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      +{Number(project.cost_increase_rce_cr || 0).toFixed(2)} Cr Escalation
                    </span>
                  </div>
                )}
              </div>

              {/* Card C: Contract Value Progress */}
              {project.contract_value_cr && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xs border border-purple-200 dark:border-purple-900/50 space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                        Contract Value Progress
                      </span>
                    </div>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-base">
                      {contractProgress !== null ? `${contractProgress}%` : '0%'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-xs overflow-hidden shadow-inner">
                      <div
                        className="bg-purple-600 dark:bg-purple-500 h-full rounded-xs transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, contractProgress || 0))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Exp: ₹{Number(project.contract_cum_expenditure_cr || 0).toFixed(2)} Cr</span>
                      <span>Contract Value: ₹{Number(project.contract_value_cr || 0).toFixed(2)} Cr</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Physical Progress Remarks (When in Execution / In-Progress) */}
            {!isTender && (
              <div className="p-3.5 rounded-xs border space-y-1 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-400">
                  Physical Progress Remarks
                </span>
                <p className={`text-xs leading-relaxed whitespace-pre-line ${project.progress_remarks ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                  {project.progress_remarks || '— None / No physical progress remarks recorded'}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: TIMELINES, EOT & DYNAMIC DELAY ANALYSIS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                3. Milestones, EOT & Delay Analysis
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Appointed Date</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  📅 {project.appointed_date || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scheduled Completion Date</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  📅 {project.scheduled_completion_date || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Likely Completion Date</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  📅 {project.likely_completion_date || project.probable_completion_date || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Calculated Time Overrun</span>
                <p className={`font-mono font-bold text-xs ${delayInfo.isDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {delayInfo.humanText}
                </p>
              </div>
            </div>

            {/* EOT Status & Change of Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xs border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">
                    Extension of Time (EOT) Status
                  </span>
                  {project.eot_proposal_agency && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold rounded-xs">
                      Agency: {project.eot_proposal_agency}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {project.eot_granted_till || 'No EOT granted / Pending submission.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xs border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider block">
                  Change of Scope (COS) Details
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {project.cos_details || 'No Change of Scope proposal recorded.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: CLEARANCE BOTTLENECKS & ISSUES (5 FIELDS) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                4. Departmental Clearance Bottlenecks &amp; Issues (5 Fields)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Issue 1: Land Acquisition */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  1. Land Acquisition Issues
                </span>
                <p className={`text-xs ${project.issue_land ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                  {project.issue_land || '— None / No Land Acquisition issues recorded'}
                </p>
              </div>

              {/* Issue 2: Forest & Environmental */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  2. Forest &amp; Environmental Clearance
                </span>
                <p className={`text-xs ${project.issue_forest ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                  {project.issue_forest || '— None / No Forest Clearance issues recorded'}
                </p>
              </div>

              {/* Issue 3: Utility Shifting */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  3. Utility Shifting (EB / Water / OFC)
                </span>
                <p className={`text-xs ${project.issue_utility ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                  {project.issue_utility || '— None / No Utility Shifting issues recorded'}
                </p>
              </div>

              {/* Issue 4: Railways Clearance */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  4. Railways Clearance (ROB / RUB / GAD)
                </span>
                <p className={`text-xs ${project.issue_railways ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                  {project.issue_railways || '— None / No Railways issues recorded'}
                </p>
              </div>
            </div>

            {/* Issue 5: Other Issues */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                5. Other Bottlenecks &amp; General Remarks
              </span>
              <p className={`text-xs ${project.issue_others ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 italic'}`}>
                {project.issue_others || '— None / No other bottlenecks recorded'}
              </p>
            </div>
          </div>

          {/* SECTION 5: PERSONNEL & EXECUTING CONTRACTOR */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                5. Key Personnel &amp; Executing Agency
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Divisional Engineer In-Charge</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {project.de_name_phone || '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Executing Contractor / Agency</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {project.contractor_name || '—'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xs border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Division Updated Stamp</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {project.updated_division_date || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 6: DETAILED CIVIL, RAILWAY, FOREST & LA STAGE NOTES (COL AC) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  6. Granular Engineering Milestones &amp; Land Acquisition Log (Col AC)
                </h3>
              </div>
              {project.detailed_stage_status && (
                <button
                  onClick={handleCopyStageLog}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Log'}</span>
                </button>
              )}
            </div>

            {project.detailed_stage_status ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-850/80 rounded-xs border border-slate-200 dark:border-slate-800 text-xs leading-relaxed whitespace-pre-line font-mono text-slate-800 dark:text-slate-200 min-h-[160px] max-h-[400px] overflow-y-auto shadow-inner">
                {project.detailed_stage_status}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xs border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 italic">
                No granular structural or land acquisition status log recorded yet for this project.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/80 flex items-center justify-between print:hidden shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            National Highways Project Passport &bull; Complete Single-Page Technical Dossier
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xs text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
