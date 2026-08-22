'use client';

import React, { useState, useEffect } from 'react';
import { FeeBillRecord, AuditLogEntry, PaymentStatusType } from '@/types/feeBill';
import { formatINR } from '@/lib/feeBillMasterData';
import {
  X,
  ShieldCheck,
  History,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface FeeBillAuditModalProps {
  contract: FeeBillRecord | null;
  isOpen: boolean;
  paymentStatuses?: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const FeeBillAuditModal: React.FC<FeeBillAuditModalProps> = ({
  contract,
  isOpen,
  paymentStatuses = [],
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [settledAmount, setSettledAmount] = useState<number>(0);
  const [itCess, setItCess] = useState<number>(0);
  const [utrRbiReference, setUtrRbiReference] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    if (contract) {
      setSelectedStatus(contract.paymentStatus || paymentStatuses[0] || '');
      setSettledAmount(contract.settledAmount || contract.totalFeeAmount || 0);
      setItCess(contract.itCess || Math.round((contract.totalFeeAmount || 0) * 0.1));
      setUtrRbiReference(contract.utrRbiReference || '');
      setPaymentDate(contract.paymentDate || new Date().toISOString().split('T')[0]);
    }
  }, [contract]);

  if (!isOpen || !contract) return null;

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const updatedRecord: FeeBillRecord = {
        ...contract,
        paymentStatus: selectedStatus as PaymentStatusType,
        settledAmount: selectedStatus === 'Settled' ? settledAmount : 0,
        itCess: selectedStatus === 'Settled' ? itCess : 0,
        utrRbiReference: selectedStatus === 'Settled' ? utrRbiReference : '',
        paymentDate: selectedStatus === 'Settled' ? paymentDate : '',
        currentPendency: selectedStatus === 'Settled' ? 'Settled' : contract.currentPendency,
      };

      const res = await fetch('/api/fee-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(data.message || 'Failed to update audit log status');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Server error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Audit & Sanction Settlement
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Voucher Ref: {contract.feeBillNumber} &bull; {contract.lawyerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Record Summary Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
              <span>{contract.caseNumber} ({contract.caseType})</span>
              <span className="text-blue-600 font-extrabold">{formatINR(contract.totalFeeAmount)}</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Division: {contract.division} &bull; Circle: {contract.circle}
            </p>
          </div>

          {/* Settlement Form Controls */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Update Disbursement Status
            </h4>

            <div className={`grid grid-cols-${Math.min(paymentStatuses.length, 3)} gap-3`}>
              {paymentStatuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                    selectedStatus === st
                      ? st === 'Settled'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Mark as {st.toUpperCase()}
                </button>
              ))}
            </div>

            {selectedStatus === 'Settled' && (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Final Settled Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={settledAmount}
                      onChange={(e) => setSettledAmount(Number(e.target.value))}
                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      IT Cess Deduction (₹)
                    </label>
                    <input
                      type="number"
                      value={itCess}
                      onChange={(e) => setItCess(Number(e.target.value))}
                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      UTR / RBI Reference No.
                    </label>
                    <input
                      type="text"
                      value={utrRbiReference}
                      onChange={(e) => setUtrRbiReference(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateStatus}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving Update...' : 'Confirm Audit Settlement'}
          </button>
        </div>
      </div>
    </div>
  );
};
