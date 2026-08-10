'use client';

import React from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { formatINR } from '@/lib/feeBillMasterData';
import {
  PieChart,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
  Briefcase,
} from 'lucide-react';

interface FeeBillAnalysisDashboardProps {
  bills: FeeBillRecord[];
  masterData: FeeBillMasterDataConfig;
}

export const FeeBillAnalysisDashboard: React.FC<FeeBillAnalysisDashboardProps> = ({
  bills,
  masterData,
}) => {
  const activeBills = bills.filter((b) => !b.isDeleted && b.delete_status !== 'DELETED');
  const totalClaimsCount = activeBills.length;
  const totalClaimsAmount = activeBills.reduce((acc, b) => acc + (b.totalFeeAmount || 0), 0);

  const settledBills = activeBills.filter((b) => b.paymentStatus === 'Settled');
  const settledAmount = settledBills.reduce((acc, b) => acc + (b.settledAmount || b.totalFeeAmount || 0), 0);

  const unsettledBills = activeBills.filter((b) => b.paymentStatus !== 'Settled');
  const unsettledAmount = unsettledBills.reduce((acc, b) => acc + (b.totalFeeAmount || 0), 0);

  // Circle breakdown
  const circleStats = masterData.circles.map((c) => {
    const cBills = activeBills.filter((b) => b.circle === c.name);
    const amount = cBills.reduce((acc, b) => acc + (b.totalFeeAmount || 0), 0);
    return { name: c.name, count: cBills.length, amount };
  });

  return (
    <div className="space-y-6">
      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Claims Submitted</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatINR(totalClaimsAmount)}</div>
          <div className="text-xs text-slate-500 font-medium">{totalClaimsCount} Vouchers Recorded</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Settled & Paid</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatINR(settledAmount)}</div>
          <div className="text-xs text-emerald-600 font-medium">{settledBills.length} Claims Disbursed</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Outstanding Pending</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{formatINR(unsettledAmount)}</div>
          <div className="text-xs text-amber-600 font-medium">{unsettledBills.length} Pending Approval</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Settlement Rate</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
            {totalClaimsCount > 0 ? Math.round((settledBills.length / totalClaimsCount) * 100) : 0}%
          </div>
          <div className="text-xs text-purple-600 font-medium">Disbursement Efficiency</div>
        </div>
      </div>

      {/* Circle Breakdown Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" /> Circle Expenditure Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {circleStats.map((st) => (
            <div
              key={st.name}
              className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{st.name} Circle</span>
              <span className="text-lg font-black text-blue-900 dark:text-blue-300 block">{formatINR(st.amount)}</span>
              <span className="text-[10px] text-slate-400 font-medium block">{st.count} Claims</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
