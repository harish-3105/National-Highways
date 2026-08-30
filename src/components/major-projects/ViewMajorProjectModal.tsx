'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Edit,
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

type StageTabType =
  | 'sanction_scope'
  | 'contract_award'
  | 'physical_financial_progress'
  | 'overruns_eot'
  | 'statutory_clearances'
  | 'col27_field_log';

interface StageDefinition {
  id: StageTabType;
  label: string;
  step: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'sanction_scope',
    label: 'Sanction & Scope',
    step: 'Stage 1',
    subtitle: 'Primary identity, division, scheme & technical scope',
    icon: FileText,
  },
  {
    id: 'contract_award',
    label: 'Award & Contract',
    step: 'Stage 2',
    subtitle: 'LOA, agreement, contractor & award valuation',
    icon: HardHat,
  },
  {
    id: 'physical_financial_progress',
    label: 'Physical & Financial Progress',
    step: 'Stage 3',
    subtitle: 'Stage classification, completed lengths & financial expenditure bars',
    icon: TrendingUp,
  },
  {
    id: 'overruns_eot',
    label: 'Overruns & EOT',
    step: 'Stage 4',
    subtitle: 'Completion targets, delay metrics & extension of time',
    icon: Clock,
  },
  {
    id: 'statutory_clearances',
    label: 'Statutory Clearances',
    step: 'Stage 5',
    subtitle: 'Land, forest, utility, railways & statutory bottlenecks',
    icon: ShieldAlert,
  },
  {
    id: 'col27_field_log',
    label: 'Col 27 Execution Log',
    step: 'Stage 6',
    subtitle: 'Detailed stage status & division update ledger',
    icon: Building2,
  },
];

