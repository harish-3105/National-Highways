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
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
  Save,
  ArrowLeft,
  FileText,
  Calculator,
  User,
  AlertCircle,
  Building,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Trash2,
  Receipt,
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
  circle: '',
  division: '',
  lawyerName: '',
  lawyerDesignation: '',
  caseType: '',
  caseNumber: '',
  caseYear: new Date().getFullYear().toString(),
  casePertainsTo: '' as any,
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
  assistantDesignation: '',
  paymentStatus: '' as any,
  settledAmount: 0,
  itCess: 0,
  amountDeposited: 0,
  utrRbiReference: '',
  paymentDate: '',
  goStatus: '' as any,
  statusOfObtainingGo: '',
  goNumber: '',
  goDate: '',
  statusOfPaymentProposal: '',
  proceedingLetterNo: '',
  proceedingLetterDate: '',
  sanctionedAmount: 0,
  isSanctioned: '' as any,
  paymentSanction: '' as any,
  proposalSubmitted: '' as any,
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
  currentPendency: '',
};

type FormTabType = 'voucher' | 'lawyer' | 'breakdown' | 'go' | 'payment';

const TABS: { id: FormTabType; label: string; step: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'voucher', label: 'Voucher & Office', step: 'Stage 1', icon: Building },
  { id: 'lawyer', label: 'Law Officer & Case', step: 'Stage 2', icon: User },
  { id: 'breakdown', label: 'Fee Breakdown', step: 'Stage 3', icon: Calculator },
  { id: 'go', label: 'G.O. Workflow', step: 'Stage 4', icon: FileText },
  { id: 'payment', label: 'Payment & Settlement', step: 'Stage 5', icon: DollarSign },
];

