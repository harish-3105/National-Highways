'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LegalCaseData,
  AppealCaseInformation,
  CaseClassificationType,
  YesNoType,
  GPOpinionType,
  ComplianceStatusType,
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
  Sparkles,
  ShieldAlert,
  Calendar,
  Building,
  Check,
  ChevronRight,
  ChevronLeft,
  LockKeyhole,
  AlertCircle,
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
    label: 'Hearing Schedule',
    step: 'Stage 3',
    subtitle: 'Listing purpose, previous & upcoming court appearance dates',
    icon: Calendar,
  },
  {
    id: 'interim_compliance',
    label: 'Interim Orders & Compliance',
    step: 'Stage 4',
    subtitle: 'Court interim directions, time limits & departmental actions taken',
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
          appealLevel: '',
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
    category: initial?.category || '',
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
    caRequired: initial?.caRequired || ('' as any),
    caFiled: initial?.caFiled || ('' as any),
    caDueDate: initial?.caDueDate || '',
    caFiledDate: initial?.caFiledDate || '',
    lastHearingDate: initial?.lastHearingDate || '',
    nextHearingDate: initial?.nextHearingDate || '',
    nextListingPurpose: initial?.nextListingPurpose || '',
    interimOrderDirection: initial?.interimOrderDirection || '',
    interimOrderDate: initial?.interimOrderDate || '',
    latestOrderFinalOrder: initial?.latestOrderFinalOrder || '',
    latestOrderDate: initial?.latestOrderDate || '',
    complianceRequired: initial?.complianceRequired || ('' as any),
    complianceAction: initial?.complianceAction || '',
    compliancePeriod: initial?.compliancePeriod || '',
    complianceEndDate: initial?.complianceEndDate || '',
    actionTakenDetailsForCompliance: initial?.actionTakenDetailsForCompliance || '',
    complianceStatus: initial?.complianceStatus || ('' as any),
    remarks: initial?.remarks || '',
    finalResult: initial?.finalResult || ('' as any),
    finalResultOrder: initial?.finalResultOrder || '',
    finalOrderDate: initial?.finalOrderDate || '',
    adverseToDepartment: initial?.adverseToDepartment || ('' as any),
    gpOpinion: initial?.gpOpinion || ('' as any),
    appealFiled: initial?.appealFiled || ('' as any),
    appealFiledDate: initial?.appealFiledDate || '',
    linkedAppealCaseId: initial?.linkedAppealCaseId || '',
    finalOrderComplianceActionGiven: initial?.finalOrderComplianceActionGiven || '',
    finalOrderComplianceAction: initial?.finalOrderComplianceAction || ('' as any),
    finalOrderCompliancePeriod: initial?.finalOrderCompliancePeriod || '',
    finalOrderComplianceEndDate: initial?.finalOrderComplianceEndDate || '',
    finalOrderComplianceActionTaken: initial?.finalOrderComplianceActionTaken || '',
    finalOrderComplianceStatus: initial?.finalOrderComplianceStatus || ('' as any),
    finalOrderRemarks: initial?.finalOrderRemarks || '',
  };
};

