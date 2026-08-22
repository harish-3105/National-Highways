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
import { CIRCLE_DIVISION_MAP, calculateAppealDelay } from '@/lib/legal/masterData';
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
} from 'lucide-react';

interface CaseEntryFormProps {
  initialData?: Partial<LegalCaseData>;
  masterData?: LegalMasterData;
  onSave: (data: LegalCaseData) => void;
  onSaveAndCreateAppeal?: (savedData: LegalCaseData) => void;
  onCancel: () => void;
}

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
  const [formData, setFormData] = useState<LegalCaseData>(() => getDefaultInitialState(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic Master Data Options (driven strictly by masterData from DB)
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

  // Dynamic divisions: based on active circle from CIRCLE_DIVISION_MAP or masterData.divisions
  const divisions = useMemo(() => {
    if (formData.circle && CIRCLE_DIVISION_MAP[formData.circle]) {
      return CIRCLE_DIVISION_MAP[formData.circle];
    }
    return masterData?.divisions || [];
  }, [formData.circle, masterData?.divisions]);

  // Auto-calculate Appeal Delay whenever Appeal Filing Date or Limitation Due Date changes
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
      division: '', // Allow user to explicitly select division
    }));
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // Top Level Mode
    if (!formData.caseClassification) {
      errs.caseClassification = 'Case Type classification is required';
    }

    // Section A validations if Appeal Case
    if (formData.caseClassification === 'Appeal Case') {
      if (!formData.appealInfo?.appealLevel) errs.appealLevel = 'Appeal Level is required';
      if (!formData.appealInfo?.appealCaseType) errs.appealCaseType = 'Appeal Case Type is required';
      if (!formData.appealInfo?.appealCaseNumber?.trim()) errs.appealCaseNumber = 'Appeal Case Number is required';
      if (!formData.appealInfo?.appealYear?.trim()) errs.appealYear = 'Appeal Year is required';
      if (!formData.appealInfo?.appellateCourt) errs.appellateCourt = 'Appellate Court is required';
      if (!formData.appealInfo?.appealFilingDate) errs.appealFilingDate = 'Appeal Filing Date is required';
      if (!formData.appealInfo?.limitationDueDate) errs.limitationDueDate = 'Limitation / Due Date is required';
      if (!formData.appealInfo?.condonationOfDelay) errs.condonationOfDelay = 'Condonation of Delay is required';
    }

    // Section B.1 validations (Case Information)
    if (!formData.caseType) errs.caseType = 'Case Type is required';
    if (!formData.circle) errs.circle = 'Circle is required';
    if (!formData.division) errs.division = 'Division is required';
    if (!formData.caseNumber?.trim()) errs.caseNumber = 'Case Number is required';
    if (!formData.caseYear?.trim()) errs.caseYear = 'Case Year is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.nameOfCourt) errs.nameOfCourt = 'Name of Court is required';
    if (!formData.petitionerNames?.trim()) errs.petitionerNames = 'Name of Petitioner(s) is required';
    if (!formData.respondentNames?.trim()) errs.respondentNames = 'Name of Respondent(s) is required';
    if (!formData.casePertainsTo) errs.casePertainsTo = 'Case Pertains To is required';
    if (!formData.natureOfCase) errs.natureOfCase = 'Nature of Case is required';
    if (!formData.briefOfPrayer?.trim()) errs.briefOfPrayer = 'Brief of the Prayer is required';
    if (!formData.presentStage) errs.presentStage = 'Present Stage is required';
    if (!formData.currentStatus) errs.currentStatus = 'Current Status is required';

    // Section B.2 validations (CA Information)
    if (!formData.caRequired) errs.caRequired = 'CA Required selection is required';
    if (!formData.caFiled) errs.caFiled = 'CA Filed selection is required';
    if (formData.caFiled === 'Yes' && !formData.caFiledDate) {
      errs.caFiledDate = 'CA Filed Date is required when CA Filed = Yes';
    }

    // Section B.4 validations (Compliance)
    if (!formData.complianceRequired) errs.complianceRequired = 'Compliance Required is required';
    if (formData.complianceRequired === 'Yes') {
      if (!formData.complianceAction?.trim()) errs.complianceAction = 'Compliance Action is required';
      if (!formData.compliancePeriod?.trim()) errs.compliancePeriod = 'Compliance Period is required';
      if (!formData.actionTakenDetailsForCompliance?.trim()) {
        errs.actionTakenDetailsForCompliance = 'Action Taken Details for Compliance is required';
      }
      if (!formData.complianceStatus) errs.complianceStatus = 'Compliance Status is required';
    }

    // Section B.5 validations (Final Result)
    if (!formData.finalResult) errs.finalResult = 'Final Result selection is required';
    if (formData.finalResult === 'Yes') {
      if (!formData.finalResultOrder?.trim()) errs.finalResultOrder = 'Final Result Order details are required';
      if (!formData.finalOrderDate) errs.finalOrderDate = 'Final Order Date is required';
    }
    if (!formData.adverseToDepartment) errs.adverseToDepartment = 'Adverse to Department is required';
    if (!formData.gpOpinion) errs.gpOpinion = 'GP Opinion is required';

    // Section B.6 validations (Appeal)
    if (!formData.appealFiled) errs.appealFiled = 'Appeal Filed is required';
    if (formData.appealFiled === 'Yes' && !formData.appealFiledDate) {
      errs.appealFiledDate = 'Appeal Filed Date is required when Appeal Filed = Yes';
    }

    // Section B.7 validations (Final-Order Compliance)
    if (formData.finalResult === 'Yes') {
      if (!formData.finalOrderComplianceActionGiven?.trim()) {
        errs.finalOrderComplianceActionGiven = 'Compliance Action Given in Final Order is required';
      }
      if (!formData.finalOrderComplianceAction) {
        errs.finalOrderComplianceAction = 'Compliance Action is required';
      }
      if (!formData.finalOrderCompliancePeriod?.trim()) {
        errs.finalOrderCompliancePeriod = 'Compliance Period is required';
      }
      if (!formData.finalOrderComplianceActionTaken?.trim()) {
        errs.finalOrderComplianceActionTaken = 'Compliance Action Taken details are required';
      }
      if (!formData.finalOrderComplianceStatus) {
        errs.finalOrderComplianceStatus = 'Compliance Status is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(firstErrorKey);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleSaveAndCreateAppealClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (onSaveAndCreateAppeal) {
        onSaveAndCreateAppeal(formData);
      } else {
        onSave(formData);
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {formData.id ? 'Edit Legal Case Record' : 'New Legal Case Entry'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Tamil Nadu Highways Department &bull; High Court, Appellate & District Litigation System
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors self-start md:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Legal Dashboard</span>
        </button>
      </div>

      {/* CORE FLOW SELECTOR: Normal Case vs Appeal Case */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-blue-200 dark:border-blue-800/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
              1
            </span>
            <span>Case Classification (Core Entry Type) *</span>
          </label>
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            {formData.caseClassification === 'Appeal Case' ? '⚡ Appeal Mini-Form Active' : 'Standard Case Form'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleChange('caseClassification', 'Normal Case')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              formData.caseClassification === 'Normal Case'
                ? 'border-blue-600 bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-100 shadow-md ring-2 ring-blue-500/20 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="text-sm font-extrabold flex items-center gap-2">
                <span>Normal Case</span>
                {formData.caseClassification === 'Normal Case' && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-black">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Standard original petition / suit (WP, OS, CRP, CMP, etc.)
              </p>
            </div>
            <FileText className={`w-5 h-5 ${formData.caseClassification === 'Normal Case' ? 'text-blue-600' : 'text-slate-400'}`} />
          </button>

          <button
            type="button"
            onClick={() => handleChange('caseClassification', 'Appeal Case')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              formData.caseClassification === 'Appeal Case'
                ? 'border-amber-500 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-100 shadow-md ring-2 ring-amber-500/20 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="text-sm font-extrabold flex items-center gap-2">
                <span>Appeal Case</span>
                {formData.caseClassification === 'Appeal Case' && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-black">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Appellate proceeding (WA, CMA, AS, SLP) with delay computation
              </p>
            </div>
            <Gavel className={`w-5 h-5 ${formData.caseClassification === 'Appeal Case' ? 'text-amber-600' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>

      {/* SECTION A: APPEAL CASE INFORMATION (Rendered ONLY when Case Type = Appeal Case) */}
      {formData.caseClassification === 'Appeal Case' && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-300">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                  A. Appeal Case Information
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Appellate forum details & automatic limitation delay calculator
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2.5 py-1 rounded-lg">
              Appeal Mini-Form
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Appeal Level */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Level *
              </label>
              <SearchableSelect
                options={appealLevels}
                value={formData.appealInfo?.appealLevel || ''}
                onChange={(val) => handleAppealInfoChange('appealLevel', val)}
                placeholder="Select Appeal Level..."
              />
              {errors.appealLevel && <p className="text-[11px] font-semibold text-rose-500">{errors.appealLevel}</p>}
            </div>

            {/* Appeal Case Type */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Case Type *
              </label>
              <SearchableSelect
                options={appealCaseTypes}
                value={formData.appealInfo?.appealCaseType || ''}
                onChange={(val) => handleAppealInfoChange('appealCaseType', val)}
                placeholder="Select Appeal Case Type..."
              />
              {errors.appealCaseType && <p className="text-[11px] font-semibold text-rose-500">{errors.appealCaseType}</p>}
            </div>

            {/* Appeal Case Number */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Case Number *
              </label>
              <input
                type="text"
                value={formData.appealInfo?.appealCaseNumber || ''}
                onChange={(e) => handleAppealInfoChange('appealCaseNumber', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.appealCaseNumber && <p className="text-[11px] font-semibold text-rose-500">{errors.appealCaseNumber}</p>}
            </div>

            {/* Appeal Year */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Year *
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.appealInfo?.appealYear || ''}
                onChange={(e) => handleAppealInfoChange('appealYear', e.target.value.replace(/\D/g, ''))}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.appealYear && <p className="text-[11px] font-semibold text-rose-500">{errors.appealYear}</p>}
            </div>

            {/* Appellate Court */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appellate Court *
              </label>
              <SearchableSelect
                options={appellateCourts}
                value={formData.appealInfo?.appellateCourt || ''}
                onChange={(val) => handleAppealInfoChange('appellateCourt', val)}
                placeholder="Select Appellate Court..."
              />
              {errors.appellateCourt && <p className="text-[11px] font-semibold text-rose-500">{errors.appellateCourt}</p>}
            </div>

            {/* Appeal Filing Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Filing Date *
              </label>
              <DatePickerInput
                value={formData.appealInfo?.appealFilingDate || ''}
                onChange={(val) => handleAppealInfoChange('appealFilingDate', val)}
              />
              {errors.appealFilingDate && <p className="text-[11px] font-semibold text-rose-500">{errors.appealFilingDate}</p>}
            </div>

            {/* Limitation / Due Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Limitation / Due Date *
              </label>
              <DatePickerInput
                value={formData.appealInfo?.limitationDueDate || ''}
                onChange={(val) => handleAppealInfoChange('limitationDueDate', val)}
              />
              {errors.limitationDueDate && <p className="text-[11px] font-semibold text-rose-500">{errors.limitationDueDate}</p>}
            </div>

            {/* Condonation of Delay */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Condonation of Delay *
              </label>
              <SearchableSelect
                options={condonationDelays}
                value={formData.appealInfo?.condonationOfDelay || ''}
                onChange={(val) => handleAppealInfoChange('condonationOfDelay', val)}
                placeholder="Select Condonation Status..."
              />
              {errors.condonationOfDelay && <p className="text-[11px] font-semibold text-rose-500">{errors.condonationOfDelay}</p>}
            </div>
          </div>

          {/* AUTO-COMPUTED DELAY PANEL */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  System Computed Limitation Audit
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Delay in Filing Appeal:
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                  formData.appealInfo?.delayInFilingAppeal === 'Yes'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {formData.appealInfo?.delayInFilingAppeal === 'Yes' ? '⚠️ Delay = Yes' : '✓ Delay = No'}
              </span>

              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Delay Period:{' '}
                <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  {formData.appealInfo?.delayPeriodDays || 0} days
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: NORMAL CASE FORM */}
      <div className="space-y-6">
        {/* B.1: CASE INFORMATION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                B. Case Information
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Primary litigation details, court jurisdiction, and case classification
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Case Type */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Case Type *
              </label>
              <SearchableSelect
                options={caseTypes}
                value={formData.caseType}
                onChange={(val) => handleChange('caseType', val)}
                placeholder="Select Case Type..."
              />
              {errors.caseType && <p className="text-[11px] font-semibold text-rose-500">{errors.caseType}</p>}
            </div>

            {/* Circle */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Circle *
              </label>
              <SearchableSelect
                options={circles}
                value={formData.circle}
                onChange={handleCircleChange}
                placeholder="Select Circle..."
              />
              {errors.circle && <p className="text-[11px] font-semibold text-rose-500">{errors.circle}</p>}
            </div>

            {/* Division */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Division *
              </label>
              <SearchableSelect
                options={divisions}
                value={formData.division}
                onChange={(val) => handleChange('division', val)}
                placeholder="Select Division..."
              />
              {errors.division && <p className="text-[11px] font-semibold text-rose-500">{errors.division}</p>}
            </div>

            {/* Case Number */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Case Number *
              </label>
              <input
                type="text"
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => handleChange('caseNumber', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.caseNumber && <p className="text-[11px] font-semibold text-rose-500">{errors.caseNumber}</p>}
            </div>

            {/* Case Year */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Case Year *
              </label>
              <input
                type="text"
                id="caseYear"
                maxLength={4}
                value={formData.caseYear}
                onChange={(e) => handleChange('caseYear', e.target.value.replace(/\D/g, ''))}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.caseYear && <p className="text-[11px] font-semibold text-rose-500">{errors.caseYear}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <SearchableSelect
                options={categories}
                value={formData.category}
                onChange={(val) => handleChange('category', val)}
                placeholder="Select Category..."
              />
              {errors.category && <p className="text-[11px] font-semibold text-rose-500">{errors.category}</p>}
            </div>

            {/* Name of Court */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Name of Court *
              </label>
              <SearchableSelect
                options={courts}
                value={formData.nameOfCourt}
                onChange={(val) => handleChange('nameOfCourt', val)}
                placeholder="Select Name of Court..."
              />
              {errors.nameOfCourt && <p className="text-[11px] font-semibold text-rose-500">{errors.nameOfCourt}</p>}
            </div>

            {/* Case Pertains To */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Case Pertains To *
              </label>
              <SearchableSelect
                options={casePertainsToList}
                value={formData.casePertainsTo}
                onChange={(val) => handleChange('casePertainsTo', val)}
                placeholder="Select Organization..."
              />
              {errors.casePertainsTo && <p className="text-[11px] font-semibold text-rose-500">{errors.casePertainsTo}</p>}
            </div>

            {/* Name of Petitioner(s) */}
            <div className="space-y-1 sm:col-span-3">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Name of Petitioner(s) *
              </label>
              <input
                type="text"
                id="petitionerNames"
                value={formData.petitionerNames}
                onChange={(e) => handleChange('petitionerNames', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.petitionerNames && <p className="text-[11px] font-semibold text-rose-500">{errors.petitionerNames}</p>}
            </div>

            {/* Name of Respondent(s) */}
            <div className="space-y-1 sm:col-span-3">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Name of Respondent(s) *
              </label>
              <input
                type="text"
                id="respondentNames"
                value={formData.respondentNames}
                onChange={(e) => handleChange('respondentNames', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.respondentNames && <p className="text-[11px] font-semibold text-rose-500">{errors.respondentNames}</p>}
            </div>

            {/* Nature of Case */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Nature of Case *
              </label>
              <SearchableSelect
                options={natureOfCasesList}
                value={formData.natureOfCase}
                onChange={(val) => handleChange('natureOfCase', val)}
                placeholder="Select Nature of Case..."
              />
              {errors.natureOfCase && <p className="text-[11px] font-semibold text-rose-500">{errors.natureOfCase}</p>}
            </div>

            {/* Financial Implication */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Financial Implication
              </label>
              <input
                type="text"
                value={formData.financialImplication || ''}
                onChange={(e) => handleChange('financialImplication', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Present Stage */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Present Stage *
              </label>
              <SearchableSelect
                options={presentStages}
                value={formData.presentStage}
                onChange={(val) => handleChange('presentStage', val)}
                placeholder="Select Present Stage..."
              />
              {errors.presentStage && <p className="text-[11px] font-semibold text-rose-500">{errors.presentStage}</p>}
            </div>

            {/* Current Status */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Current Status *
              </label>
              <SearchableSelect
                options={currentStatuses}
                value={formData.currentStatus}
                onChange={(val) => handleChange('currentStatus', val)}
                placeholder="Select Current Status..."
              />
              {errors.currentStatus && <p className="text-[11px] font-semibold text-rose-500">{errors.currentStatus}</p>}
            </div>

            {/* Brief of the Prayer */}
            <div className="space-y-1 sm:col-span-3">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Brief of the Prayer *
              </label>
              <textarea
                rows={3}
                id="briefOfPrayer"
                value={formData.briefOfPrayer}
                onChange={(e) => handleChange('briefOfPrayer', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.briefOfPrayer && <p className="text-[11px] font-semibold text-rose-500">{errors.briefOfPrayer}</p>}
            </div>
          </div>
        </div>

        {/* B.2: CA (COUNTER AFFIDAVIT) INFORMATION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                CA (Counter Affidavit) Information
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Counter affidavit filing requirement and compliance schedule
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* CA Required */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                CA Required *
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.caRequired || ''}
                onChange={(val) => handleChange('caRequired', val as YesNoType)}
                placeholder="Select CA Required..."
              />
              {errors.caRequired && <p className="text-[11px] font-semibold text-rose-500">{errors.caRequired}</p>}
            </div>

            {/* CA Filed */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                CA Filed *
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.caFiled || ''}
                onChange={(val) => handleChange('caFiled', val as YesNoType)}
                placeholder="Select CA Filed..."
              />
              {errors.caFiled && <p className="text-[11px] font-semibold text-rose-500">{errors.caFiled}</p>}
            </div>

            {/* CA Due Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                CA Due Date
              </label>
              <DatePickerInput
                value={formData.caDueDate || ''}
                onChange={(val) => handleChange('caDueDate', val)}
              />
            </div>

            {/* CA Filed Date (Conditional: CA Filed = Yes) */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                CA Filed Date {formData.caFiled === 'Yes' && '*'}
              </label>
              <DatePickerInput
                value={formData.caFiledDate || ''}
                onChange={(val) => handleChange('caFiledDate', val)}
                disabled={formData.caFiled !== 'Yes'}
              />
              {errors.caFiledDate && <p className="text-[11px] font-semibold text-rose-500">{errors.caFiledDate}</p>}
            </div>
          </div>
        </div>

        {/* B.3: HEARING & ORDERS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Hearing & Orders
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Last hearing, upcoming listing, interim directions, and latest orders
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Last Hearing Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Last Hearing Date
              </label>
              <DatePickerInput
                value={formData.lastHearingDate || ''}
                onChange={(val) => handleChange('lastHearingDate', val)}
              />
            </div>

            {/* Next Hearing Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Next Hearing Date
              </label>
              <DatePickerInput
                value={formData.nextHearingDate || ''}
                onChange={(val) => handleChange('nextHearingDate', val)}
              />
            </div>

            {/* Next Listing Purpose */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Next Listing Purpose
              </label>
              <input
                type="text"
                value={formData.nextListingPurpose || ''}
                onChange={(e) => handleChange('nextListingPurpose', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Interim Order / Direction */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Interim Order / Direction
              </label>
              <input
                type="text"
                value={formData.interimOrderDirection || ''}
                onChange={(e) => handleChange('interimOrderDirection', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Interim Order Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Interim Order Date
              </label>
              <DatePickerInput
                value={formData.interimOrderDate || ''}
                onChange={(val) => handleChange('interimOrderDate', val)}
              />
            </div>

            {/* Latest Order / Final Order */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Latest Order / Final Order
              </label>
              <input
                type="text"
                value={formData.latestOrderFinalOrder || ''}
                onChange={(e) => handleChange('latestOrderFinalOrder', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Latest Order Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Latest Order Date
              </label>
              <DatePickerInput
                value={formData.latestOrderDate || ''}
                onChange={(val) => handleChange('latestOrderDate', val)}
              />
            </div>
          </div>
        </div>

        {/* B.4: COMPLIANCE (GENERAL / INTERIM) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Compliance (Interim Directions & Orders)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Action required by department, time limits, and compliance status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Compliance Required */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Required *
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.complianceRequired || ''}
                onChange={(val) => handleChange('complianceRequired', val as YesNoType)}
                placeholder="Select Compliance Required..."
              />
              {errors.complianceRequired && <p className="text-[11px] font-semibold text-rose-500">{errors.complianceRequired}</p>}
            </div>

            {/* Compliance Action */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Action {formData.complianceRequired === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.complianceAction || ''}
                onChange={(e) => handleChange('complianceAction', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-500"
                disabled={formData.complianceRequired !== 'Yes'}
              />
              {errors.complianceAction && <p className="text-[11px] font-semibold text-rose-500">{errors.complianceAction}</p>}
            </div>

            {/* Compliance Period */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Period {formData.complianceRequired === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.compliancePeriod || ''}
                onChange={(e) => handleChange('compliancePeriod', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-500"
                disabled={formData.complianceRequired !== 'Yes'}
              />
              {errors.compliancePeriod && <p className="text-[11px] font-semibold text-rose-500">{errors.compliancePeriod}</p>}
            </div>

            {/* Compliance End Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance End Date
              </label>
              <DatePickerInput
                value={formData.complianceEndDate || ''}
                onChange={(val) => handleChange('complianceEndDate', val)}
                disabled={formData.complianceRequired !== 'Yes'}
              />
            </div>

            {/* Compliance Status */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Status {formData.complianceRequired === 'Yes' && '*'}
              </label>
              <SearchableSelect
                options={complianceStatuses}
                value={formData.complianceStatus || ''}
                onChange={(val) => handleChange('complianceStatus', val as ComplianceStatusType)}
                placeholder="Select Compliance Status..."
                disabled={formData.complianceRequired !== 'Yes'}
              />
              {errors.complianceStatus && <p className="text-[11px] font-semibold text-rose-500">{errors.complianceStatus}</p>}
            </div>

            {/* Action Taken Details for Compliance */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Action Taken Details for Compliance {formData.complianceRequired === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.actionTakenDetailsForCompliance || ''}
                onChange={(e) => handleChange('actionTakenDetailsForCompliance', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-500"
                disabled={formData.complianceRequired !== 'Yes'}
              />
              {errors.actionTakenDetailsForCompliance && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.actionTakenDetailsForCompliance}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Remarks
              </label>
              <input
                type="text"
                value={formData.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* B.5: FINAL RESULT & GP OPINION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Final Result & GP Opinion
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Case disposal outcome, adverse orders, and Government Pleader recommendation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Final Result (Concluded?) */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Final Result (Concluded?) *
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.finalResult || ''}
                onChange={(val) => handleChange('finalResult', val as YesNoType)}
                placeholder="Select Final Result..."
              />
              {errors.finalResult && <p className="text-[11px] font-semibold text-rose-500">{errors.finalResult}</p>}
            </div>

            {/* Final Result Order */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Final Result Order {formData.finalResult === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.finalResultOrder || ''}
                onChange={(e) => handleChange('finalResultOrder', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={formData.finalResult !== 'Yes'}
              />
              {errors.finalResultOrder && <p className="text-[11px] font-semibold text-rose-500">{errors.finalResultOrder}</p>}
            </div>

            {/* Final Order Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Final Order Date {formData.finalResult === 'Yes' && '*'}
              </label>
              <DatePickerInput
                value={formData.finalOrderDate || ''}
                onChange={(val) => handleChange('finalOrderDate', val)}
                disabled={formData.finalResult !== 'Yes'}
              />
              {errors.finalOrderDate && <p className="text-[11px] font-semibold text-rose-500">{errors.finalOrderDate}</p>}
            </div>

            {/* Adverse to Department */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Adverse to Department *
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.adverseToDepartment || ''}
                onChange={(val) => handleChange('adverseToDepartment', val as YesNoType)}
                placeholder="Select Adverse Status..."
              />
              {errors.adverseToDepartment && <p className="text-[11px] font-semibold text-rose-500">{errors.adverseToDepartment}</p>}
            </div>

            {/* GP Opinion */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                GP Opinion *
              </label>
              <SearchableSelect
                options={gpOpinions}
                value={formData.gpOpinion || ''}
                onChange={(val) => handleChange('gpOpinion', val as GPOpinionType)}
                placeholder="Select GP Opinion..."
              />
              {errors.gpOpinion && <p className="text-[11px] font-semibold text-rose-500">{errors.gpOpinion}</p>}
            </div>
          </div>
        </div>

        {/* B.6: APPEAL FILED STATUS & WORKFLOW BANNER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Appeal Filing Decision
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Appellate remedy against lower court order
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Appeal Filed */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Filed *
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.appealFiled || ''}
                onChange={(val) => handleChange('appealFiled', val as YesNoType)}
                placeholder="Select Appeal Filed..."
              />
              {errors.appealFiled && <p className="text-[11px] font-semibold text-rose-500">{errors.appealFiled}</p>}
            </div>

            {/* Appeal Filed Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Appeal Filed Date {formData.appealFiled === 'Yes' && '*'}
              </label>
              <DatePickerInput
                value={formData.appealFiledDate || ''}
                onChange={(val) => handleChange('appealFiledDate', val)}
                disabled={formData.appealFiled !== 'Yes'}
              />
              {errors.appealFiledDate && <p className="text-[11px] font-semibold text-rose-500">{errors.appealFiledDate}</p>}
            </div>
          </div>

          {/* Footnote / Guidance Callout when Appeal Filed = Yes */}
          {formData.appealFiled === 'Yes' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Please enter the details of the appeal case as a new case.
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  Save this lower court case, then use <strong>Case Type = Appeal Case</strong> to file the appellate proceeding with the dedicated appeal tracking header.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* B.7: FINAL-ORDER COMPLIANCE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Final-Order Compliance
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mandates, directions, and departmental action taken pursuant to the final judgment
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Compliance Action Given in Final Order */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Action Given in Final Order {formData.finalResult === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.finalOrderComplianceActionGiven || ''}
                onChange={(e) => handleChange('finalOrderComplianceActionGiven', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.finalOrderComplianceActionGiven && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.finalOrderComplianceActionGiven}</p>
              )}
            </div>

            {/* Compliance Action (Yes/No) */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Action {formData.finalResult === 'Yes' && '*'}
              </label>
              <SearchableSelect
                options={['Yes', 'No']}
                value={formData.finalOrderComplianceAction || ''}
                onChange={(val) => handleChange('finalOrderComplianceAction', val as YesNoType)}
                placeholder="Select Compliance Action..."
              />
              {errors.finalOrderComplianceAction && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.finalOrderComplianceAction}</p>
              )}
            </div>

            {/* Compliance Period */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Period {formData.finalResult === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.finalOrderCompliancePeriod || ''}
                onChange={(e) => handleChange('finalOrderCompliancePeriod', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.finalOrderCompliancePeriod && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.finalOrderCompliancePeriod}</p>
              )}
            </div>

            {/* Compliance End Date */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance End Date
              </label>
              <DatePickerInput
                value={formData.finalOrderComplianceEndDate || ''}
                onChange={(val) => handleChange('finalOrderComplianceEndDate', val)}
              />
            </div>

            {/* Compliance Status */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Status {formData.finalResult === 'Yes' && '*'}
              </label>
              <SearchableSelect
                options={complianceStatuses}
                value={formData.finalOrderComplianceStatus || ''}
                onChange={(val) => handleChange('finalOrderComplianceStatus', val as ComplianceStatusType)}
                placeholder="Select Compliance Status..."
              />
              {errors.finalOrderComplianceStatus && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.finalOrderComplianceStatus}</p>
              )}
            </div>

            {/* Compliance Action Taken */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Compliance Action Taken {formData.finalResult === 'Yes' && '*'}
              </label>
              <input
                type="text"
                value={formData.finalOrderComplianceActionTaken || ''}
                onChange={(e) => handleChange('finalOrderComplianceActionTaken', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.finalOrderComplianceActionTaken && (
                <p className="text-[11px] font-semibold text-rose-500">{errors.finalOrderComplianceActionTaken}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">
                Remarks
              </label>
              <input
                type="text"
                value={formData.finalOrderRemarks || ''}
                onChange={(e) => handleChange('finalOrderRemarks', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FORM ACTION TOOLBAR */}
      <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          {formData.caseClassification === 'Appeal Case' ? (
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
              <Gavel className="w-4 h-4" />
              <span>Filing Appellate Proceeding</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
              <FileText className="w-4 h-4" />
              <span>Standard Legal Case Record</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {/* Primary Save */}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Case Record</span>
          </button>

          {/* Dual Action when Appeal Filed = Yes */}
          {formData.appealFiled === 'Yes' && (
            <button
              type="button"
              onClick={handleSaveAndCreateAppealClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Save current case and immediately open the Appeal Case entry form"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Save & File Appeal Case ⚡</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CaseEntryForm;
