'use client';

import React, { useState, useMemo } from 'react';
import {
  LegalCaseData,
  AppealCaseInformation,
  CaseClassificationType,
} from '@/types/legal';
import { calculateAppealDelay } from '@/lib/legal/masterData';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { LegalMasterData } from '@/app/api/legal/master-data/route';
import {
  Save,
  ArrowLeft,
  Gavel,
  Scale,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  LockKeyhole,
} from 'lucide-react';

interface CaseEntryFormProps {
  initialData?: Partial<LegalCaseData>;
  masterData?: LegalMasterData;
  onSave: (data: LegalCaseData) => void;
  onSaveAndCreateAppeal?: (savedData: LegalCaseData) => void;
  onCancel: () => void;
}

type LegalStageType =
  | 'case_registry'
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

const STAGES: StageDefinition[] = [
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
    subtitle: 'CA filing mandate, due timeline & submission date',
    icon: FileText,
  },
  {
    id: 'hearing_listing',
    label: 'Hearing Schedule & Status',
    step: 'Stage 3',
    subtitle: 'Present stage, current status & hearing schedule',
    icon: Calendar,
  },
  {
    id: 'interim_compliance',
    label: 'Interim Orders & Compliance',
    step: 'Stage 4',
    subtitle: 'Court interim directions, compliance period & departmental actions',
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

const getDefaultInitialState = (initial?: Partial<LegalCaseData>): LegalCaseData => {
  return {
    id: initial?.id,
    caseClassification: initial?.caseClassification || 'Normal Case',
    appealInfo: initial?.appealInfo
      ? { ...initial.appealInfo }
      : {
          appealCaseType: '',
          appealCaseNumber: '',
          appealYear: '',
          appellateCourt: '',
          appealFilingDate: '',
          limitationDueDate: '',
          delayInFilingAppeal: 'No',
          delayPeriodDays: 0,
          condonationOfDelay: '',
        },
    caseType: initial?.caseType || '',
    circle: initial?.circle || '',
    division: initial?.division || '',
    caseNumber: initial?.caseNumber || '',
    caseYear: initial?.caseYear || '',
    nameOfCourt: initial?.nameOfCourt || '',
    petitionerNames: initial?.petitionerNames || '',
    respondentNames: initial?.respondentNames || '',
    casePertainsTo: initial?.casePertainsTo || '',
    natureOfCase: initial?.natureOfCase || '',
    specifyNatureOfCase: initial?.specifyNatureOfCase || '',
    briefOfPrayer: initial?.briefOfPrayer || '',
    financialImplication: initial?.financialImplication || '',
    presentStage: initial?.presentStage || '',
    currentStatus: initial?.currentStatus || '',
    caRequired: initial?.caRequired || '',
    caFiled: initial?.caFiled || '',
    caDueDate: initial?.caDueDate || '',
    caFiledDate: initial?.caFiledDate || '',
    lastHearingDate: initial?.lastHearingDate || '',
    nextHearingDate: initial?.nextHearingDate || '',
    nextListingPurpose: initial?.nextListingPurpose || '',
    interimOrderDirection: initial?.interimOrderDirection || '',
    interimOrderDate: initial?.interimOrderDate || '',
    latestOrderFinalOrder: initial?.latestOrderFinalOrder || '',
    latestOrderDate: initial?.latestOrderDate || '',
    complianceRequired: initial?.complianceRequired || '',
    complianceAction: initial?.complianceAction || '',
    compliancePeriod: initial?.compliancePeriod || '',
    complianceEndDate: initial?.complianceEndDate || '',
    actionTakenDetailsForCompliance: initial?.actionTakenDetailsForCompliance || '',
    complianceStatus: initial?.complianceStatus || '',
    remarks: initial?.remarks || '',
    finalResult: initial?.finalResult || '',
    finalResultOrder: initial?.finalResultOrder || '',
    finalOrderDate: initial?.finalOrderDate || '',
    adverseToDepartment: initial?.adverseToDepartment || '',
    gpOpinion: initial?.gpOpinion || '',
    appealFiled: initial?.appealFiled || '',
    appealFiledDate: initial?.appealFiledDate || '',
    linkedAppealCaseId: initial?.linkedAppealCaseId || '',
    finalOrderComplianceActionGiven: initial?.finalOrderComplianceActionGiven || '',
    finalOrderComplianceAction: initial?.finalOrderComplianceAction || '',
    finalOrderCompliancePeriod: initial?.finalOrderCompliancePeriod || '',
    finalOrderComplianceEndDate: initial?.finalOrderComplianceEndDate || '',
    finalOrderComplianceActionTaken: initial?.finalOrderComplianceActionTaken || '',
    finalOrderComplianceStatus: initial?.finalOrderComplianceStatus || '',
    finalOrderRemarks: initial?.finalOrderRemarks || '',
  };
};

export const CaseEntryForm: React.FC<CaseEntryFormProps> = ({
  initialData,
  masterData,
  onSave,
  onCancel,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [formData, setFormData] = useState<LegalCaseData>(() => getDefaultInitialState(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Dynamic Master Data Options directly from database (zero hardcoded defaults)
  const circles = masterData?.circles || [];
  const caseTypes = masterData?.caseTypes || [];
  const courts = masterData?.courtNames || [];
  const casePertainsToList = masterData?.casePertainsTo || [];
  const natureOfCasesList = masterData?.natureOfCases || [];
  const presentStages = masterData?.presentStages || [];
  const currentStatuses = masterData?.caseStatuses || [];
  const appealCaseTypes = masterData?.appealCaseTypes || [];
  const appellateCourts = masterData?.appellateCourts || [];
  const condonationDelays = masterData?.condonationOfDelays || [];
  const gpOpinions = masterData?.gpOpinions || [];
  const complianceStatuses = masterData?.complianceStatuses || [];

  const divisions = useMemo(() => {
    return masterData?.divisions || [];
  }, [masterData?.divisions]);

  // Helper to determine if GP Opinion qualifies for Appeal Filing
  const isAppealRecommended = (opinion: string | undefined): boolean => {
    if (!opinion) return false;
    const clean = opinion.trim().toLowerCase();
    if (clean.includes('not recommended')) return false;
    return (
      clean === 'recommended for appeal' ||
      clean === 'recommended' ||
      clean === 'not required' ||
      clean === 'fit for appeal'
    );
  };

  const handleChange = <K extends keyof LegalCaseData>(field: K, value: LegalCaseData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleAppealInfoChange = <K extends keyof AppealCaseInformation>(
    field: K,
    value: AppealCaseInformation[K]
  ) => {
    setFormData((prev) => {
      const currentAppeal = prev.appealInfo || (getDefaultInitialState().appealInfo as AppealCaseInformation);
      const updatedAppeal = { ...currentAppeal, [field]: value };

      if (updatedAppeal.appealFilingDate && updatedAppeal.limitationDueDate) {
        const { isDelayed, delayDays } = calculateAppealDelay(
          updatedAppeal.appealFilingDate,
          updatedAppeal.limitationDueDate
        );
        updatedAppeal.delayInFilingAppeal = isDelayed;
        updatedAppeal.delayPeriodDays = delayDays;
      }

      return {
        ...prev,
        appealInfo: updatedAppeal,
      };
    });

    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleCircleChange = (newCircle: string) => {
    setFormData((prev) => ({
      ...prev,
      circle: newCircle,
      division: '',
    }));
    if (errors.circle) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.circle;
        return next;
      });
    }
  };

  // -------------------------------------------------------------
  // STAGE-GATED PROGRESSIVE VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Case Registry (Fully Mandatory)
      if (!formData.caseClassification) {
        stageErrors.caseClassification = 'Case Classification is required (Stage 1).';
      }

      if (formData.caseClassification === 'Appeal Case') {
        if (!formData.appealInfo?.appealCaseType?.trim()) {
          stageErrors.appealCaseType = 'Appeal Case Type is required (Stage 1).';
        }
        if (!formData.appealInfo?.appellateCourt?.trim()) {
          stageErrors.appellateCourt = 'Appellate Court is required (Stage 1).';
        }
        if (!formData.appealInfo?.appealCaseNumber?.trim()) {
          stageErrors.appealCaseNumber = 'Appeal Case Number is required (Stage 1).';
        }
        if (!formData.appealInfo?.appealYear?.trim()) {
          stageErrors.appealYear = 'Appeal Year is required (Stage 1).';
        } else {
          const yr = Number(formData.appealInfo.appealYear);
          const currentYear = new Date().getFullYear();
          if (isNaN(yr) || yr < 1900 || yr > currentYear) {
            stageErrors.appealYear = `Appeal Year must be a valid 4-digit year (up to ${currentYear}).`;
          }
        }
        if (!formData.appealInfo?.appealFilingDate?.trim()) {
          stageErrors.appealFilingDate = 'Appeal Filing Date is required (Stage 1).';
        }
        if (!formData.appealInfo?.limitationDueDate?.trim()) {
          stageErrors.limitationDueDate = 'Limitation Due Date is required (Stage 1).';
        }
        if (!formData.appealInfo?.condonationOfDelay?.trim()) {
          stageErrors.condonationOfDelay = 'Condonation of Delay is required (Stage 1).';
        }
      }

      if (!formData.circle?.trim()) {
        stageErrors.circle = 'Circle Jurisdiction is required (Stage 1).';
      }
      if (!formData.division?.trim()) {
        stageErrors.division = 'Division Jurisdiction is required (Stage 1).';
      }
      if (!formData.nameOfCourt?.trim()) {
        stageErrors.nameOfCourt = 'Name of Court / Forum is required (Stage 1).';
      }
      if (!formData.caseType?.trim()) {
        stageErrors.caseType = 'Case Type is required (Stage 1).';
      }
      if (!formData.caseNumber?.trim()) {
        stageErrors.caseNumber = 'Case Number is required (Stage 1).';
      }
      if (!formData.caseYear?.trim()) {
        stageErrors.caseYear = 'Case Filing Year is required (Stage 1).';
      } else {
        const yr = Number(formData.caseYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(yr) || yr < 1900 || yr > currentYear) {
          stageErrors.caseYear = `Case Year must be a valid 4-digit year (up to ${currentYear}).`;
        }
      }
      if (!formData.petitionerNames?.trim()) {
        stageErrors.petitionerNames = 'Petitioner Name(s) is required (Stage 1).';
      }
      if (!formData.respondentNames?.trim()) {
        stageErrors.respondentNames = 'Respondent Name(s) is required (Stage 1).';
      }
      if (!formData.casePertainsTo?.trim()) {
        stageErrors.casePertainsTo = 'Case Pertains To is required (Stage 1).';
      }
      if (!formData.natureOfCase?.trim()) {
        stageErrors.natureOfCase = 'Nature of Case is required (Stage 1).';
      }
      const isNatureOther =
        formData.natureOfCase?.toLowerCase() === 'others' ||
        formData.natureOfCase?.toLowerCase() === 'other';
      if (isNatureOther && !formData.specifyNatureOfCase?.trim()) {
        stageErrors.specifyNatureOfCase = 'Please specify the custom nature of case (Stage 1).';
      }
      if (!formData.briefOfPrayer?.trim()) {
        stageErrors.briefOfPrayer = 'Brief of Prayer is required (Stage 1).';
      }
    } else if (stageIdx === 1) {
      // Stage 2: Counter Affidavit & Financial Implication
      if (formData.caRequired === 'Yes') {
        if (!formData.caFiled) {
          stageErrors.caFiled = 'CA Filed status is required when CA is required (Stage 2).';
        }
        if (formData.caFiled === 'Yes' && !formData.caFiledDate) {
          stageErrors.caFiledDate = 'CA Filed Date is required when CA is filed (Stage 2).';
        }
      }
    } else if (stageIdx === 2) {
      // Stage 3: Hearing Schedule & Status (Validation: Hearing Dates >= Filing Date)
      const baseFilingDate =
        formData.caseClassification === 'Appeal Case'
          ? formData.appealInfo?.appealFilingDate
          : formData.caFiledDate || '';

      if (baseFilingDate) {
        if (formData.lastHearingDate && formData.lastHearingDate < baseFilingDate) {
          stageErrors.lastHearingDate = `Last Hearing Date (${formData.lastHearingDate}) cannot be earlier than Filing Date (${baseFilingDate}).`;
        }
        if (formData.nextHearingDate && formData.nextHearingDate < baseFilingDate) {
          stageErrors.nextHearingDate = `Next Hearing Date (${formData.nextHearingDate}) cannot be earlier than Filing Date (${baseFilingDate}).`;
        }
      }

      if (
        formData.lastHearingDate &&
        formData.nextHearingDate &&
        formData.nextHearingDate < formData.lastHearingDate
      ) {
        stageErrors.nextHearingDate = 'Next Hearing Date cannot be earlier than Last Hearing Date.';
      }
    } else if (stageIdx === 3) {
      // Stage 4: Interim Orders & Compliance
      if (formData.complianceRequired === 'Yes') {
        if (!formData.complianceStatus) {
          stageErrors.complianceStatus = 'Compliance Status is required when Compliance is required (Stage 4).';
        }
      }
    } else if (stageIdx === 4) {
      // Stage 5: Final Disposal & Appeal Track
      if (formData.finalResult === 'Yes') {
        if (!formData.finalOrderDate) {
          stageErrors.finalOrderDate = 'Final Order Date is required when Case is Concluded (Stage 5).';
        }
        if (!formData.adverseToDepartment) {
          stageErrors.adverseToDepartment = 'Adverse to Department selection is required (Stage 5).';
        }
        if (formData.adverseToDepartment === 'Yes') {
          if (!formData.gpOpinion) {
            stageErrors.gpOpinion = 'GP Opinion is required when order is Adverse to Department (Stage 5).';
          }
          if (isAppealRecommended(formData.gpOpinion)) {
            if (!formData.appealFiled) {
              stageErrors.appealFiled = 'Appeal Filed selection is required (Stage 5).';
            }
            if (formData.appealFiled === 'Yes' && !formData.appealFiledDate) {
              stageErrors.appealFiledDate = 'Appeal Filed Date is required when Appeal is Filed (Stage 5).';
            }
          }
        }
      }
    }

    return stageErrors;
  };

  const isStageAccessible = (targetStageIdx: number): boolean => {
    if (targetStageIdx === 0) return true;
    for (let i = 0; i < targetStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      if (Object.keys(stageErrs).length > 0) return false;
    }
    return true;
  };

  const isStageCompleted = (stageIdx: number): boolean => {
    if (stageIdx === 0) {
      return Boolean(
        formData.caseNumber.trim() &&
        formData.circle &&
        formData.division &&
        formData.nameOfCourt &&
        formData.caseType &&
        formData.petitionerNames.trim() &&
        formData.respondentNames.trim() &&
        formData.briefOfPrayer.trim() &&
        Object.keys(validateSingleStage(0)).length === 0
      );
    }
    if (stageIdx === 1) {
      return Boolean(formData.caRequired || formData.caFiled || formData.financialImplication);
    }
    if (stageIdx === 2) {
      return Boolean(formData.presentStage || formData.currentStatus || formData.lastHearingDate || formData.nextHearingDate);
    }
    if (stageIdx === 3) {
      return Boolean(formData.interimOrderDirection || formData.complianceRequired);
    }
    if (stageIdx === 4) {
      return Boolean(formData.finalResult || formData.finalOrderDate);
    }
    return false;
  };

  const validateUpToStage = (maxStageIdx: number): boolean => {
    const combinedErrors: Record<string, string> = {};
    for (let i = 0; i <= maxStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      Object.assign(combinedErrors, stageErrs);
    }
    setErrors(combinedErrors);
    return Object.keys(combinedErrors).length === 0;
  };

  const handleStageTabClick = (idx: number) => {
    if (isStageAccessible(idx)) {
      setErrors({});
      setActiveStageIndex(idx);
    } else {
      validateUpToStage(activeStageIndex);
    }
  };

  const handleNextStage = () => {
    if (validateUpToStage(activeStageIndex)) {
      if (activeStageIndex < STAGES.length - 1) {
        setActiveStageIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpToStage(activeStageIndex)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const currentStage = STAGES[activeStageIndex];
  const isNatureOther =
    formData.natureOfCase?.toLowerCase() === 'others' ||
    formData.natureOfCase?.toLowerCase() === 'other';

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Legal Dockets
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Legal Case Docket' : 'New Legal Case Registration'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Department Legal Proceedings Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Legal Case'}
          </button>
        </div>
      </div>

      {/* Progressive Stage Stepper Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2" aria-label="Stages">
          {STAGES.map((stg, idx) => {
            const Icon = stg.icon;
            const isActive = activeStageIndex === idx;
            const accessible = isStageAccessible(idx);
            const completed = isStageCompleted(idx);

            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => handleStageTabClick(idx)}
                disabled={!accessible}
                className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-xs transition-all text-left cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : accessible
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    : 'text-slate-400 dark:text-slate-600 opacity-60'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : completed
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {completed && !isActive ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : !accessible ? (
                    <LockKeyhole className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-80">
                      {stg.step}
                    </span>
                    {completed && !isActive && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                        DONE
                      </span>
                    )}
                  </div>
                  <div className="font-bold truncate mt-0.5">{stg.label}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Stage Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Stage Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {React.createElement(currentStage.icon, { className: 'w-5 h-5 text-blue-300' })}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                {currentStage.step}: {currentStage.label}
              </h3>
              <span className="text-xs text-blue-200">{currentStage.subtitle}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ========================================================= */}
          {/* STAGE 1: Case Registry & Scope (Fully Mandatory) */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-6">
              {/* Classification Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Case Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Normal Case', 'Appeal Case'].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => handleChange('caseClassification', cls as CaseClassificationType)}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        formData.caseClassification === cls
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Appeal Case Specific Fields (Rendered seamlessly without colored container) */}
              {formData.caseClassification === 'Appeal Case' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Appellate Jurisdiction Particulars
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Appeal Case Type <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={appealCaseTypes}
                        value={formData.appealInfo?.appealCaseType || ''}
                        onChange={(val) => handleAppealInfoChange('appealCaseType', val)}
                      />
                      {errors.appealCaseType && <p className="text-[11px] text-rose-500 mt-1">{errors.appealCaseType}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Appellate Court <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={appellateCourts}
                        value={formData.appealInfo?.appellateCourt || ''}
                        onChange={(val) => handleAppealInfoChange('appellateCourt', val)}
                      />
                      {errors.appellateCourt && <p className="text-[11px] text-rose-500 mt-1">{errors.appellateCourt}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Appeal Case No <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.appealInfo?.appealCaseNumber || ''}
                        onChange={(e) => handleAppealInfoChange('appealCaseNumber', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        required
                      />
                      {errors.appealCaseNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.appealCaseNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Appeal Year <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.appealInfo?.appealYear || ''}
                        onChange={(e) => handleAppealInfoChange('appealYear', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        required
                      />
                      {errors.appealYear && <p className="text-[11px] text-rose-500 mt-1">{errors.appealYear}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Appeal Filing Date <span className="text-rose-500">*</span>
                      </label>
                      <DatePickerInput
                        value={formData.appealInfo?.appealFilingDate || ''}
                        onChange={(val) => handleAppealInfoChange('appealFilingDate', val)}
                      />
                      {errors.appealFilingDate && <p className="text-[11px] text-rose-500 mt-1">{errors.appealFilingDate}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Limitation Due Date <span className="text-rose-500">*</span>
                      </label>
                      <DatePickerInput
                        value={formData.appealInfo?.limitationDueDate || ''}
                        onChange={(val) => handleAppealInfoChange('limitationDueDate', val)}
                      />
                      {errors.limitationDueDate && <p className="text-[11px] text-rose-500 mt-1">{errors.limitationDueDate}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Condonation of Delay <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={condonationDelays}
                        value={formData.appealInfo?.condonationOfDelay || ''}
                        onChange={(val) => handleAppealInfoChange('condonationOfDelay', val)}
                      />
                      {errors.condonationOfDelay && <p className="text-[11px] text-rose-500 mt-1">{errors.condonationOfDelay}</p>}
                    </div>
                  </div>

                  {formData.appealInfo?.delayInFilingAppeal === 'Yes' && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Appeal Filing Overran Limitation by {formData.appealInfo.delayPeriodDays} Days</span>
                      </div>
                      <span className="text-[11px] font-medium bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-700">
                        Condonation: {formData.appealInfo.condonationOfDelay || 'Required'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Administrative Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Circle Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={circles}
                    value={formData.circle}
                    onChange={handleCircleChange}
                  />
                  {errors.circle && <p className="text-[11px] text-rose-500 mt-1">{errors.circle}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Division Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={divisions}
                    value={formData.division}
                    onChange={(val) => handleChange('division', val)}
                  />
                  {errors.division && <p className="text-[11px] text-rose-500 mt-1">{errors.division}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Name of Court / Forum <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={courts}
                    value={formData.nameOfCourt}
                    onChange={(val) => handleChange('nameOfCourt', val)}
                  />
                  {errors.nameOfCourt && <p className="text-[11px] text-rose-500 mt-1">{errors.nameOfCourt}</p>}
                </div>
              </div>

              {/* Case Registry Specifics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Case Type <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={caseTypes}
                    value={formData.caseType}
                    onChange={(val) => handleChange('caseType', val)}
                  />
                  {errors.caseType && <p className="text-[11px] text-rose-500 mt-1">{errors.caseType}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Case Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.caseNumber}
                    onChange={(e) => handleChange('caseNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.caseNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.caseNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Case Filing Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.caseYear}
                    onChange={(e) => handleChange('caseYear', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.caseYear && <p className="text-[11px] text-rose-500 mt-1">{errors.caseYear}</p>}
                </div>
              </div>

              {/* Litigant Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Petitioner Name(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.petitionerNames}
                    onChange={(e) => handleChange('petitionerNames', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.petitionerNames && <p className="text-[11px] text-rose-500 mt-1">{errors.petitionerNames}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Respondent Name(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.respondentNames}
                    onChange={(e) => handleChange('respondentNames', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.respondentNames && <p className="text-[11px] text-rose-500 mt-1">{errors.respondentNames}</p>}
                </div>
              </div>

              {/* Jurisdiction & Nature of Case */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Case Pertains To <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={casePertainsToList}
                    value={formData.casePertainsTo}
                    onChange={(val) => handleChange('casePertainsTo', val)}
                  />
                  {errors.casePertainsTo && <p className="text-[11px] text-rose-500 mt-1">{errors.casePertainsTo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nature of Case <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={natureOfCasesList}
                    value={formData.natureOfCase}
                    onChange={(val) => handleChange('natureOfCase', val)}
                  />
                  {errors.natureOfCase && <p className="text-[11px] text-rose-500 mt-1">{errors.natureOfCase}</p>}
                </div>
              </div>

              {/* Conditional Specify Nature of Case for Others */}
              {isNatureOther && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specify Nature of Case <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.specifyNatureOfCase || ''}
                    onChange={(e) => handleChange('specifyNatureOfCase', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.specifyNatureOfCase && <p className="text-[11px] text-rose-500 mt-1">{errors.specifyNatureOfCase}</p>}
                </div>
              )}

              {/* Brief of Prayer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brief of Prayer <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.briefOfPrayer}
                  onChange={(e) => handleChange('briefOfPrayer', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
                {errors.briefOfPrayer && <p className="text-[11px] text-rose-500 mt-1">{errors.briefOfPrayer}</p>}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Counter Affidavit (CA) & Financial Implication */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Step 1: CA Required */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CA Required</label>
                  <SearchableSelect
                    options={['Yes', 'No', 'Not Required']}
                    value={formData.caRequired || ''}
                    onChange={(val) => handleChange('caRequired', val)}
                  />
                </div>

                {/* Step 2: If CA Required = Yes -> Show CA Due Date & CA Filed */}
                {formData.caRequired === 'Yes' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CA Due Date</label>
                      <DatePickerInput
                        value={formData.caDueDate || ''}
                        onChange={(val) => handleChange('caDueDate', val)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CA Filed</label>
                      <SearchableSelect
                        options={['Yes', 'No', 'Under Preparation']}
                        value={formData.caFiled || ''}
                        onChange={(val) => handleChange('caFiled', val)}
                      />
                      {errors.caFiled && <p className="text-[11px] text-rose-500 mt-1">{errors.caFiled}</p>}
                    </div>
                  </>
                )}

                {/* Step 3: If CA Filed = Yes -> Show CA Filed Date */}
                {formData.caRequired === 'Yes' && formData.caFiled === 'Yes' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CA Filed Date</label>
                    <DatePickerInput
                      value={formData.caFiledDate || ''}
                      onChange={(val) => handleChange('caFiledDate', val)}
                    />
                    {errors.caFiledDate && <p className="text-[11px] text-rose-500 mt-1">{errors.caFiledDate}</p>}
                  </div>
                )}
              </div>

              {/* Financial Implication (in ₹) positioned after CA Filed Date */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-md">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Financial Implication (in ₹ / Numeric, if any)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.financialImplication !== undefined ? formData.financialImplication : ''}
                    onChange={(e) => handleChange('financialImplication', e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Hearing Schedule & Present Status */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-6">
              {/* Present Stage & Current Status moved to the TOP of Tab 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Present Stage</label>
                  <SearchableSelect
                    options={presentStages}
                    value={formData.presentStage}
                    onChange={(val) => handleChange('presentStage', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Status</label>
                  <SearchableSelect
                    options={currentStatuses}
                    value={formData.currentStatus}
                    onChange={(val) => handleChange('currentStatus', val)}
                  />
                </div>
              </div>

              {/* Hearing Schedule Dates (Validation: Hearing Date >= Filing Date) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Hearing Date</label>
                  <DatePickerInput
                    value={formData.lastHearingDate || ''}
                    onChange={(val) => handleChange('lastHearingDate', val)}
                  />
                  {errors.lastHearingDate && <p className="text-[11px] text-rose-500 mt-1">{errors.lastHearingDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Next Hearing Date</label>
                  <DatePickerInput
                    value={formData.nextHearingDate || ''}
                    onChange={(val) => handleChange('nextHearingDate', val)}
                  />
                  {errors.nextHearingDate && <p className="text-[11px] text-rose-500 mt-1">{errors.nextHearingDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Next Listing Purpose</label>
                  <input
                    type="text"
                    value={formData.nextListingPurpose || ''}
                    onChange={(e) => handleChange('nextListingPurpose', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: Interim Orders & Compliance */}
          {/* ========================================================= */}
          {activeStageIndex === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Interim Order Direction</label>
                  <textarea
                    rows={2}
                    value={formData.interimOrderDirection || ''}
                    onChange={(e) => handleChange('interimOrderDirection', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Interim Order Date</label>
                  <DatePickerInput
                    value={formData.interimOrderDate || ''}
                    onChange={(val) => handleChange('interimOrderDate', val)}
                  />
                </div>
              </div>

              {/* Compliance Required */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-xs">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance Required</label>
                  <SearchableSelect
                    options={['Yes', 'No', 'Not Applicable']}
                    value={formData.complianceRequired || ''}
                    onChange={(val) => handleChange('complianceRequired', val)}
                  />
                </div>
              </div>

              {/* If Compliance Required = Yes -> reveal Compliance Period, Compliance End Date, Status & Action Taken */}
              {formData.complianceRequired === 'Yes' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Compliance Period (Text)
                      </label>
                      <input
                        type="text"
                        value={formData.compliancePeriod || ''}
                        onChange={(e) => handleChange('compliancePeriod', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance End Date (CED)</label>
                      <DatePickerInput
                        value={formData.complianceEndDate || ''}
                        onChange={(val) => handleChange('complianceEndDate', val)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Compliance Status <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={complianceStatuses}
                        value={formData.complianceStatus || ''}
                        onChange={(val) => handleChange('complianceStatus', val)}
                      />
                      {errors.complianceStatus && <p className="text-[11px] text-rose-500 mt-1">{errors.complianceStatus}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Action Taken Details for Compliance</label>
                    <textarea
                      rows={2}
                      value={formData.actionTakenDetailsForCompliance || ''}
                      onChange={(e) => handleChange('actionTakenDetailsForCompliance', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 5: Disposal & Appeal Track */}
          {/* ========================================================= */}
          {activeStageIndex === 4 && (
            <div className="space-y-6">
              {/* Step 1: Case Concluded / Disposed? */}
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Case Concluded / Disposed?</label>
                <SearchableSelect
                  options={['Yes', 'No']}
                  value={formData.finalResult || ''}
                  onChange={(val) => handleChange('finalResult', val)}
                />
              </div>

              {/* If Case Concluded = Yes -> show Final Order, Final Order Date, Adverse to Department? */}
              {formData.finalResult === 'Yes' && (
                <div className="space-y-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Final Order</label>
                      <input
                        type="text"
                        value={formData.finalResultOrder || ''}
                        onChange={(e) => handleChange('finalResultOrder', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Final Order Date <span className="text-rose-500">*</span>
                      </label>
                      <DatePickerInput
                        value={formData.finalOrderDate || ''}
                        onChange={(val) => handleChange('finalOrderDate', val)}
                      />
                      {errors.finalOrderDate && <p className="text-[11px] text-rose-500 mt-1">{errors.finalOrderDate}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Adverse to Department? <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={['Yes', 'No', 'Neutral']}
                        value={formData.adverseToDepartment || ''}
                        onChange={(val) => handleChange('adverseToDepartment', val)}
                      />
                      {errors.adverseToDepartment && <p className="text-[11px] text-rose-500 mt-1">{errors.adverseToDepartment}</p>}
                    </div>
                  </div>

                  {/* Step 2: If Adverse to Department = Yes -> Reveal ONLY GP Opinion */}
                  {formData.adverseToDepartment === 'Yes' && (
                    <div className="space-y-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                      <div className="max-w-md">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          GP Opinion <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          options={gpOpinions}
                          value={formData.gpOpinion || ''}
                          onChange={(val) => handleChange('gpOpinion', val)}
                        />
                        {errors.gpOpinion && <p className="text-[11px] text-rose-500 mt-1">{errors.gpOpinion}</p>}
                      </div>

                      {/* Step 3: If GP Opinion is Recommended or Not Required -> Reveal Appeal Filed? */}
                      {isAppealRecommended(formData.gpOpinion) && (
                        <div className="space-y-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                          <div className="max-w-md">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Appeal Filed? <span className="text-rose-500">*</span>
                            </label>
                            <SearchableSelect
                              options={['Yes', 'No', 'Under Proposal']}
                              value={formData.appealFiled || ''}
                              onChange={(val) => handleChange('appealFiled', val)}
                            />
                            {errors.appealFiled && <p className="text-[11px] text-rose-500 mt-1">{errors.appealFiled}</p>}
                          </div>

                          {/* Step 4: If Appeal Filed = Yes -> Reveal Appeal Filed Date & Final Judgment Summary */}
                          {formData.appealFiled === 'Yes' && (
                            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                              <div className="max-w-md">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Appeal Filed Date <span className="text-rose-500">*</span>
                                </label>
                                <DatePickerInput
                                  value={formData.appealFiledDate || ''}
                                  onChange={(val) => handleChange('appealFiledDate', val)}
                                />
                                {errors.appealFiledDate && <p className="text-[11px] text-rose-500 mt-1">{errors.appealFiledDate}</p>}
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Final Judgment Summary & Remarks
                                </label>
                                <textarea
                                  rows={3}
                                  value={formData.finalOrderRemarks || ''}
                                  onChange={(e) => handleChange('finalOrderRemarks', e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Navigation Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStage}
            disabled={activeStageIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Stage
          </button>

          <div className="flex items-center gap-2">
            {activeStageIndex < STAGES.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStage}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Next Stage <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete & Save Docket
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default CaseEntryForm;
