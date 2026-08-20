'use client';

import React, { useState, useEffect } from 'react';
import {
  FeeBillRecord,
  FeeBillMasterDataConfig,
  GOStatusType,
  YesNoType,
} from '@/types/feeBill';
import {
  calculateAssistanceAmount,
  calculateTotalFeeAmount,
  derivePendencyStage,
  formatINR,
} from '@/lib/feeBillMasterData';
import {
  Save,
  ArrowLeft,
  FileText,
  Calculator,
  User,
  Clock,
  AlertCircle,
  HelpCircle,
  CheckSquare,
} from 'lucide-react';

interface FeeBillDataEntryFormProps {
  initialData?: Partial<FeeBillRecord>;
  existingBills?: FeeBillRecord[];
  masterData: FeeBillMasterDataConfig;
  onSave: (record: FeeBillRecord, resetForm?: boolean) => void;
  onCancel: () => void;
}

const defaultFormState: FeeBillRecord = {
  id: '',
  feeBillNumber: '',
  feeBillDate: new Date().toISOString().split('T')[0],
  circle: 'Chennai',
  division: 'Chennai City Division',
  lawyerName: '',
  lawyerDesignation: 'Government Advocate',
  caseType: 'Writ Petition (WP)',
  caseNumber: '',
  caseYear: new Date().getFullYear().toString(),
  casePertainsTo: 'GOTN',
  appearanceAmount: 0,
  appearanceDate: new Date().toISOString().split('T')[0],
  conferenceAmount: 0,
  conferenceDate: new Date().toISOString().split('T')[0],
  verifyingAmount: 0,
  verifyingDate: new Date().toISOString().split('T')[0],
  assistanceAmount: 0,
  assistanceDate: new Date().toISOString().split('T')[0],
  totalFeeAmount: 0,
  assistantName: '',
  assistantDesignation: 'Junior Advocate',
  paymentStatus: 'Not Settled',
  settledAmount: 0,
  itCess: 0,
  utrRbiReference: '',
  paymentDate: '',
  goStatus: 'Yes',
  goNumber: '',
  goDate: '',
  paymentSanction: 'No',
  proposalSubmitted: 'No',
  proposalMovement: {
    deToCe: false,
    seToCe: false,
    seToRorMorth: false,
  },
  directMovement: {
    deToCe: false,
    seToCe: false,
  },
  letterNumber: '',
  letterDate: '',
  currentPendency: 'Pending with DE',
};

