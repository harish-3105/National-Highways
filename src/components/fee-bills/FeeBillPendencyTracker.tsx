'use client';

import React, { useState, useMemo } from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { formatINR, formatDateDMY } from '@/lib/feeBillMasterData';
import {
  Clock,
  Building,
  FileText,
  DollarSign,
} from 'lucide-react';

interface FeeBillPendencyTrackerProps {
  bills: FeeBillRecord[];
  masterData?: FeeBillMasterDataConfig;
  onViewBill: (bill: FeeBillRecord) => void;
}

type PendencyViewMode = 'all' | 'payment_proposal' | 'go_workflow';

export const FeeBillPendencyTracker: React.FC<FeeBillPendencyTrackerProps> = ({
  bills,
  masterData,
  onViewBill,
}) => {
  const [viewMode, setViewMode] = useState<PendencyViewMode>('all');

  // Filter active unsettled bills
  const activeUnsettledBills = useMemo(() => {
    return bills.filter((b) => !b.isDeleted && b.delete_status !== 'DELETED' && b.paymentStatus !== 'Settled');
  }, [bills]);

  // Vouchers relevant to Government Order (G.O.) workflow
  const goRelevantBills = useMemo(() => {
    return activeUnsettledBills.filter(
      (b) => b.goStatus === 'Yes' || b.goStatus?.toLowerCase() === 'yes' || Boolean(b.statusOfObtainingGo || b.goNumber)
    );
  }, [activeUnsettledBills]);

  // Vouchers relevant to Payment Proposal (PP) workflow
  const ppRelevantBills = useMemo(() => {
    return activeUnsettledBills;
  }, [activeUnsettledBills]);

  // Stages for Payment Proposal (PP) - strictly from DB master data & live bill values
  const ppStages = useMemo(() => {
    const configured = masterData?.statusOfPaymentProposalOptions || [];
    const billCustomStages = ppRelevantBills
      .map((b) => b.statusOfPaymentProposal)
      .filter((s): s is string => Boolean(s && !configured.includes(s)));

    return Array.from(new Set([...configured, ...billCustomStages]));
  }, [ppRelevantBills, masterData]);

  // Stages for Government Order (G.O.) - strictly from DB master data & live bill values
  const goStages = useMemo(() => {
    const configured = masterData?.statusOfObtainingGoOptions || [];
    const billCustomStages = goRelevantBills
      .map((b) => b.statusOfObtainingGo)
      .filter((s): s is string => Boolean(s && !configured.includes(s)));

    return Array.from(new Set([...configured, ...billCustomStages]));
  }, [goRelevantBills, masterData]);

  // Helper to match a bill to a PP stage
  const getBillPPStage = (b: FeeBillRecord): string => {
    if (b.statusOfPaymentProposal) return b.statusOfPaymentProposal;
    if (b.isSanctioned === 'Yes') return 'Payment Sanction';
    return 'Pending with DE';
  };

  // Helper to match a bill to a GO stage
  const getBillGOStage = (b: FeeBillRecord): string => {
    if (b.statusOfObtainingGo) return b.statusOfObtainingGo;
    if (b.goNumber) return 'G.O. Obtained';
    return 'Proposal Submitted to CE';
  };

  const totalUnsettledValue = activeUnsettledBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);
  const totalGoValue = goRelevantBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Summary & Category Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Fee Bill Pendency Tracker
          </h3>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Split Dual View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('payment_proposal')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'payment_proposal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> PP Workflow ({ppRelevantBills.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('go_workflow')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'go_workflow'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> G.O. Workflow ({goRelevantBills.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Unsettled</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                {activeUnsettledBills.length} Claims ({formatINR(totalUnsettledValue)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PAYMENT PROPOSAL (PP) WORKFLOW & STAGES                        */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || viewMode === 'payment_proposal') && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Payment Proposal Pipeline
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-xs font-extrabold text-white">
                {ppRelevantBills.length} Vouchers Pending Sanction
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-xs font-black text-emerald-300">
                {formatINR(totalUnsettledValue)}
              </span>
            </div>
          </div>

          {/* PP Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ppStages.map((stage) => {
              const stageBills = ppRelevantBills.filter((b) => getBillPPStage(b) === stage);
              const stageTotal = stageBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

              return (
                <div
                  key={stage}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">{stage}</span>
                      </h5>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md font-extrabold text-[11px] border border-blue-200 dark:border-blue-800">
                        {stageBills.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                      {stageBills.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">
                          No vouchers currently in this PP stage.
                        </p>
                      ) : (
                        stageBills.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => onViewBill(b)}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer space-y-1.5"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs">
                                {b.feeBillNumber}
                              </span>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs">
                                {formatINR(b.totalFeeAmount)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold truncate">
                              {b.lawyerName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                              <span className="truncate max-w-[150px]">{b.caseDetails || '—'}</span>
                              <span>{b.division}</span>
                            </div>
                            {b.letterNumber && (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold truncate pt-0.5">
                                Ref: {b.letterNumber}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Stage Value:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold">{formatINR(stageTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: GOVERNMENT ORDER (G.O.) WORKFLOW & STAGES                      */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || viewMode === 'go_workflow') && (
        <div className="space-y-4 pt-2">
          <div className="bg-gradient-to-r from-amber-900 to-orange-950 text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <FileText className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Government Order Pipeline
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-xs font-extrabold text-white">
                {goRelevantBills.length} Vouchers Requiring G.O.
              </span>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-xl text-xs font-black text-amber-300">
                {formatINR(totalGoValue)}
              </span>
            </div>
          </div>

          {/* G.O. Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goStages.map((stage) => {
              const stageBills = goRelevantBills.filter((b) => getBillGOStage(b) === stage);
              const stageTotal = stageBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

              return (
                <div
                  key={stage}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">{stage}</span>
                      </h5>
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-md font-extrabold text-[11px] border border-amber-200 dark:border-amber-800">
                        {stageBills.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                      {stageBills.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">
                          No vouchers currently in this G.O. stage.
                        </p>
                      ) : (
                        stageBills.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => onViewBill(b)}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer space-y-1.5"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-amber-900 dark:text-amber-300 text-xs">
                                {b.feeBillNumber}
                              </span>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs">
                                {formatINR(b.totalFeeAmount)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold truncate">
                              {b.lawyerName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                              <span className="truncate max-w-[150px]">{b.caseDetails || '—'}</span>
                              <span>{b.division}</span>
                            </div>
                            {b.goNumber && (
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold truncate pt-0.5">
                                G.O. No: {b.goNumber} {b.goDate ? `(${formatDateDMY(b.goDate)})` : ''}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Stage Value:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-extrabold">{formatINR(stageTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
