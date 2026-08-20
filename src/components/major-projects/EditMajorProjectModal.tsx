'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  AlertCircle,
  IndianRupee,
  Building2,
  Calendar,
  Layers,
  Clock,
  User,
  HardHat,
  FileText,
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface EditMajorProjectModalProps {
  project: MajorProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterDivisions?: string[];
  masterSchemes?: string[];
}

type EditTab = 'general' | 'technical' | 'physical' | 'financial' | 'timeline' | 'issues' | 'personnel_notes';

export const EditMajorProjectModal: React.FC<EditMajorProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onSuccess,
  masterDivisions = [],
  masterSchemes = [],
}) => {
  const [activeTab, setActiveTab] = useState<EditTab>('general');

  // Core Level 1 fields
  const [sNo, setSNo] = useState<string>('1');
  const [division, setDivision] = useState<string>('Vellore');
  const [scheme, setScheme] = useState<string>('');
  const [nameOfWork, setNameOfWork] = useState<string>('');
  const [projectCostCr, setProjectCostCr] = useState<string>('');
  const [workStage, setWorkStage] = useState<'IN_PROGRESS' | 'TENDER_STAGE'>('IN_PROGRESS');
  const [progressPercent, setProgressPercent] = useState<string>('');
  const [probableCompletionDate, setProbableCompletionDate] = useState<string>('');
  const [stageRemarks, setStageRemarks] = useState<string>('');

  // Level 2 27-Column fields
  const [pmisId, setPmisId] = useState<string>('');
  const [oldNewNh, setOldNewNh] = useState<string>('');
  const [lengthKm, setLengthKm] = useState<string>('');
  const [jobNo, setJobNo] = useState<string>('');
  const [sanctionDate, setSanctionDate] = useState<string>('');
  const [appointedDate, setAppointedDate] = useState<string>('');
  const [scheduledCompletionDate, setScheduledCompletionDate] = useState<string>('');

  const [completedLengthPriorKm, setCompletedLengthPriorKm] = useState<string>('');
  const [completedLengthCurrentFyKm, setCompletedLengthCurrentFyKm] = useState<string>('');
  const [totalCompletedLengthKm, setTotalCompletedLengthKm] = useState<string>('');

  const [revisedCostCr, setRevisedCostCr] = useState<string>('');
  const [costIncreaseRceCr, setCostIncreaseRceCr] = useState<string>('');
  const [expenditurePriorCr, setExpenditurePriorCr] = useState<string>('');
  const [expenditureCurrentFyCr, setExpenditureCurrentFyCr] = useState<string>('');
  const [cummFinancialExpenditureCr, setCummFinancialExpenditureCr] = useState<string>('');

  const [likelyCompletionDate, setLikelyCompletionDate] = useState<string>('');
  const [timeOverrunYears, setTimeOverrunYears] = useState<string>('');
  const [eotGrantedTill, setEotGrantedTill] = useState<string>('');
  const [eotProposalAgency, setEotProposalAgency] = useState<string>('');
  const [cosDetails, setCosDetails] = useState<string>('');

  // 5 Clearance Bottlenecks & Issues (Clean Defaults)
  const [issueLand, setIssueLand] = useState<string>('');
  const [issueForest, setIssueForest] = useState<string>('');
  const [issueUtility, setIssueUtility] = useState<string>('');
  const [issueRailways, setIssueRailways] = useState<string>('');
  const [issueOthers, setIssueOthers] = useState<string>('');

  const [deNamePhone, setDeNamePhone] = useState<string>('');
  const [contractorName, setContractorName] = useState<string>('');
  const [updatedDivisionDate, setUpdatedDivisionDate] = useState<string>('');
  const [detailedStageStatus, setDetailedStageStatus] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (project) {
      setSNo(String(project.s_no || '1'));
      setDivision(project.division || (masterDivisions[0] || 'Vellore'));
      setScheme(project.scheme || '');
      setNameOfWork(project.name_of_work || '');
      setProjectCostCr(project.project_cost_cr !== undefined && project.project_cost_cr !== null ? String(project.project_cost_cr) : '');
      setWorkStage(project.work_stage || 'IN_PROGRESS');
      setProgressPercent(project.progress_percent !== undefined && project.progress_percent !== null ? String(project.progress_percent) : '');
      setProbableCompletionDate(project.probable_completion_date || '');
      setStageRemarks(project.stage_remarks || '');

      setPmisId(project.pmis_id || '');
      setOldNewNh(project.old_new_nh || '');
      setLengthKm(project.length_km !== undefined && project.length_km !== null ? String(project.length_km) : '');
      setJobNo(project.job_no || '');
      setSanctionDate(project.sanction_date || '');
      setAppointedDate(project.appointed_date || '');
      setScheduledCompletionDate(project.scheduled_completion_date || '');

      setCompletedLengthPriorKm(project.completed_length_prior_km !== undefined && project.completed_length_prior_km !== null ? String(project.completed_length_prior_km) : '');
      setCompletedLengthCurrentFyKm(project.completed_length_current_fy_km !== undefined && project.completed_length_current_fy_km !== null ? String(project.completed_length_current_fy_km) : '');
      setTotalCompletedLengthKm(project.total_completed_length_km !== undefined && project.total_completed_length_km !== null ? String(project.total_completed_length_km) : '');

      setRevisedCostCr(project.revised_cost_cr !== undefined && project.revised_cost_cr !== null ? String(project.revised_cost_cr) : '');
      setCostIncreaseRceCr(project.cost_increase_rce_cr !== undefined && project.cost_increase_rce_cr !== null ? String(project.cost_increase_rce_cr) : '');
      setExpenditurePriorCr(project.expenditure_prior_cr !== undefined && project.expenditure_prior_cr !== null ? String(project.expenditure_prior_cr) : '');
      setExpenditureCurrentFyCr(project.expenditure_current_fy_cr !== undefined && project.expenditure_current_fy_cr !== null ? String(project.expenditure_current_fy_cr) : '');
      setCummFinancialExpenditureCr(project.cumm_financial_expenditure_cr !== undefined && project.cumm_financial_expenditure_cr !== null ? String(project.cumm_financial_expenditure_cr) : '');

      setLikelyCompletionDate(project.likely_completion_date || '');
      setTimeOverrunYears(project.time_overrun_years !== undefined && project.time_overrun_years !== null ? String(project.time_overrun_years) : '');
      setEotGrantedTill(project.eot_granted_till || '');
      setEotProposalAgency(project.eot_proposal_agency || '');
      setCosDetails(project.cos_details || '');

      // Load issues directly from project fields (empty if unset, never populating from detailed_stage_status)
      setIssueLand(project.issue_land || '');
      setIssueForest(project.issue_forest || '');
      setIssueUtility(project.issue_utility || '');
      setIssueRailways(project.issue_railways || '');
      setIssueOthers(project.issue_others || '');

      setDeNamePhone(project.de_name_phone || '');
      setContractorName(project.contractor_name || '');
      setUpdatedDivisionDate(project.updated_division_date || '');
      setDetailedStageStatus(project.detailed_stage_status || '');

      setError('');
    }
  }, [project, masterDivisions]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOfWork.trim() || !division.trim() || !scheme.trim()) {
      setError('Please provide Name of Work, Division, and Scheme.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        id: project.id,
        s_no: Number(sNo) || 1,
        division: division.trim(),
        scheme: scheme.trim(),
        name_of_work: nameOfWork.trim(),
        project_cost_cr: Number(projectCostCr) || 0,
        work_stage: workStage,
        progress_percent: workStage === 'TENDER_STAGE' ? null : progressPercent !== '' ? Number(progressPercent) : null,
        probable_completion_date: workStage === 'TENDER_STAGE' ? null : probableCompletionDate.trim() || null,
        stage_remarks: stageRemarks.trim() || null,

        // 27-Column parameters
        pmis_id: pmisId.trim() || null,
        old_new_nh: oldNewNh.trim() || null,
        length_km: lengthKm !== '' ? Number(lengthKm) : null,
        job_no: jobNo.trim() || null,
        sanction_date: sanctionDate.trim() || null,
        appointed_date: appointedDate.trim() || null,
        scheduled_completion_date: scheduledCompletionDate.trim() || null,

        completed_length_prior_km: completedLengthPriorKm !== '' ? Number(completedLengthPriorKm) : null,
        completed_length_current_fy_km: completedLengthCurrentFyKm !== '' ? Number(completedLengthCurrentFyKm) : null,
        total_completed_length_km: totalCompletedLengthKm !== '' ? Number(totalCompletedLengthKm) : null,

        revised_cost_cr: revisedCostCr !== '' ? Number(revisedCostCr) : null,
        cost_increase_rce_cr: costIncreaseRceCr !== '' ? Number(costIncreaseRceCr) : null,
        expenditure_prior_cr: expenditurePriorCr !== '' ? Number(expenditurePriorCr) : null,
        expenditure_current_fy_cr: expenditureCurrentFyCr !== '' ? Number(expenditureCurrentFyCr) : null,
        cumm_financial_expenditure_cr: cummFinancialExpenditureCr !== '' ? Number(cummFinancialExpenditureCr) : null,

        likely_completion_date: likelyCompletionDate.trim() || null,
        time_overrun_years: timeOverrunYears !== '' ? Number(timeOverrunYears) : null,
        eot_granted_till: eotGrantedTill.trim() || null,
        eot_proposal_agency: eotProposalAgency.trim() || null,
        cos_details: cosDetails.trim() || null,

        de_name_phone: deNamePhone.trim() || null,
        contractor_name: contractorName.trim() || null,
        updated_division_date: updatedDivisionDate.trim() || null,
        detailed_stage_status: detailedStageStatus.trim() || null,

        issue_land: issueLand.trim() || null,
        issue_forest: issueForest.trim() || null,
        issue_utility: issueUtility.trim() || null,
        issue_railways: issueRailways.trim() || null,
        issue_others: issueOthers.trim() || null,
      };

      const res = await fetch('/api/major-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update ongoing work.');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs shadow-2xl w-full max-w-5xl lg:max-w-6xl h-[92vh] max-h-[95vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Ongoing Work (27-Column Deep Data)
              </h2>
              <p className="text-xs text-slate-500">
                Update technical specifications, physical progress, financials, delays & civil stages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto bg-slate-50/30 dark:bg-slate-800/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📋 General Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'technical'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🏷️ Sanction & IDs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('physical')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'physical'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🛣️ Physical Progress
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            💰 Financials & RCE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⏱️ Timelines & EOT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'issues'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚠️ Clearance Issues (5 Fields)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personnel_notes')}
            className={`px-3 py-2 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'personnel_notes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            👷 Personnel & Notes (Col 27)
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 text-xs">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: GENERAL OVERVIEW */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    S. No.
                  </label>
                  <input
                    type="number"
                    value={sNo}
                    onChange={(e) => setSNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Division <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={masterDivisions.length > 0 ? masterDivisions : ['Chennai', 'Salem', 'Madurai', 'Coimbatore', 'Tirunelveli']}
                    value={division}
                    onChange={setDivision}
                    placeholder="Select Division..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheme <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={masterSchemes.length > 0 ? masterSchemes : ['NH(O)', 'CRIF', 'Annual Plan', 'Special Repairs', 'State Fund']}
                    value={scheme}
                    onChange={setScheme}
                    placeholder="Select Scheme..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Work / Project Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={nameOfWork}
                  onChange={(e) => setNameOfWork(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Project Cost (₹ in Cr.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={projectCostCr}
                    onChange={(e) => setProjectCostCr(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Execution Stage
                  </label>
                  <SearchableSelect
                    options={['In Progress (Execution Stage)', 'Tender / Sanction Stage']}
                    value={workStage === 'IN_PROGRESS' ? 'In Progress (Execution Stage)' : 'Tender / Sanction Stage'}
                    onChange={(val) => setWorkStage(val.includes('Tender') ? 'TENDER_STAGE' : 'IN_PROGRESS')}
                    placeholder="Select Stage..."
                  />
                </div>
              </div>

              {workStage === 'IN_PROGRESS' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Physical Progress (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 75"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Probable Date of Completion
                    </label>
                    <input
                      type="text"
                      value={probableCompletionDate}
                      onChange={(e) => setProbableCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 20-02-2027"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tender Stage & Sanction Status Remarks
                  </label>
                  <textarea
                    value={stageRemarks}
                    onChange={(e) => setStageRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tender milestone, bid opening, LOA, or estimate scrutiny details..."
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TECHNICAL & IDENTIFICATION */}
          {activeTab === 'technical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PMIS / OCMS / PMG ID
                  </label>
                  <input
                    type="text"
                    value={pmisId}
                    onChange={(e) => setPmisId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 151517"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Old NH / New NH No.
                  </label>
                  <input
                    type="text"
                    value={oldNewNh}
                    onChange={(e) => setOldNewNh(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="e.g. 234/75"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Length in Km
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={lengthKm}
                    onChange={(e) => setLengthKm(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 1.104"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Job Number
                  </label>
                  <input
                    type="text"
                    value={jobNo}
                    onChange={(e) => setJobNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. NH-234-NH-2020-21-944"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Sanction / Revision
                  </label>
                  <input
                    type="text"
                    value={sanctionDate}
                    onChange={(e) => setSanctionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 17-09-2020"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Start / Appointed Date
                  </label>
                  <input
                    type="text"
                    value={appointedDate}
                    onChange={(e) => setAppointedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 29-10-2021"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Date of Completion
                  </label>
                  <input
                    type="text"
                    value={scheduledCompletionDate}
                    onChange={(e) => setScheduledCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 19-02-2025"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHYSICAL PROGRESS */}
          {activeTab === 'physical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Length till 31.03.2026 (km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={completedLengthPriorKm}
                    onChange={(e) => {
                      setCompletedLengthPriorKm(e.target.value);
                      const prior = Number(e.target.value) || 0;
                      const cur = Number(completedLengthCurrentFyKm) || 0;
                      setTotalCompletedLengthKm(String(prior + cur));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Length in 2026-27 (km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={completedLengthCurrentFyKm}
                    onChange={(e) => {
                      setCompletedLengthCurrentFyKm(e.target.value);
                      const prior = Number(completedLengthPriorKm) || 0;
                      const cur = Number(e.target.value) || 0;
                      setTotalCompletedLengthKm(String(prior + cur));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Completed Length (km)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={totalCompletedLengthKm}
                    onChange={(e) => setTotalCompletedLengthKm(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Overall Physical Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    placeholder="e.g. 68.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Probable Date of Completion
                  </label>
                  <input
                    type="text"
                    value={probableCompletionDate}
                    onChange={(e) => setProbableCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="e.g. 31.03.2027"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {workStage === 'TENDER_STAGE'
                    ? 'Tender Stage Status & Pre-Construction Milestone Details'
                    : 'Physical Progress & Work Stage Remarks'}
                </label>
                <textarea
                  rows={3}
                  value={stageRemarks}
                  onChange={(e) => setStageRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed"
                  placeholder={
                    workStage === 'TENDER_STAGE'
                      ? 'e.g. Tender invited by MoRTH HQ on 30.07.2026. Bid due date: 15.09.2026, technical evaluation, or LOA issued...'
                      : 'e.g. Bridge substructure 80% complete, carriageway DBM in progress, or milestone update...'
                  }
                />
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS & RCE */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Revised Cost / Anticipated Cost (₹ in Cr.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={revisedCostCr}
                    onChange={(e) => {
                      setRevisedCostCr(e.target.value);
                      const rev = Number(e.target.value) || 0;
                      const tpc = Number(projectCostCr) || 0;
                      if (rev > tpc) {
                        setCostIncreaseRceCr((rev - tpc).toFixed(2));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 118.94"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Increase in Cost due to RCE (₹ in Cr.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costIncreaseRceCr}
                    onChange={(e) => setCostIncreaseRceCr(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                    placeholder="e.g. 20.39"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expenditure upto 31.03.2026 (₹ Cr.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenditurePriorCr}
                    onChange={(e) => {
                      setExpenditurePriorCr(e.target.value);
                      const prior = Number(e.target.value) || 0;
                      const cur = Number(expenditureCurrentFyCr) || 0;
                      setCummFinancialExpenditureCr((prior + cur).toFixed(2));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expenditure in 2026-27 (₹ Cr.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenditureCurrentFyCr}
                    onChange={(e) => {
                      setExpenditureCurrentFyCr(e.target.value);
                      const prior = Number(expenditurePriorCr) || 0;
                      const cur = Number(e.target.value) || 0;
                      setCummFinancialExpenditureCr((prior + cur).toFixed(2));
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cumulative Financial Progress (₹ Cr.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cummFinancialExpenditureCr}
                    onChange={(e) => setCummFinancialExpenditureCr(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINES & EOT */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Likely / Actual Date of Completion
                  </label>
                  <input
                    type="text"
                    value={likelyCompletionDate}
                    onChange={(e) => setLikelyCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                    placeholder="e.g. 20-02-2027"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time Overrun in Years
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={timeOverrunYears}
                    onChange={(e) => setTimeOverrunYears(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                    placeholder="e.g. 2.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  EOT Granted Till / EOT Proposal Notes
                </label>
                <textarea
                  value={eotGrantedTill}
                  onChange={(e) => setEotGrantedTill(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  placeholder="Enter EOT approval status, ministry letters, or submission dates..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Further EOT Proposal with Agency
                  </label>
                  <input
                    type="text"
                    value={eotProposalAgency}
                    onChange={(e) => setEotProposalAgency(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    placeholder="e.g. RO / Ministry / SE"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Change of Scope (COS) Details
                  </label>
                  <textarea
                    value={cosDetails}
                    onChange={(e) => setCosDetails(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="COS-I / COS-II approval references..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLEARANCE BOTTLENECKS & ISSUES (5 FIELDS) */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-800 dark:text-amber-200">
                Departmental bottleneck registers across Land Acquisition, Forest, Utility, Railways, and General Remarks. If no issue exists, leave blank.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Land Acquisition Issues
                  </label>
                  <textarea
                    rows={3}
                    value={issueLand}
                    onChange={(e) => setIssueLand(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="Status of 3(A), 3(D), 3(G) LA awards, compensation disbursement, or court stays..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Forest &amp; Environmental Clearance
                  </label>
                  <textarea
                    rows={3}
                    value={issueForest}
                    onChange={(e) => setIssueForest(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="Stage-I / Stage-II forest clearance, wildlife sanctuary eco-sensitive approvals..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Utility Shifting (EB / Water / OFC)
                  </label>
                  <textarea
                    rows={3}
                    value={issueUtility}
                    onChange={(e) => setIssueUtility(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="TANGEDCO pole/line shifting, TWAD water pipeline relocation, payment of demand notices..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4. Railways (ROB / RUB / GAD Clearances)
                  </label>
                  <textarea
                    rows={3}
                    value={issueRailways}
                    onChange={(e) => setIssueRailways(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="Southern Railway GAD approvals, CRS inspection, traffic block permissions..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  5. Other Inter-Departmental &amp; General Remarks
                </label>
                <textarea
                  rows={3}
                  value={issueOthers}
                  onChange={(e) => setIssueOthers(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  placeholder="Court litigation, contractor slow progress notice, weather constraints, or other key remarks..."
                />
              </div>
            </div>
          )}

          {/* TAB 6: PERSONNEL & NOTES */}
          {activeTab === 'personnel_notes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Divisional Engineer Name & Phone
                  </label>
                  <input
                    type="text"
                    value={deNamePhone}
                    onChange={(e) => setDeNamePhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    placeholder="e.g. Er.P.Ma.Aathavan 9994949643"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Executing Contractor / Agency
                  </label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    placeholder="e.g. M.R.Hi.Tech Engg Pvt Ltd"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Updated Division & Timestamp
                </label>
                <input
                  type="text"
                  value={updatedDivisionDate}
                  onChange={(e) => setUpdatedDivisionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  placeholder="e.g. Vellore Division 03.08.2026"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Structural, Railway, Forest & LA Stage Log (Col AC)
                </label>
                <textarea
                  value={detailedStageStatus}
                  onChange={(e) => setDetailedStageStatus(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs text-xs font-mono leading-relaxed min-h-[180px] max-h-[450px]"
                  placeholder="Enter multi-paragraph log of piers, decks, box culverts, railway GAD, forest clearance, 3A/3D/3G gazettes, CALA award disbursement..."
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving 27-Col Data...</span>
                </>
              ) : (
                <span>Save All Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