export const CaseEntryForm: React.FC<CaseEntryFormProps> = ({
  initialData,
  masterData,
  onSave,
  onSaveAndCreateAppeal,
  onCancel,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [formData, setFormData] = useState<LegalCaseData>(() => getDefaultInitialState(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Dynamic Master Data Options
  const circles = masterData?.circles || [];
  const caseTypes = masterData?.caseTypes || [];
  const categories = masterData?.categories || [];
  const courts = masterData?.courtNames || [];
  const casePertainsToList = masterData?.casePertainsTo || [];
  const natureOfCasesList = masterData?.natureOfCases || [];
  const presentStages = masterData?.presentStages || [];
  const currentStatuses = masterData?.caseStatuses || [];
  const appealLevels = masterData?.appealLevels || [];
  const appealCaseTypes = masterData?.appealCaseTypes || [];
  const appellateCourts = masterData?.appellateCourts || [];
  const condonationDelays = masterData?.condonationOfDelays || [];
  const gpOpinions = masterData?.gpOpinions || [];
  const complianceStatuses = masterData?.complianceStatuses || [];

  const divisions = useMemo(() => {
    return masterData?.divisions || [];
  }, [masterData?.divisions]);

  // Auto-calculate Appeal Delay
  useEffect(() => {
    if (formData.caseClassification === 'Appeal Case' && formData.appealInfo) {
      if (formData.appealInfo.appealFilingDate && formData.appealInfo.limitationDueDate) {
        const { isDelayed, delayDays } = calculateAppealDelay(
          formData.appealInfo.appealFilingDate,
          formData.appealInfo.limitationDueDate
        );

        if (
          formData.appealInfo.delayInFilingAppeal !== isDelayed ||
          formData.appealInfo.delayPeriodDays !== delayDays
        ) {
          setFormData((prev) => ({
            ...prev,
            appealInfo: {
              ...prev.appealInfo!,
              delayInFilingAppeal: isDelayed,
              delayPeriodDays: delayDays,
            },
          }));
        }
      }
    }
  }, [
    formData.caseClassification,
    formData.appealInfo?.appealFilingDate,
    formData.appealInfo?.limitationDueDate,
    formData.appealInfo?.delayInFilingAppeal,
    formData.appealInfo?.delayPeriodDays,
  ]);

  const handleChange = <K extends keyof LegalCaseData>(field: K, value: LegalCaseData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAppealInfoChange = <K extends keyof AppealCaseInformation>(
    field: K,
    value: AppealCaseInformation[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      appealInfo: {
        ...(prev.appealInfo || (getDefaultInitialState().appealInfo as AppealCaseInformation)),
        [field]: value,
      },
    }));
  };

  const handleCircleChange = (newCircle: string) => {
    setFormData((prev) => ({
      ...prev,
      circle: newCircle,
      division: '',
    }));
  };

  // -------------------------------------------------------------
  // STAGE-GATED VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Case Registry (Baseline)
      if (!formData.caseClassification) stageErrors.caseClassification = 'Classification is required (Stage 1).';
      if (formData.caseClassification === 'Appeal Case') {
        if (!formData.appealInfo?.appealCaseNumber?.trim()) stageErrors.appealCaseNumber = 'Appeal Case Number is required (Stage 1).';
        if (!formData.appealInfo?.appealYear?.trim()) stageErrors.appealYear = 'Appeal Year is required (Stage 1).';
      }
      if (!formData.caseType) stageErrors.caseType = 'Case Type is required (Stage 1).';
      if (!formData.circle) stageErrors.circle = 'Circle is required (Stage 1).';
      if (!formData.division) stageErrors.division = 'Division is required (Stage 1).';
      if (!formData.caseNumber?.trim()) stageErrors.caseNumber = 'Case Number is required (Stage 1).';
      if (!formData.caseYear?.trim()) stageErrors.caseYear = 'Case Year is required (Stage 1).';
      if (!formData.nameOfCourt) stageErrors.nameOfCourt = 'Name of Court is required (Stage 1).';
      if (!formData.petitionerNames?.trim()) stageErrors.petitionerNames = 'Petitioner Name(s) is required (Stage 1).';
      if (!formData.respondentNames?.trim()) stageErrors.respondentNames = 'Respondent Name(s) is required (Stage 1).';
    } else if (stageIdx === 1) {
      // Stage 2: CA Details
      if (formData.caFiled === 'Yes' && !formData.caFiledDate) {
        stageErrors.caFiledDate = 'CA Filed Date is required when CA Filed = Yes (Stage 2).';
      }
    } else if (stageIdx === 2) {
      // Stage 3: Hearing details
    } else if (stageIdx === 3) {
      // Stage 4: Interim Orders & Compliance
      if (formData.complianceRequired === 'Yes') {
        if (!formData.complianceAction?.trim()) stageErrors.complianceAction = 'Compliance Action is required (Stage 4).';
        if (!formData.complianceStatus) stageErrors.complianceStatus = 'Compliance Status is required (Stage 4).';
      }
    } else if (stageIdx === 4) {
      // Stage 5: Final disposal
      if (formData.finalResult === 'Yes') {
        if (!formData.finalOrderDate) stageErrors.finalOrderDate = 'Final Order Date is required when Final Result (Disposed) = Yes (Stage 5).';
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
      return Boolean(formData.caseNumber.trim() && formData.circle && formData.division && Object.keys(validateSingleStage(0)).length === 0);
    }
    if (stageIdx === 1) {
      return Boolean(formData.caRequired || formData.caFiled);
    }
    if (stageIdx === 2) {
      return Boolean(formData.lastHearingDate || formData.nextHearingDate);
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

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              {initialData?.id ? 'Edit Legal Case Proceeding' : 'New Legal Case Registration'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Legal Cell &bull; High Court, District Courts & Tribunal Docket System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving Docket...' : `Save Progress (${currentStage.step})`}
          </button>
        </div>
      </div>

      {/* 5-STAGE LIFECYCLE SUB-NAVIGATION STEPPER BAR */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = activeStageIndex === idx;
            const accessible = isStageAccessible(idx);
            const completed = isStageCompleted(idx);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageTabClick(idx)}
                disabled={!accessible}
                className={`flex flex-col items-start p-3 rounded-xl text-left transition-all border relative cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                    : accessible
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : completed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {stage.step}
                  </span>
                  {completed ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : !accessible ? (
                    <LockKeyhole className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  )}
                </div>
                <span className="text-xs font-bold truncate w-full">{stage.label}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate w-full mt-0.5">{stage.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Diagnostic Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please resolve the following required fields ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STAGE CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Stage Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
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
          {/* STAGE 1: Case Registry & Scope */}
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

              {/* Appeal Case Fields */}
              {formData.caseClassification === 'Appeal Case' && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                    Appellate Jurisdiction Particulars
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Appeal Level</label>
                      <SearchableSelect
                        options={appealLevels}
                        value={formData.appealInfo?.appealLevel || ''}
                        onChange={(val) => handleAppealInfoChange('appealLevel', val)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Appeal Case Type</label>
                      <SearchableSelect
                        options={appealCaseTypes}
                        value={formData.appealInfo?.appealCaseType || ''}
                        onChange={(val) => handleAppealInfoChange('appealCaseType', val)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Appellate Court</label>
                      <SearchableSelect
                        options={appellateCourts}
                        value={formData.appealInfo?.appellateCourt || ''}
                        onChange={(val) => handleAppealInfoChange('appellateCourt', val)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Appeal Case No *</label>
                      <input
                        type="text"
                        value={formData.appealInfo?.appealCaseNumber || ''}
                        onChange={(e) => handleAppealInfoChange('appealCaseNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Appeal Year *</label>
                      <input
                        type="text"
                        value={formData.appealInfo?.appealYear || ''}
                        onChange={(e) => handleAppealInfoChange('appealYear', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Appeal Filing Date</label>
                      <DatePickerInput
                        value={formData.appealInfo?.appealFilingDate || ''}
                        onChange={(val) => handleAppealInfoChange('appealFilingDate', val)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Limitation Due Date</label>
                      <DatePickerInput
                        value={formData.appealInfo?.limitationDueDate || ''}
                        onChange={(val) => handleAppealInfoChange('limitationDueDate', val)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Condonation of Delay</label>
                      <SearchableSelect
                        options={condonationDelays}
                        value={formData.appealInfo?.condonationOfDelay || ''}
                        onChange={(val) => handleAppealInfoChange('condonationOfDelay', val)}
                      />
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

              {/* Nature, Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <SearchableSelect
                    options={categories}
                    value={formData.category}
                    onChange={(val) => handleChange('category', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nature of Case</label>
                  <SearchableSelect
                    options={natureOfCasesList}
                    value={formData.natureOfCase}
                    onChange={(val) => handleChange('natureOfCase', val)}
                  />
                </div>

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

              {/* Brief of Prayer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brief of Prayer</label>
                <textarea
                  rows={3}
                  value={formData.briefOfPrayer}
                  onChange={(e) => handleChange('briefOfPrayer', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Counter Affidavit (CA) */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CA Required</label>
                  <SearchableSelect
                    options={['Yes', 'No', 'Not Required']}
                    value={formData.caRequired || ''}
                    onChange={(val) => handleChange('caRequired', val as any)}
                  />
                </div>

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
                    onChange={(val) => handleChange('caFiled', val as any)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CA Filed Date</label>
                  <DatePickerInput
                    value={formData.caFiledDate || ''}
                    onChange={(val) => handleChange('caFiledDate', val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Hearing Schedule */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Hearing Date</label>
                  <DatePickerInput
                    value={formData.lastHearingDate || ''}
                    onChange={(val) => handleChange('lastHearingDate', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Next Hearing Date</label>
                  <DatePickerInput
                    value={formData.nextHearingDate || ''}
                    onChange={(val) => handleChange('nextHearingDate', val)}
                  />
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance Required</label>
                  <SearchableSelect
                    options={['Yes', 'No', 'Not Applicable']}
                    value={formData.complianceRequired || ''}
                    onChange={(val) => handleChange('complianceRequired', val as any)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance End Date</label>
                  <DatePickerInput
                    value={formData.complianceEndDate || ''}
                    onChange={(val) => handleChange('complianceEndDate', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance Status</label>
                  <SearchableSelect
                    options={complianceStatuses}
                    value={formData.complianceStatus || ''}
                    onChange={(val) => handleChange('complianceStatus', val as any)}
                  />
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

          {/* ========================================================= */}
          {/* STAGE 5: Disposal & Appeal Track */}
          {/* ========================================================= */}
          {activeStageIndex === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Case Concluded / Disposed? (Final Result)</label>
                  <SearchableSelect
                    options={['Yes', 'No']}
                    value={formData.finalResult || ''}
                    onChange={(val) => handleChange('finalResult', val as any)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Final Order Date</label>
                  <DatePickerInput
                    value={formData.finalOrderDate || ''}
                    onChange={(val) => handleChange('finalOrderDate', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Adverse to Department?</label>
                  <SearchableSelect
                    options={['Yes', 'No', 'Neutral']}
                    value={formData.adverseToDepartment || ''}
                    onChange={(val) => handleChange('adverseToDepartment', val as any)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">GP Opinion Received</label>
                  <SearchableSelect
                    options={gpOpinions}
                    value={formData.gpOpinion || ''}
                    onChange={(val) => handleChange('gpOpinion', val as any)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Appeal Filed?</label>
                  <SearchableSelect
                    options={['Yes', 'No', 'Under Proposal']}
                    value={formData.appealFiled || ''}
                    onChange={(val) => handleChange('appealFiled', val as any)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Appeal Filed Date</label>
                  <DatePickerInput
                    value={formData.appealFiledDate || ''}
                    onChange={(val) => handleChange('appealFiledDate', val)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Final Judgment Summary & Remarks</label>
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

        {/* Bottom Navigation & Save Action Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
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
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeStageIndex < STAGES.length - 1 && (
              <button
                type="button"
                onClick={handleNextStage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer transition-all"
              >
                <span>Next: {STAGES[activeStageIndex + 1].label}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Docket...' : `Save Progress (${currentStage.step})`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CaseEntryForm;
