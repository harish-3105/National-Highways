'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LegalCaseData } from '@/types/legal';
import {
  X,
  Printer,
  FileText,
  Gavel,
  AlertTriangle,
  Clock,
  Scale,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Edit,
  Link as LinkIcon,
} from 'lucide-react';
import { formatDateIndian } from '@/lib/formatters';

interface CaseViewModalProps {
  caseData: LegalCaseData;
  onClose: () => void;
  onEdit?: (c: LegalCaseData) => void;
}

type LegalStageType =
  | 'case_registry'
  | 'appeal_registry'
  | 'base_case_details'
  | 'counter_affidavit'
  | 'hearing_listing'
  | 'interim_compliance'
  | 'disposal_appeal';

interface StageDefinition {
  id: LegalStageType;
  label: string;
  step: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NORMAL_CASE_STAGES: StageDefinition[] = [
  {
    id: 'case_registry',
    label: 'Case Registry & Scope',
    step: 'Stage 1',
    subtitle: 'Jurisdiction, court, case particulars, parties & prayer',
    icon: Scale,
  },
  {
    id: 'counter_affidavit',
    label: 'Counter Affidavit (CA)',
    step: 'Stage 2',
    subtitle: 'CA filing mandate, due timeline, submission date & financial implication',
    icon: FileText,
  },
  {
    id: 'hearing_listing',
    label: 'Hearing Schedule & Status',
    step: 'Stage 3',
    subtitle: 'Present stage, current status & hearing dates',
    icon: Calendar,
  },
  {
    id: 'interim_compliance',
    label: 'Interim Orders & Compliance',
    step: 'Stage 4',
    subtitle: 'Court interim directions, compliance period & departmental actions taken',
    icon: Clock,
  },
  {
    id: 'disposal_appeal',
    label: 'Disposal & Appeal Track',
    step: 'Stage 5',
    subtitle: 'Final judgment, adverse findings, GP opinion & appeal initiation',
    icon: Gavel,
  },
];

const APPEAL_CASE_STAGES: StageDefinition[] = [
  {
    id: 'appeal_registry',
    label: 'Appeal Case Registry',
    step: 'Stage 1',
    subtitle: 'Appellate court, appeal particulars, parties & appeal prayer',
    icon: Scale,
  },
  {
    id: 'base_case_details',
    label: 'Base / Original Case',
    step: 'Stage 2',
    subtitle: 'Original court, case type, case number, parties & original prayer',
    icon: FileText,
  },
  {
    id: 'counter_affidavit',
    label: 'Counter Affidavit (CA)',
    step: 'Stage 3',
    subtitle: 'CA filing mandate, due timeline, submission date & financial implication',
    icon: FileText,
  },
  {
    id: 'hearing_listing',
    label: 'Hearing Schedule & Status',
    step: 'Stage 4',
    subtitle: 'Present stage, current status & hearing dates',
    icon: Calendar,
  },
  {
    id: 'interim_compliance',
    label: 'Interim Orders & Compliance',
    step: 'Stage 5',
    subtitle: 'Court interim directions, compliance period & departmental actions taken',
    icon: Clock,
  },
  {
    id: 'disposal_appeal',
    label: 'Disposal & Higher Appeal',
    step: 'Stage 6',
    subtitle: 'Final judgment, adverse findings, GP opinion & higher appeal track',
    icon: Gavel,
  },
];

export const CaseViewModal: React.FC<CaseViewModalProps> = ({ caseData, onClose, onEdit }) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  const isAppeal = caseData.caseClassification === 'Appeal Case';
  const stages = useMemo(() => {
    return isAppeal ? APPEAL_CASE_STAGES : NORMAL_CASE_STAGES;
  }, [isAppeal]);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
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
  }, [onClose]);

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
    }
  };

  const handleNextStage = () => {
    if (activeStageIndex < stages.length - 1) {
      setActiveStageIndex((prev) => prev + 1);
    }
  };

  const currentStage = stages[activeStageIndex] || stages[0];

  return (
    <div
      className="legal-print-modal-wrapper fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden print:p-0 print:bg-white print:static animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="legal-print-card bg-slate-50 dark:bg-slate-950 w-full h-full flex flex-col overflow-hidden print:bg-white print:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print:bg-blue-950 print:text-white border-b border-blue-950">
          <div className="flex items-center gap-3 max-w-7xl">
            <div className="p-2.5 bg-white/10 rounded-xl shrink-0 print:hidden">
              {isAppeal ? <Gavel className="w-5 h-5 text-amber-300" /> : <Scale className="w-5 h-5 text-blue-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg text-white">
                  {caseData.caseDetails || 'Legal Case'}
                </h3>
                <span className="text-[10px] bg-blue-800 text-blue-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {caseData.caseClassification}
                </span>
                {caseData.currentStatus && (
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${
                      caseData.currentStatus === 'Disposed' || caseData.finalResult === 'Yes'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {caseData.currentStatus}
                  </span>
                )}
              </div>
              <span className="text-xs text-blue-200 print:text-blue-100 mt-0.5 block">
                {caseData.circle} Circle &bull; {caseData.division} Division &bull; {caseData.nameOfCourt}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(caseData);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Case
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Export PDF / Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STAGE LIFECYCLE SUB-NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto">
            <div
              className={`grid gap-2 ${
                isAppeal
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
              }`}
            >
              {stages.map((stage, idx) => {
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

        {/* Modal Scrollable Body */}
        <div className="legal-print-scrollable p-6 md:p-8 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 print:p-6 print:text-slate-900 flex-1">
          <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Departmental Print Letterhead Header (Only in print) */}
          <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-4">
            <h2 className="font-extrabold text-base text-slate-950 uppercase tracking-wide">
              Highways Department &bull; Government of Tamil Nadu
            </h2>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">
              Legal Cell &bull; {caseData.circle} Circle ({caseData.division})
            </p>
            <p className="text-[11px] text-slate-600 font-mono mt-1">
              Litigation Docket &bull; Case: {caseData.caseDetails || 'Legal Case'} &bull; Classification: {caseData.caseClassification} &bull; Generated: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>

          {/* ========================================================= */}
          {/* STAGE 1: Case Registry & Scope (Normal Case) */}
          {/* ========================================================= */}
          {currentStage.id === 'case_registry' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 1: Case Registry & Particulars
                </h3>
              </div>

              {/* Jurisdiction Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Circle</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.circle}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Division</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.division}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Court Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.nameOfCourt}</span>
                </div>
              </div>

              {/* Litigants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Petitioner(s)</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">{caseData.petitionerNames}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Respondent(s)</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">{caseData.respondentNames}</p>
                </div>
              </div>

              {/* Nature & Pertains */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Pertains To</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.casePertainsTo || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Nature of Case</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    {caseData.natureOfCase}
                    {caseData.specifyNatureOfCase ? ` (${caseData.specifyNatureOfCase})` : ''}
                  </span>
                </div>
              </div>

              {caseData.briefOfPrayer && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Brief of Prayer</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{caseData.briefOfPrayer}</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 1: Appeal Case Registry (Appeal Case) */}
          {/* ========================================================= */}
          {currentStage.id === 'appeal_registry' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 1: Appeal Case Particulars & Appellate Forum
                </h3>
              </div>

              {/* Appeal Jurisdiction Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Appeal Circle</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.circle}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Appeal Division</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.division}</span>
                </div>
              </div>

              {caseData.appealInfo && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                      <Gavel className="w-3.5 h-3.5 text-blue-600" /> Appellate Forum Details
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Appeal Case Number / Year</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {caseData.appealInfo.appealCaseDetails || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Appellate Court</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{caseData.appealInfo.appellateCourt || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Filing Date</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">📅 {formatDateIndian(caseData.appealInfo.appealFilingDate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Limitation Due Date</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">📅 {formatDateIndian(caseData.appealInfo.limitationDueDate)}</span>
                    </div>
                  </div>
                  {caseData.appealInfo.delayInFilingAppeal === 'Yes' && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Appeal Filing Delayed by {caseData.appealInfo.delayPeriodDays || 0} Days
                      </span>
                      <span className="font-medium">{caseData.appealInfo.condonationOfDelay || 'Condonation Application'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Litigants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Appellant / Petitioner(s)</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">{caseData.petitionerNames}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Respondent(s)</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">{caseData.respondentNames}</p>
                </div>
              </div>

              {/* Nature & Pertains */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Pertains To</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.casePertainsTo || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Nature of Case</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    {caseData.natureOfCase}
                    {caseData.specifyNatureOfCase ? ` (${caseData.specifyNatureOfCase})` : ''}
                  </span>
                </div>
              </div>

              {caseData.briefOfPrayer && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Appeal Grounds & Prayer</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{caseData.briefOfPrayer}</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Base / Original Case Details (Appeal Case) */}
          {/* ========================================================= */}
          {currentStage.id === 'base_case_details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Stage 2: Base / Original Lower Court Case Details
                  </h3>
                </div>
                {caseData.linkedBaseCaseId && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    <LinkIcon className="w-3 h-3" /> Linked to Original Docket
                  </span>
                )}
              </div>

              {/* Case Particulars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Number / Year</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    {caseData.baseCaseDetails || '—'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Court / Forum</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.baseCourtName || '—'}</span>
                </div>
              </div>

              {/* Administrative Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Circle Jurisdiction</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.baseCircle || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Division Jurisdiction</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.baseDivision || '—'}</span>
                </div>
              </div>

              {/* Litigants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Petitioner(s)</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">{caseData.basePetitionerNames || '—'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Respondent(s)</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">{caseData.baseRespondentNames || '—'}</p>
                </div>
              </div>

              {/* Nature & Pertains */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Pertains To</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.baseCasePertainsTo || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Nature of Case</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.baseNatureOfCase || '—'}</span>
                </div>
              </div>

              {/* Final Order & Date */}
              {(caseData.baseFinalOrder || caseData.baseFinalOrderDate) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Order / Direction</span>
                    <p className="text-slate-900 dark:text-slate-100 text-xs font-medium leading-relaxed">
                      {caseData.baseFinalOrder || '—'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Order Date</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                      📅 {formatDateIndian(caseData.baseFinalOrderDate)}
                    </span>
                  </div>
                </div>
              )}

              {caseData.baseBriefOfPrayer && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Brief of Prayer</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{caseData.baseBriefOfPrayer}</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE: Counter Affidavit (CA) */}
          {/* ========================================================= */}
          {currentStage.id === 'counter_affidavit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {currentStage.step}: Counter Affidavit (CA) Status & Financials
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CA Required</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.caRequired || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CA Due Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateIndian(caseData.caDueDate)}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CA Filed</span>
                  <span className={`font-extrabold text-xs mt-0.5 block ${caseData.caFiled === 'Yes' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {caseData.caFiled || '—'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CA Filed Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateIndian(caseData.caFiledDate)}
                  </span>
                  {caseData.caFiledDate && caseData.caDueDate && caseData.caFiledDate > caseData.caDueDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Delayed by {Math.ceil((new Date(caseData.caFiledDate).getTime() - new Date(caseData.caDueDate).getTime()) / (1000 * 60 * 60 * 24))}d
                    </span>
                  )}
                </div>
              </div>

              {caseData.financialImplication && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Financial Implication</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block">
                    ₹ {caseData.financialImplication}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE: Hearing Schedule & Status */}
          {/* ========================================================= */}
          {currentStage.id === 'hearing_listing' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {currentStage.step}: Present Status & Hearing Schedule
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Present Stage</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-xs mt-0.5 block">{caseData.presentStage || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Status</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.currentStatus || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Hearing Date</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {formatDateIndian(caseData.lastHearingDate)}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Hearing Date</span>
                  <p className="font-mono font-bold text-blue-700 dark:text-blue-300 text-xs">
                    📅 {formatDateIndian(caseData.nextHearingDate)}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Listing Purpose</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {caseData.nextListingPurpose || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE: Interim Orders & Compliance */}
          {/* ========================================================= */}
          {currentStage.id === 'interim_compliance' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {currentStage.step}: Interim Directions & Compliance Track
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Interim Order Direction</span>
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-xs leading-relaxed">
                    {caseData.interimOrderDirection || 'No interim orders recorded'}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Interim Order Date</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    📅 {formatDateIndian(caseData.interimOrderDate)}
                  </p>
                </div>
              </div>

              {caseData.complianceAction && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Action Directed by Court</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">
                    {caseData.complianceAction}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Required</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.complianceRequired || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Period</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.compliancePeriod || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance End Date (CED)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateIndian(caseData.complianceEndDate)}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Status</span>
                  <span className={`font-bold text-xs mt-0.5 block ${
                    caseData.complianceStatus?.toLowerCase() === 'completed' || caseData.complianceStatus?.toLowerCase() === 'complied'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : caseData.complianceStatus?.toLowerCase() === 'overdue'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {caseData.complianceStatus || '—'}
                  </span>
                  {caseData.complianceStatus?.toLowerCase() === 'overdue' && caseData.complianceEndDate && new Date().toISOString().split('T')[0] > caseData.complianceEndDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Overdue by {Math.ceil((new Date(new Date().toISOString().split('T')[0]).getTime() - new Date(caseData.complianceEndDate).getTime()) / (1000 * 60 * 60 * 24))}d
                    </span>
                  )}
                </div>
              </div>

              {/* Completion Date (if completed / recorded) */}
              {caseData.complianceCompletionDate && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 max-w-sm">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Completion Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateIndian(caseData.complianceCompletionDate)}
                  </span>
                  {caseData.complianceEndDate && caseData.complianceCompletionDate > caseData.complianceEndDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Delayed by {Math.ceil((new Date(caseData.complianceCompletionDate).getTime() - new Date(caseData.complianceEndDate).getTime()) / (1000 * 60 * 60 * 24))}d
                    </span>
                  )}
                </div>
              )}

              {caseData.actionTakenDetailsForCompliance && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Action Taken Details for Compliance</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{caseData.actionTakenDetailsForCompliance}</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE: Disposal & Appeal Track */}
          {/* ========================================================= */}
          {currentStage.id === 'disposal_appeal' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Gavel className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {currentStage.step}: Final Disposal, Adverse Findings & Appeals
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Concluded / Disposed?</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.finalResult || 'No'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Order</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.finalResultOrder || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Order Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateIndian(caseData.finalOrderDate)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Adverse to Department</span>
                  <span className={`font-extrabold text-xs mt-0.5 block ${caseData.adverseToDepartment === 'Yes' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {caseData.adverseToDepartment || 'No'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">GP Opinion</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-xs mt-0.5 block">{caseData.gpOpinion || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Appeal Filed?</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{caseData.appealFiled || 'No'}</span>
                </div>
              </div>

              {caseData.appealFiledDate && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Appeal Filed Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateIndian(caseData.appealFiledDate)}
                  </span>
                </div>
              )}

              {caseData.finalOrderRemarks && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Judgment Summary & Remarks</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{caseData.finalOrderRemarks}</p>
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
                  <ChevronLeft className="w-4 h-4" /> Previous: {stages[activeStageIndex - 1].label}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close Docket
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeStageIndex < stages.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer transition-all"
                >
                  <span>Next: {stages[activeStageIndex + 1].label}</span>
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

export default CaseViewModal;
