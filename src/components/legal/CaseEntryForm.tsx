'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LegalCaseData,
  AppealCaseInformation,
  CaseClassificationType,
} from '@/types/legal';
import { calculateAppealDelay } from '@/lib/legal/masterData';
import { formatDateIndian } from '@/lib/formatters';
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
    specifyNameOfCourt: initial?.specifyNameOfCourt || '',
    petitionerNames: initial?.petitionerNames || '',
    respondentNames: initial?.respondentNames || '',
    casePertainsTo: initial?.casePertainsTo || '',
    natureOfCase: initial?.natureOfCase || '',
    specifyNatureOfCase: initial?.specifyNatureOfCase || '',
    briefOfPrayer: initial?.briefOfPrayer || '',
    baseCircle: initial?.baseCircle || '',
    baseDivision: initial?.baseDivision || '',
    baseCourtName: initial?.baseCourtName || '',
    specifyBaseCourtName: initial?.specifyBaseCourtName || '',
    specifyAppellateCourt: initial?.specifyAppellateCourt || '',
    baseCaseDetails: initial?.baseCaseDetails || '',
    basePetitionerNames: initial?.basePetitionerNames || '',
    baseRespondentNames: initial?.baseRespondentNames || '',
    baseCasePertainsTo: initial?.baseCasePertainsTo || '',
    baseNatureOfCase: initial?.baseNatureOfCase || '',
    specifyBaseNatureOfCase: initial?.specifyBaseNatureOfCase || '',
    baseBriefOfPrayer: initial?.baseBriefOfPrayer || '',
    baseFinalOrder: initial?.baseFinalOrder || '',
    baseFinalOrderDate: initial?.baseFinalOrderDate || '',
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
    complianceCompletionDate: initial?.complianceCompletionDate || '',
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

  // Dynamic Master Data Options directly from database (with Others included)
  const circles = masterData?.circles || [];
  const courts = useMemo(() => {
    const rawList = Array.from(
      new Set([
        ...(masterData?.courtNames || []),
        ...(masterData?.appellateCourts || []),
      ])
    ).filter(Boolean);
    return rawList.includes('Others') ? rawList : [...rawList, 'Others'];
  }, [masterData?.courtNames, masterData?.appellateCourts]);

  const appellateCourts = courts;

  const casePertainsToList = masterData?.casePertainsTo || [];
  const natureOfCasesList = useMemo(() => {
    const list = masterData?.natureOfCases || [];
    return list.includes('Others') ? list : [...list, 'Others'];
  }, [masterData?.natureOfCases]);

  const presentStages = masterData?.presentStages || [];
  const currentStatuses = masterData?.caseStatuses || [];
  const condonationDelays = masterData?.condonationOfDelays || [];
  const gpOpinions = masterData?.gpOpinions || [];
  const complianceStatuses = masterData?.complianceStatuses || [];
  const caRequiredOptions = masterData?.caRequiredOptions || [];

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const availableComplianceStatuses = useMemo(() => {
    const rawList = masterData?.complianceStatuses && masterData.complianceStatuses.length > 0
      ? masterData.complianceStatuses
      : ['Completed', 'Pending', 'Overdue'];
    const completedLabel = rawList.find((s) => s.toLowerCase() === 'completed' || s.toLowerCase() === 'complied') || 'Completed';
    const pendingLabel = rawList.find((s) => s.toLowerCase() === 'pending') || 'Pending';
    const overdueLabel = rawList.find((s) => s.toLowerCase() === 'overdue') || 'Overdue';

    if (formData.complianceEndDate) {
      if (formData.complianceEndDate < todayStr) {
        return [completedLabel, overdueLabel];
      } else {
        return [completedLabel, pendingLabel];
      }
    }
    return [completedLabel, pendingLabel];
  }, [formData.complianceEndDate, masterData?.complianceStatuses, todayStr]);

  const completionDelayDays = useMemo(() => {
    if (!formData.complianceCompletionDate || !formData.complianceEndDate) return 0;
    if (formData.complianceCompletionDate <= formData.complianceEndDate) return 0;
    const diff = new Date(formData.complianceCompletionDate).getTime() - new Date(formData.complianceEndDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [formData.complianceCompletionDate, formData.complianceEndDate]);

  const overdueDays = useMemo(() => {
    if (!formData.complianceEndDate) return 0;
    if (todayStr <= formData.complianceEndDate) return 0;
    const diff = new Date(todayStr).getTime() - new Date(formData.complianceEndDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [formData.complianceEndDate, todayStr]);
  const caFiledOptions = masterData?.caFiledOptions || [];
  const complianceRequiredOptions = masterData?.complianceRequiredOptions || [];
  const finalResultOptions = masterData?.finalResultOptions || [];
  const adverseToDepartmentOptions = masterData?.adverseToDepartmentOptions || [];
  const appealFiledOptions = masterData?.appealFiledOptions || [];

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
        if (isDelayed === 'No') {
          updatedAppeal.condonationOfDelay = '';
        }
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
        baseFinalOrder: matched.finalResultOrder || matched.latestOrderFinalOrder || '',
        baseFinalOrderDate: matched.finalOrderDate || matched.latestOrderDate || '',
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
          'baseFinalOrder',
          'baseFinalOrderDate',
        ].forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  // Helper to auto-save newly specified options into Master Data
  const saveCustomMasterOption = async (category: string, value: string) => {
    if (!value || !value.trim()) return;
    try {
      await fetch('/api/legal/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value: value.trim() }),
      });
    } catch (err) {
      console.warn(`Note: Auto-saving custom master option for ${category}:`, err);
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
      const isCourtOther =
        formData.nameOfCourt?.toLowerCase() === 'others' ||
        formData.nameOfCourt?.toLowerCase() === 'other';
      if (isCourtOther && !formData.specifyNameOfCourt?.trim()) {
        stageErrors.specifyNameOfCourt = 'Please specify the custom Court Name.';
      }
      if (!formData.caseDetails?.trim()) stageErrors.caseDetails = 'Case Number / Year is required.';
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
      const isAppellateOther =
        formData.appealInfo?.appellateCourt?.toLowerCase() === 'others' ||
        formData.appealInfo?.appellateCourt?.toLowerCase() === 'other' ||
        formData.appellateCourt?.toLowerCase() === 'others' ||
        formData.appellateCourt?.toLowerCase() === 'other';
      if (isAppellateOther && !formData.specifyAppellateCourt?.trim()) {
        stageErrors.specifyAppellateCourt = 'Please specify the custom Appellate Court.';
      }
      if (!formData.appealInfo?.appealCaseDetails?.trim()) stageErrors.appealCaseDetails = 'Appeal Case Number / Year is required.';
      if (!formData.appealInfo?.appealFilingDate?.trim()) stageErrors.appealFilingDate = 'Appeal Filing Date is required.';
      if (!formData.appealInfo?.limitationDueDate?.trim()) stageErrors.limitationDueDate = 'Limitation Due Date is required.';

      // Condonation of Delay is ONLY displayed and mandatory when appeal filing is delayed
      const appealDelay = calculateAppealDelay(
        formData.appealInfo?.appealFilingDate,
        formData.appealInfo?.limitationDueDate
      );
      if (appealDelay.isDelayed === 'Yes') {
        if (!formData.appealInfo?.condonationOfDelay?.trim()) {
          stageErrors.condonationOfDelay = 'Condonation of Delay is required when appeal filing is delayed.';
        }
      }

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
      if (!formData.baseCircle?.trim()) stageErrors.baseCircle = 'Circle Jurisdiction is required.';
      if (!formData.baseDivision?.trim()) stageErrors.baseDivision = 'Division Jurisdiction is required.';
      if (!formData.baseCourtName?.trim()) stageErrors.baseCourtName = 'Name of Court is required.';
      const isBaseCourtOther =
        formData.baseCourtName?.toLowerCase() === 'others' ||
        formData.baseCourtName?.toLowerCase() === 'other';
      if (isBaseCourtOther && !formData.specifyBaseCourtName?.trim()) {
        stageErrors.specifyBaseCourtName = 'Please specify the custom Base Court Name.';
      }
      if (!formData.baseCaseDetails?.trim()) stageErrors.baseCaseDetails = 'Base Case Number / Year is required.';
      if (!formData.basePetitionerNames?.trim()) stageErrors.basePetitionerNames = 'Petitioner Name(s) is required.';
      if (!formData.baseRespondentNames?.trim()) stageErrors.baseRespondentNames = 'Respondent Name(s) is required.';
      if (!formData.baseCasePertainsTo?.trim()) stageErrors.baseCasePertainsTo = 'Case Pertains To is required.';
      if (!formData.baseNatureOfCase?.trim()) stageErrors.baseNatureOfCase = 'Nature of Case is required.';
      const isBaseNatureOther =
        formData.baseNatureOfCase?.toLowerCase() === 'others' ||
        formData.baseNatureOfCase?.toLowerCase() === 'other';
      if (isBaseNatureOther && !formData.specifyBaseNatureOfCase?.trim()) {
        stageErrors.specifyBaseNatureOfCase = 'Please specify the custom Base Nature of Case.';
      }
      if (!formData.baseBriefOfPrayer?.trim()) stageErrors.baseBriefOfPrayer = 'Brief of Prayer is required.';
      if (!formData.baseFinalOrder?.trim()) stageErrors.baseFinalOrder = 'Final Order / Direction is required.';
      if (!formData.baseFinalOrderDate?.trim()) {
        stageErrors.baseFinalOrderDate = 'Final Order Date is required.';
      } else if (
        formData.appealInfo?.limitationDueDate &&
        formData.baseFinalOrderDate > formData.appealInfo.limitationDueDate
      ) {
        stageErrors.baseFinalOrderDate = `Base Case Final Order Date (${formData.baseFinalOrderDate}) cannot be later than Appeal Filing Limitation Due Date (${formData.appealInfo.limitationDueDate}).`;
      }
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
      if (formData.interimOrderDate && formData.caFiledDate && formData.interimOrderDate < formData.caFiledDate) {
        stageErrors.interimOrderDate = `Interim Order Date (${formData.interimOrderDate}) cannot be earlier than CA Filed Date (${formData.caFiledDate}).`;
      }

      if (formData.complianceRequired === 'Yes') {
        if (!formData.complianceAction?.trim()) {
          stageErrors.complianceAction = 'Compliance Action Directed by Court is required when Compliance is required.';
        }
        if (!formData.complianceStatus) {
          stageErrors.complianceStatus = 'Compliance Status is required when Compliance is required.';
        } else {
          const isCompleted =
            formData.complianceStatus.toLowerCase() === 'completed' ||
            formData.complianceStatus.toLowerCase() === 'complied';
          const isPending = formData.complianceStatus.toLowerCase() === 'pending';
          const isOverdue = formData.complianceStatus.toLowerCase() === 'overdue';

          if (formData.complianceEndDate) {
            if (formData.complianceEndDate < todayStr && isPending) {
              stageErrors.complianceStatus = 'Compliance Status cannot be Pending when Compliance End Date has elapsed (must be Completed or Overdue).';
            } else if (formData.complianceEndDate >= todayStr && isOverdue) {
              stageErrors.complianceStatus = 'Compliance Status cannot be Overdue before Compliance End Date has elapsed (must be Completed or Pending).';
            }
          }

          if (isCompleted) {
            if (!formData.complianceCompletionDate?.trim()) {
              stageErrors.complianceCompletionDate = 'Completion Date is required when Compliance Status is Completed.';
            }
          }
        }
      }
    } else if (stageDef.id === 'disposal_appeal') {
      // Final Disposal & Track
      if (formData.finalResult === 'Yes') {
        if (!formData.finalOrderDate) {
          stageErrors.finalOrderDate = 'Final Order Date is required when Case is Concluded.';
        } else if (formData.caseClassification === 'Appeal Case') {
          const appealFilingDate = formData.appealInfo?.appealFilingDate || formData.appealFilingDate;
          if (appealFilingDate && formData.finalOrderDate < appealFilingDate) {
            stageErrors.finalOrderDate = `Final Order Date (${formData.finalOrderDate}) cannot be earlier than Appeal Filing Date (${appealFilingDate}).`;
          }
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
            if (formData.appealFiled === 'Yes') {
              if (!formData.appealFiledDate) {
                stageErrors.appealFiledDate = 'Appeal Filed Date is required when Appeal is Filed.';
              } else if (formData.finalOrderDate && formData.appealFiledDate < formData.finalOrderDate) {
                stageErrors.appealFiledDate = `Appeal Filed Date (${formData.appealFiledDate}) cannot be earlier than Final Order Date (${formData.finalOrderDate}).`;
              }
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
        formData.baseFinalOrder?.trim() &&
        formData.baseFinalOrderDate?.trim() &&
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpToStage(activeStageIndex)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const payloadToSave: LegalCaseData = { ...formData };
      const savePromises: Promise<void>[] = [];

      // 1. Auto-save custom Court Name in Stage 1 Normal Case
      if (
        (payloadToSave.nameOfCourt?.toLowerCase() === 'others' || payloadToSave.nameOfCourt?.toLowerCase() === 'other') &&
        payloadToSave.specifyNameOfCourt?.trim()
      ) {
        const customCourt = payloadToSave.specifyNameOfCourt.trim();
        payloadToSave.nameOfCourt = customCourt;
        savePromises.push(saveCustomMasterOption('court_name', customCourt));
      }

      // 2. Auto-save custom Appellate Court in Stage 1 Appeal Case
      const isAppellateOther =
        payloadToSave.appealInfo?.appellateCourt?.toLowerCase() === 'others' ||
        payloadToSave.appealInfo?.appellateCourt?.toLowerCase() === 'other' ||
        payloadToSave.appellateCourt?.toLowerCase() === 'others' ||
        payloadToSave.appellateCourt?.toLowerCase() === 'other';
      if (isAppellateOther && payloadToSave.specifyAppellateCourt?.trim()) {
        const customAppellate = payloadToSave.specifyAppellateCourt.trim();
        payloadToSave.appellateCourt = customAppellate;
        if (payloadToSave.appealInfo) {
          payloadToSave.appealInfo.appellateCourt = customAppellate;
        }
        savePromises.push(saveCustomMasterOption('appellate_court', customAppellate));
      }

      // 3. Auto-save custom Base Court Name in Stage 2 Appeal Case
      if (
        (payloadToSave.baseCourtName?.toLowerCase() === 'others' || payloadToSave.baseCourtName?.toLowerCase() === 'other') &&
        payloadToSave.specifyBaseCourtName?.trim()
      ) {
        const customBaseCourt = payloadToSave.specifyBaseCourtName.trim();
        payloadToSave.baseCourtName = customBaseCourt;
        savePromises.push(saveCustomMasterOption('court_name', customBaseCourt));
      }

      // 4. Auto-save custom Nature of Case in Stage 1 (Normal / Appeal)
      if (
        (payloadToSave.natureOfCase?.toLowerCase() === 'others' || payloadToSave.natureOfCase?.toLowerCase() === 'other') &&
        payloadToSave.specifyNatureOfCase?.trim()
      ) {
        const customNature = payloadToSave.specifyNatureOfCase.trim();
        payloadToSave.natureOfCase = customNature;
        savePromises.push(saveCustomMasterOption('nature_of_case', customNature));
      }

      // 5. Auto-save custom Base Nature of Case in Stage 2 Appeal Case
      if (
        (payloadToSave.baseNatureOfCase?.toLowerCase() === 'others' || payloadToSave.baseNatureOfCase?.toLowerCase() === 'other') &&
        payloadToSave.specifyBaseNatureOfCase?.trim()
      ) {
        const customBaseNature = payloadToSave.specifyBaseNatureOfCase.trim();
        payloadToSave.baseNatureOfCase = customBaseNature;
        savePromises.push(saveCustomMasterOption('nature_of_case', customBaseNature));
      }

      // Sync caseDetails and nameOfCourt for appeal cases
      if (isAppeal && payloadToSave.appealInfo) {
        payloadToSave.caseDetails = payloadToSave.appealInfo.appealCaseDetails || payloadToSave.caseDetails;
        payloadToSave.appealCaseDetails = payloadToSave.appealInfo.appealCaseDetails || payloadToSave.appealCaseDetails;
        payloadToSave.nameOfCourt = payloadToSave.appealInfo.appellateCourt || payloadToSave.nameOfCourt;
      }

      if (savePromises.length > 0) {
        await Promise.allSettled(savePromises);
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

              {/* Conditional Specify Name of Court for Others */}
              {(formData.nameOfCourt?.toLowerCase() === 'others' || formData.nameOfCourt?.toLowerCase() === 'other') && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specify Court Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter specific court name..."
                    value={formData.specifyNameOfCourt || ''}
                    onChange={(e) => handleChange('specifyNameOfCourt', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.specifyNameOfCourt && <p className="text-[11px] text-rose-500 mt-1">{errors.specifyNameOfCourt}</p>}
                </div>
              )}

              {/* Case Number / Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Case Number / Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. W.P (MD) No.12345/2024"
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
                      Appeal Case Number / Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. W.P (MD) No.12345/2024"
                      value={formData.appealInfo?.appealCaseDetails || ''}
                      onChange={(e) => handleAppealInfoChange('appealCaseDetails', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      required
                    />
                    {errors.appealCaseDetails && <p className="text-[11px] text-rose-500 mt-1">{errors.appealCaseDetails}</p>}
                  </div>
                </div>

                {/* Conditional Specify Appellate Court for Others */}
                {(formData.appealInfo?.appellateCourt?.toLowerCase() === 'others' ||
                  formData.appealInfo?.appellateCourt?.toLowerCase() === 'other' ||
                  formData.appellateCourt?.toLowerCase() === 'others' ||
                  formData.appellateCourt?.toLowerCase() === 'other') && (
                  <div className="animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Specify Appellate Court Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter specific appellate court name..."
                      value={formData.specifyAppellateCourt || ''}
                      onChange={(e) => handleChange('specifyAppellateCourt', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      required
                    />
                    {errors.specifyAppellateCourt && <p className="text-[11px] text-rose-500 mt-1">{errors.specifyAppellateCourt}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

                  {formData.appealInfo?.delayInFilingAppeal === 'Yes' && (
                    <div className="animate-in fade-in">
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
                  )}
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

              {/* Administrative Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Circle Jurisdiction <span className="text-rose-500">*</span>
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
                    Division Jurisdiction <span className="text-rose-500">*</span>
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
                    Name of Court <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={courts}
                    value={formData.baseCourtName || ''}
                    onChange={(val) => handleChange('baseCourtName', val)}
                  />
                  {errors.baseCourtName && <p className="text-[11px] text-rose-500 mt-1">{errors.baseCourtName}</p>}
                </div>
              </div>

              {/* Conditional Specify Base Court for Others */}
              {(formData.baseCourtName?.toLowerCase() === 'others' || formData.baseCourtName?.toLowerCase() === 'other') && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specify Base Court Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter specific base court name..."
                    value={formData.specifyBaseCourtName || ''}
                    onChange={(e) => handleChange('specifyBaseCourtName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.specifyBaseCourtName && <p className="text-[11px] text-rose-500 mt-1">{errors.specifyBaseCourtName}</p>}
                </div>
              )}

              {/* Case Number / Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Case Number / Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. W.P (MD) No.12345/2024"
                  value={formData.baseCaseDetails || ''}
                  onChange={(e) => handleChange('baseCaseDetails', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
                {errors.baseCaseDetails && <p className="text-[11px] text-rose-500 mt-1">{errors.baseCaseDetails}</p>}
              </div>

              {/* Litigant Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Petitioner Name(s) <span className="text-rose-500">*</span>
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
                    Respondent Name(s) <span className="text-rose-500">*</span>
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

              {/* Jurisdiction & Nature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Case Pertains To <span className="text-rose-500">*</span>
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
                    Nature of Case <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={natureOfCasesList}
                    value={formData.baseNatureOfCase || ''}
                    onChange={(val) => handleChange('baseNatureOfCase', val)}
                  />
                  {errors.baseNatureOfCase && <p className="text-[11px] text-rose-500 mt-1">{errors.baseNatureOfCase}</p>}
                </div>
              </div>

              {/* Conditional Specify Base Nature of Case for Others */}
              {(formData.baseNatureOfCase?.toLowerCase() === 'others' || formData.baseNatureOfCase?.toLowerCase() === 'other') && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specify Base Nature of Case <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter specific base nature of case..."
                    value={formData.specifyBaseNatureOfCase || ''}
                    onChange={(e) => handleChange('specifyBaseNatureOfCase', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.specifyBaseNatureOfCase && <p className="text-[11px] text-rose-500 mt-1">{errors.specifyBaseNatureOfCase}</p>}
                </div>
              )}

              {/* Brief of Prayer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brief of Prayer <span className="text-rose-500">*</span>
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

              {/* Final Order & Final Order Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Final Order / Direction <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter final judgment/order details..."
                    value={formData.baseFinalOrder || ''}
                    onChange={(e) => handleChange('baseFinalOrder', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                  {errors.baseFinalOrder && <p className="text-[11px] text-rose-500 mt-1">{errors.baseFinalOrder}</p>}
                </div>

                <div>
                  <DatePickerInput
                    label="Final Order Date"
                    value={formData.baseFinalOrderDate || ''}
                    max={formData.appealInfo?.limitationDueDate || undefined}
                    onChange={(val) => handleChange('baseFinalOrderDate', val)}
                    error={errors.baseFinalOrderDate}
                    placeholder="DD/MM/YYYY"
                    required
                  />
                </div>
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
                    options={caRequiredOptions}
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
                        options={caFiledOptions}
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CA Filed Date <span className="text-rose-500">*</span>
                    </label>
                    <DatePickerInput
                      value={formData.caFiledDate || ''}
                      onChange={(val) => handleChange('caFiledDate', val)}
                    />
                    {errors.caFiledDate && <p className="text-[11px] text-rose-500 mt-1">{errors.caFiledDate}</p>}
                    {formData.caFiledDate && formData.caDueDate && formData.caFiledDate > formData.caDueDate && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 animate-in fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Delayed by {Math.ceil((new Date(formData.caFiledDate).getTime() - new Date(formData.caDueDate).getTime()) / (1000 * 60 * 60 * 24))} day
                          {Math.ceil((new Date(formData.caFiledDate).getTime() - new Date(formData.caDueDate).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}.
                        </span>
                      </div>
                    )}
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
                    min={formData.caFiledDate || undefined}
                    onChange={(val) => handleChange('interimOrderDate', val)}
                  />
                  {errors.interimOrderDate && <p className="text-[11px] text-rose-500 mt-1">{errors.interimOrderDate}</p>}
                </div>
              </div>

              {/* Compliance Required */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-xs">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance Required</label>
                  <SearchableSelect
                    options={complianceRequiredOptions}
                    value={formData.complianceRequired || ''}
                    onChange={(val) => handleChange('complianceRequired', val)}
                  />
                </div>
              </div>

              {/* If Compliance Required = Yes -> reveal Compliance Action Directed by Court, Period, End Date, CED Complaint Sent Date, Status & Action Taken */}
              {formData.complianceRequired === 'Yes' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Compliance Action Directed by Court <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter compliance action directed by court..."
                      value={formData.complianceAction || ''}
                      onChange={(e) => handleChange('complianceAction', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      required
                    />
                    {errors.complianceAction && <p className="text-[11px] text-rose-500 mt-1">{errors.complianceAction}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Compliance Period (Text)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 8 weeks, 3 months"
                        value={formData.compliancePeriod || ''}
                        onChange={(e) => handleChange('compliancePeriod', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compliance End Date (CED)</label>
                      <DatePickerInput
                        value={formData.complianceEndDate || ''}
                        onChange={(val) => {
                          handleChange('complianceEndDate', val);
                          // Auto-adjust complianceStatus if invalid for new date
                          if (val) {
                            if (val < todayStr && formData.complianceStatus?.toLowerCase() === 'pending') {
                              handleChange('complianceStatus', '');
                            } else if (val >= todayStr && formData.complianceStatus?.toLowerCase() === 'overdue') {
                              handleChange('complianceStatus', '');
                            }
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Compliance Status <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={availableComplianceStatuses}
                        value={formData.complianceStatus || ''}
                        onChange={(val) => handleChange('complianceStatus', val)}
                      />
                      {errors.complianceStatus && <p className="text-[11px] text-rose-500 mt-1">{errors.complianceStatus}</p>}
                      {formData.complianceStatus?.toLowerCase() === 'overdue' && overdueDays > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold text-rose-800 dark:text-rose-300 animate-in fade-in">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            Overdue by {overdueDays} day{overdueDays > 1 ? 's' : ''} (Compliance End Date {formatDateIndian(formData.complianceEndDate)} has elapsed).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conditional Completion Date (when Compliance Status is Completed / Complied) */}
                  {(formData.complianceStatus?.toLowerCase() === 'completed' || formData.complianceStatus?.toLowerCase() === 'complied') && (
                    <div className="animate-in fade-in max-w-sm">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Completion Date <span className="text-rose-500">*</span>
                      </label>
                      <DatePickerInput
                        value={formData.complianceCompletionDate || ''}
                        onChange={(val) => handleChange('complianceCompletionDate', val)}
                      />
                      {errors.complianceCompletionDate && (
                        <p className="text-[11px] text-rose-500 mt-1">{errors.complianceCompletionDate}</p>
                      )}
                      {completionDelayDays > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 animate-in fade-in">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Delayed by {completionDelayDays} day{completionDelayDays > 1 ? 's' : ''} (Completed on {formatDateIndian(formData.complianceCompletionDate)} after Compliance End Date {formatDateIndian(formData.complianceEndDate)}).
                          </span>
                        </div>
                      )}
                    </div>
                  )}

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
                  options={finalResultOptions}
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
                        min={formData.caseClassification === 'Appeal Case' ? (formData.appealInfo?.appealFilingDate || formData.appealFilingDate || undefined) : undefined}
                      />
                      {errors.finalOrderDate && <p className="text-[11px] text-rose-500 mt-1">{errors.finalOrderDate}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Adverse to Department? <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={adverseToDepartmentOptions}
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
                              options={appealFiledOptions}
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
                                  min={formData.finalOrderDate || undefined}
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
