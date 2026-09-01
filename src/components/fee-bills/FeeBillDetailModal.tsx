'use client';

import React, { useState, useEffect } from 'react';
import { FeeBillRecord } from '@/types/feeBill';
import { formatINR, formatDateDMY, calculateLawyerClaimAmount } from '@/lib/feeBillMasterData';
import {
  X,
  Printer,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Building,
  Calculator,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Scale,
} from 'lucide-react';

interface FeeBillDetailModalProps {
  contract: FeeBillRecord | null;
  onClose: () => void;
}

type FeeBillStageType = 'voucher' | 'lawyer' | 'breakdown' | 'go' | 'payment';

interface StageDefinition {
  id: FeeBillStageType;
  label: string;
  step: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'voucher',
    label: 'Voucher & Office',
    step: 'Stage 1',
    subtitle: 'Voucher particulars, reference letters & field division',
    icon: Building,
  },
  {
    id: 'lawyer',
    label: 'Law Officer & Case',
    step: 'Stage 2',
    subtitle: 'Lead advocate, assistant counsel & associated case details',
    icon: User,
  },
  {
    id: 'breakdown',
    label: 'Fee Breakdown',
    step: 'Stage 3',
    subtitle: 'Itemized fee claims, dates & auto-calculated total',
    icon: Calculator,
  },
  {
    id: 'go',
    label: 'G.O. Workflow',
    step: 'Stage 4',
    subtitle: 'Government Order requirement, status & sanction orders',
    icon: FileText,
  },
  {
    id: 'payment',
    label: 'Payment & Settlement',
    step: 'Stage 5',
    subtitle: 'Disbursement, TDS IT-cess, net deposits & banking UTR',
    icon: DollarSign,
  },
];

