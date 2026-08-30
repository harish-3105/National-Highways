'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Link as LinkIcon,
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
    subtitle: 'Present stage, current status & hearing schedule',
    icon: Calendar,
  },
  {
    id: 'interim_compliance',
    label: 'Interim Orders & Compliance',
    step: 'Stage 5',
    subtitle: 'Court interim directions, compliance period & departmental actions',
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

const getDefaultInitialState = (initial?: Partial<LegalCaseData>): LegalCaseData => {
  return {
    id: initial?.id,
    caseClassification: initial?.caseClassification || 'Normal Case',
    appealInfo: initial?.appealInfo
      ? {
          ...initial.appealInfo,
          appealCaseDetails: initial.appealInfo.appealCaseDetails || '',
        }
      : {
          appealCaseDetails: '',
          appellateCourt: '',
          appealFilingDate: '',
          limitationDueDate: '',
          delayInFilingAppeal: 'No',
          delayPeriodDays: 0,
          condonationOfDelay: '',
        },
    caseDetails: initial?.caseDetails || '',
    appealCaseDetails: initial?.appealCaseDetails || '',
    circle: initial?.circle || '',
    division: initial?.division || '',
    nameOfCourt: initial?.nameOfCourt || '',
    petitionerNames: initial?.petitionerNames || '',
    respondentNames: initial?.respondentNames || '',
    casePertainsTo: initial?.casePertainsTo || '',
    natureOfCase: initial?.natureOfCase || '',
    specifyNatureOfCase: initial?.specifyNatureOfCase || '',
    briefOfPrayer: initial?.briefOfPrayer || '',
    baseCircle: initial?.baseCircle || '',
    baseDivision: initial?.baseDivision || '',
    baseCourtName: initial?.baseCourtName || '',
    baseCaseDetails: initial?.baseCaseDetails || '',
    basePetitionerNames: initial?.basePetitionerNames || '',
    baseRespondentNames: initial?.baseRespondentNames || '',
    baseCasePertainsTo: initial?.baseCasePertainsTo || '',
    baseNatureOfCase: initial?.baseNatureOfCase || '',
    baseBriefOfPrayer: initial?.baseBriefOfPrayer || '',
    linkedBaseCaseId: initial?.linkedBaseCaseId || '',
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

  // Existing cases for auto-filling Base Case details
  const [existingCases, setExistingCases] = useState<LegalCaseData[]>([]);
  const [selectedExistingCaseId, setSelectedExistingCaseId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      try {
        const res = await fetch('/api/legal');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.cases)) {
          setExistingCases(data.cases);
        }
      } catch (err) {
        console.warn('Failed to load existing cases list:', err);
      }
    };
    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic stages based on classification
  const isAppeal = formData.caseClassification === 'Appeal Case';
  const stages = useMemo(() => {
    return isAppeal ? APPEAL_CASE_STAGES : NORMAL_CASE_STAGES;
  }, [isAppeal]);

  // Dynamic Master Data Options directly from database (zero hardcoded defaults)
  const circles = masterData?.circles || [];
  const courts = masterData?.courtNames || [];
  const casePertainsToList = masterData?.casePertainsTo || [];
  const natureOfCasesList = masterData?.natureOfCases || [];
  const presentStages = masterData?.presentStages || [];
  const currentStatuses = masterData?.caseStatuses || [];
  const appellateCourts = masterData?.appellateCourts || [];
  const condonationDelays = masterData?.condonationOfDelays || [];
  const gpOpinions = masterData?.gpOpinions || [];
  const complianceStatuses = masterData?.complianceStatuses || [];

  const divisions = useMemo(() => {
    return masterData?.divisions || [];
  }, [masterData?.divisions]);

  const availableDivisions = useMemo(() => {
    if (!formData.circle) return masterData?.divisions || [];
    const matched = (masterData?.rawItems || [])
      .filter((item) => item.category === 'division' && item.parent_value === formData.circle)
      .map((item) => item.value);
    return matched.length > 0 ? matched : masterData?.divisions || [];
  }, [formData.circle, masterData?.divisions, masterData?.rawItems]);

  const availableBaseDivisions = useMemo(() => {
    if (!formData.baseCircle) return masterData?.divisions || [];
    const matched = (masterData?.rawItems || [])
      .filter((item) => item.category === 'division' && item.parent_value === formData.baseCircle)
      .map((item) => item.value);
    return matched.length > 0 ? matched : masterData?.divisions || [];
  }, [formData.baseCircle, masterData?.divisions, masterData?.rawItems]);

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
    if (field === 'caseClassification') {
      setActiveStageIndex(0);
      setErrors({});
    }
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

  const handleBaseCircleChange = (newCircle: string) => {
    setFormData((prev) => ({
      ...prev,
      baseCircle: newCircle,
      baseDivision: '',
    }));
    if (errors.baseCircle) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.baseCircle;
        return next;
      });
    }
  };

  // Handler for Auto-Filling Base Case from an existing docket
  const handleAutoFillFromExisting = (caseId: string) => {
    setSelectedExistingCaseId(caseId);
    if (!caseId) return;

    const matched = existingCases.find((c) => c.id === caseId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        baseCircle: matched.circle || '',
        baseDivision: matched.division || '',
        baseCourtName: matched.nameOfCourt || '',
        baseCaseDetails: matched.caseDetails || '',
        basePetitionerNames: matched.petitionerNames || '',
        baseRespondentNames: matched.respondentNames || '',
        baseCasePertainsTo: matched.casePertainsTo || '',
        baseNatureOfCase: matched.natureOfCase || '',
        baseBriefOfPrayer: matched.briefOfPrayer || '',
        linkedBaseCaseId: matched.id || '',
      }));

      // Clear base errors
      setErrors((prev) => {
        const next = { ...prev };
        [
          'baseCircle',
          'baseDivision',
          'baseCourtName',
          'baseCaseDetails',
          'basePetitionerNames',
          'baseRespondentNames',
          'baseCasePertainsTo',
          'baseNatureOfCase',
          'baseBriefOfPrayer',
        ].forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  // -------------------------------------------------------------
  // STAGE-GATED PROGRESSIVE VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = useCallback((stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};
    const stageDef = stages[stageIdx];
    if (!stageDef) return stageErrors;

    if (stageDef.id === 'case_registry') {
      // Stage 1 for Normal Case (Fully Mandatory)
      if (!formData.circle?.trim()) stageErrors.circle = 'Circle Jurisdiction is required.';
      if (!formData.division?.trim()) stageErrors.division = 'Division Jurisdiction is required.';
      if (!formData.nameOfCourt?.trim()) stageErrors.nameOfCourt = 'Name of Court / Forum is required.';
      if (!formData.caseDetails?.trim()) stageErrors.caseDetails = 'Case Details / Particulars is required.';
      if (!formData.petitionerNames?.trim()) stageErrors.petitionerNames = 'Petitioner Name(s) is required.';
      if (!formData.respondentNames?.trim()) stageErrors.respondentNames = 'Respondent Name(s) is required.';
      if (!formData.casePertainsTo?.trim()) stageErrors.casePertainsTo = 'Case Pertains To is required.';
      if (!formData.natureOfCase?.trim()) stageErrors.natureOfCase = 'Nature of Case is required.';
      const isNatureOther =
        formData.natureOfCase?.toLowerCase() === 'others' ||
        formData.natureOfCase?.toLowerCase() === 'other';
      if (isNatureOther && !formData.specifyNatureOfCase?.trim()) {
        stageErrors.specifyNatureOfCase = 'Please specify the custom nature of case.';
      }
      if (!formData.briefOfPrayer?.trim()) stageErrors.briefOfPrayer = 'Brief of Prayer is required.';
    } else if (stageDef.id === 'appeal_registry') {
      // Stage 1 for Appeal Case (Fully Mandatory)
      if (!formData.appealInfo?.appellateCourt?.trim()) stageErrors.appellateCourt = 'Appellate Court is required.';
      if (!formData.appealInfo?.appealCaseDetails?.trim()) stageErrors.appealCaseDetails = 'Appeal Case Details / Particulars is required.';
      if (!formData.appealInfo?.appealFilingDate?.trim()) stageErrors.appealFilingDate = 'Appeal Filing Date is required.';
      if (!formData.appealInfo?.limitationDueDate?.trim()) stageErrors.limitationDueDate = 'Limitation Due Date is required.';
      if (!formData.appealInfo?.condonationOfDelay?.trim()) stageErrors.condonationOfDelay = 'Condonation of Delay is required.';

      if (!formData.circle?.trim()) stageErrors.circle = 'Appeal Circle Jurisdiction is required.';
      if (!formData.division?.trim()) stageErrors.division = 'Appeal Division Jurisdiction is required.';
      if (!formData.petitionerNames?.trim()) stageErrors.petitionerNames = 'Appellant / Petitioner Name(s) is required.';
      if (!formData.respondentNames?.trim()) stageErrors.respondentNames = 'Respondent Name(s) is required.';
      if (!formData.casePertainsTo?.trim()) stageErrors.casePertainsTo = 'Case Pertains To is required.';
      if (!formData.natureOfCase?.trim()) stageErrors.natureOfCase = 'Nature of Case is required.';
      const isNatureOther =
        formData.natureOfCase?.toLowerCase() === 'others' ||
        formData.natureOfCase?.toLowerCase() === 'other';
      if (isNatureOther && !formData.specifyNatureOfCase?.trim()) {
        stageErrors.specifyNatureOfCase = 'Please specify the custom nature of case.';
      }
      if (!formData.briefOfPrayer?.trim()) stageErrors.briefOfPrayer = 'Appeal Prayer / Grounds is required.';
    } else if (stageDef.id === 'base_case_details') {
      // Stage 2 for Appeal Case (Base / Original Case Details - Fully Mandatory)
      if (!formData.baseCircle?.trim()) stageErrors.baseCircle = 'Base Circle Jurisdiction is required.';
      if (!formData.baseDivision?.trim()) stageErrors.baseDivision = 'Base Division Jurisdiction is required.';
      if (!formData.baseCourtName?.trim()) stageErrors.baseCourtName = 'Base / Lower Court Name is required.';
      if (!formData.baseCaseDetails?.trim()) stageErrors.baseCaseDetails = 'Base / Original Case Details is required.';
      if (!formData.basePetitionerNames?.trim()) stageErrors.basePetitionerNames = 'Base Petitioner Name(s) is required.';
      if (!formData.baseRespondentNames?.trim()) stageErrors.baseRespondentNames = 'Base Respondent Name(s) is required.';
      if (!formData.baseCasePertainsTo?.trim()) stageErrors.baseCasePertainsTo = 'Base Case Pertains To is required.';
      if (!formData.baseNatureOfCase?.trim()) stageErrors.baseNatureOfCase = 'Base Nature of Case is required.';
      if (!formData.baseBriefOfPrayer?.trim()) stageErrors.baseBriefOfPrayer = 'Base Brief of Prayer is required.';
    } else if (stageDef.id === 'counter_affidavit') {
      // Counter Affidavit (CA)
      if (formData.caRequired === 'Yes') {
        if (!formData.caFiled) {
          stageErrors.caFiled = 'CA Filed status is required when CA is required.';
        }
        if (formData.caFiled === 'Yes' && !formData.caFiledDate) {
          stageErrors.caFiledDate = 'CA Filed Date is required when CA is filed.';
        }
      }
    } else if (stageDef.id === 'hearing_listing') {
      // Hearing Schedule & Status (Validation: Hearing Dates >= Filing Date)
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
    } else if (stageDef.id === 'interim_compliance') {
      // Interim Orders & Compliance
      if (formData.complianceRequired === 'Yes') {
        if (!formData.complianceStatus) {
          stageErrors.complianceStatus = 'Compliance Status is required when Compliance is required.';
        }
      }
    } else if (stageDef.id === 'disposal_appeal') {
      // Final Disposal & Track
      if (formData.finalResult === 'Yes') {
        if (!formData.finalOrderDate) {
          stageErrors.finalOrderDate = 'Final Order Date is required when Case is Concluded.';
        }
        if (!formData.adverseToDepartment) {
          stageErrors.adverseToDepartment = 'Adverse to Department selection is required.';
        }
        if (formData.adverseToDepartment === 'Yes') {
          if (!formData.gpOpinion) {
            stageErrors.gpOpinion = 'GP Opinion is required when order is Adverse to Department.';
          }
          if (isAppealRecommended(formData.gpOpinion)) {
            if (!formData.appealFiled) {
              stageErrors.appealFiled = 'Appeal Filed selection is required.';
            }
            if (formData.appealFiled === 'Yes' && !formData.appealFiledDate) {
              stageErrors.appealFiledDate = 'Appeal Filed Date is required when Appeal is Filed.';
            }
          }
        }
      }
    }

    return stageErrors;
  }, [formData, stages]);

  const isStageAccessible = (targetStageIdx: number): boolean => {
    if (targetStageIdx === 0) return true;
    for (let i = 0; i < targetStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      if (Object.keys(stageErrs).length > 0) return false;
    }
    return true;
  };

  const isStageCompleted = (stageIdx: number): boolean => {
    const stageDef = stages[stageIdx];
    if (!stageDef) return false;

    if (stageDef.id === 'case_registry') {
      return Boolean(
        formData.caseDetails?.trim() &&
        formData.circle &&
        formData.division &&
        formData.nameOfCourt &&
        formData.petitionerNames?.trim() &&
        formData.respondentNames?.trim() &&
        formData.briefOfPrayer?.trim() &&
        Object.keys(validateSingleStage(stageIdx)).length === 0
      );
    }
    if (stageDef.id === 'appeal_registry') {
      return Boolean(
        formData.appealInfo?.appealCaseDetails?.trim() &&
        formData.appealInfo?.appellateCourt &&
        formData.petitionerNames?.trim() &&
        formData.respondentNames?.trim() &&
        formData.briefOfPrayer?.trim() &&
        Object.keys(validateSingleStage(stageIdx)).length === 0
      );
    }
    if (stageDef.id === 'base_case_details') {
      return Boolean(
        formData.baseCaseDetails?.trim() &&
        formData.baseCourtName &&
        formData.basePetitionerNames?.trim() &&
        formData.baseRespondentNames?.trim() &&
        formData.baseBriefOfPrayer?.trim() &&
        Object.keys(validateSingleStage(stageIdx)).length === 0
      );
    }
    if (stageDef.id === 'counter_affidavit') {
      return Boolean(formData.caRequired || formData.caFiled || formData.financialImplication);
    }
    if (stageDef.id === 'hearing_listing') {
      return Boolean(formData.presentStage || formData.currentStatus || formData.lastHearingDate || formData.nextHearingDate);
    }
    if (stageDef.id === 'interim_compliance') {
      return Boolean(formData.interimOrderDirection || formData.complianceRequired);
    }
    if (stageDef.id === 'disposal_appeal') {
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
      if (activeStageIndex < stages.length - 1) {
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
      // Sync caseDetails and nameOfCourt for appeal cases if needed
      const payloadToSave: LegalCaseData = { ...formData };
      if (isAppeal && formData.appealInfo) {
        payloadToSave.caseDetails = formData.appealInfo.appealCaseDetails || formData.caseDetails;
        payloadToSave.appealCaseDetails = formData.appealInfo.appealCaseDetails || formData.appealCaseDetails;
        payloadToSave.nameOfCourt = formData.appealInfo.appellateCourt || formData.nameOfCourt;
      }
      onSave(payloadToSave);
    } finally {
      setLoading(false);
    }
  };

  const currentStage = stages[activeStageIndex] || stages[0];
  const isNatureOther =
    formData.natureOfCase?.toLowerCase() === 'others' ||
    formData.natureOfCase?.toLowerCase() === 'other';

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="max-w-7xl mx-auto space-y-6 pb-12"
    >
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
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

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Legal Case'}
        </button>
      </div>

      {/* Progressive Stage Stepper Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <nav
          className={`grid gap-2 ${
            isAppeal
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
          }`}
          aria-label="Stages"
        >
          {stages.map((stg, idx) => {
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
          {/* STAGE 1: Case Registry (Normal Case) */}
          {/* ========================================================= */}
          {currentStage.id === 'case_registry' && (
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
                    options={availableDivisions}
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

              {/* Case Details / Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Case Details / Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.caseDetails || ''}
                  onChange={(e) => handleChange('caseDetails', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
                {errors.caseDetails && <p className="text-[11px] text-rose-500 mt-1">{errors.caseDetails}</p>}
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
          {/* STAGE 1: Appeal Case Registry (Appeal Case) */}
          {/* ========================================================= */}
          {currentStage.id === 'appeal_registry' && (
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

              {/* Administrative Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    options={availableDivisions}
                    value={formData.division}
                    onChange={(val) => handleChange('division', val)}
                  />
                  {errors.division && <p className="text-[11px] text-rose-500 mt-1">{errors.division}</p>}
                </div>
              </div>

              {/* Appellate Jurisdiction Particulars */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Appellate Jurisdiction Particulars
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Appeal Case Details / Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.appealInfo?.appealCaseDetails || ''}
                      onChange={(e) => handleAppealInfoChange('appealCaseDetails', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      required
                    />
                    {errors.appealCaseDetails && <p className="text-[11px] text-rose-500 mt-1">{errors.appealCaseDetails}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              {/* Appeal Litigants & Case Particulars */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Appeal Litigants & Particulars
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Appellant / Petitioner Name(s) <span className="text-rose-500">*</span>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Appeal Prayer / Grounds <span className="text-rose-500">*</span>
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
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Base / Original Case Details (Appeal Case) */}
          {/* ========================================================= */}
          {currentStage.id === 'base_case_details' && (
            <div className="space-y-6">
              {/* Optional Quick Auto-Fill from Existing Case */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900/60 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
                  <LinkIcon className="w-4 h-4" />
                  <span>Auto-Fill from Existing Case Docket (Optional)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select an existing case in the system to auto-populate all original case fields below, or enter them manually.
                </p>
                <div className="pt-1">
                  <SearchableSelect
                    options={[
                      '-- Select Existing Case to Auto-Fill --',
                      ...existingCases.map(
                        (c) => `${c.caseDetails || 'Legal Case'} - ${c.nameOfCourt || 'Court'} - ${c.petitionerNames || ''}`
                      ),
                    ]}
                    value={
                      selectedExistingCaseId
                        ? (() => {
                            const match = existingCases.find((c) => c.id === selectedExistingCaseId);
                            return match
                              ? `${match.caseDetails || 'Legal Case'} - ${match.nameOfCourt || 'Court'} - ${match.petitionerNames || ''}`
                              : '-- Select Existing Case to Auto-Fill --';
                          })()
                        : '-- Select Existing Case to Auto-Fill --'
                    }
                    onChange={(val) => {
                      if (val.startsWith('--')) {
                        setSelectedExistingCaseId('');
                      } else {
                        const match = existingCases.find(
                          (c) => `${c.caseDetails || 'Legal Case'} - ${c.nameOfCourt || 'Court'} - ${c.petitionerNames || ''}` === val
                        );
                        if (match?.id) handleAutoFillFromExisting(match.id);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Base Administrative Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Circle Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={circles}
                    value={formData.baseCircle || ''}
                    onChange={handleBaseCircleChange}
                  />
                  {errors.baseCircle && <p className="text-[11px] text-rose-500 mt-1">{errors.baseCircle}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Division Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={availableBaseDivisions}
                    value={formData.baseDivision || ''}
                    onChange={(val) => handleChange('baseDivision', val)}
                  />
                  {errors.baseDivision && <p className="text-[11px] text-rose-500 mt-1">{errors.baseDivision}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base / Lower Court Name <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={courts}
                    value={formData.baseCourtName || ''}
                    onChange={(val) => handleChange('baseCourtName', val)}
                  />
                  {errors.baseCourtName && <p className="text-[11px] text-rose-500 mt-1">{errors.baseCourtName}</p>}
                </div>
              </div>

              {/* Base Case Details / Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Base / Original Case Details / Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.baseCaseDetails || ''}
                  onChange={(e) => handleChange('baseCaseDetails', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
                {errors.baseCaseDetails && <p className="text-[11px] text-rose-500 mt-1">{errors.baseCaseDetails}</p>}
              </div>

              {/* Base Litigant Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Petitioner Name(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.basePetitionerNames || ''}
                    onChange={(e) => handleChange('basePetitionerNames', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.basePetitionerNames && <p className="text-[11px] text-rose-500 mt-1">{errors.basePetitionerNames}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Respondent Name(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.baseRespondentNames || ''}
                    onChange={(e) => handleChange('baseRespondentNames', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.baseRespondentNames && <p className="text-[11px] text-rose-500 mt-1">{errors.baseRespondentNames}</p>}
                </div>
              </div>

              {/* Base Jurisdiction & Nature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Case Pertains To <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={casePertainsToList}
                    value={formData.baseCasePertainsTo || ''}
                    onChange={(val) => handleChange('baseCasePertainsTo', val)}
                  />
                  {errors.baseCasePertainsTo && <p className="text-[11px] text-rose-500 mt-1">{errors.baseCasePertainsTo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Base Nature of Case <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={natureOfCasesList}
                    value={formData.baseNatureOfCase || ''}
                    onChange={(val) => handleChange('baseNatureOfCase', val)}
                  />
                  {errors.baseNatureOfCase && <p className="text-[11px] text-rose-500 mt-1">{errors.baseNatureOfCase}</p>}
                </div>
              </div>

              {/* Base Brief of Prayer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Base Brief of Prayer <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.baseBriefOfPrayer || ''}
                  onChange={(e) => handleChange('baseBriefOfPrayer', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
                {errors.baseBriefOfPrayer && <p className="text-[11px] text-rose-500 mt-1">{errors.baseBriefOfPrayer}</p>}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE: Counter Affidavit (CA) & Financial Implication */}
          {/* ========================================================= */}
          {currentStage.id === 'counter_affidavit' && (
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
          {/* STAGE: Hearing Schedule & Present Status */}
          {/* ========================================================= */}
          {currentStage.id === 'hearing_listing' && (
            <div className="space-y-6">
              {/* Present Stage & Current Status moved to the TOP of Hearing Schedule */}
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
          {/* STAGE: Interim Orders & Compliance */}
          {/* ========================================================= */}
          {currentStage.id === 'interim_compliance' && (
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
          {/* STAGE: Disposal & Appeal Track */}
          {/* ========================================================= */}
          {currentStage.id === 'disposal_appeal' && (
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

          <button
            type="button"
            onClick={handleNextStage}
            disabled={activeStageIndex === stages.length - 1}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Stage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default CaseEntryForm;