export const ViewMajorProjectModal: React.FC<ViewMajorProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveStageIndex(0);
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

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

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
    }
  };

  const handleNextStage = () => {
    if (activeStageIndex < STAGES.length - 1) {
      setActiveStageIndex((prev) => prev - 1);
    }
  };

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden print:p-0 print:bg-white print:static animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 dark:bg-slate-950 w-full h-full overflow-hidden flex flex-col relative print:border-none print:shadow-none print:max-h-none print:h-auto print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="max-w-7xl mx-auto w-full flex items-start justify-between gap-4">
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
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10.5px] rounded-md border border-amber-200 dark:border-amber-800">
                    ⚡ Mega Project (&ge; ₹50 Cr)
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                {project.name_of_work}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0 print:hidden">
              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(project);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Work</span>
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Print Project Passport"
              >
                <Printer className="w-4 h-4" />
                <span>Export / Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 5-Metric Quick Header Ribbon */}
        <div className="px-6 py-3 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
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
                    (₹{Number(project.contract_value_cr).toFixed(2)} Cr)
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
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 text-[10px] font-bold rounded-md font-mono">
                    ⚠️ {delayInfo.compactText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 6-STAGE LIFECYCLE SUB-NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isActive = activeStageIndex === idx;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageIndex(idx)}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {stage.step}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-xs font-bold truncate w-full">{stage.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Stage Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 text-xs text-slate-800 dark:text-slate-200 print:p-6 print:text-slate-900">
          <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* ========================================================= */}
          {/* STAGE 1: Sanction & Scope */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 1: Sanction & Technical Scope
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Serial Number
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    #{project.s_no || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Administrative Division
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.division || '—'} Division
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Scheme Classification
                  </span>
                  <p className="font-bold text-purple-700 dark:text-purple-300 text-xs">
                    {project.scheme || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Total Project Length
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.length_km ? `${project.length_km} km` : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Sanction Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.sanction_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Sanction Job / AS Number
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.job_no || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    PMIS Portal ID
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.pmis_id || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Old / New NH No
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.old_new_nh || '—'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                  Full Work Description
                </span>
                <p className="font-medium text-slate-900 dark:text-slate-100 text-xs leading-relaxed">
                  {project.name_of_work}
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Contract & Award Execution */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <HardHat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 2: Contract Award & Field Agency
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Contractor / Agency
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.contractor_name || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Divisional Engineer (DE) & Phone
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.de_name_phone || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Contract Value
                  </span>
                  <p className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {project.contract_value_cr ? `₹ ${Number(project.contract_value_cr).toFixed(2)} Cr` : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Date of LOA
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.loa_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Date of Agreement
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.agreement_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Site Handover Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.site_handover_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Appointed Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.appointed_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Scheduled Completion
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.scheduled_completion_date || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Combined Physical & Financial Progress */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 3: Physical & Financial Execution Metrics
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Card A: Physical Progress with Progress Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                        Physical Progress ({project.work_stage})
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                      {isTender ? 'Tender Stage' : `${project.progress_percent || 0}%`}
                    </span>
                  </div>

                  {!isTender && (
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
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
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Prior Completed</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                        {project.completed_length_prior_km || 0} km
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Current FY</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                        {project.completed_length_current_fy_km || 0} km
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Total Completed</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block">
                        {project.total_completed_length_km || 0} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card B: Financial Progress with Progress Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                        Financial Progress
                      </span>
                    </div>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg">
                      {finProgress !== null ? `${finProgress}%` : '0%'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, finProgress || 0))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Exp: ₹{Number(project.cumm_financial_expenditure_cr || project.expenditure_prior_cr || 0).toFixed(2)} Cr</span>
                      <span>Budget: ₹{effectiveCost.toFixed(2)} Cr</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Prior Exp</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                        ₹{Number(project.expenditure_prior_cr || 0).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Current FY</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                        ₹{Number(project.expenditure_current_fy_cr || 0).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Cumulative</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs mt-0.5 block">
                        ₹{Number(project.cumm_financial_expenditure_cr || project.expenditure_prior_cr || 0).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 block uppercase font-bold">Contract Exp</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block">
                        ₹{Number(project.contract_cum_expenditure_cr || 0).toFixed(2)} Cr
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card C: Contract Value Progress Bar */}
              {project.contract_value_cr && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                        Contract Value Progress
                      </span>
                    </div>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                      {contractProgress !== null ? `${contractProgress}%` : '0%'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, contractProgress || 0))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Contract Cumulative Exp: ₹{Number(project.contract_cum_expenditure_cr || 0).toFixed(2)} Cr</span>
                    <span>Total Contract Value: ₹{Number(project.contract_value_cr).toFixed(2)} Cr</span>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {(project.stage_remarks || project.progress_remarks) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    {project.work_stage === 'TENDER_STAGE' ? 'Tender Stage Remarks' : 'Physical Progress Remarks'}
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                    {project.stage_remarks || project.progress_remarks}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: Overruns, EOT & Target Dates */}
          {/* ========================================================= */}
          {activeStageIndex === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 4: Schedule Analysis, Delay & EOT
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Scheduled Completion
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.scheduled_completion_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Likely Completion Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.likely_completion_date || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Probable Completion Date
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.probable_completion_date || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Time Overrun (Years)
                  </span>
                  <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                    {project.time_overrun_years ? `${project.time_overrun_years} Years` : '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    EOT Granted Till
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {project.eot_granted_till || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    EOT Proposal Agency
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {project.eot_proposal_agency || '—'}
                  </p>
                </div>
              </div>

              {project.cos_details && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Change of Scope (COS) Details
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                    {project.cos_details}
                  </p>
                </div>
              )}

              {delayInfo && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Schedule Analysis & Delay Status
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Completion: {project.scheduled_completion_date || 'Not specified'}
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${delayInfo.isDelayed ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'}`}>
                    {delayInfo.humanText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 5: Statutory Clearances & Bottlenecks */}
          {/* ========================================================= */}
          {activeStageIndex === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 5: 5 Statutory Bottlenecks & Clearances
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    1. Land Acquisition (LA)
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {project.issue_land || 'No bottlenecks reported'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    2. Forest & Environmental Clearances
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {project.issue_forest || 'No bottlenecks reported'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    3. Utility Shifting (TNEB, TWAD, Gas)
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {project.issue_utility || 'No bottlenecks reported'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    4. Railways Approvals (ROB / RUB / GAD)
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {project.issue_railways || 'No bottlenecks reported'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  5. Other Statutory or Legal Bottlenecks
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  {project.issue_others || 'No bottlenecks reported'}
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 6: Column 27 Technical Execution Remarks */}
          {/* ========================================================= */}
          {activeStageIndex === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Stage 6: Column 27 Detailed Technical Execution Log
                  </h3>
                </div>
                {project.detailed_stage_status && (
                  <button
                    onClick={handleCopyStageLog}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Log'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {project.detailed_stage_status || 'No detailed technical stage log recorded for this work item.'}
              </div>

              {project.updated_division_date && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <span className="font-bold">Division Progress Ledger Update Date:</span>
                  <span className="font-mono font-extrabold">📅 {project.updated_division_date}</span>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="bg-white dark:bg-slate-900 px-6 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div>
              {activeStageIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevStage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous: {STAGES[activeStageIndex - 1].label}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close Passport
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeStageIndex < STAGES.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer transition-all"
                >
                  <span>Next: {STAGES[activeStageIndex + 1].label}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMajorProjectModal;
