'use client';

import React, { useEffect } from 'react';
import { FeeBillRecord } from '@/types/feeBill';
import { formatINR } from '@/lib/feeBillMasterData';
import {
  X,
  Printer,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface FeeBillDetailModalProps {
  contract: FeeBillRecord | null;
  onClose: () => void;
}

export const FeeBillDetailModal: React.FC<FeeBillDetailModalProps> = ({
  contract,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contract) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contract, onClose]);

  if (!contract) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-print-modal-wrapper fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="legal-print-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between print:bg-blue-950 print:text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400 shrink-0 print:hidden" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-800 text-white rounded font-extrabold text-xs">
                  {contract.feeBillNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-extrabold text-xs border ${
                    contract.paymentStatus === 'Settled'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-amber-500 text-white border-amber-400'
                  }`}
                >
                  {contract.paymentStatus}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white mt-1">
                Legal Fee Voucher Record &bull; {contract.caseNumber}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 print-hide">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Export PDF / Print Letterhead
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="legal-print-scrollable p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200 print:p-6 print:text-slate-900">
          {/* Departmental Letterhead Banner */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Highways Department &bull; Government of Tamil Nadu
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Office of the Superintending Engineer / Executive Engineer &bull; {contract.circle} Circle ({contract.division})
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Lawyer Fee Claim Voucher &bull; Ref: {contract.feeBillNumber} &bull; Date: {contract.feeBillDate}
            </p>
          </div>

          {/* Grid Information Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Case Number</span>
              <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs mt-0.5 block">{contract.caseNumber}</span>
              <span className="text-[10px] text-slate-500">{contract.caseType} ({contract.caseYear})</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Jurisdiction Pertains To</span>
              <span className="font-extrabold text-purple-700 dark:text-purple-300 text-xs mt-0.5 block">{contract.casePertainsTo}</span>
              <span className="text-[10px] text-slate-500">{contract.division}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Claim Amount</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm mt-0.5 block">{formatINR(contract.totalFeeAmount)}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Pendency</span>
              <span className="font-bold text-amber-700 dark:text-amber-300 text-xs mt-0.5 block">{contract.currentPendency}</span>
            </div>
          </div>

          {/* Advocate Details */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl space-y-2">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> Law Officer / Advocate Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Lead Advocate:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{contract.lawyerName}</span>
                <span className="text-slate-500 block text-[11px] font-semibold">{contract.lawyerDesignation}</span>
              </div>
              {contract.assistantName && (
                <div>
                  <span className="text-slate-500 font-medium block">Assistant Advocate:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{contract.assistantName}</span>
                  <span className="text-slate-500 block text-[11px]">{contract.assistantDesignation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Fee Breakdown Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Itemized Fee Claim Calculation
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Fee Item Component</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Claim Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-200">1. Appearance Fee</td>
                    <td className="py-2 px-4 text-slate-500">{contract.appearanceDate || '-'}</td>
                    <td className="py-2 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatINR(contract.appearanceAmount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-200">2. Conference Fee</td>
                    <td className="py-2 px-4 text-slate-500">{contract.conferenceDate || '-'}</td>
                    <td className="py-2 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatINR(contract.conferenceAmount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-200">3. Verifying Fee</td>
                    <td className="py-2 px-4 text-slate-500">{contract.verifyingDate || '-'}</td>
                    <td className="py-2 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatINR(contract.verifyingAmount)}</td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <td className="py-2 px-4 font-bold text-blue-900 dark:text-blue-300">
                      4. Assistance Fee <span className="text-[10px] text-slate-400 font-normal">(1/3 of Appearance Fee only)</span>
                    </td>
                    <td className="py-2 px-4 text-slate-500">{contract.assistanceDate || '-'}</td>
                    <td className="py-2 px-4 text-right font-extrabold text-blue-700 dark:text-blue-300">{formatINR(contract.assistanceAmount)}</td>
                  </tr>
                  <tr className="bg-blue-50 dark:bg-blue-950/60 font-extrabold">
                    <td colSpan={2} className="py-3 px-4 text-blue-950 dark:text-blue-100 uppercase">
                      Total Fee Amount Claimed
                    </td>
                    <td className="py-3 px-4 text-right text-base text-blue-900 dark:text-blue-200">
                      {formatINR(contract.totalFeeAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* G.O. Workflow Details */}
          {contract.goStatus === 'Yes' && (
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
              <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> Government Order (G.O.) Particulars
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Status of Obtaining G.O.:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{contract.statusOfObtainingGo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">G.O. Number:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{contract.goNumber || 'Pending'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">G.O. Date:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{contract.goDate || 'Pending'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settlement or Proposal Details */}
          {contract.paymentStatus === 'Settled' || (contract.settledAmount && contract.settledAmount > 0) ? (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Disbursement & UTR Settlement Record
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Settled Amount:</span>
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-200">{formatINR(contract.settledAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">IT Cess:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(contract.itCess)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Net Deposited:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatINR(contract.amountDeposited || ((contract.settledAmount || 0) - (contract.itCess || 0)))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">UTR Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">{contract.utrRbiReference || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Date:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{contract.paymentDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Payment Proposal & Sanction Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Proposal Status:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{contract.statusOfPaymentProposal || contract.currentPendency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sanction Order / Proc No:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{contract.proceedingLetterNo || 'Pending'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sanctioned Amount:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{contract.sanctionedAmount ? formatINR(contract.sanctionedAmount) : 'Pending'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sanction Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.proceedingLetterDate || '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 print-hide">
          <span className="text-xs text-slate-400 font-mono">
            Tamil Nadu Highways Dept &bull; Legal Fee Management System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Card
          </button>
        </div>
      </div>
    </div>
  );
};
