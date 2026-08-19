'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit3,
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
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';

interface ViewMajorProjectModalProps {
  project: MajorProject | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (project: MajorProject) => void;
}

type TabType = 'overview' | 'physical' | 'financial' | 'timeline' | 'personnel' | 'detailed_stage';

export const ViewMajorProjectModal: React.FC<ViewMajorProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen || !project) return null;

  const isTender = project.work_stage === 'TENDER_STAGE';
  const hasTimeOverrun = Number(project.time_overrun_years || 0) > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col relative print:border-none print:shadow-none print:max-h-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded-md">
                #{project.s_no}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-md border border-slate-200 dark:border-slate-700">
                {project.division} Division
              </span>
              <span className="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold text-xs rounded-md border border-purple-200 dark:border-purple-800">
                {project.scheme}
              </span>
              {project.old_new_nh && (
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] rounded-md font-bold">
                  NH {project.old_new_nh}
                </span>
              )}
              {project.pmis_id && (
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] rounded-md border border-indigo-200 dark:border-indigo-800">
                  PMIS: {project.pmis_id}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-md font-bold text-xs border ${
                  isTender
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isTender ? 'Tender / Sanction Stage' : 'In Execution'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
              {project.name_of_work}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Print Project Passport"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Ribbon */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Total Project Cost</span>
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
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Physical Progress</span>
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
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Total Expenditure</span>
            <div className="font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm">
              ₹ {Number(project.cumm_financial_expenditure_cr || project.expenditure_prior_cr || 0).toFixed(2)} Cr
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Target Completion</span>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1">
              <span>📅 {project.likely_completion_date || project.probable_completion_date || '—'}</span>
              {hasTimeOverrun && (
                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 text-[10px] font-bold rounded">
                  +{project.time_overrun_years}y delay
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Level 2 Tab Navigation */}
        <div className="px-6 pt-2 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto bg-slate-50/40 dark:bg-slate-850/40 print:hidden text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab('physical')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'physical'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🛣️ Physical Progress
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            💰 Financials & RCE
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⏱️ Timelines & EOT
          </button>
          <button
            onClick={() => setActiveTab('personnel')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'personnel'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            👷 Personnel & Agency
          </button>
          <button
            onClick={() => setActiveTab('detailed_stage')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'detailed_stage'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🏗️ Civil & LA Stage Notes
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Identification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Sanction Job Number
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.job_no || '—'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    PMIS / OCMS / PMG ID
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.pmis_id || '—'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Total Design Length
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.length_km ? `${project.length_km} Km` : '—'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Sanction Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.sanction_date || '—'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Appointed / Start Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.appointed_date || '—'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Scheduled Completion
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.scheduled_completion_date || '—'}
                  </p>
                </div>
              </div>

              {/* Contracting & Personnel Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Contractor / Agency
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                    {project.contractor_name || 'Agency to be appointed / Tendering'}
                  </p>
                </div>
                <div>
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Divisional Engineer In-Charge
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                    {project.de_name_phone || '—'}
                  </p>
                </div>
              </div>

              {/* Stage Remarks Box */}
              {(project.stage_remarks || isTender) && (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <Clock className="w-4 h-4" />
                    <span>Tender / Pre-Execution Status Remarks</span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    {project.stage_remarks || 'Tender / Sanction process ongoing.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHYSICAL PROGRESS */}
          {activeTab === 'physical' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Cumulative Physical Progress
                  </span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {project.progress_percent || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, project.progress_percent || 0))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Completed till 31.03.2026
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.completed_length_prior_km !== null ? `${project.completed_length_prior_km} Km` : '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Completed in 2026-27
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.completed_length_current_fy_km !== null ? `${project.completed_length_current_fy_km} Km` : '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold block">
                    Total Completed Length
                  </span>
                  <p className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300 text-xs">
                    {project.total_completed_length_km !== null ? `${project.total_completed_length_km} Km` : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & RCE */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Original TPC
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    ₹ {Number(project.project_cost_cr || 0).toFixed(2)} Cr
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Revised / Anticipated Cost
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.revised_cost_cr ? `₹ ${Number(project.revised_cost_cr).toFixed(2)} Cr` : '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1">
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-semibold block">
                    Increase in Cost (RCE)
                  </span>
                  <p className="font-mono font-bold text-amber-800 dark:text-amber-300 text-xs">
                    {project.cost_increase_rce_cr ? `₹ ${Number(project.cost_increase_rce_cr).toFixed(2)} Cr` : '—'}
                  </p>
                </div>
              </div>

              {/* Expenditure Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  Booked Financial Expenditure
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Upto 31.03.2026:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      ₹ {Number(project.expenditure_prior_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">In 2026-27:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      ₹ {Number(project.expenditure_current_fy_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Cumulative Financial Progress:</span>
                    <span className="font-mono font-extrabold text-blue-700 dark:text-blue-400 text-xs">
                      ₹ {Number(project.cumm_financial_expenditure_cr || 0).toFixed(2)} Cr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINES & EOT */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Scheduled Date
                  </span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {project.scheduled_completion_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Likely / Actual Date
                  </span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {project.likely_completion_date || project.probable_completion_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Time Overrun
                  </span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {project.time_overrun_years ? `${project.time_overrun_years} Years` : 'Nil / On Schedule'}
                  </p>
                </div>
              </div>

              {/* EOT Status */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    Extension of Time (EOT) Status
                  </h4>
                  {project.eot_proposal_agency && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold rounded">
                      With Agency: {project.eot_proposal_agency}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {project.eot_granted_till || 'No EOT granted / Pending submission.'}
                </p>
              </div>

              {/* Change of Scope */}
              {project.cos_details && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    Change of Scope (COS) Details
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {project.cos_details}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PERSONNEL & AGENCY */}
          {activeTab === 'personnel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DE Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <User className="w-4 h-4" />
                    <span>Divisional Engineer</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.de_name_phone || '—'}
                  </p>
                </div>

                {/* Contractor Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <HardHat className="w-4 h-4" />
                    <span>Executing Contractor</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.contractor_name || '—'}
                  </p>
                </div>
              </div>

              {/* Reporting Division & Timestamp */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Reporting Division & Update Timestamp:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {project.updated_division_date || `${project.division} Division`}
                </span>
              </div>
            </div>
          )}

          {/* TAB 6: DETAILED STAGE CIVIL & LA NOTES */}
          {activeTab === 'detailed_stage' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Ground Reality & Engineering Milestone Log (Col AC)</span>
                </div>
                {project.detailed_stage_status ? (
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed whitespace-pre-line font-mono text-slate-800 dark:text-slate-200 max-h-96 overflow-y-auto">
                    {project.detailed_stage_status}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    No granular structural or land acquisition status log recorded yet for this project.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-400 font-mono">
            National Highways Project Passport &bull; Level 2 Review System
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
