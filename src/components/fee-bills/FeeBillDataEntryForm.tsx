'use client';

import React, { useState, useEffect } from 'react';
import {
  FeeBillRecord,
  FeeBillMasterDataConfig,
  GOStatusType,
  YesNoType,
  PaymentStatusType,
} from '@/types/feeBill';
import {
  calculateAssistanceAmount,
  calculateLawyerClaimAmount,
  calculateTotalFeeAmount,
  derivePendencyStage,
  formatINR,
} from '@/lib/feeBillMasterData';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { DatePickerInput } from '@/components/common/DatePickerInput';
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
  CreditCard,
  Scale,
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
  feeBillDate: '', // Zero default date
  receiptDate: '', // Zero default date
  circle: '',
  division: '',
  lawyerName: '',
  lawyerDesignation: '',
  caseDetails: '',
  casePertainsTo: '' as any,
  appearanceAmount: 0,
  appearanceDate: '', // Zero default date
  conferenceAmount: 0,
  conferenceDate: '', // Zero default date
  verifyingAmount: 0,
  verifyingDate: '', // Zero default date
  assistanceAmount: 0,
  assistanceDate: '', // Zero default date
  totalFeeAmount: 0,
  assistantName: '',
  assistantDesignation: '',
  paymentStatus: 'Pending' as any,
  settledAmount: 0,
  itCess: 0,
  amountDeposited: 0,
  utrRbiReference: '',
  paymentDate: '',
  assistantSettledAmount: 0,
  assistantItCess: 0,
  assistantAmountDeposited: 0,
  assistantUtrRbiReference: '',
  assistantPaymentDate: '',
  assistantPaymentStatus: '' as any,
  goStatus: '' as any,
  statusOfObtainingGo: '',
  goNumber: '',
  goDate: '',
  goReferenceLetterNo: '',
  goReferenceLetterDate: '',
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
    caseDetails: initialData?.caseDetails || '',
    amountDeposited:
      initialData?.amountDeposited !== undefined
        ? initialData.amountDeposited
        : Math.max(0, (initialData?.settledAmount || 0) - (initialData?.itCess || 0)),
    assistantAmountDeposited:
      initialData?.assistantAmountDeposited !== undefined
        ? initialData.assistantAmountDeposited
        : Math.max(0, (initialData?.assistantSettledAmount || 0) - (initialData?.assistantItCess || 0)),
  }));

  const [hasAssistant, setHasAssistant] = useState<boolean>(
    Boolean(
      initialData?.assistantName?.trim() ||
      initialData?.assistantDesignation?.trim() ||
      (initialData?.assistanceAmount && initialData.assistanceAmount > 0)
    )
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const activeCircles = (masterData.circles || []).filter((c) => c.active);
  const availableDivisions = formData.circle
    ? (masterData.divisions || []).filter(
        (d) => d.circleName === formData.circle && d.active
      )
    : (masterData.divisions || []).filter((d) => d.active);

  const lawyerDesignations = masterData.lawyerDesignations || [];
  const assistantDesignations = masterData.assistantDesignations || [];
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

  // Check duplicate fee bill number
  const checkDuplicateFeeBillNumber = (val: string): boolean => {
    if (!val.trim()) return false;
    return existingBills.some(
      (b) =>
        b.feeBillNumber.trim().toLowerCase() === val.trim().toLowerCase() &&
        String(b.id) !== String(formData.id)
    );
  };

  const handleFeeBillNoChange = (val: string) => {
    setFormData((prev) => ({ ...prev, feeBillNumber: val }));
    if (!val.trim()) {
      setDuplicateError('');
      setErrors((prev) => {
        const next = { ...prev };
        delete next.feeBillNumber;
        return next;
      });
      return;
    }
    const isDup = checkDuplicateFeeBillNumber(val);
    if (isDup) {
      const msg = `Fee Bill Number "${val.trim()}" already exists in the system. Duplicate fee bill numbers are not permitted.`;
      setDuplicateError(msg);
      setErrors((prev) => ({ ...prev, feeBillNumber: msg }));
    } else {
      setDuplicateError('');
      setErrors((prev) => {
        const next = { ...prev };
        delete next.feeBillNumber;
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

  // Lawyer settlement calculations
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

  // Assistant settlement calculations
  const handleAssistantSettledAmountChange = (val: number) => {
    const it = Number(formData.assistantItCess) || 0;
    setFormData((prev) => ({
      ...prev,
      assistantSettledAmount: val,
      assistantAmountDeposited: Math.max(0, val - it),
      assistantPaymentStatus: val > 0 ? 'Settled' : prev.assistantPaymentStatus,
    }));
  };

  const handleAssistantItCessChange = (val: number) => {
    const settled = Number(formData.assistantSettledAmount) || 0;
    setFormData((prev) => ({
      ...prev,
      assistantItCess: val,
      assistantAmountDeposited: Math.max(0, settled - val),
    }));
  };

  const handleAssistantAmountDepositedChange = (val: number) => {
    const it = Number(formData.assistantItCess) || 0;
    setFormData((prev) => ({
      ...prev,
      assistantAmountDeposited: val,
      assistantSettledAmount: val + it,
      assistantPaymentStatus: (val + it) > 0 ? 'Settled' : prev.assistantPaymentStatus,
    }));
  };

  // -------------------------------------------------------------
  // STAGE-GATED PROGRESSIVE VALIDATION ENGINE
  // -------------------------------------------------------------
  const validateSingleStage = (stageIdx: number): Record<string, string> => {
    const stageErrors: Record<string, string> = {};

    if (stageIdx === 0) {
      // Stage 1: Voucher & Office (Baseline)
      if (!formData.circle.trim()) {
        stageErrors.circle = 'Circle Jurisdiction is required (Stage 1).';
      }
      if (!formData.division.trim()) {
        stageErrors.division = 'Division Jurisdiction is required (Stage 1).';
      }
      if (!formData.feeBillNumber.trim()) {
        stageErrors.feeBillNumber = 'Fee Bill Number is required (Stage 1).';
      } else if (checkDuplicateFeeBillNumber(formData.feeBillNumber)) {
        stageErrors.feeBillNumber = `Fee Bill Number "${formData.feeBillNumber.trim()}" already exists. Duplicate fee bill numbers are strictly blocked.`;
      }
      if (!formData.feeBillDate || !formData.feeBillDate.trim()) {
        stageErrors.feeBillDate = 'Fee Bill Date is required (Stage 1).';
      } else if (formData.feeBillDate > todayStr) {
        stageErrors.feeBillDate = 'Fee Bill Date cannot be a future date.';
      }
      if (!formData.receiptDate || !formData.receiptDate.trim()) {
        stageErrors.receiptDate = 'Date of receipt in concerned office is required (Stage 1).';
      } else if (formData.receiptDate > todayStr) {
        stageErrors.receiptDate = 'Date of receipt in concerned office cannot be a future date.';
      } else if (formData.feeBillDate && formData.receiptDate < formData.feeBillDate) {
        stageErrors.receiptDate = 'Date of receipt in concerned office cannot be earlier than Fee Bill Date.';
      }
    } else if (stageIdx === 1) {
      // Stage 2: Law Officer & Case (Fully Mandatory except assistant)
      if (!formData.lawyerName.trim()) {
        stageErrors.lawyerName = 'Lawyer / Advocate Name is required (Stage 2).';
      }
      if (!formData.lawyerDesignation?.trim()) {
        stageErrors.lawyerDesignation = 'Lawyer Designation is required (Stage 2).';
      }
      if (!formData.casePertainsTo) {
        stageErrors.casePertainsTo = 'Case Pertains To jurisdiction is required (Stage 2).';
      }
      if (!formData.caseDetails || !formData.caseDetails.trim()) {
        stageErrors.caseDetails = 'Case Details / Particulars is required (Stage 2).';
      }

      // Assistant Law Officer Validation & Co-dependency
      if (hasAssistant || formData.assistantName?.trim() || formData.assistantDesignation?.trim()) {
        if (!formData.assistantName?.trim()) {
          stageErrors.assistantName = 'Assistant Law Officer Name is required when assistant option is enabled.';
        }
        if (!formData.assistantDesignation?.trim()) {
          stageErrors.assistantDesignation = 'Assistant Law Officer Designation is required when assistant option is enabled.';
        }
      }
      if (formData.appearanceAmount > 0 && (!hasAssistant || !formData.assistantName?.trim() || !formData.assistantDesignation?.trim())) {
        if (!formData.assistantName?.trim()) {
          stageErrors.assistantName = 'Assistant Law Officer Name is required when Appearance Fee is claimed.';
        }
        if (!formData.assistantDesignation?.trim()) {
          stageErrors.assistantDesignation = 'Assistant Law Officer Designation is required when Appearance Fee is claimed.';
        }
      }
    } else if (stageIdx === 2) {
      // Stage 3: Fee Breakdown
      if (formData.appearanceAmount < 0) stageErrors.appearanceAmount = 'Appearance Amount cannot be negative.';
      if (formData.conferenceAmount < 0) stageErrors.conferenceAmount = 'Conference Amount cannot be negative.';
      if (formData.verifyingAmount < 0) stageErrors.verifyingAmount = 'Opinion / Vetting Amount cannot be negative.';

      // Assistant co-dependency: If assistant is assigned, appearance fee is mandatory (> 0)
      if ((hasAssistant || formData.assistantName?.trim() || formData.assistantDesignation?.trim()) && (!formData.appearanceAmount || formData.appearanceAmount <= 0)) {
        stageErrors.appearanceAmount = 'Appearance Fee is required (> ₹0) when an Assistant Law Officer is assigned.';
      }

      // Date validations (no future dates)
      if (formData.appearanceDate && formData.appearanceDate > todayStr) {
        stageErrors.appearanceDate = 'Appearance Date cannot be a future date.';
      }
      if (formData.conferenceDate && formData.conferenceDate > todayStr) {
        stageErrors.conferenceDate = 'Conference Date cannot be a future date.';
      }
      if (formData.verifyingDate && formData.verifyingDate > todayStr) {
        stageErrors.verifyingDate = 'Opinion / Vetting Date cannot be a future date.';
      }
      if (formData.assistanceDate && formData.assistanceDate > todayStr) {
        stageErrors.assistanceDate = 'Assistance Date cannot be a future date.';
      }
    } else if (stageIdx === 3) {
      // Stage 4: G.O. Workflow
      if (formData.goStatus === 'Yes' || formData.goStatus?.toLowerCase() === 'yes') {
        if (!formData.statusOfObtainingGo?.trim()) {
          stageErrors.statusOfObtainingGo = 'Status of Obtaining G.O. is required when G.O. is required.';
        }
        const isObtained = formData.statusOfObtainingGo?.toLowerCase().includes('obtained');
        if (isObtained) {
          if (!formData.goNumber?.trim()) {
            stageErrors.goNumber = 'G.O. Number is required when G.O. is obtained.';
          }
          if (!formData.goDate?.trim()) {
            stageErrors.goDate = 'G.O. Date is required when G.O. is obtained.';
          }
        }
        const goStatusLower = formData.statusOfObtainingGo?.toLowerCase() || '';
        const isProposal =
          !isObtained &&
          Boolean(formData.statusOfObtainingGo) &&
          !goStatusLower.includes('yet to be') &&
          (goStatusLower.includes('proposal') ||
            goStatusLower.includes('sent') ||
            goStatusLower.includes('submitted'));
        if (isProposal) {
          if (!formData.goReferenceLetterNo?.trim()) {
            stageErrors.goReferenceLetterNo = 'G.O. Proposal Reference Letter Number is required.';
          }
          if (!formData.goReferenceLetterDate?.trim()) {
            stageErrors.goReferenceLetterDate = 'G.O. Proposal Reference Letter Date is required.';
          }
        }
      }
      if (formData.goDate && formData.goDate > todayStr) {
        stageErrors.goDate = 'G.O. Date cannot be a future date.';
      }
      if (formData.goReferenceLetterDate && formData.goReferenceLetterDate > todayStr) {
        stageErrors.goReferenceLetterDate = 'G.O. Proposal Reference Letter Date cannot be a future date.';
      }
    } else if (stageIdx === 4) {
      // Stage 5: Payment & Settlement
      if (formData.letterDate && formData.letterDate > todayStr) {
        stageErrors.letterDate = 'Reference Letter Date cannot be a future date.';
      }
      if (formData.proceedingLetterDate && formData.proceedingLetterDate > todayStr) {
        stageErrors.proceedingLetterDate = 'Proceeding Date cannot be a future date.';
      }
      if (formData.paymentDate && formData.paymentDate > todayStr) {
        stageErrors.paymentDate = 'Lawyer Payment Date cannot be a future date.';
      }
      if (formData.assistantPaymentDate && formData.assistantPaymentDate > todayStr) {
        stageErrors.assistantPaymentDate = 'Assistant Payment Date cannot be a future date.';
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
      return Boolean(
        formData.circle &&
        formData.division &&
        formData.feeBillNumber.trim() &&
        formData.feeBillDate &&
        formData.receiptDate &&
        Object.keys(validateSingleStage(0)).length === 0
      );
    }
    if (stageIdx === 1) {
      return Boolean(
        formData.lawyerName.trim() &&
        formData.lawyerDesignation &&
        formData.casePertainsTo &&
        formData.caseDetails?.trim() &&
        Object.keys(validateSingleStage(1)).length === 0
      );
    }
    if (stageIdx === 2) {
      return Boolean(formData.totalFeeAmount > 0 && Object.keys(validateSingleStage(2)).length === 0);
    }
    if (stageIdx === 3) {
      return Boolean(
        (formData.goStatus === 'Not Required' || formData.goStatus === 'No' || formData.goNumber || formData.statusOfObtainingGo) &&
        Object.keys(validateSingleStage(3)).length === 0
      );
    }
    if (stageIdx === 4) {
      return Boolean(
        (formData.paymentStatus === 'Settled' || formData.statusOfPaymentProposal || formData.paymentStatus === 'Pending') &&
        Object.keys(validateSingleStage(4)).length === 0
      );
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

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleTabClick = (targetTabId: FormTabType) => {
    const targetIdx = TABS.findIndex((t) => t.id === targetTabId);
    if (isStageAccessible(targetIdx)) {
      setErrors({});
      setActiveTab(targetTabId);
    } else {
      validateUpToStage(currentTabIndex);
    }
  };

  const goToNextTab = () => {
    if (validateUpToStage(currentTabIndex)) {
      if (currentTabIndex < TABS.length - 1) {
        setActiveTab(TABS[currentTabIndex + 1].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUpToStage(currentTabIndex)) {
      onSave(formData);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const lawyerClaimAmount = calculateLawyerClaimAmount(
    formData.appearanceAmount,
    formData.conferenceAmount,
    formData.verifyingAmount
  );

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
            <ArrowLeft className="w-4 h-4" /> Cancel
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

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-500">Live Total Claim:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatINR(formData.totalFeeAmount)}</strong>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Record
          </button>
        </div>
      </div>

      {/* Sub-Navigation Lifecycle Tab Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
        <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5" aria-label="Lifecycle Stages">
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const accessible = isStageAccessible(idx);
            const completed = isStageCompleted(idx);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                disabled={!accessible}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : accessible
                    ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    : 'text-slate-400 dark:text-slate-600 opacity-60'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : completed
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
                    {completed && !isActive && <span className="text-emerald-600 text-[10px] font-black">✓</span>}
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
      {/* Order: Circle -> Division -> Fee Bill Number -> Fee Bill Date -> Receipt Date */}
      {/* ========================================================================= */}
      {activeTab === 'voucher' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Stage 1: Jurisdiction & Voucher Registration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select field office jurisdiction, fee bill number, voucher date, and receipt date in office
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
            {/* 1. Circle */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Circle Jurisdiction <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={activeCircles.map((c) => c.name)}
                value={formData.circle}
                onChange={handleCircleChange}
                required
              />
              {errors.circle && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.circle}</p>}
            </div>

            {/* 2. Division */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Division Jurisdiction <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={availableDivisions.map((d) => d.name)}
                value={formData.division}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, division: val }));
                  if (errors.division) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.division;
                      return next;
                    });
                  }
                }}
                required
              />
              {errors.division && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.division}</p>}
            </div>

            {/* 3. Fee Bill Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fee Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.feeBillNumber}
                onChange={(e) => handleFeeBillNoChange(e.target.value)}
                className={`w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border rounded-xl font-bold uppercase outline-none focus:ring-2 ${
                  errors.feeBillNumber || duplicateError
                    ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {errors.feeBillNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.feeBillNumber}</p>}
              {duplicateError && !errors.feeBillNumber && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">{duplicateError}</p>
              )}
            </div>

            {/* 4. Fee Bill Date */}
            <div>
              <DatePickerInput
                label="Fee Bill Date"
                required
                max={todayStr}
                value={formData.feeBillDate}
                onChange={(val) => setFormData((prev) => ({ ...prev, feeBillDate: val }))}
                error={errors.feeBillDate}
              />
            </div>

            {/* 5. Date of receipt in concerned office */}
            <div>
              <DatePickerInput
                label="Receipt Date in Office"
                required
                min={formData.feeBillDate || undefined}
                max={todayStr}
                value={formData.receiptDate || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, receiptDate: val }))}
                error={errors.receiptDate}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: LAW OFFICER & COURT CASE PARAMETERS                              */}
      {/* Order: Lawyer Name -> Lawyer Designation -> Case Pertains To -> Case Type -> Case Number & Year */}
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
                  All fields are mandatory. Assistant law officer is optional unless appearance fee is claimed.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* 1. Lawyer Name */}
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

            {/* 2. Lawyer Designation */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Lawyer Designation <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={lawyerDesignations}
                value={formData.lawyerDesignation}
                onChange={(val) => setFormData((prev) => ({ ...prev, lawyerDesignation: val }))}
                required
              />
              {errors.lawyerDesignation && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.lawyerDesignation}</p>}
            </div>

            {/* 3. Case Pertains To */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Case Pertains To <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={casePertainsToOptions}
                value={formData.casePertainsTo}
                onChange={(val) => setFormData((prev) => ({ ...prev, casePertainsTo: val as any }))}
                required
              />
              {errors.casePertainsTo && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.casePertainsTo}</p>}
            </div>

            {/* 4. Case Details / Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Case Details / Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.caseDetails || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, caseDetails: e.target.value }))}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.caseDetails && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.caseDetails}</p>}
            </div>
          </div>

          {/* Assistant Law Officer Section */}
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
                    <User className="w-4 h-4 text-indigo-600" /> Assistant Law Officer Particulars
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasAssistant(false);
                      setFormData((prev) => ({
                        ...prev,
                        assistantName: '',
                        assistantDesignation: '',
                        appearanceAmount: prev.appearanceAmount > 0 ? prev.appearanceAmount : 0,
                      }));
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Assistant
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assistant Law Officer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.assistantName || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, assistantName: e.target.value }))}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                    {errors.assistantName && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.assistantName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assistant Law Officer Designation <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={assistantDesignations.length > 0 ? assistantDesignations : lawyerDesignations}
                      value={formData.assistantDesignation || ''}
                      onChange={(val) => setFormData((prev) => ({ ...prev, assistantDesignation: val }))}
                    />
                    {errors.assistantDesignation && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.assistantDesignation}</p>
                    )}
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
                  Assistance fee is auto-computed as 1/3 of Appearance Fee only and settled as a separate payment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800">
                Lawyer Total: {formatINR(lawyerClaimAmount)}
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
                Grand Total: {formatINR(formData.totalFeeAmount)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* 1. Appearance */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                1. Appearance Fee (₹) {hasAssistant && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                min="0"
                value={formData.appearanceAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, appearanceAmount: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              {errors.appearanceAmount && (
                <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.appearanceAmount}</p>
              )}
              <DatePickerInput
                label="Appearance Date"
                max={todayStr}
                value={formData.appearanceDate}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    appearanceDate: val,
                    assistanceDate: val,
                  }))
                }
                error={errors.appearanceDate}
              />
            </div>

            {/* 2. Conference */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                2. Conference Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.conferenceAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, conferenceAmount: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <DatePickerInput
                label="Conference Date"
                max={todayStr}
                value={formData.conferenceDate}
                onChange={(val) => setFormData((prev) => ({ ...prev, conferenceDate: val }))}
                error={errors.conferenceDate}
              />
            </div>

            {/* 3. Opinion / Vetting */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                3. Opinion / Vetting Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.verifyingAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, verifyingAmount: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <DatePickerInput
                label="Opinion / Vetting Date"
                max={todayStr}
                value={formData.verifyingDate}
                onChange={(val) => setFormData((prev) => ({ ...prev, verifyingDate: val }))}
                error={errors.verifyingDate}
              />
            </div>

            {/* 4. Assistance (1/3 of Appearance Only) */}
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-extrabold text-blue-900 dark:text-blue-300">
                  4. Assistant Fee (₹)
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Auto (1/3 App)</span>
              </div>
              <input
                type="number"
                readOnly
                value={formData.assistanceAmount || 0}
                className="w-full h-10 px-3 bg-blue-100/80 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 rounded-xl font-black text-blue-900 dark:text-blue-100 cursor-not-allowed"
              />
              <DatePickerInput
                label="Assistance Date"
                max={todayStr}
                value={formData.assistanceDate}
                onChange={(val) => setFormData((prev) => ({ ...prev, assistanceDate: val }))}
                error={errors.assistanceDate}
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
                Whether G.O. Required <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={goStatusOptions}
                value={formData.goStatus || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, goStatus: val as GOStatusType }))}
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
                  <DatePickerInput
                    label="G.O. Date"
                    required
                    max={todayStr}
                    value={formData.goDate || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, goDate: val }))}
                    error={errors.goDate}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Branch: If G.O. Required == YES and Status is along the lines of "Proposal sent..." */}
          {(formData.goStatus === 'Yes' || formData.goStatus?.toLowerCase() === 'yes') &&
            Boolean(formData.statusOfObtainingGo) &&
            !formData.statusOfObtainingGo?.toLowerCase().includes('obtained') &&
            !formData.statusOfObtainingGo?.toLowerCase().includes('yet to be') &&
            (formData.statusOfObtainingGo?.toLowerCase().includes('proposal') ||
              formData.statusOfObtainingGo?.toLowerCase().includes('sent') ||
              formData.statusOfObtainingGo?.toLowerCase().includes('submitted')) && (
            <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> G.O. Proposal Reference Particulars
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference Letter Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.goReferenceLetterNo || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, goReferenceLetterNo: e.target.value }))}
                    placeholder="e.g. Lr. No. 1284/GO/2026"
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                  {errors.goReferenceLetterNo && (
                    <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.goReferenceLetterNo}</p>
                  )}
                </div>
                <div>
                  <DatePickerInput
                    label="Reference Letter Date"
                    required
                    max={todayStr}
                    value={formData.goReferenceLetterDate || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, goReferenceLetterDate: val }))}
                    error={errors.goReferenceLetterDate}
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
      {/* Swap Order: Payment Status first -> Status of Payment Proposal second     */}
      {/* Conditional: If Pending -> show Status of Payment Proposal; If Settled -> Settlement forms */}
      {/* Separate Payments: Lawyer Record + Assistant Record                       */}
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
                  Select payment status. When pending, track proposal movement. When settled, record individual disbursements.
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
              Status: {formData.paymentStatus || 'Pending'}
            </span>
          </div>

          {/* Primary Field: Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={paymentStatuses}
                value={formData.paymentStatus || 'Pending'}
                onChange={(val) => setFormData((prev) => ({ ...prev, paymentStatus: val as PaymentStatusType }))}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BRANCH A: IF PAYMENT STATUS IS PENDING                                     */}
          {/* ========================================================================= */}
          {formData.paymentStatus !== 'Settled' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* 2. Status of Payment Proposal */}
                <div className={formData.statusOfPaymentProposal?.toLowerCase().includes('proposal sent') && !formData.statusOfPaymentProposal?.toLowerCase().includes('yet to be') ? 'sm:col-span-2 md:col-span-2' : 'sm:col-span-1 md:col-span-3'}>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status of Payment Proposal
                  </label>
                  <SearchableSelect
                    options={statusOfPaymentProposalOptions}
                    value={formData.statusOfPaymentProposal || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, statusOfPaymentProposal: val }))}
                  />
                </div>

                {/* If proposal sent from... reveal reference letter number and date */}
                {Boolean(
                  formData.statusOfPaymentProposal &&
                  !formData.statusOfPaymentProposal.toLowerCase().includes('yet to be') &&
                  (
                    formData.statusOfPaymentProposal.toLowerCase().includes('proposal sent from') ||
                    formData.statusOfPaymentProposal.toLowerCase().includes('proposal sent')
                  )
                ) && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Reference Letter Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.letterNumber || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, letterNumber: e.target.value }))}
                        placeholder="e.g. Lr. No. 4521/2026/A2"
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <DatePickerInput
                        label="Reference Letter Date"
                        required
                        max={todayStr}
                        value={formData.letterDate || ''}
                        onChange={(val) => setFormData((prev) => ({ ...prev, letterDate: val }))}
                        error={errors.letterDate}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* If Status == Payment Sanction */}
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
                      <DatePickerInput
                        label="Proceeding / Letter Date"
                        max={todayStr}
                        value={formData.proceedingLetterDate || ''}
                        onChange={(val) => setFormData((prev) => ({ ...prev, proceedingLetterDate: val }))}
                        error={errors.proceedingLetterDate}
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sanctioned Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
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
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BRANCH B: IF PAYMENT STATUS IS SETTLED (TWO SEPARATE DISBURSEMENTS)       */}
          {/* ========================================================================= */}
          {formData.paymentStatus === 'Settled' && (
            <div className="space-y-6 animate-in fade-in">
              {/* 1. Primary Lawyer Settlement Record */}
              <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Lawyer Settlement & Bank Transfer Record</span>
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      ({formData.lawyerName || 'Primary Advocate'})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Net Deposited = Settled - IT Cess
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lawyer Claim Amount (₹)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatINR(lawyerClaimAmount)}
                      className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Settled Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.settledAmount || ''}
                      onChange={(e) => handleSettledAmountChange(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-emerald-700 dark:text-emerald-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      IT Cess (TDS ₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.itCess || ''}
                      onChange={(e) => handleItCessChange(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Net Deposited (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.amountDeposited || ''}
                      onChange={(e) => handleAmountDepositedChange(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-emerald-700 dark:text-emerald-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment UTR / RBI Ref No.
                    </label>
                    <input
                      type="text"
                      value={formData.utrRbiReference || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, utrRbiReference: e.target.value }))}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <DatePickerInput
                      label="Payment / Bank Date"
                      max={todayStr}
                      value={formData.paymentDate || ''}
                      onChange={(val) => setFormData((prev) => ({ ...prev, paymentDate: val }))}
                      error={errors.paymentDate}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Separate Assistant Settlement Record (If Assistant Added) */}
              {(hasAssistant || formData.assistantName?.trim() || (formData.assistanceAmount && formData.assistanceAmount > 0)) && (
                <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-4 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-800/60 pb-3">
                    <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>2. Assistant Law Officer Settlement & Bank Transfer Record</span>
                      <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400">
                        ({formData.assistantName || 'Assistant Counsel'})
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      Independent Assistant Disbursement
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Claim Amount (₹)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formatINR(formData.assistanceAmount)}
                        className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-700 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Settled Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.assistantSettledAmount || ''}
                        onChange={(e) => handleAssistantSettledAmountChange(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl font-black text-indigo-700 dark:text-indigo-300"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        IT Cess (TDS ₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.assistantItCess || ''}
                        onChange={(e) => handleAssistantItCessChange(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Net Deposited (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.assistantAmountDeposited || ''}
                        onChange={(e) => handleAssistantAmountDepositedChange(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl font-black text-indigo-700 dark:text-indigo-300"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment UTR / RBI Ref No.
                      </label>
                      <input
                        type="text"
                        value={formData.assistantUtrRbiReference || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, assistantUtrRbiReference: e.target.value }))}
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold uppercase"
                      />
                    </div>

                    <div>
                      <DatePickerInput
                        label="Payment / Bank Date"
                        max={todayStr}
                        value={formData.assistantPaymentDate || ''}
                        onChange={(val) => setFormData((prev) => ({ ...prev, assistantPaymentDate: val }))}
                        error={errors.assistantPaymentDate}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Combined Settlement Voucher Summary Card */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    Voucher Combined Disbursement Summary:
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Settled:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold">
                      {formatINR((formData.settledAmount || 0) + (formData.assistantSettledAmount || 0))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total IT Cess:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-extrabold">
                      - {formatINR((formData.itCess || 0) + (formData.assistantItCess || 0))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Net Deposited:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      {formatINR((formData.amountDeposited || 0) + (formData.assistantAmountDeposited || 0))}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stepper Navigation Footer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goToPrevTab}
          disabled={currentTabIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Stage
        </button>

        <button
          type="button"
          onClick={goToNextTab}
          disabled={currentTabIndex === TABS.length - 1}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next Stage <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