export const FeeBillDetailModal: React.FC<FeeBillDetailModalProps> = ({
  contract,
  onClose,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  useEffect(() => {
    if (contract) {
      setActiveStageIndex(0);
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [contract, onClose]);

  if (!contract) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
    }
  };

  const handleNextStage = () => {
    if (activeStageIndex < STAGES.length - 1) {
      setActiveStageIndex((prev) => prev + 1);
    }
  };

  const lawyerClaim = calculateLawyerClaimAmount(
    contract.appearanceAmount || 0,
    contract.conferenceAmount || 0,
    contract.verifyingAmount || 0
  );

  return (
    <div
      className="legal-print-modal-wrapper fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden print:p-0 print:bg-white print:static animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="legal-print-card bg-slate-50 dark:bg-slate-950 w-full h-full overflow-hidden flex flex-col relative print:border-none print:shadow-none print:max-h-none print:h-auto print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print:bg-blue-950 print:text-white border-b border-blue-950">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl shrink-0 print:hidden">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-blue-800 text-white rounded-md font-extrabold text-xs">
                    {contract.feeBillNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs border ${
                      contract.paymentStatus === 'Settled'
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-amber-500 text-white border-amber-400'
                    }`}
                  >
                    {contract.paymentStatus || 'Pending'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-white/10 text-white rounded-md font-mono text-xs font-bold">
                    {formatINR(contract.totalFeeAmount)}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-white mt-1">
                  Legal Fee Voucher Record &bull; {contract.caseDetails || 'Case Record'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 print-hide">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Export PDF / Print
              </button>
              <button
                onClick={onClose}
                className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 5-STAGE LIFECYCLE SUB-NAVIGATION BAR */}
        <div className="bg-white dark:bg-slate-900 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isActive = activeStageIndex === idx;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageIndex(idx)}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {stage.step}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-xs font-bold truncate w-full">{stage.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="legal-print-scrollable p-6 md:p-8 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 print:p-6 print:text-slate-900 flex-1">
          <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Departmental Letterhead Banner (Print only) */}
          <div className="hidden print:block text-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Highways Department &bull; Government of Tamil Nadu
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Office of the Superintending Engineer / Executive Engineer &bull; {contract.circle} Circle ({contract.division})
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Lawyer Fee Claim Voucher &bull; Ref: {contract.feeBillNumber} &bull; Date: {formatDateDMY(contract.feeBillDate)}
            </p>
          </div>

          {/* ========================================================= */}
          {/* STAGE 1: Voucher & Office */}
          {/* ========================================================= */}
          {activeStageIndex === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 1: Fee Bill Voucher & Field Office
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Circle Jurisdiction</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{contract.circle}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Division Jurisdiction</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{contract.division}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee Bill Number</span>
                  <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs mt-0.5 block">{contract.feeBillNumber}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee Bill Date</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateDMY(contract.feeBillDate)}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Receipt Date in Office</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                    📅 {formatDateDMY(contract.receiptDate)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Pendency Lifecycle Stage</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-xs mt-0.5 block">
                    {contract.currentPendency || '—'}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-lg">
                  Stage 1 Complete
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: Law Officer & Case */}
          {/* ========================================================= */}
          {activeStageIndex === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 2: Law Officer & Court Case Particulars
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                    Lead Advocate / Law Officer
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{contract.lawyerName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{contract.lawyerDesignation || 'Government Advocate'}</p>
                </div>

                {contract.assistantName ? (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block">
                      Assistant Law Officer
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{contract.assistantName}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{contract.assistantDesignation || 'Assistant Counsel'}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                    No assistant law officer assigned
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Number / Year</span>
                  <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs mt-0.5 block">
                    {contract.caseDetails || '—'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Pertains To</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300 text-xs mt-0.5 block">{contract.casePertainsTo || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: Fee Breakdown */}
          {/* ========================================================= */}
          {activeStageIndex === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Stage 3: Itemized Fee Claim Calculation
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800">
                    Lawyer Claim: {formatINR(lawyerClaim)}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
                    Grand Total: {formatINR(contract.totalFeeAmount)}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Fee Item Component</th>
                      <th className="py-2.5 px-4">Beneficiary</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4 text-right">Claim Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">1. Appearance Fee</td>
                      <td className="py-2.5 px-4 font-sans text-slate-500">{contract.lawyerName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDateDMY(contract.appearanceDate)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(contract.appearanceAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">2. Conference Fee</td>
                      <td className="py-2.5 px-4 font-sans text-slate-500">{contract.lawyerName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDateDMY(contract.conferenceDate)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(contract.conferenceAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">3. Opinion / Vetting Fee</td>
                      <td className="py-2.5 px-4 font-sans text-slate-500">{contract.lawyerName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDateDMY(contract.verifyingDate)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(contract.verifyingAmount)}
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/30 dark:bg-indigo-950/20">
                      <td className="py-2.5 px-4 font-sans font-medium text-indigo-900 dark:text-indigo-200">
                        4. Assistant Fee (1/3 of Appearance)
                      </td>
                      <td className="py-2.5 px-4 font-sans text-indigo-700 dark:text-indigo-400">
                        {contract.assistantName || 'Assistant Counsel'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDateDMY(contract.assistanceDate)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-indigo-900 dark:text-indigo-200">
                        {formatINR(contract.assistanceAmount)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold">
                      <td colSpan={3} className="py-3 px-4 font-sans text-emerald-900 dark:text-emerald-300 uppercase text-[11px]">
                        Total Live Voucher Claim Amount
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                        {formatINR(contract.totalFeeAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 4: G.O. Workflow */}
          {/* ========================================================= */}
          {activeStageIndex === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 4: Government Order (G.O.) Sanction Track
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Whether G.O. Required</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">{contract.goStatus || 'Not Required'}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status of Obtaining G.O.</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-xs mt-0.5 block">{contract.statusOfObtainingGo || '—'}</span>
                </div>

                {(contract.goNumber || contract.goDate) && (
                  <>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">G.O. Number</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        {contract.goNumber || '—'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">G.O. Date</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        📅 {formatDateDMY(contract.goDate)}
                      </span>
                    </div>
                  </>
                )}

                {(contract.goReferenceLetterNo || contract.goReferenceLetterDate) && (
                  <>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">G.O. Proposal Ref Letter No</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        {contract.goReferenceLetterNo || '—'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">G.O. Proposal Ref Letter Date</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        📅 {formatDateDMY(contract.goReferenceLetterDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 5: Payment & Settlement */}
          {/* ========================================================= */}
          {activeStageIndex === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Stage 5: Payment Proposal, Sanction & Banking Settlement
                </h3>
              </div>

              {/* Status Header */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Status</span>
                  <span className={`font-extrabold text-sm ${contract.paymentStatus === 'Settled' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {contract.paymentStatus || 'Pending'}
                  </span>
                </div>
                {contract.statusOfPaymentProposal && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Proposal Stage</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {contract.statusOfPaymentProposal}
                    </span>
                  </div>
                )}
              </div>

              {/* If Proposal / Sanction Orders */}
              {(contract.proceedingLetterNo || contract.letterNumber || contract.sanctionedAmount) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {contract.letterNumber && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {contract.statusOfPaymentProposal?.toLowerCase().includes('proceeding')
                          ? 'Proceeding No'
                          : contract.statusOfPaymentProposal?.toLowerCase().includes('approval')
                          ? 'Approval / Letter No'
                          : 'Reference Letter No'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        {contract.letterNumber}
                      </span>
                    </div>
                  )}
                  {contract.letterDate && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {contract.statusOfPaymentProposal?.toLowerCase().includes('proceeding')
                          ? 'Date for Proceeding'
                          : contract.statusOfPaymentProposal?.toLowerCase().includes('approval')
                          ? 'Approval Date'
                          : 'Reference Letter Date'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        📅 {formatDateDMY(contract.letterDate)}
                      </span>
                    </div>
                  )}
                  {contract.proceedingLetterNo && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Proceeding No</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                        {contract.proceedingLetterNo}
                      </span>
                    </div>
                  )}
                  {contract.sanctionedAmount ? (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Sanctioned Amount</span>
                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs mt-0.5 block">
                        {formatINR(contract.sanctionedAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Settlement Records */}
              {contract.paymentStatus === 'Settled' && (
                <div className="space-y-4">
                  {/* 1. Lawyer Settlement Record */}
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>1. Primary Lawyer Settlement: {contract.lawyerName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                        Claimed: {formatINR(lawyerClaim)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Settled (Gross)</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono block mt-0.5">
                          {formatINR(contract.settledAmount || 0)}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">IT Cess (TDS)</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
                          - {formatINR(contract.itCess || 0)}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">Net Deposited</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                          {formatINR(contract.amountDeposited || 0)}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">UTR Reference</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] block mt-0.5 truncate">
                          {contract.utrRbiReference || '—'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Date</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] block mt-0.5">
                          📅 {formatDateDMY(contract.paymentDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Assistant Settlement Record (if assistant is present) */}
                  {(contract.assistantName || Boolean(contract.assistantSettledAmount && contract.assistantSettledAmount > 0)) && (
                    <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
                      <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span>2. Assistant Law Officer Settlement: {contract.assistantName || 'Assistant Counsel'}</span>
                        </div>
                        <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-400">
                          Claimed: {formatINR(contract.assistanceAmount || 0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Settled Amount</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono block mt-0.5">
                            {formatINR(contract.assistantSettledAmount || 0)}
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">IT Cess (TDS)</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
                            - {formatINR(contract.assistantItCess || 0)}
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-indigo-700 uppercase font-bold block">Net Deposited</span>
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono block mt-0.5">
                            {formatINR(contract.assistantAmountDeposited || 0)}
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">UTR / RBI Ref No.</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] block mt-0.5 truncate">
                            {contract.assistantUtrRbiReference || '—'}
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Date</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] block mt-0.5">
                            📅 {formatDateDMY(contract.assistantPaymentDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Combined Totals */}
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Voucher Total Net Disbursement:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-black text-sm">
                      {formatINR((contract.amountDeposited || 0) + (contract.assistantAmountDeposited || 0))}
                    </strong>
                  </div>
                </div>
              )}

              {/* Remarks Field (Stage 5 / Final Field) */}
              {contract.remarks && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Remarks / Notes</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                    {contract.remarks}
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="bg-white dark:bg-slate-900 px-6 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
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
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close Voucher
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeStageIndex < STAGES.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer transition-all"
                >
                  <span>Next: {STAGES[activeStageIndex + 1].label}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeBillDetailModal;
