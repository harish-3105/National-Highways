'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Building2,
  AlertCircle,
  FileText,
  IndianRupee,
  Activity,
  Calendar,
  ShieldAlert,
  HardHat,
  Clock,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  LockKeyhole,
  Check,
} from 'lucide-react';
import { MajorProject, FROZEN_PROJECT_COLUMNS } from '@/app/api/major-projects/route';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { calculateProjectDelay } from '@/lib/formatters';

interface OngoingWorkEntryFormProps {
  initialData?: Partial<MajorProject>;
  nextSNo?: number;
  masterDivisions?: string[];
  masterSchemes?: string[];
  isAdmin?: boolean;
  onSave: (projectData: Partial<MajorProject>) => Promise<void> | void;
  onCancel: () => void;
}

type StageTabType =
  | 'sanction_scope'
  | 'contract_award'
  | 'physical_progress'
  | 'financial_outlay'
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
    id: 'physical_progress',
    label: 'Physical Progress',
    step: 'Stage 3',
    subtitle: 'Stage classification, completed lengths & execution %',
    icon: Activity,
  },
  {
    id: 'financial_outlay',
    label: 'Financial Outlay',
    step: 'Stage 4',
    subtitle: 'Cost sanctions, revisions & cumulative expenditure',
    icon: IndianRupee,
  },
  {
    id: 'overruns_eot',
    label: 'Overruns & EOT',
    step: 'Stage 5',
    subtitle: 'Completion targets, delay metrics & extension of time',
    icon: Clock,
  },
  {
    id: 'statutory_clearances',
    label: 'Statutory Clearances',
    step: 'Stage 6',
    subtitle: 'Land, forest, utility, railways & statutory bottlenecks',
    icon: ShieldAlert,
  },
  {
    id: 'col27_field_log',
    label: 'Col 27 Execution Log',
    step: 'Stage 7',
    subtitle: 'Detailed stage status & division update ledger',
    icon: Building2,
  },
];

