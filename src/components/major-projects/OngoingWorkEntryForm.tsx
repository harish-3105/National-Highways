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

export const OngoingWorkEntryForm: React.FC<OngoingWorkEntryFormProps> = ({
  initialData,
  nextSNo = 1,
  masterDivisions = [],
  masterSchemes = [],
  isAdmin = false,
  onSave,
  onCancel,
}) => {
  // Parse any existing issues from stage_remarks without touching detailed_stage_status (Col 27)
  const initialIssues = useMemo(() => {
    let land = initialData?.issue_land || '';
    let forest = initialData?.issue_forest || '';
    let utility = initialData?.issue_utility || '';
    let railways = initialData?.issue_railways || '';
    let others = initialData?.issue_others || '';

    // Only parse from stage_remarks if individual issue fields are empty
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

  // Form states
  const [sNo, setSNo] = useState<string>(String(initialData?.s_no || nextSNo));
  const [division, setDivision] = useState<string>(initialData?.division || '');
  const [scheme, setScheme] = useState<string>(initialData?.scheme || '');
  const [nameOfWork, setNameOfWork] = useState<string>(initialData?.name_of_work || '');

  // Financial (Module 2)
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
  const [contractValueCr, setContractValueCr] = useState<string>(
    initialData?.contract_value_cr !== undefined && initialData?.contract_value_cr !== null
      ? String(initialData.contract_value_cr)
      : ''
  );
  const [contractCumExpenditureCr, setContractCumExpenditureCr] = useState<string>(
    initialData?.contract_cum_expenditure_cr !== undefined &&
      initialData?.contract_cum_expenditure_cr !== null
      ? String(initialData.contract_cum_expenditure_cr)
      : ''
  );

  // Contract & Execution Milestones
  const [loaDate, setLoaDate] = useState<string>(initialData?.loa_date || '');
  const [agreementDate, setAgreementDate] = useState<string>(initialData?.agreement_date || '');
  const [siteHandoverDate, setSiteHandoverDate] = useState<string>(initialData?.site_handover_date || '');
  const [appointedDate, setAppointedDate] = useState<string>(initialData?.appointed_date || '');
  const [scheduledCompletionDate, setScheduledCompletionDate] = useState<string>(
    initialData?.scheduled_completion_date || ''
  );

  // Physical Progress, Lengths & Stage (Module 3)
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

  const [stageRemarks, setStageRemarks] = useState<string>(initialData?.stage_remarks || '');
  const [progressRemarks, setProgressRemarks] = useState<string>(initialData?.progress_remarks || '');

  // 5 Issues Fields (Module 4)
  const [issueLand, setIssueLand] = useState<string>(initialIssues.land);
  const [issueForest, setIssueForest] = useState<string>(initialIssues.forest);
  const [issueUtility, setIssueUtility] = useState<string>(initialIssues.utility);
  const [issueRailways, setIssueRailways] = useState<string>(initialIssues.railways);
  const [issueOthers, setIssueOthers] = useState<string>(initialIssues.others);

  // Execution & Field Details (Module 5)
  const [contractorName, setContractorName] = useState<string>(initialData?.contractor_name || '');
  const [deNamePhone, setDeNamePhone] = useState<string>(initialData?.de_name_phone || '');
  const [oldNewNh, setOldNewNh] = useState<string>(initialData?.old_new_nh || '');
  const [lengthKm, setLengthKm] = useState<string>(
    initialData?.length_km !== undefined && initialData?.length_km !== null
      ? String(initialData.length_km)
      : ''
  );
  const [jobNo, setJobNo] = useState<string>(initialData?.job_no || '');
  const [pmisId, setPmisId] = useState<string>(initialData?.pmis_id || '');
  const [sanctionDate, setSanctionDate] = useState<string>(initialData?.sanction_date || '');
  const [updatedDivisionDate, setUpdatedDivisionDate] = useState<string>(
    initialData?.updated_division_date || ''
  );

  // Column 27 (Module 6): Detailed Stage Status & Technical Execution Remarks
  const [detailedStageStatus, setDetailedStageStatus] = useState<string>(
    initialData?.detailed_stage_status || ''
  );

  // UI status
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper: Write-Once / Freeze-When-Filled check
  // A field is locked ONLY IF it was already populated in initialData AND user is not an admin
  const isFieldLocked = (fieldName: keyof MajorProject): boolean => {
    if (isAdmin) return false;
    if (!initialData?.id) return false; // New entries are never locked
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Progressive entry: Only Name of Work is strictly required to save a record
    if (!nameOfWork.trim()) {
      newErrors.nameOfWork = 'Name of Work is required to save project.';
    }

    if (projectCostCr && (isNaN(Number(projectCostCr)) || Number(projectCostCr) < 0)) {
      newErrors.projectCostCr = 'Project Cost must be a valid non-negative number.';
    }

    if (contractValueCr && (isNaN(Number(contractValueCr)) || Number(contractValueCr) < 0)) {
      newErrors.contractValueCr = 'Contract Value must be a valid non-negative number.';
    }

    if (workStage === 'IN_PROGRESS' || workStage === 'COMPLETED') {
      if (progressPercent !== '') {
        const p = Number(progressPercent);
        if (isNaN(p) || p < 0 || p > 100) {
          newErrors.progressPercent = 'Physical Progress must be between 0% and 100%.';
        }

        // Monotonic check: Cannot decrease unless Admin
        if (!isAdmin && initialData?.progress_percent !== null && initialData?.progress_percent !== undefined) {
          const prevP = Number(initialData.progress_percent);
          if (p < prevP) {
            newErrors.progressPercent = `Monotonic progress rule: Physical progress cannot decrease from previously recorded ${prevP}% (entered ${p}%).`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const payload: Partial<MajorProject> & { isAdmin?: boolean } = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      s_no: Number(sNo) || nextSNo,
      division: division.trim() || 'Chennai',
      scheme: scheme.trim() || 'Annual Plan 2025-26',
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

      // 5 Contract & Milestone Fields
      loa_date: loaDate.trim() || null,
      agreement_date: agreementDate.trim() || null,
      site_handover_date: siteHandoverDate.trim() || null,
      appointed_date: appointedDate.trim() || null,

      // 5 Issues Fields
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
            <Save className="w-4 h-4" /> {loading ? 'Saving Work Entry...' : 'Save Work Record'}
          </button>
        </div>
      </div>

      {/* Validation Diagnostics Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please review the following input validation issues ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 1: Primary Identity & Classification */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-300" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                MODULE 1: Work Identity & Administrative Scope
              </h3>
              <span className="text-xs text-blue-200">
                Sanction serial, administrative division, scheme classification, and work description
              </span>
            </div>
          </div>
          {isFieldLocked('name_of_work') && (
            <span className="text-[11px] flex items-center gap-1 bg-blue-950/60 text-blue-200 px-2.5 py-1 rounded-lg border border-blue-700/50">
              <Lock className="w-3 h-3 text-amber-300" /> Identity Frozen
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Administrative Division</span>
                {isFieldLocked('division') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              {isFieldLocked('division') ? (
                <input
                  type="text"
                  value={division}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <SearchableSelect
                  options={masterDivisions.length > 0 ? masterDivisions : ['Chennai', 'Salem', 'Madurai', 'Coimbatore', 'Tirunelveli']}
                  value={division}
                  onChange={(val) => {
                    setDivision(val);
                    if (errors.division) setErrors((prev) => ({ ...prev, division: '' }));
                  }}
                  placeholder="Select Division..."
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Scheme / Funding Program</span>
                {isFieldLocked('scheme') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              {isFieldLocked('scheme') ? (
                <input
                  type="text"
                  value={scheme}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <SearchableSelect
                  options={masterSchemes.length > 0 ? masterSchemes : ['NH(O)', 'CRIF', 'Annual Plan', 'Special Repairs', 'State Fund']}
                  value={scheme}
                  onChange={(val) => {
                    setScheme(val);
                    if (errors.scheme) setErrors((prev) => ({ ...prev, scheme: '' }));
                  }}
                  placeholder="Select Scheme..."
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Official Name of Work <span className="text-rose-500">*</span></span>
              {isFieldLocked('name_of_work') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
            </label>
            <textarea
              rows={3}
              value={nameOfWork}
              disabled={isFieldLocked('name_of_work')}
              onChange={(e) => {
                setNameOfWork(e.target.value);
                if (errors.nameOfWork) setErrors((prev) => ({ ...prev, nameOfWork: '' }));
              }}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                isFieldLocked('name_of_work')
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
              placeholder="Enter complete sanctioned title of the highway work..."
              required
            />
            {errors.nameOfWork && <p className="text-[11px] text-rose-500 mt-1">{errors.nameOfWork}</p>}
          </div>
        </div>
      </div>

      {/* MODULE 2: Financial Sanctions & Contract Values */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 text-white flex items-center gap-3">
          <IndianRupee className="w-5 h-5 text-emerald-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 2: Financial Sanctions, Contract Outlay & Expenditures
            </h3>
            <span className="text-xs text-emerald-200">
              Sanctioned cost, contract award value, cumulative expenditure, and contract burn rate
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Original Sanction Cost (Rs. Cr)</span>
                {isFieldLocked('project_cost_cr') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={projectCostCr}
                disabled={isFieldLocked('project_cost_cr')}
                onChange={(e) => {
                  setProjectCostCr(e.target.value);
                  if (errors.projectCostCr) setErrors((prev) => ({ ...prev, projectCostCr: '' }));
                }}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('project_cost_cr')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="e.g. 75.50"
              />
              {errors.projectCostCr && <p className="text-[11px] text-rose-500 mt-1">{errors.projectCostCr}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Contract Value (Rs. Cr)</span>
                {isFieldLocked('contract_value_cr') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={contractValueCr}
                disabled={isFieldLocked('contract_value_cr')}
                onChange={(e) => {
                  setContractValueCr(e.target.value);
                  if (errors.contractValueCr) setErrors((prev) => ({ ...prev, contractValueCr: '' }));
                }}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('contract_value_cr')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="e.g. 68.20"
              />
              {errors.contractValueCr && <p className="text-[11px] text-rose-500 mt-1">{errors.contractValueCr}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Revised Cost (Rs. Cr) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={revisedCostCr}
                onChange={(e) => {
                  setRevisedCostCr(e.target.value);
                  const rev = parseFloat(e.target.value) || 0;
                  const tpc = parseFloat(projectCostCr) || 0;
                  if (rev > tpc) {
                    setCostIncreaseRceCr((rev - tpc).toFixed(2));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank if not revised"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Increase in Cost due to RCE (Rs. Cr)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costIncreaseRceCr}
                onChange={(e) => setCostIncreaseRceCr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 12.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expenditure upto Prior FY (Rs. Cr)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenditurePriorCr}
                onChange={(e) => {
                  setExpenditurePriorCr(e.target.value);
                  const prior = parseFloat(e.target.value) || 0;
                  const cur = parseFloat(expenditureCurrentFyCr) || 0;
                  setExpenditureCr((prior + cur).toFixed(2));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 30.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expenditure Current FY (Rs. Cr)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenditureCurrentFyCr}
                onChange={(e) => {
                  setExpenditureCurrentFyCr(e.target.value);
                  const prior = parseFloat(expenditurePriorCr) || 0;
                  const cur = parseFloat(e.target.value) || 0;
                  setExpenditureCr((prior + cur).toFixed(2));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 12.10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cumulative Financial Expenditure (Rs. Cr)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenditureCr}
                onChange={(e) => setExpenditureCr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 42.10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cumulative Expenditure of Contract Value (Rs. Cr)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={contractCumExpenditureCr}
                onChange={(e) => setContractCumExpenditureCr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 39.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {calculatedFinancialPercent !== null && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  Financial Progress (TPC):
                </span>
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 font-mono">
                  {calculatedFinancialPercent}% ({expenditureCr || 0} / {revisedCostCr || projectCostCr} Cr)
                </span>
              </div>
            )}

            {calculatedContractPercent !== null && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                  Contract Value Progress:
                </span>
                <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400 font-mono">
                  {calculatedContractPercent}% ({contractCumExpenditureCr || 0} / {contractValueCr} Cr)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODULE 3: Physical Stage, Completion Targets & Progress Remarks */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-4 text-white flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 3: Physical Stage, Completion Targets & Delay Tracking
            </h3>
            <span className="text-xs text-amber-200">
              Work stage execution state, physical progress percentage, monotonic progress checks, and finish targets
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Work Stage Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  workStage === 'IN_PROGRESS'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="work_stage"
                  checked={workStage === 'IN_PROGRESS'}
                  onChange={() => setWorkStage('IN_PROGRESS')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-xs">In Progress (Execution)</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  workStage === 'TENDER_STAGE'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="work_stage"
                  checked={workStage === 'TENDER_STAGE'}
                  onChange={() => setWorkStage('TENDER_STAGE')}
                  className="w-4 h-4 text-amber-600"
                />
                <span className="text-xs">Tender / Pre-Work Stage</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  workStage === 'COMPLETED'
                    ? 'border-teal-600 bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="work_stage"
                  checked={workStage === 'COMPLETED'}
                  onChange={() => {
                    setWorkStage('COMPLETED');
                    if (progressPercent === '') setProgressPercent('100');
                  }}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Completed Work
                </span>
              </label>
            </div>
          </div>

          {workStage === 'TENDER_STAGE' ? (
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                Pre-Construction / Tender Stage Selected
              </span>
              <p className="text-amber-700 dark:text-amber-400">
                Detailed tender milestone history, estimate scrutiny, and sanction remarks are recorded directly in <strong>MODULE 6: Granular Engineering Milestones &amp; Land Acquisition Log (Col 27)</strong> below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workStage === 'COMPLETED' && (
                <div className="p-4 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Work Completed Stage Selected
                  </span>
                  <p className="text-teal-700 dark:text-teal-400">
                    This project will be archived under the <strong>Completed Works</strong> register and hidden from default active views.
                  </p>
                </div>
              )}

              {/* Physical Completed Lengths (Km) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Length Prior FY (km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={completedLengthPriorKm}
                    onChange={(e) => {
                      setCompletedLengthPriorKm(e.target.value);
                      const prior = parseFloat(e.target.value) || 0;
                      const cur = parseFloat(completedLengthCurrentFyKm) || 0;
                      setTotalCompletedLengthKm((prior + cur).toFixed(3));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="0.000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Length Current FY (km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={completedLengthCurrentFyKm}
                    onChange={(e) => {
                      setCompletedLengthCurrentFyKm(e.target.value);
                      const prior = parseFloat(completedLengthPriorKm) || 0;
                      const cur = parseFloat(e.target.value) || 0;
                      setTotalCompletedLengthKm((prior + cur).toFixed(3));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="0.000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Completed Length (km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={totalCompletedLengthKm}
                    onChange={(e) => setTotalCompletedLengthKm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="0.000"
                  />
                </div>
              </div>

              {/* Progress & Target Completion Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Physical Progress (%)</span>
                    {initialData?.progress_percent !== undefined && initialData?.progress_percent !== null && (
                      <span className="text-[11px] font-normal text-slate-400">
                        Prior: {initialData.progress_percent}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={progressPercent}
                    onChange={(e) => {
                      setProgressPercent(e.target.value);
                      if (errors.progressPercent) setErrors((prev) => ({ ...prev, progressPercent: '' }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g. 68.5"
                  />
                  {errors.progressPercent && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.progressPercent}</p>
                  )}
                </div>

                <div>
                  <DatePickerInput
                    label="Likely Date of Completion"
                    value={likelyCompletionDate}
                    onChange={setLikelyCompletionDate}
                  />
                </div>

                <div>
                  <DatePickerInput
                    label="Probable / Actual Completion Date"
                    value={probableCompletionDate}
                    onChange={setProbableCompletionDate}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Scheduled Completion (Baseline)
                    </span>
                    {isFieldLocked('scheduled_completion_date') && (
                      <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>
                    )}
                  </div>
                  {isFieldLocked('scheduled_completion_date') ? (
                    <input
                      type="text"
                      value={scheduledCompletionDate}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed font-mono"
                    />
                  ) : (
                    <DatePickerInput
                      label=""
                      value={scheduledCompletionDate}
                      onChange={setScheduledCompletionDate}
                    />
                  )}
                </div>
              </div>

              {/* EOT & Scope Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    EOT Granted Till
                  </label>
                  <input
                    type="text"
                    value={eotGrantedTill}
                    onChange={(e) => setEotGrantedTill(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 31.12.2026 or Under Review"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Further EOT Proposal with Agency
                  </label>
                  <input
                    type="text"
                    value={eotProposalAgency}
                    onChange={(e) => setEotProposalAgency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Recommended for 6 months by CE"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    COS (Change of Scope) Details
                  </label>
                  <input
                    type="text"
                    value={cosDetails}
                    onChange={(e) => setCosDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Additional 2-lane service road approved"
                  />
                </div>
              </div>

              {computedDelay && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Timeline Status:
                  </span>
                  <span
                    className={`font-extrabold ${
                      computedDelay.isDelayed
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {computedDelay.humanText}
                  </span>
                </div>
              )}

              {/* Dedicated Physical Progress Remarks */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Progress Remarks
                </label>
                <textarea
                  rows={3}
                  value={progressRemarks}
                  onChange={(e) => setProgressRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Active pier erection, deck slab casting in progress, or physical milestone update..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODULE 4: Clearance Bottlenecks & Issues (5 Dedicated Fields) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4 text-white flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 4: Critical Bottlenecks & Clearance Issues (Section 4)
            </h3>
            <span className="text-xs text-red-200">
              Departmental issue registers across Land Acquisition, Forest, Utility, Railways, and General Remarks
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                1. Land Acquisition Issues &amp; Status
              </label>
              <textarea
                rows={2}
                value={issueLand}
                onChange={(e) => setIssueLand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Status of 3(A), 3(D), 3(G) LA awards, compensation disbursement, or court stays..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                2. Forest &amp; Environmental Clearance
              </label>
              <textarea
                rows={2}
                value={issueForest}
                onChange={(e) => setIssueForest(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Stage-I / Stage-II forest clearance, wildlife sanctuary eco-sensitive approvals..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                3. Utility Shifting (EB / Water / OFC)
              </label>
              <textarea
                rows={2}
                value={issueUtility}
                onChange={(e) => setIssueUtility(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TANGEDCO pole/line shifting, TWAD water pipeline relocation, payment of demand notices..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                4. Railways (ROB / RUB / GAD Clearances)
              </label>
              <textarea
                rows={2}
                value={issueRailways}
                onChange={(e) => setIssueRailways(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Southern Railway GAD approvals, CRS inspection, traffic block permissions..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              5. Other Inter-Departmental &amp; General Remarks
            </label>
            <textarea
              rows={2}
              value={issueOthers}
              onChange={(e) => setIssueOthers(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Court litigation, contractor slow progress notice, weather constraints, or other key remarks..."
            />
          </div>
        </div>
      </div>

      {/* MODULE 5: Technical Details, Contract Milestones & Personnel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-750 px-6 py-4 text-white flex items-center gap-3">
          <HardHat className="w-5 h-5 text-slate-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 5: Contract Milestones, Identifiers &amp; Site Management
            </h3>
            <span className="text-xs text-slate-300">
              Contract milestones (LOA, Agreement, Handover, Appointed Date), contractor details, and identifiers
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contractor Name / Agency
              </label>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. M/s ABC Infra Ltd"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                DE Name &amp; Contact
              </label>
              <input
                type="text"
                value={deNamePhone}
                onChange={(e) => setDeNamePhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Er. K. Sharma (9443xxxxxx)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Old / New NH No</span>
                {isFieldLocked('old_new_nh') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              <input
                type="text"
                value={oldNewNh}
                disabled={isFieldLocked('old_new_nh')}
                onChange={(e) => setOldNewNh(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('old_new_nh')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="e.g. NH-44 / NH-7"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Length (Km)</span>
                {isFieldLocked('length_km') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={lengthKm}
                disabled={isFieldLocked('length_km')}
                onChange={(e) => setLengthKm(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('length_km')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="e.g. 14.500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>PMIS Work ID</span>
                {isFieldLocked('pmis_id') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              <input
                type="text"
                value={pmisId}
                disabled={isFieldLocked('pmis_id')}
                onChange={(e) => setPmisId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('pmis_id')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="e.g. TN2023001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>MoRTH Job Number</span>
                {isFieldLocked('job_no') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </label>
              <input
                type="text"
                value={jobNo}
                disabled={isFieldLocked('job_no')}
                onChange={(e) => setJobNo(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldLocked('job_no')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
                placeholder="e.g. 044-TN-2023-45"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sanction Date</span>
                {isFieldLocked('sanction_date') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </div>
              {isFieldLocked('sanction_date') ? (
                <input
                  type="text"
                  value={sanctionDate}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <DatePickerInput
                  label=""
                  value={sanctionDate}
                  onChange={setSanctionDate}
                />
              )}
            </div>
          </div>

          {/* 4 Contract Execution Milestones (LOA, Agreement, Handover, Appointed Date) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of LOA</span>
                {isFieldLocked('loa_date') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </div>
              {isFieldLocked('loa_date') ? (
                <input
                  type="text"
                  value={loaDate}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <DatePickerInput
                  label=""
                  value={loaDate}
                  onChange={setLoaDate}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Agreement</span>
                {isFieldLocked('agreement_date') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </div>
              {isFieldLocked('agreement_date') ? (
                <input
                  type="text"
                  value={agreementDate}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <DatePickerInput
                  label=""
                  value={agreementDate}
                  onChange={setAgreementDate}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Site Handover</span>
                {isFieldLocked('site_handover_date') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </div>
              {isFieldLocked('site_handover_date') ? (
                <input
                  type="text"
                  value={siteHandoverDate}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <DatePickerInput
                  label=""
                  value={siteHandoverDate}
                  onChange={setSiteHandoverDate}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Appointed / Start Date</span>
                {isFieldLocked('appointed_date') && <span title="Frozen field"><Lock className="w-3 h-3 text-amber-500" /></span>}
              </div>
              {isFieldLocked('appointed_date') ? (
                <input
                  type="text"
                  value={appointedDate}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <DatePickerInput
                  label=""
                  value={appointedDate}
                  onChange={setAppointedDate}
                />
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Updated Division &amp; Date Reference
            </label>
            <input
              type="text"
              value={updatedDivisionDate}
              onChange={(e) => setUpdatedDivisionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Vellore / 15.03.2026"
            />
          </div>
        </div>
      </div>

      {/* MODULE 6: Granular Engineering Milestones & Land Acquisition Log (Col 27 / Col AC) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-4 text-white flex items-center gap-3">
          <FileText className="w-5 h-5 text-amber-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 6: Granular Engineering Milestones &amp; Land Acquisition Log (Col 27 / Col AC)
            </h3>
            <span className="text-xs text-amber-200">
              Detailed structural progress, pier/deck casting log, GAD approvals, 3A/3D gazettes, and historical site notes
            </span>
          </div>
        </div>

        <div className="p-6">
          <textarea
            rows={6}
            value={detailedStageStatus}
            onChange={(e) => setDetailedStageStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono min-h-[140px]"
            placeholder="Granular site progress log, structural milestones, piers/slabs casted, earthwork/pavement status, or pre-construction tender stage remarks..."
          />
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel &amp; Return
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Work Record...' : 'Save Complete Work Entry'}
        </button>
      </div>
    </form>
  );
};

export default OngoingWorkEntryForm;