export const FeeBillDataEntryForm: React.FC<FeeBillDataEntryFormProps> = ({
  initialData,
  existingBills = [],
  masterData,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FeeBillRecord>(() => ({
    ...defaultFormState,
    ...initialData,
    id: initialData?.id || `fb-${Date.now()}`,
    proposalMovement: {
      deToCe: initialData?.proposalMovement?.deToCe || false,
      seToCe: initialData?.proposalMovement?.seToCe || false,
      seToRorMorth: initialData?.proposalMovement?.seToRorMorth || false,
    },
    directMovement: {
      deToCe: initialData?.directMovement?.deToCe || false,
      seToCe: initialData?.directMovement?.seToCe || false,
    },
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const activeCircles = masterData.circles.filter((c) => c.active);
  const availableDivisions = masterData.divisions.filter(
    (d) => d.circleName === formData.circle && d.active
  );

  // Auto-calculate Assistance Amount whenever Appearance, Conference, or Verifying Amount changes
  useEffect(() => {
    const assistance = calculateAssistanceAmount(
      formData.appearanceAmount,
      formData.conferenceAmount,
      formData.verifyingAmount
    );
    const total = calculateTotalFeeAmount(
      formData.appearanceAmount,
      formData.conferenceAmount,
      formData.verifyingAmount,
      assistance
    );

    setFormData((prev) => ({
      ...prev,
      assistanceAmount: assistance,
      totalFeeAmount: total,
    }));
  }, [formData.appearanceAmount, formData.conferenceAmount, formData.verifyingAmount]);

  // Derive Current Pendency Stage whenever relevant fields change
  useEffect(() => {
    const derived = derivePendencyStage(formData);
    setFormData((prev) => ({
      ...prev,
      currentPendency: derived,
    }));
  }, [
    formData.paymentStatus,
    formData.goStatus,
    formData.paymentSanction,
    formData.proposalSubmitted,
    formData.proposalMovement,
    formData.directMovement,
  ]);

  const handleFeeBillNoChange = (val: string) => {
    setFormData((prev) => ({ ...prev, feeBillNumber: val }));
    if (!val.trim()) {
      setDuplicateWarning('');
      return;
    }
    const isDuplicate = existingBills.some(
      (b) =>
        b.feeBillNumber.trim().toLowerCase() === val.trim().toLowerCase() &&
        String(b.id) !== String(formData.id)
    );
    if (isDuplicate) {
      setDuplicateWarning(`Fee Bill Number "${val}" already exists!`);
    } else {
      setDuplicateWarning('');
    }
  };

  const handleCircleChange = (newCircle: string) => {
    const matchingDivisions = masterData.divisions.filter(
      (d) => d.circleName === newCircle && d.active
    );
    const defaultDiv = matchingDivisions[0]?.name || '';
    setFormData((prev) => ({
      ...prev,
      circle: newCircle,
      division: defaultDiv,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.feeBillNumber.trim()) {
      newErrors.feeBillNumber = 'Fee Bill Number is required.';
    }
    if (!formData.lawyerName.trim()) {
      newErrors.lawyerName = 'Lawyer / Law Officer Name is required.';
    }
    if (!formData.caseNumber.trim()) {
      newErrors.caseNumber = 'Case Number is required.';
    }
    if (formData.totalFeeAmount <= 0) {
      newErrors.totalFeeAmount = 'Total Fee Claim Amount must be greater than zero.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Sticky Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Ledger
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Legal Fee Bill Voucher' : 'New Legal Fee Bill Voucher Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Legal Fee Portal &bull; G.O. Fee Schedule, Assistance Calculator & Audit Registry
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
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Fee Bill Record
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

      {/* 1. Basic Fee Bill Information Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            1. Basic Voucher Identification & Office Jurisdiction
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fee Bill Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. FB-CHN-2024-001"
              value={formData.feeBillNumber}
              onChange={(e) => handleFeeBillNoChange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.feeBillNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.feeBillNumber}</p>}
            {duplicateWarning && <p className="text-[11px] text-amber-600 font-semibold mt-1">{duplicateWarning}</p>}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Fee Bill Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.feeBillDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, feeBillDate: e.target.value }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Circle Jurisdiction <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.circle}
              onChange={(e) => handleCircleChange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              {activeCircles.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} Circle
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Division Jurisdiction <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.division}
              onChange={(e) => setFormData((prev) => ({ ...prev, division: e.target.value }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              {availableDivisions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Advocate & Case Information Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <User className="w-5 h-5 text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            2. Law Officer & Court Case Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lawyer / Advocate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Thiru. R. Shunmugasundaram"
              value={formData.lawyerName}
              onChange={(e) => setFormData((prev) => ({ ...prev, lawyerName: e.target.value }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            />
            {errors.lawyerName && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.lawyerName}</p>}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lawyer Designation
            </label>
            <select
              value={formData.lawyerDesignation}
              onChange={(e) => setFormData((prev) => ({ ...prev, lawyerDesignation: e.target.value }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              {masterData.lawyerDesignations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Case Type & Category
            </label>
            <select
              value={formData.caseType}
              onChange={(e) => setFormData((prev) => ({ ...prev, caseType: e.target.value }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              {masterData.caseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Case Number & Year <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="WP 18452"
                value={formData.caseNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, caseNumber: e.target.value }))}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <input
                type="text"
                placeholder="2024"
                value={formData.caseYear}
                onChange={(e) => setFormData((prev) => ({ ...prev, caseYear: e.target.value }))}
                className="w-20 py-2 px-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
              />
            </div>
            {errors.caseNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.caseNumber}</p>}
          </div>
        </div>
      </div>

      {/* 3. Itemized Fee Claims & Auto-Calculator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              3. Itemized Fee Breakdown & Automated Assistance Calculator
            </h3>
          </div>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
            Total Claim: {formatINR(formData.totalFeeAmount)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Appearance */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              1. Appearance Fee (₹)
            </label>
            <input
              type="number"
              value={formData.appearanceAmount || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, appearanceAmount: Number(e.target.value) }))}
              className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
            />
            <input
              type="date"
              value={formData.appearanceDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, appearanceDate: e.target.value }))}
              className="w-full mt-2 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          {/* Conference */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              2. Conference Fee (₹)
            </label>
            <input
              type="number"
              value={formData.conferenceAmount || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, conferenceAmount: Number(e.target.value) }))}
              className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
            />
            <input
              type="date"
              value={formData.conferenceDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, conferenceDate: e.target.value }))}
              className="w-full mt-2 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          {/* Verifying */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              3. Verifying Fee (₹)
            </label>
            <input
              type="number"
              value={formData.verifyingAmount || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, verifyingAmount: Number(e.target.value) }))}
              className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
            />
            <input
              type="date"
              value={formData.verifyingDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, verifyingDate: e.target.value }))}
              className="w-full mt-2 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          {/* Assistance (Auto-Calculated) */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-extrabold text-blue-900 dark:text-blue-300">
                4. Assistance Fee (₹)
              </label>
              <span className="text-[10px] text-blue-600 font-bold">Auto (1/3)</span>
            </div>
            <input
              type="number"
              readOnly
              value={formData.assistanceAmount}
              className="w-full py-1.5 px-3 bg-blue-100 dark:bg-blue-900/80 border border-blue-300 dark:border-blue-700 rounded-lg font-extrabold text-blue-900 dark:text-blue-100 cursor-not-allowed"
            />
            <input
              type="date"
              value={formData.assistanceDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, assistanceDate: e.target.value }))}
              className="w-full mt-2 py-1 px-2 text-[11px] bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded"
            />
          </div>
        </div>
      </div>

      {/* 4. Payment Settlement & Government Order (G.O.) Inter-Office Workflow Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              4. Payment Settlement & Government Order (G.O.) Inter-Office Workflow
            </h3>
          </div>
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-200">
            Current Stage: {formData.currentPendency}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Settlement Status
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentStatus: e.target.value as any }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-900 dark:text-blue-300"
            >
              <option value="Not Settled">Not Settled (Pending Approval)</option>
              <option value="Settled">Settled (Disbursed & Closed)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              G.O. Required Status
            </label>
            <select
              value={formData.goStatus}
              onChange={(e) => setFormData((prev) => ({ ...prev, goStatus: e.target.value as GOStatusType }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              <option value="Yes">Yes (G.O. Sanction Required)</option>
              <option value="No">No (Direct Office Level)</option>
              <option value="Not Required">Not Required</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Proposal Submitted to SE/CE
            </label>
            <select
              value={formData.proposalSubmitted}
              onChange={(e) => setFormData((prev) => ({ ...prev, proposalSubmitted: e.target.value as YesNoType }))}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {/* Conditional Inter-Office Movement Sub-Panel (G.O. = YES) */}
        {formData.goStatus === 'Yes' && (
          <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3 text-xs">
            <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> G.O. Sanction & Inter-Office Movement Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">G.O. Number</label>
                <input
                  type="text"
                  placeholder="e.g. G.O. (Ms) No. 142/HW/2024"
                  value={formData.goNumber || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, goNumber: e.target.value }))}
                  className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">G.O. Date</label>
                <input
                  type="date"
                  value={formData.goDate || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, goDate: e.target.value }))}
                  className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Sanction Received?</label>
                <select
                  value={formData.paymentSanction}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paymentSanction: e.target.value as YesNoType }))}
                  className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {formData.proposalSubmitted === 'Yes' && (
              <div className="p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">Proposal Movement Steps (Check completed stages):</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.proposalMovement?.deToCe || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          proposalMovement: { ...prev.proposalMovement!, deToCe: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Submitted DE to CE</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.proposalMovement?.seToCe || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          proposalMovement: { ...prev.proposalMovement!, seToCe: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Submitted SE to CE</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.proposalMovement?.seToRorMorth || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          proposalMovement: { ...prev.proposalMovement!, seToRorMorth: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Submitted SE to RO / MoRTH</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conditional Direct Movement Sub-Panel (G.O. = NO) */}
        {formData.goStatus === 'No' && (
          <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Direct Office Approval Workflow (G.O. Bypassed)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.directMovement?.deToCe || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      directMovement: { ...prev.directMovement!, deToCe: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span>Submitted DE to CE</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.directMovement?.seToCe || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      directMovement: { ...prev.directMovement!, seToCe: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span>Submitted SE to CE</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Fee Bill Record</span>
        </button>
      </div>
    </form>
  );
};