export const OngoingWorkEntryForm: React.FC<OngoingWorkEntryFormProps> = ({
  initialData,
  nextSNo = 1,
  masterDivisions = [],
  masterSchemes = [],
  isAdmin = false,
  onSave,
  onCancel,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Parse existing issues from stage_remarks without touching detailed_stage_status (Col 27)
  const initialIssues = useMemo(() => {
    let land = initialData?.issue_land || '';
    let forest = initialData?.issue_forest || '';
    let utility = initialData?.issue_utility || '';
    let railways = initialData?.issue_railways || '';
    let others = initialData?.issue_others || '';

    const text = initialData?.stage_remarks || '';
    if (text && (!land && !forest && !utility && !railways && !others)) {
      const landMatch = text.match(/Land Acquisition:?\s*([^\n;|]+)/i);
      const forestMatch = text.match(/Forest:?\s*([^\n;|]+)/i);
      const utilityMatch = text.match(/Utility:?\s*([^\n;|]+)/i);
      const railMatch = text.match(/Railways:?\s*([^\n;|]+)/i);
      const othersMatch = text.match(/Others:?\s*([^\n;|]+)/i);

      if (landMatch) land = landMatch[1].trim();
      if (forestMatch) forest = forestMatch[1].trim();
      if (utilityMatch) utility = utilityMatch[1].trim();
      if (railMatch) railways = railMatch[1].trim();
      if (othersMatch) others = othersMatch[1].trim();
    }

    return { land, forest, utility, railways, others };
  }, [initialData]);

  // Stage 1: Sanction & Scope
  const [sNo, setSNo] = useState<string>(String(initialData?.s_no || nextSNo));
  const [division, setDivision] = useState<string>(initialData?.division || '');
  const [scheme, setScheme] = useState<string>(initialData?.scheme || '');
  const [nameOfWork, setNameOfWork] = useState<string>(initialData?.name_of_work || '');
  const [sanctionDate, setSanctionDate] = useState<string>(initialData?.sanction_date || '');
  const [jobNo, setJobNo] = useState<string>(initialData?.job_no || '');
  const [pmisId, setPmisId] = useState<string>(initialData?.pmis_id || '');
  const [oldNewNh, setOldNewNh] = useState<string>(initialData?.old_new_nh || '');
  const [lengthKm, setLengthKm] = useState<string>(
    initialData?.length_km !== undefined && initialData?.length_km !== null
      ? String(initialData.length_km)
      : ''
  );

  // Stage 2: Contract & Award Execution
  const [loaDate, setLoaDate] = useState<string>(initialData?.loa_date || '');
  const [agreementDate, setAgreementDate] = useState<string>(initialData?.agreement_date || '');
  const [siteHandoverDate, setSiteHandoverDate] = useState<string>(initialData?.site_handover_date || '');
  const [appointedDate, setAppointedDate] = useState<string>(initialData?.appointed_date || '');
  const [scheduledCompletionDate, setScheduledCompletionDate] = useState<string>(
    initialData?.scheduled_completion_date || ''
  );
  const [contractorName, setContractorName] = useState<string>(initialData?.contractor_name || '');
  const [deNamePhone, setDeNamePhone] = useState<string>(initialData?.de_name_phone || '');
  const [contractValueCr, setContractValueCr] = useState<string>(
    initialData?.contract_value_cr !== undefined && initialData?.contract_value_cr !== null
      ? String(initialData.contract_value_cr)
      : ''
  );

  // Stage 3: Physical Progress & Lengths
  const [workStage, setWorkStage] = useState<'IN_PROGRESS' | 'TENDER_STAGE' | 'COMPLETED'>(
    initialData?.work_stage === 'TENDER_STAGE'
      ? 'TENDER_STAGE'
      : initialData?.work_stage === 'COMPLETED'
      ? 'COMPLETED'
      : 'IN_PROGRESS'
  );
  const [progressPercent, setProgressPercent] = useState<string>(
    initialData?.progress_percent !== undefined && initialData?.progress_percent !== null
      ? String(initialData.progress_percent)
      : ''
  );
  const [completedLengthPriorKm, setCompletedLengthPriorKm] = useState<string>(
    initialData?.completed_length_prior_km !== undefined && initialData?.completed_length_prior_km !== null
      ? String(initialData.completed_length_prior_km)
      : ''
  );
  const [completedLengthCurrentFyKm, setCompletedLengthCurrentFyKm] = useState<string>(
    initialData?.completed_length_current_fy_km !== undefined && initialData?.completed_length_current_fy_km !== null
      ? String(initialData.completed_length_current_fy_km)
      : ''
  );
  const [totalCompletedLengthKm, setTotalCompletedLengthKm] = useState<string>(
    initialData?.total_completed_length_km !== undefined && initialData?.total_completed_length_km !== null
      ? String(initialData.total_completed_length_km)
      : ''
  );
  const [stageRemarks, setStageRemarks] = useState<string>(initialData?.stage_remarks || '');
  const [progressRemarks, setProgressRemarks] = useState<string>(initialData?.progress_remarks || '');

  // Stage 4: Financial Outlay & Expenditure
  const [projectCostCr, setProjectCostCr] = useState<string>(
    initialData?.project_cost_cr !== undefined && initialData?.project_cost_cr !== null
      ? String(initialData.project_cost_cr)
      : ''
  );
  const [revisedCostCr, setRevisedCostCr] = useState<string>(
    initialData?.revised_cost_cr !== undefined && initialData?.revised_cost_cr !== null
      ? String(initialData.revised_cost_cr)
      : ''
  );
  const [costIncreaseRceCr, setCostIncreaseRceCr] = useState<string>(
    initialData?.cost_increase_rce_cr !== undefined && initialData?.cost_increase_rce_cr !== null
      ? String(initialData.cost_increase_rce_cr)
      : ''
  );
  const [expenditurePriorCr, setExpenditurePriorCr] = useState<string>(
    initialData?.expenditure_prior_cr !== undefined && initialData?.expenditure_prior_cr !== null
      ? String(initialData.expenditure_prior_cr)
      : ''
  );
  const [expenditureCurrentFyCr, setExpenditureCurrentFyCr] = useState<string>(
    initialData?.expenditure_current_fy_cr !== undefined && initialData?.expenditure_current_fy_cr !== null
      ? String(initialData.expenditure_current_fy_cr)
      : ''
  );
  const [expenditureCr, setExpenditureCr] = useState<string>(
    initialData?.cumm_financial_expenditure_cr !== undefined &&
      initialData?.cumm_financial_expenditure_cr !== null
      ? String(initialData.cumm_financial_expenditure_cr)
      : ''
  );
  const [contractCumExpenditureCr, setContractCumExpenditureCr] = useState<string>(
    initialData?.contract_cum_expenditure_cr !== undefined &&
      initialData?.contract_cum_expenditure_cr !== null
      ? String(initialData.contract_cum_expenditure_cr)
      : ''
  );

  // Stage 5: Overruns, EOT & Target Dates
  const [likelyCompletionDate, setLikelyCompletionDate] = useState<string>(
    initialData?.likely_completion_date || ''
  );
  const [probableCompletionDate, setProbableCompletionDate] = useState<string>(
    initialData?.probable_completion_date || ''
  );
  const [timeOverrunYears, setTimeOverrunYears] = useState<string>(
    initialData?.time_overrun_years !== undefined && initialData?.time_overrun_years !== null
      ? String(initialData.time_overrun_years)
      : ''
  );
  const [eotGrantedTill, setEotGrantedTill] = useState<string>(initialData?.eot_granted_till || '');
  const [eotProposalAgency, setEotProposalAgency] = useState<string>(initialData?.eot_proposal_agency || '');
  const [cosDetails, setCosDetails] = useState<string>(initialData?.cos_details || '');

  // Stage 6: 5 Statutory Clearance Issues
  const [issueLand, setIssueLand] = useState<string>(initialIssues.land);
  const [issueForest, setIssueForest] = useState<string>(initialIssues.forest);
  const [issueUtility, setIssueUtility] = useState<string>(initialIssues.utility);
  const [issueRailways, setIssueRailways] = useState<string>(initialIssues.railways);
  const [issueOthers, setIssueOthers] = useState<string>(initialIssues.others);

  // Stage 7: Column 27 Technical Execution Remarks & Date
  const [detailedStageStatus, setDetailedStageStatus] = useState<string>(
    initialData?.detailed_stage_status || ''
  );
  const [updatedDivisionDate, setUpdatedDivisionDate] = useState<string>(
    initialData?.updated_division_date || ''
  );

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper: Write-Once / Freeze-When-Filled check
  const isFieldLocked = (fieldName: keyof MajorProject): boolean => {
    if (isAdmin) return false;
    if (!initialData?.id) return false;
    const val = initialData[fieldName];
    return val !== null && val !== undefined && val !== '';
  };

  // Computed Financial %
  const calculatedFinancialPercent = useMemo(() => {
    const cost = parseFloat(revisedCostCr) || parseFloat(projectCostCr);
    const exp = parseFloat(expenditureCr);
    if (cost > 0 && exp >= 0) {
      return Math.min(100, Math.round((exp / cost) * 100 * 10) / 10);
    }
    return null;
  }, [projectCostCr, revisedCostCr, expenditureCr]);

  // Computed Contract Value %
  const calculatedContractPercent = useMemo(() => {
    const val = parseFloat(contractValueCr);
    const exp = parseFloat(contractCumExpenditureCr);
    if (val > 0 && exp >= 0) {
      return Math.min(100, Math.round((exp / val) * 100 * 10) / 10);
    }
    return null;
  }, [contractValueCr, contractCumExpenditureCr]);

  // Computed Delay
  const computedDelay = useMemo(() => {
    if (workStage === 'TENDER_STAGE' || !scheduledCompletionDate) return null;
    return calculateProjectDelay(
      scheduledCompletionDate,
      probableCompletionDate,
      progressPercent ? Number(progressPercent) : 0
    );
  }, [workStage, scheduledCompletionDate, probableCompletionDate, progressPercent]);

  // -------------------------------------------------------------
  // STAGE-GATED VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Sanction & Scope (Mandatory baseline)
      if (!nameOfWork.trim()) {
        stageErrors.nameOfWork = 'Name of Work is required (Stage 1).';
      }
      if (!division.trim()) {
        stageErrors.division = 'Division selection is required (Stage 1).';
      }
      if (!scheme.trim()) {
        stageErrors.scheme = 'Scheme selection is required (Stage 1).';
      }
      if (lengthKm && (isNaN(Number(lengthKm)) || Number(lengthKm) < 0)) {
        stageErrors.lengthKm = 'Length (Km) must be a non-negative number.';
      }
    } else if (stageIdx === 1) {
      // Stage 2: Contract & Award Execution
      if (contractValueCr && (isNaN(Number(contractValueCr)) || Number(contractValueCr) < 0)) {
        stageErrors.contractValueCr = 'Contract Value must be a valid non-negative number.';
      }
    } else if (stageIdx === 2) {
      // Stage 3: Physical Progress
      if (workStage === 'IN_PROGRESS' || workStage === 'COMPLETED') {
        if (progressPercent !== '') {
          const p = Number(progressPercent);
          if (isNaN(p) || p < 0 || p > 100) {
            stageErrors.progressPercent = 'Physical Progress must be between 0% and 100%.';
          }
          if (!isAdmin && initialData?.progress_percent !== null && initialData?.progress_percent !== undefined) {
            const prevP = Number(initialData.progress_percent);
            if (p < prevP) {
              stageErrors.progressPercent = `Monotonic progress rule: Physical progress cannot decrease from previously recorded ${prevP}% (entered ${p}%).`;
            }
          }
        }
      }
      if (completedLengthPriorKm && (isNaN(Number(completedLengthPriorKm)) || Number(completedLengthPriorKm) < 0)) {
        stageErrors.completedLengthPriorKm = 'Completed Length Prior FY must be a non-negative number.';
      }
      if (completedLengthCurrentFyKm && (isNaN(Number(completedLengthCurrentFyKm)) || Number(completedLengthCurrentFyKm) < 0)) {
        stageErrors.completedLengthCurrentFyKm = 'Completed Length Current FY must be a non-negative number.';
      }
      if (totalCompletedLengthKm && (isNaN(Number(totalCompletedLengthKm)) || Number(totalCompletedLengthKm) < 0)) {
        stageErrors.totalCompletedLengthKm = 'Total Completed Length must be a non-negative number.';
      }
    } else if (stageIdx === 3) {
      // Stage 4: Financial Outlay & Expenditure
      if (projectCostCr && (isNaN(Number(projectCostCr)) || Number(projectCostCr) < 0)) {
        stageErrors.projectCostCr = 'Project Cost must be a valid non-negative number.';
      }
      if (revisedCostCr && (isNaN(Number(revisedCostCr)) || Number(revisedCostCr) < 0)) {
        stageErrors.revisedCostCr = 'Revised Cost must be a valid non-negative number.';
      }
      if (costIncreaseRceCr && (isNaN(Number(costIncreaseRceCr)) || Number(costIncreaseRceCr) < 0)) {
        stageErrors.costIncreaseRceCr = 'Cost Increase must be a valid non-negative number.';
      }
      if (expenditurePriorCr && (isNaN(Number(expenditurePriorCr)) || Number(expenditurePriorCr) < 0)) {
        stageErrors.expenditurePriorCr = 'Expenditure Prior FY must be a valid non-negative number.';
      }
      if (expenditureCurrentFyCr && (isNaN(Number(expenditureCurrentFyCr)) || Number(expenditureCurrentFyCr) < 0)) {
        stageErrors.expenditureCurrentFyCr = 'Expenditure Current FY must be a valid non-negative number.';
      }
      if (expenditureCr && (isNaN(Number(expenditureCr)) || Number(expenditureCr) < 0)) {
        stageErrors.expenditureCr = 'Cumulative Financial Expenditure must be a valid non-negative number.';
      }
      if (contractCumExpenditureCr && (isNaN(Number(contractCumExpenditureCr)) || Number(contractCumExpenditureCr) < 0)) {
        stageErrors.contractCumExpenditureCr = 'Contract Cumulative Expenditure must be a valid non-negative number.';
      }
    } else if (stageIdx === 4) {
      // Stage 5: Overruns & EOT
      if (timeOverrunYears && (isNaN(Number(timeOverrunYears)) || Number(timeOverrunYears) < 0)) {
        stageErrors.timeOverrunYears = 'Time Overrun (Years) must be a non-negative number.';
      }
    }

    return stageErrors;
  };

  // Check if all stages prior to targetStage are satisfied
  const isStageAccessible = (targetStageIdx: number): boolean => {
    if (targetStageIdx === 0) return true;
    for (let i = 0; i < targetStageIdx; i++) {
      const stageErrs = validateSingleStage(i);
      if (Object.keys(stageErrs).length > 0) return false;
    }
    return true;
  };

  // Check whether a stage is completed
  const isStageCompleted = (stageIdx: number): boolean => {
    if (stageIdx === 0) {
      return Boolean(nameOfWork.trim() && division.trim() && scheme.trim() && Object.keys(validateSingleStage(0)).length === 0);
    }
    if (stageIdx === 1) {
      return Boolean((contractorName.trim() || loaDate || agreementDate || contractValueCr) && Object.keys(validateSingleStage(1)).length === 0);
    }
    if (stageIdx === 2) {
      return Boolean(progressPercent !== '' && Object.keys(validateSingleStage(2)).length === 0);
    }
    if (stageIdx === 3) {
      return Boolean((projectCostCr || expenditureCr) && Object.keys(validateSingleStage(3)).length === 0);
    }
    if (stageIdx === 4) {
      return Boolean((likelyCompletionDate || probableCompletionDate || timeOverrunYears) && Object.keys(validateSingleStage(4)).length === 0);
    }
    if (stageIdx === 5) {
      return Boolean(issueLand || issueForest || issueUtility || issueRailways || issueOthers);
    }
    if (stageIdx === 6) {
      return Boolean(detailedStageStatus.trim());
    }
    return false;
  };

  // Validate only up to the specified stage
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpToStage(activeStageIndex)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const payload: Partial<MajorProject> & { isAdmin?: boolean } = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      s_no: Number(sNo) || nextSNo,
      division: division.trim(),
      scheme: scheme.trim(),
      name_of_work: nameOfWork.trim(),
      project_cost_cr: projectCostCr ? Number(projectCostCr) : 0,
      revised_cost_cr: revisedCostCr ? Number(revisedCostCr) : null,
      cost_increase_rce_cr: costIncreaseRceCr ? Number(costIncreaseRceCr) : null,
      expenditure_prior_cr: expenditurePriorCr ? Number(expenditurePriorCr) : null,
      expenditure_current_fy_cr: expenditureCurrentFyCr ? Number(expenditureCurrentFyCr) : null,
      cumm_financial_expenditure_cr: expenditureCr ? Number(expenditureCr) : null,
      contract_value_cr: contractValueCr ? Number(contractValueCr) : null,
      contract_cum_expenditure_cr: contractCumExpenditureCr ? Number(contractCumExpenditureCr) : null,

      work_stage: workStage,
      progress_percent:
        workStage === 'TENDER_STAGE'
          ? null
          : workStage === 'COMPLETED' && progressPercent === ''
          ? 100
          : progressPercent !== ''
          ? Number(progressPercent)
          : null,
      completed_length_prior_km: completedLengthPriorKm ? Number(completedLengthPriorKm) : null,
      completed_length_current_fy_km: completedLengthCurrentFyKm ? Number(completedLengthCurrentFyKm) : null,
      total_completed_length_km: totalCompletedLengthKm ? Number(totalCompletedLengthKm) : null,

      likely_completion_date: likelyCompletionDate.trim() || null,
      probable_completion_date:
        workStage === 'TENDER_STAGE' ? null : probableCompletionDate ? probableCompletionDate.trim() : null,
      scheduled_completion_date: scheduledCompletionDate ? scheduledCompletionDate.trim() : null,
      time_overrun_years: timeOverrunYears ? Number(timeOverrunYears) : null,
      eot_granted_till: eotGrantedTill.trim() || null,
      eot_proposal_agency: eotProposalAgency.trim() || null,
      cos_details: cosDetails.trim() || null,

      stage_remarks: workStage === 'TENDER_STAGE' ? stageRemarks.trim() || null : null,
      progress_remarks: workStage !== 'TENDER_STAGE' ? progressRemarks.trim() || null : null,
      detailed_stage_status: detailedStageStatus.trim() || null,

      loa_date: loaDate.trim() || null,
      agreement_date: agreementDate.trim() || null,
      site_handover_date: siteHandoverDate.trim() || null,
      appointed_date: appointedDate.trim() || null,

      issue_land: issueLand.trim() || null,
      issue_forest: issueForest.trim() || null,
      issue_utility: issueUtility.trim() || null,
      issue_railways: issueRailways.trim() || null,
      issue_others: issueOthers.trim() || null,

      contractor_name: contractorName.trim() || null,
      de_name_phone: deNamePhone.trim() || null,
      old_new_nh: oldNewNh.trim() || null,
      length_km: lengthKm ? Number(lengthKm) : null,
      job_no: jobNo.trim() || null,
      pmis_id: pmisId.trim() || null,
      sanction_date: sanctionDate.trim() || null,
      updated_division_date: updatedDivisionDate.trim() || null,

      isAdmin,
    };

    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  const currentStage = STAGES[activeStageIndex];

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Works List
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {initialData?.id ? 'Edit Ongoing Highway Work Record' : 'New Capital Highway Work Entry'}
              </h2>
              {initialData?.id && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-medium">
                  <Lock className="w-3 h-3 text-amber-500" /> Write-Once Protection Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Department &bull; Ongoing Capital Projects & Stage Monitoring
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
            <Save className="w-4 h-4" /> {loading ? 'Saving Work Entry...' : `Save Progress (${currentStage.step})`}
          </button>
        </div>
      </div>

      {/* 7-STAGE LIFECYCLE SUB-NAVIGATION STEPPER BAR */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Diagnostic Alert Banner */}
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
          {activeStageIndex === 0 && isFieldLocked('name_of_work') && (
            <span className="text-[11px] flex items-center gap-1 bg-blue-950/60 text-blue-200 px-2.5 py-1 rounded-lg border border-blue-700/50">
              <Lock className="w-3 h-3 text-amber-300" /> Identity Frozen
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* ========================================================= */}
          {/* STAGE 1: Sanction & Scope */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Serial No (S.No)
                  </label>
                  <input
                    type="number"
                    value={sNo}
                    onChange={(e) => setSNo(e.target.value)}
                    disabled={isFieldLocked('s_no')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Administrative Division <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={masterDivisions.length > 0 ? masterDivisions : ['Chennai', 'Salem', 'Madurai', 'Coimbatore', 'Trichy', 'Tirunelveli', 'Villupuram']}
                    value={division}
                    onChange={(val) => {
                      setDivision(val);
                      if (errors.division) setErrors((prev) => ({ ...prev, division: '' }));
                    }}
                    disabled={isFieldLocked('division')}
                  />
                  {errors.division && <p className="text-[11px] text-rose-500 mt-1">{errors.division}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheme Classification <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={masterSchemes.length > 0 ? masterSchemes : ['Annual Plan 2025-26', 'EPC Special', 'CRIF', 'Inter-Corridor', 'NHDP', 'Setu Bharatam']}
                    value={scheme}
                    onChange={(val) => {
                      setScheme(val);
                      if (errors.scheme) setErrors((prev) => ({ ...prev, scheme: '' }));
                    }}
                    disabled={isFieldLocked('scheme')}
                  />
                  {errors.scheme && <p className="text-[11px] text-rose-500 mt-1">{errors.scheme}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name of Work <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={nameOfWork}
                  onChange={(e) => {
                    setNameOfWork(e.target.value);
                    if (errors.nameOfWork) setErrors((prev) => ({ ...prev, nameOfWork: '' }));
                  }}
                  disabled={isFieldLocked('name_of_work')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  required
                />
                {errors.nameOfWork && <p className="text-[11px] text-rose-500 mt-1">{errors.nameOfWork}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sanction Date
                  </label>
                  <DatePickerInput
                    value={sanctionDate}
                    onChange={setSanctionDate}
                    disabled={isFieldLocked('sanction_date')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Job / AS Number
                  </label>
                  <input
                    type="text"
                    value={jobNo}
                    onChange={(e) => setJobNo(e.target.value)}
                    disabled={isFieldLocked('job_no')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PMIS Portal ID
                  </label>
                  <input
                    type="text"
                    value={pmisId}
                    onChange={(e) => setPmisId(e.target.value)}
                    disabled={isFieldLocked('pmis_id')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Old / New NH No
                  </label>
                  <input
                    type="text"
                    value={oldNewNh}
                    onChange={(e) => setOldNewNh(e.target.value)}
                    disabled={isFieldLocked('old_new_nh')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scope Length (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={lengthKm}
                    onChange={(e) => setLengthKm(e.target.value)}
                    disabled={isFieldLocked('length_km')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Contract Award & Execution */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contractor / Agency
                  </label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    disabled={isFieldLocked('contractor_name')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DE Name & Contact Phone
                  </label>
                  <input
                    type="text"
                    value={deNamePhone}
                    onChange={(e) => setDeNamePhone(e.target.value)}
                    disabled={isFieldLocked('de_name_phone')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Value (₹ Cr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={contractValueCr}
                      onChange={(e) => setContractValueCr(e.target.value)}
                      disabled={isFieldLocked('contract_value_cr')}
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    LOA Date
                  </label>
                  <DatePickerInput
                    value={loaDate}
                    onChange={setLoaDate}
                    disabled={isFieldLocked('loa_date')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agreement Date
                  </label>
                  <DatePickerInput
                    value={agreementDate}
                    onChange={setAgreementDate}
                    disabled={isFieldLocked('agreement_date')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Site Handover Date
                  </label>
                  <DatePickerInput
                    value={siteHandoverDate}
                    onChange={setSiteHandoverDate}
                    disabled={isFieldLocked('site_handover_date')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Appointed Date
                  </label>
                  <DatePickerInput
                    value={appointedDate}
                    onChange={setAppointedDate}
                    disabled={isFieldLocked('appointed_date')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Completion
                  </label>
                  <DatePickerInput
                    value={scheduledCompletionDate}
                    onChange={setScheduledCompletionDate}
                    disabled={isFieldLocked('scheduled_completion_date')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Physical Progress & Milestones */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Execution Stage Classification
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'IN_PROGRESS', label: 'In Progress' },
                      { id: 'TENDER_STAGE', label: 'Tender Stage' },
                      { id: 'COMPLETED', label: 'Completed' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setWorkStage(st.id as any)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          workStage === st.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {workStage !== 'TENDER_STAGE' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Physical Progress (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={progressPercent}
                        onChange={(e) => setProgressPercent(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    {errors.progressPercent && <p className="text-[11px] text-rose-500 mt-1">{errors.progressPercent}</p>}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Project is in pre-construction / tendering stage. Physical execution metrics are deferred.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Length Prior FY (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={completedLengthPriorKm}
                    onChange={(e) => setCompletedLengthPriorKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Length Current FY (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={completedLengthCurrentFyKm}
                    onChange={(e) => setCompletedLengthCurrentFyKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Completed Length (Km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={totalCompletedLengthKm}
                    onChange={(e) => setTotalCompletedLengthKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {workStage === 'TENDER_STAGE' ? 'Tender Stage Remarks' : 'Physical Progress Remarks'}
                </label>
                <textarea
                  rows={3}
                  value={workStage === 'TENDER_STAGE' ? stageRemarks : progressRemarks}
                  onChange={(e) => {
                    if (workStage === 'TENDER_STAGE') setStageRemarks(e.target.value);
                    else setProgressRemarks(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: Financial Outlay & Expenditure */}
          {/* ========================================================= */}
          {activeStageIndex === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sanctioned Project Cost (₹ Cr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={projectCostCr}
                      onChange={(e) => setProjectCostCr(e.target.value)}
                      disabled={isFieldLocked('project_cost_cr')}
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Revised Cost (₹ Cr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={revisedCostCr}
                      onChange={(e) => setRevisedCostCr(e.target.value)}
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Increase / RCE (₹ Cr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={costIncreaseRceCr}
                      onChange={(e) => setCostIncreaseRceCr(e.target.value)}
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expenditure Prior FY (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenditurePriorCr}
                    onChange={(e) => setExpenditurePriorCr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expenditure Current FY (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenditureCurrentFyCr}
                    onChange={(e) => setExpenditureCurrentFyCr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cumm Financial Expenditure (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenditureCr}
                    onChange={(e) => setExpenditureCr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Cumm Expenditure (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={contractCumExpenditureCr}
                    onChange={(e) => setContractCumExpenditureCr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Real-time Percentage Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                    Financial Progress (Expenditure / Sanction Cost)
                  </span>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {calculatedFinancialPercent !== null ? `${calculatedFinancialPercent}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                    Contract Expenditure Utilization
                  </span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {calculatedContractPercent !== null ? `${calculatedContractPercent}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 5: Overruns, EOT & Target Dates */}
          {/* ========================================================= */}
          {activeStageIndex === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Likely Completion Date
                  </label>
                  <DatePickerInput
                    value={likelyCompletionDate}
                    onChange={setLikelyCompletionDate}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Probable Completion Date
                  </label>
                  <DatePickerInput
                    value={probableCompletionDate}
                    onChange={setProbableCompletionDate}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time Overrun (Years)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={timeOverrunYears}
                    onChange={(e) => setTimeOverrunYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    EOT Granted Till Date
                  </label>
                  <DatePickerInput
                    value={eotGrantedTill}
                    onChange={setEotGrantedTill}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    EOT Proposal Agency / Stage
                  </label>
                  <input
                    type="text"
                    value={eotProposalAgency}
                    onChange={(e) => setEotProposalAgency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Change of Scope (COS) Particulars
                  </label>
                  <input
                    type="text"
                    value={cosDetails}
                    onChange={(e) => setCosDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {computedDelay && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Schedule Analysis & Delay Status
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Completion: {scheduledCompletionDate || 'Not specified'}
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${computedDelay.isDelayed ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'}`}>
                    {computedDelay.humanText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 6: Statutory Clearances & Bottlenecks */}
          {/* ========================================================= */}
          {activeStageIndex === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <strong>Statutory & Clearances Monitoring:</strong> Record specific field bottlenecks across statutory departments. These entries remain independent and do not overwrite technical execution remarks.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Land Acquisition Bottlenecks (LA)
                  </label>
                  <textarea
                    rows={2}
                    value={issueLand}
                    onChange={(e) => setIssueLand(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Forest & Environmental Clearances
                  </label>
                  <textarea
                    rows={2}
                    value={issueForest}
                    onChange={(e) => setIssueForest(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Utility Shifting (TNEB, TWAD, Gas)
                  </label>
                  <textarea
                    rows={2}
                    value={issueUtility}
                    onChange={(e) => setIssueUtility(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Railways Approvals (ROB / RUB / GAD)
                  </label>
                  <textarea
                    rows={2}
                    value={issueRailways}
                    onChange={(e) => setIssueRailways(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  5. Other Statutory or Legal Encumbrances
                </label>
                <textarea
                  rows={2}
                  value={issueOthers}
                  onChange={(e) => setIssueOthers(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 7: Column 27 Technical Execution Remarks & Date */}
          {/* ========================================================= */}
          {activeStageIndex === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Column 27: Detailed Technical Stage Status & Execution Log
                </label>
                <textarea
                  rows={5}
                  value={detailedStageStatus}
                  onChange={(e) => setDetailedStageStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Division Progress Update Date
                  </label>
                  <DatePickerInput
                    value={updatedDivisionDate}
                    onChange={setUpdatedDivisionDate}
                  />
                </div>
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
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Work Entry...' : `Save Progress (${currentStage.step})`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default OngoingWorkEntryForm;
