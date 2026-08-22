'use client';

import React from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { formatINR } from '@/lib/feeBillMasterData';
import { Clock, Building, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FeeBillPendencyTrackerProps {
  bills: FeeBillRecord[];
  masterData?: FeeBillMasterDataConfig;
  onViewBill: (bill: FeeBillRecord) => void;
}

export const FeeBillPendencyTracker: React.FC<FeeBillPendencyTrackerProps> = ({
  bills,
  masterData,
  onViewBill,
}) => {
  const pendingBills = bills.filter((b) => b.paymentStatus !== 'Settled');

  // Derive unique pendency stages dynamically from masterData and bills
  const pendencyStages = React.useMemo(() => {
    const configuredStages = [
      ...(masterData?.statusOfObtainingGoOptions || []),
      ...(masterData?.statusOfPaymentProposalOptions || []),
    ];
    const billStages = pendingBills.map((b) => b.currentPendency).filter(Boolean);
    return Array.from(new Set([...configuredStages, ...billStages]));
  }, [pendingBills, masterData]);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Inter-Office Fee Bill Movement & Pendency Tracker
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Step-by-step movement tracking: Division Engineer (DE) &rarr; Superintending Engineer (SE) &rarr; Chief Engineer (CE) &rarr; MoRTH
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-bold block">Pending Vouchers</span>
            <span className="font-extrabold text-amber-900 dark:text-amber-100 text-sm">{pendingBills.length} Claims</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
            <span className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-bold block">Pending Value</span>
            <span className="font-extrabold text-blue-900 dark:text-blue-100 text-sm">
              {formatINR(pendingBills.reduce((acc, b) => acc + (b.totalFeeAmount || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Stage Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendencyStages.map((stage) => {
          const stageBills = pendingBills.filter((b) => b.currentPendency === stage);
          const stageTotal = stageBills.reduce((acc, b) => acc + (b.totalFeeAmount || 0), 0);

          return (
            <div
              key={stage}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" /> {stage}
                  </h4>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-extrabold text-[11px]">
                    {stageBills.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                  {stageBills.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-4 text-center">No vouchers pending at this stage.</p>
                  ) : (
                    stageBills.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onViewBill(b)}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs">{b.feeBillNumber}</span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs">{formatINR(b.totalFeeAmount)}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate">{b.lawyerName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{b.caseNumber} &bull; {b.division}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span>Stage Total:</span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{formatINR(stageTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