export const FeeBillDataEntryForm: React.FC<FeeBillDataEntryFormProps> = ({
  initialData,
  existingBills = [],
  masterData,
  onSave,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<FormTabType>('voucher');
  const [formData, setFormData] = useState<FeeBillRecord>(() => ({
    ...defaultFormState,
    ...initialData,
    id: initialData?.id || `fb-${Date.now()}`,
    amountDeposited:
      initialData?.amountDeposited !== undefined
        ? initialData.amountDeposited
        : Math.max(0, (initialData?.settledAmount || 0) - (initialData?.itCess || 0)),
  }));

  const [hasAssistant, setHasAssistant] = useState<boolean>(
    Boolean(initialData?.assistantName?.trim() || initialData?.assistantDesignation?.trim())
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const activeCircles = (masterData.circles || []).filter((c) => c.active);
  const availableDivisions = formData.circle
    ? (masterData.divisions || []).filter(
        (d) => d.circleName === formData.circle && d.active
      )
    : (masterData.divisions || []).filter((d) => d.active);

  const lawyerDesignations = masterData.lawyerDesignations || [];
  const caseTypes = masterData.caseTypes || [];
  const casePertainsToOptions = masterData.casePertainsTo || [];
  const paymentStatuses = masterData.paymentStatuses || [];
  const statusOfObtainingGoOptions = masterData.statusOfObtainingGoOptions || [];
  const statusOfPaymentProposalOptions = masterData.statusOfPaymentProposalOptions || [];
  const goStatusOptions = masterData.goStatusOptions || [];
  const yesNoOptions = masterData.yesNoOptions || [];

  // Auto-calculate Assistance Amount (1/3 of Appearance Fee only) and Total Fee
  useEffect(() => {
    const assistance = calculateAssistanceAmount(formData.appearanceAmount);
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

  // Derive Current Pendency Stage
  useEffect(() => {
    const derived = derivePendencyStage(formData);
    setFormData((prev) => ({
      ...prev,
      currentPendency: derived,
    }));
  }, [
    formData.paymentStatus,
    formData.goStatus,
    formData.statusOfObtainingGo,
    formData.goNumber,
    formData.statusOfPaymentProposal,
    formData.isSanctioned,
    formData.settledAmount,
    formData.utrRbiReference,
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
      setDuplicateWarning(`Fee Bill Number "${val}" already exists in system.`);
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

  const handleSettledAmountChange = (val: number) => {
    const it = Number(formData.itCess) || 0;
    setFormData((prev) => ({
      ...prev,
      settledAmount: val,
      amountDeposited: Math.max(0, val - it),
      paymentStatus: val > 0 ? 'Settled' : prev.paymentStatus,
    }));
  };

  const handleItCessChange = (val: number) => {
    const settled = Number(formData.settledAmount) || 0;
    setFormData((prev) => ({
      ...prev,
      itCess: val,
      amountDeposited: Math.max(0, settled - val),
    }));
  };

  const handleAmountDepositedChange = (val: number) => {
    const it = Number(formData.itCess) || 0;
    setFormData((prev) => ({
      ...prev,
      amountDeposited: val,
      settledAmount: val + it,
      paymentStatus: (val + it) > 0 ? 'Settled' : prev.paymentStatus,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.feeBillNumber.trim()) {
      newErrors.feeBillNumber = 'Fee Bill Number is required (Stage 1).';
    }
    if (!formData.lawyerName.trim()) {
      newErrors.lawyerName = 'Lawyer / Law Officer Name is required (Stage 2).';
    }
    if (!formData.caseNumber.trim()) {
      newErrors.caseNumber = 'Case Number is required (Stage 2).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const goToNextTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id);
    }
  };
  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-5 pb-16">
      {/* Top Sticky Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Ledger
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-extrabold text-[10px] tracking-wider uppercase">
                {TABS[currentTabIndex].step} of 5
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                {initialData?.id ? 'Edit Legal Fee Bill Voucher' : 'New Legal Fee Bill Voucher Entry'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              Progressive Lifecycle Entry &bull; Fill any stage, save anytime, and update subsequent stages later
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-500">Live Total Claim:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatINR(formData.totalFeeAmount)}</strong>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Record
          </button>
        </div>
      </div>

      {/* Sub-Navigation Lifecycle Tab Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
        <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5" aria-label="Lifecycle Stages">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCompleted =
              (tab.id === 'voucher' && formData.feeBillNumber && formData.circle) ||
              (tab.id === 'lawyer' && formData.lawyerName && formData.caseNumber) ||
              (tab.id === 'breakdown' && formData.totalFeeAmount > 0) ||
              (tab.id === 'go' && (formData.goStatus === 'Not Required' || formData.goNumber || formData.statusOfObtainingGo)) ||
              (tab.id === 'payment' && (formData.paymentStatus === 'Settled' || formData.statusOfPaymentProposal));

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider block ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {tab.step}
                    </span>
                    {isCompleted && !isActive && <span className="text-emerald-600 text-[10px] font-black">✓</span>}
                  </div>
                  <span className="block truncate">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Validation Diagnostics Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please resolve the required fields ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: VOUCHER IDENTIFICATION & OFFICE JURISDICTION                      */}
      {/* ========================================================================= */}
      {activeTab === 'voucher' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Stage 1: Voucher Identification & Office Jurisdiction
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Initial registration details recorded upon voucher receipt from law officer
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fee Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.feeBillNumber}
                onChange={(e) => handleFeeBillNoChange(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.feeBillNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.feeBillNumber}</p>}
              {duplicateWarning && <p className="text-[11px] text-amber-600 font-semibold mt-1">{duplicateWarning}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fee Bill Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.feeBillDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, feeBillDate: e.target.value }))}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Circle Jurisdiction <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={activeCircles.map((c) => c.name)}
                value={formData.circle}
                onChange={handleCircleChange}
                placeholder=""
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Division Jurisdiction <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={availableDivisions.map((d) => d.name)}
                value={formData.division}
                onChange={(val) => setFormData((prev) => ({ ...prev, division: val }))}
                placeholder=""
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: LAW OFFICER & COURT CASE PARAMETERS                              */}
      {/* ========================================================================= */}
      {activeTab === 'lawyer' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Stage 2: Law Officer & Court Case Particulars
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Primary advocate, optional assistant law officer, and associated court case identification
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Lawyer / Advocate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lawyerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lawyerName: e.target.value }))}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.lawyerName && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.lawyerName}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Lawyer Designation
              </label>
              <SearchableSelect
                options={lawyerDesignations}
                value={formData.lawyerDesignation}
                onChange={(val) => setFormData((prev) => ({ ...prev, lawyerDesignation: val }))}
                placeholder=""
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Case Type & Category
              </label>
              <SearchableSelect
                options={caseTypes}
                value={formData.caseType}
                onChange={(val) => setFormData((prev) => ({ ...prev, caseType: val }))}
                placeholder=""
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Case Pertains To
              </label>
              <SearchableSelect
                options={casePertainsToOptions}
                value={formData.casePertainsTo}
                onChange={(val) => setFormData((prev) => ({ ...prev, casePertainsTo: val as any }))}
                placeholder=""
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Case Number & Year <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, caseNumber: e.target.value }))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
                <input
                  type="text"
                  value={formData.caseYear}
                  onChange={(e) => setFormData((prev) => ({ ...prev, caseYear: e.target.value }))}
                  className="w-24 h-10 px-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
                />
              </div>
              {errors.caseNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.caseNumber}</p>}
            </div>
          </div>

          {/* Optional Assistant Law Officer Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {!hasAssistant ? (
              <button
                type="button"
                onClick={() => setHasAssistant(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> + Add Assistant Law Officer (Optional)
              </button>
            ) : (
              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 text-xs">
                    <User className="w-4 h-4 text-indigo-600" /> Assistant Law Officer Details
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasAssistant(false);
                      setFormData((prev) => ({ ...prev, assistantName: '', assistantDesignation: '' }));
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Assistant
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assistant Law Officer Name
                    </label>
                    <input
                      type="text"
                      value={formData.assistantName || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, assistantName: e.target.value }))}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assistant Designation
                    </label>
                    <SearchableSelect
                      options={lawyerDesignations}
                      value={formData.assistantDesignation || ''}
                      onChange={(val) => setFormData((prev) => ({ ...prev, assistantDesignation: val }))}
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: ITEMIZED FEE BREAKDOWN & AUTO-CALCULATOR                         */}
      {/* ========================================================================= */}
      {activeTab === 'breakdown' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Stage 3: Itemized Fee Breakdown & Assistance Calculation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assistance fee is auto-computed as 1/3 of Appearance Fee only
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
              Total Claim: {formatINR(formData.totalFeeAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* 1. Appearance */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                1. Appearance Fee (₹)
              </label>
              <input
                type="number"
                value={formData.appearanceAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, appearanceAmount: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <label className="block text-[11px] font-semibold text-slate-500">Appearance Date</label>
              <input
                type="date"
                value={formData.appearanceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, appearanceDate: e.target.value }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            {/* 2. Conference */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                2. Conference Fee (₹)
              </label>
              <input
                type="number"
                value={formData.conferenceAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, conferenceAmount: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <label className="block text-[11px] font-semibold text-slate-500">Conference Date</label>
              <input
                type="date"
                value={formData.conferenceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, conferenceDate: e.target.value }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            {/* 3. Verifying */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                3. Verifying Fee (₹)
              </label>
              <input
                type="number"
                value={formData.verifyingAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, verifyingAmount: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <label className="block text-[11px] font-semibold text-slate-500">Verifying Date</label>
              <input
                type="date"
                value={formData.verifyingDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, verifyingDate: e.target.value }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            {/* 4. Assistance (1/3 of Appearance Only) */}
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-extrabold text-blue-900 dark:text-blue-300">
                  4. Assistance Fee (₹)
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Auto (1/3 of App)</span>
              </div>
              <input
                type="number"
                readOnly
                value={formData.assistanceAmount || 0}
                className="w-full h-10 px-3 bg-blue-100/80 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 rounded-xl font-black text-blue-900 dark:text-blue-100 cursor-not-allowed"
              />
              <label className="block text-[11px] font-semibold text-blue-700 dark:text-blue-400">Assistance Date</label>
              <input
                type="date"
                value={formData.assistanceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, assistanceDate: e.target.value }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: GOVERNMENT ORDER (G.O.) WORKFLOW                                  */}
      {/* ========================================================================= */}
      {activeTab === 'go' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Stage 4: Government Order (G.O.) Sanction Workflow
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  G.O. requirement check and sanction tracking from Government Secretariat
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800">
              Stage: {formData.currentPendency}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                G.O. Required Status <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={goStatusOptions}
                value={formData.goStatus || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, goStatus: val as GOStatusType }))}
                placeholder="Select G.O. Status..."
              />
            </div>

            {(formData.goStatus === 'Yes' || formData.goStatus?.toLowerCase() === 'yes') && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status of Obtaining G.O. <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={statusOfObtainingGoOptions}
                  value={formData.statusOfObtainingGo || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, statusOfObtainingGo: val }))}
                  placeholder=""
                />
              </div>
            )}
          </div>

          {/* Conditional Branch: If G.O. Required == YES and Status == G.O. Obtained */}
          {(formData.goStatus === 'Yes' || formData.goStatus?.toLowerCase() === 'yes') &&
            (formData.statusOfObtainingGo === 'G.O. Obtained' ||
              formData.statusOfObtainingGo === 'GO Obtained' ||
              formData.statusOfObtainingGo?.toLowerCase() === 'g.o. obtained' ||
              formData.statusOfObtainingGo?.toLowerCase() === 'go obtained') && (
            <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official G.O. Reference Particulars
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    G.O. Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.goNumber || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, goNumber: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    G.O. Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.goDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, goDate: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.goStatus !== 'Yes' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
              {formData.goStatus === 'No'
                ? 'G.O. is not required for this voucher (Office direct sanction process applies in Stage 5).'
                : 'Standard departmental voucher within sanctioned delegation limit.'}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 5: PAYMENT PROPOSAL & SETTLEMENT DISBURSEMENT                       */}
      {/* ========================================================================= */}
      {activeTab === 'payment' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Stage 5: Payment Proposal & Settlement Disbursement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payment proposal status, proceeding orders, tax deductions, and bank UTR reference numbers
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 font-bold text-xs rounded-xl border ${
                formData.paymentStatus === 'Settled'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200'
              }`}
            >
              Status: {formData.paymentStatus || 'Not Settled'}
            </span>
          </div>

          {/* Payment Proposal Stage & Payment Status Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Status of Payment Proposal
              </label>
              <SearchableSelect
                options={statusOfPaymentProposalOptions}
                value={formData.statusOfPaymentProposal || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, statusOfPaymentProposal: val }))}
                placeholder=""
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Status
              </label>
              <SearchableSelect
                options={paymentStatuses}
                value={formData.paymentStatus || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, paymentStatus: val as any }))}
                placeholder="Select Payment Status..."
              />
            </div>
          </div>

          {/* Conditional Branch 1: If Status == Payment Sanction */}
          {(formData.statusOfPaymentProposal === 'Payment Sanction' ||
            formData.statusOfPaymentProposal === 'Payment Sanctioned' ||
            formData.statusOfPaymentProposal?.toLowerCase() === 'payment sanction' ||
            formData.statusOfPaymentProposal?.toLowerCase() === 'payment sanctioned') && (
            <div className="p-5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4 text-xs animate-in fade-in">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> Proceeding & Sanction Order Particulars
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Proceeding / Letter Number
                  </label>
                  <input
                    type="text"
                    value={formData.proceedingLetterNo || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, proceedingLetterNo: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Proceeding / Letter Date
                  </label>
                  <input
                    type="date"
                    value={formData.proceedingLetterDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, proceedingLetterDate: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sanctioned Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.sanctionedAmount || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sanctionedAmount: Number(e.target.value) }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sanctioned? (Yes / No)
                  </label>
                  <SearchableSelect
                    options={yesNoOptions}
                    value={formData.isSanctioned || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, isSanctioned: val as YesNoType }))}
                    placeholder="Select Option..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Branch 2: If Sanctioned == YES (Settlement & Disbursement Banking Fields) */}
          {(formData.isSanctioned === 'Yes' ||
            formData.isSanctioned?.toLowerCase() === 'yes' ||
            formData.paymentStatus === 'Settled' ||
            formData.paymentStatus?.toLowerCase() === 'settled') && (
            <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-4 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settlement Disbursement & Bank Transfer Record
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Settled = IT Cess + Net Deposited
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lawyer Name (Beneficiary)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.lawyerName || 'Not Specified'}
                    className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Claimed Amount (₹)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatINR(formData.totalFeeAmount)}
                    className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Settled Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.settledAmount || ''}
                    onChange={(e) => handleSettledAmountChange(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-emerald-700 dark:text-emerald-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    IT Cess Deduction (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.itCess || ''}
                    onChange={(e) => handleItCessChange(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Deposited in Account (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amountDeposited || ''}
                    onChange={(e) => handleAmountDepositedChange(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-emerald-700 dark:text-emerald-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment UTR / RBI Reference No.
                  </label>
                  <input
                    type="text"
                    value={formData.utrRbiReference || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, utrRbiReference: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stepper Navigation Footer & Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
        <div>
          {currentTabIndex > 0 ? (
            <button
              type="button"
              onClick={goToPrevTab}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Stage
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentTabIndex < TABS.length - 1 && (
            <button
              type="button"
              onClick={goToNextTab}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Next Stage <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Fee Bill Record
          </button>
        </div>
      </div>
    </form>
  );
};
