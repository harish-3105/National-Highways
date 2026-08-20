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
  CheckCircle2,
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { calculateProjectDelay } from '@/lib/formatters';

interface OngoingWorkEntryFormProps {
  initialData?: Partial<MajorProject>;
  nextSNo?: number;
  masterDivisions?: string[];
  masterSchemes?: string[];
  onSave: (projectData: Partial<MajorProject>) => Promise<void> | void;
  onCancel: () => void;
}

export const OngoingWorkEntryForm: React.FC<OngoingWorkEntryFormProps> = ({
  initialData,
  nextSNo = 1,
  masterDivisions = [],
  masterSchemes = [],
  onSave,
  onCancel,
}) => {
  // Parse any existing issues from stage_remarks / detailed_stage_status if stored as JSON or text
  const initialIssues = useMemo(() => {
    let land = '';
    let forest = '';
    let utility = '';
    let railways = '';
    let others = '';

    const text = initialData?.stage_remarks || initialData?.detailed_stage_status || '';
    if (text) {
      const landMatch = text.match(/Land Acquisition:?\s*([^\n;]+)/i);
      const forestMatch = text.match(/Forest:?\s*([^\n;]+)/i);
      const utilityMatch = text.match(/Utility:?\s*([^\n;]+)/i);
      const railMatch = text.match(/Railways:?\s*([^\n;]+)/i);
      const othersMatch = text.match(/Others:?\s*([^\n;]+)/i);

      if (landMatch) land = landMatch[1].trim();
      if (forestMatch) forest = forestMatch[1].trim();
      if (utilityMatch) utility = utilityMatch[1].trim();
      if (railMatch) railways = railMatch[1].trim();
      if (othersMatch) others = othersMatch[1].trim();

      if (!land && !forest && !utility && !railways && !others) {
        others = text;
      }
    }

    return { land, forest, utility, railways, others };
  }, [initialData]);

  // Form states
  const [sNo, setSNo] = useState<string>(String(initialData?.s_no || nextSNo));
  const [division, setDivision] = useState<string>(initialData?.division || '');
  const [scheme, setScheme] = useState<string>(initialData?.scheme || '');
  const [nameOfWork, setNameOfWork] = useState<string>(initialData?.name_of_work || '');

  // Financial
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
  const [expenditureCr, setExpenditureCr] = useState<string>(
    initialData?.cumm_financial_expenditure_cr !== undefined &&
      initialData?.cumm_financial_expenditure_cr !== null
      ? String(initialData.cumm_financial_expenditure_cr)
      : ''
  );

  // Physical Progress & Stage
  const [workStage, setWorkStage] = useState<'IN_PROGRESS' | 'TENDER_STAGE'>(
    initialData?.work_stage === 'TENDER_STAGE' ? 'TENDER_STAGE' : 'IN_PROGRESS'
  );
  const [progressPercent, setProgressPercent] = useState<string>(
    initialData?.progress_percent !== undefined && initialData?.progress_percent !== null
      ? String(initialData.progress_percent)
      : ''
  );
  const [probableCompletionDate, setProbableCompletionDate] = useState<string>(
    initialData?.probable_completion_date || ''
  );
  const [scheduledCompletionDate, setScheduledCompletionDate] = useState<string>(
    initialData?.scheduled_completion_date || ''
  );

  // 5 Issues Fields (Client Specification)
  const [issueLand, setIssueLand] = useState<string>(initialIssues.land);
  const [issueForest, setIssueForest] = useState<string>(initialIssues.forest);
  const [issueUtility, setIssueUtility] = useState<string>(initialIssues.utility);
  const [issueRailways, setIssueRailways] = useState<string>(initialIssues.railways);
  const [issueOthers, setIssueOthers] = useState<string>(initialIssues.others);

  // Execution & Field Details
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
  const [appointedDate, setAppointedDate] = useState<string>(initialData?.appointed_date || '');

  // UI status
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Computed Financial %
  const calculatedFinancialPercent = useMemo(() => {
    const cost = parseFloat(revisedCostCr) || parseFloat(projectCostCr);
    const exp = parseFloat(expenditureCr);
    if (cost > 0 && exp >= 0) {
      return Math.min(100, Math.round((exp / cost) * 100 * 10) / 10);
    }
    return null;
  }, [projectCostCr, revisedCostCr, expenditureCr]);

  // Computed Delay
  const computedDelay = useMemo(() => {
    if (workStage !== 'IN_PROGRESS' || !scheduledCompletionDate) return null;
    return calculateProjectDelay(
      scheduledCompletionDate,
      probableCompletionDate,
      progressPercent ? Number(progressPercent) : 0
    );
  }, [workStage, scheduledCompletionDate, probableCompletionDate, progressPercent]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!division.trim()) newErrors.division = 'Administrative Division is required.';
    if (!scheme.trim()) newErrors.scheme = 'Scheme / Program is required.';
    if (!nameOfWork.trim()) newErrors.nameOfWork = 'Name of Work is required.';
    if (!projectCostCr || isNaN(Number(projectCostCr)) || Number(projectCostCr) <= 0) {
      newErrors.projectCostCr = 'Valid Total Project Cost (Rs. Cr) is required.';
    }

    if (workStage === 'IN_PROGRESS') {
      if (progressPercent !== '') {
        const p = Number(progressPercent);
        if (isNaN(p) || p < 0 || p > 100) {
          newErrors.progressPercent = 'Physical Progress must be between 0% and 100%.';
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

    // Format consolidated issues remarks string
    const issueParts: string[] = [];
    if (issueLand.trim()) issueParts.push(`Land Acquisition: ${issueLand.trim()}`);
    if (issueForest.trim()) issueParts.push(`Forest: ${issueForest.trim()}`);
    if (issueUtility.trim()) issueParts.push(`Utility: ${issueUtility.trim()}`);
    if (issueRailways.trim()) issueParts.push(`Railways: ${issueRailways.trim()}`);
    if (issueOthers.trim()) issueParts.push(`Others: ${issueOthers.trim()}`);
    const consolidatedIssues = issueParts.join(' | ');

    const payload: Partial<MajorProject> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      s_no: Number(sNo) || nextSNo,
      division: division.trim(),
      scheme: scheme.trim(),
      name_of_work: nameOfWork.trim(),
      project_cost_cr: Number(projectCostCr),
      revised_cost_cr: revisedCostCr ? Number(revisedCostCr) : null,
      cumm_financial_expenditure_cr: expenditureCr ? Number(expenditureCr) : null,
      work_stage: workStage,
      progress_percent:
        workStage === 'IN_PROGRESS' && progressPercent !== '' ? Number(progressPercent) : null,
      probable_completion_date:
        workStage === 'IN_PROGRESS' && probableCompletionDate ? probableCompletionDate.trim() : null,
      scheduled_completion_date: scheduledCompletionDate ? scheduledCompletionDate.trim() : null,
      stage_remarks: consolidatedIssues || null,
      detailed_stage_status: consolidatedIssues || null,
      contractor_name: contractorName.trim() || null,
      de_name_phone: deNamePhone.trim() || null,
      old_new_nh: oldNewNh.trim() || null,
      length_km: lengthKm ? Number(lengthKm) : null,
      job_no: jobNo.trim() || null,
      pmis_id: pmisId.trim() || null,
      sanction_date: sanctionDate.trim() || null,
      appointed_date: appointedDate.trim() || null,
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Ongoing Highway Work Record' : 'New Capital Highway Work Entry'}
            </h2>
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

      {/* MODULE 1: Primary Identity & Classification */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center gap-3">
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

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                S.No <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={sNo}
                onChange={(e) => setSNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Serial No"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Administrative Division <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={masterDivisions.length > 0 ? masterDivisions : ['Chennai', 'Salem', 'Madurai', 'Coimbatore', 'Tirunelveli']}
                value={division}
                onChange={(val) => {
                  setDivision(val);
                  if (errors.division) setErrors((prev) => ({ ...prev, division: '' }));
                }}
                placeholder="Select Division..."
                required
              />
              {errors.division && <p className="text-[11px] text-rose-500 mt-1">{errors.division}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scheme / Funding Program <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={masterSchemes.length > 0 ? masterSchemes : ['NH(O)', 'CRIF', 'Annual Plan', 'Special Repairs', 'State Fund']}
                value={scheme}
                onChange={(val) => {
                  setScheme(val);
                  if (errors.scheme) setErrors((prev) => ({ ...prev, scheme: '' }));
                }}
                placeholder="Select Scheme..."
                required
              />
              {errors.scheme && <p className="text-[11px] text-rose-500 mt-1">{errors.scheme}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Official Name of Work <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={nameOfWork}
              onChange={(e) => {
                setNameOfWork(e.target.value);
                if (errors.nameOfWork) setErrors((prev) => ({ ...prev, nameOfWork: '' }));
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter complete sanctioned title of the highway work..."
              required
            />
            {errors.nameOfWork && <p className="text-[11px] text-rose-500 mt-1">{errors.nameOfWork}</p>}
          </div>
        </div>
      </div>

      {/* MODULE 2: Financial Sanction & Cost Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 text-white flex items-center gap-3">
          <IndianRupee className="w-5 h-5 text-emerald-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 2: Financial Sanctions & Expenditure Incurred
            </h3>
            <span className="text-xs text-emerald-200">
              Sanctioned outlay, revised costs, cumulative expenditure, and financial burn rate
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Original Sanction Cost (Rs. Cr) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={projectCostCr}
                onChange={(e) => {
                  setProjectCostCr(e.target.value);
                  if (errors.projectCostCr) setErrors((prev) => ({ ...prev, projectCostCr: '' }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 75.50"
                required
              />
              {errors.projectCostCr && <p className="text-[11px] text-rose-500 mt-1">{errors.projectCostCr}</p>}
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
                onChange={(e) => setRevisedCostCr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank if not revised"
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
          </div>

          {calculatedFinancialPercent !== null && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Calculated Financial Progress:
              </span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                {calculatedFinancialPercent}% ({expenditureCr || 0} / {revisedCostCr || projectCostCr} Cr)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MODULE 3: Physical Stage & Milestone Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-4 text-white flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 3: Physical Stage, Completion Targets & Delay Tracking
            </h3>
            <span className="text-xs text-amber-200">
              Work stage execution state, physical progress percentage, and targeted finish dates
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Work Stage Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  workStage === 'IN_PROGRESS'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold'
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
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
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
            </div>
          </div>

          {workStage === 'IN_PROGRESS' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Progress (%)
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 68.5"
                />
                {errors.progressPercent && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.progressPercent}</p>
                )}
              </div>

              <div>
                <DatePickerInput
                  label="Probable / Revised Completion Date"
                  value={probableCompletionDate}
                  onChange={setProbableCompletionDate}
                />
              </div>

              <div>
                <DatePickerInput
                  label="Scheduled Agreement Completion Date"
                  value={scheduledCompletionDate}
                  onChange={setScheduledCompletionDate}
                />
              </div>
            </div>
          )}

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
        </div>
      </div>

      {/* MODULE 4: Clearance Bottlenecks & Issues (Client Specification) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4 text-white flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 4: Critical Bottlenecks & Clearance Issues
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
                1. Land Acquisition Issues
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
                2. Forest & Environmental Clearance
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
              5. Other Inter-Departmental & General Remarks
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

      {/* MODULE 5: Technical Details & Site Personnel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-750 px-6 py-4 text-white flex items-center gap-3">
          <HardHat className="w-5 h-5 text-slate-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 5: Technical Identifiers & Site Management
            </h3>
            <span className="text-xs text-slate-300">
              Contractor identity, Divisional Engineer contact, Job No, PMIS ID, and milestone dates
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
                DE Name & Contact
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Old / New NH No
              </label>
              <input
                type="text"
                value={oldNewNh}
                onChange={(e) => setOldNewNh(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. NH-44 / NH-7"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Length (Km)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={lengthKm}
                onChange={(e) => setLengthKm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 14.500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                PMIS Work ID
              </label>
              <input
                type="text"
                value={pmisId}
                onChange={(e) => setPmisId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. TN2023001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                MoRTH Job Number
              </label>
              <input
                type="text"
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 044-TN-2023-45"
              />
            </div>

            <div>
              <DatePickerInput
                label="Sanction Date"
                value={sanctionDate}
                onChange={setSanctionDate}
              />
            </div>

            <div>
              <DatePickerInput
                label="Appointed / Start Date"
                value={appointedDate}
                onChange={setAppointedDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
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
