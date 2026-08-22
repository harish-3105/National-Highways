'use client';

import React, { useState, useMemo } from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { formatINR } from '@/lib/feeBillMasterData';
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Building,
  User,
  Scale,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { generateFeeBillsExcel, generateFeeBillsCSV } from '@/lib/export/feeBillsExportGenerator';

interface FeeBillAnalysisDashboardProps {
  bills: FeeBillRecord[];
  masterData: FeeBillMasterDataConfig;
  hideHeaderKpis?: boolean;
  initialPivotMode?: PivotGroupMode;
  onViewBill?: (bill: FeeBillRecord) => void;
  onEditBill?: (bill: FeeBillRecord) => void;
}

type PivotGroupMode = 'case' | 'lawyer' | 'division' | 'circle';

export const FeeBillAnalysisDashboard: React.FC<FeeBillAnalysisDashboardProps> = ({
  bills,
  masterData,
  hideHeaderKpis = false,
  initialPivotMode = 'case',
  onViewBill,
  onEditBill,
}) => {
  const [pivotMode, setPivotMode] = useState<PivotGroupMode>(initialPivotMode);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const activeBills = useMemo(() => {
    return bills.filter((b) => !b.isDeleted && b.delete_status !== 'DELETED');
  }, [bills]);

  // Overall Financial KPIs
  const totalClaimsCount = activeBills.length;
  const totalClaimsAmount = activeBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  const settledBills = activeBills.filter((b) => b.paymentStatus === 'Settled');
  const settledAmount = settledBills.reduce((acc, b) => acc + (Number(b.settledAmount) || Number(b.totalFeeAmount) || 0), 0);

  const unsettledBills = activeBills.filter((b) => b.paymentStatus !== 'Settled');
  const unsettledAmount = unsettledBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  const distinctCases = useMemo(() => {
    return new Set(activeBills.map((b) => b.caseNumber.trim().toUpperCase())).size;
  }, [activeBills]);

  const distinctLawyers = useMemo(() => {
    return new Set(activeBills.map((b) => b.lawyerName.trim().toUpperCase())).size;
  }, [activeBills]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const allKeys: Record<string, boolean> = {};
    if (pivotMode === 'case') {
      caseGroups.forEach((g) => { allKeys[g.caseNumber] = true; });
    } else if (pivotMode === 'lawyer') {
      lawyerGroups.forEach((g) => { allKeys[g.lawyerName] = true; });
    } else if (pivotMode === 'division') {
      divisionGroups.forEach((g) => { allKeys[g.division] = true; });
    }
    setExpandedGroups(allKeys);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  // 1. Group by Case Number
  const caseGroups = useMemo(() => {
    const map = new Map<string, {
      caseNumber: string;
      caseYear: string;
      caseType: string;
      casePertainsTo: string;
      division: string;
      circle: string;
      lawyers: Set<string>;
      assistants: Set<string>;
      vouchers: FeeBillRecord[];
      totalClaim: number;
      totalSettled: number;
      totalOutstanding: number;
      settledCount: number;
      unsettledCount: number;
    }>();

    activeBills.forEach((b) => {
      const key = b.caseNumber.trim() || 'Unspecified Case';
      if (!map.has(key)) {
        map.set(key, {
          caseNumber: key,
          caseYear: b.caseYear || '',
          caseType: b.caseType || '',
          casePertainsTo: b.casePertainsTo || '',
          division: b.division || '',
          circle: b.circle || '',
          lawyers: new Set<string>(),
          assistants: new Set<string>(),
          vouchers: [],
          totalClaim: 0,
          totalSettled: 0,
          totalOutstanding: 0,
          settledCount: 0,
          unsettledCount: 0,
        });
      }

      const item = map.get(key)!;
      if (b.lawyerName) item.lawyers.add(b.lawyerName);
      if (b.assistantName) item.assistants.add(b.assistantName);
      item.vouchers.push(b);
      item.totalClaim += Number(b.totalFeeAmount) || 0;
      if (b.paymentStatus === 'Settled') {
        item.totalSettled += Number(b.settledAmount) || Number(b.totalFeeAmount) || 0;
        item.settledCount += 1;
      } else {
        item.totalOutstanding += Number(b.totalFeeAmount) || 0;
        item.unsettledCount += 1;
      }
    });

    let list = Array.from(map.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) =>
        g.caseNumber.toLowerCase().includes(q) ||
        Array.from(g.lawyers).some((l) => l.toLowerCase().includes(q)) ||
        g.division.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.totalClaim - a.totalClaim);
  }, [activeBills, searchQuery]);

  // 2. Group by Lawyer
  const lawyerGroups = useMemo(() => {
    const map = new Map<string, {
      lawyerName: string;
      designation: string;
      cases: Set<string>;
      assistants: Set<string>;
      vouchers: FeeBillRecord[];
      totalClaim: number;
      totalSettled: number;
      totalOutstanding: number;
    }>();

    activeBills.forEach((b) => {
      const key = b.lawyerName.trim() || 'Unspecified Lawyer';
      if (!map.has(key)) {
        map.set(key, {
          lawyerName: key,
          designation: b.lawyerDesignation || '',
          cases: new Set<string>(),
          assistants: new Set<string>(),
          vouchers: [],
          totalClaim: 0,
          totalSettled: 0,
          totalOutstanding: 0,
        });
      }

      const item = map.get(key)!;
      if (b.caseNumber) item.cases.add(b.caseNumber);
      if (b.assistantName) item.assistants.add(b.assistantName);
      item.vouchers.push(b);
      item.totalClaim += Number(b.totalFeeAmount) || 0;
      if (b.paymentStatus === 'Settled') {
        item.totalSettled += Number(b.settledAmount) || Number(b.totalFeeAmount) || 0;
      } else {
        item.totalOutstanding += Number(b.totalFeeAmount) || 0;
      }
    });

    let list = Array.from(map.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) =>
        g.lawyerName.toLowerCase().includes(q) ||
        g.designation.toLowerCase().includes(q) ||
        Array.from(g.cases).some((c) => c.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.totalClaim - a.totalClaim);
  }, [activeBills, searchQuery]);

  // 3. Group by Division
  const divisionGroups = useMemo(() => {
    const map = new Map<string, {
      division: string;
      circle: string;
      cases: Set<string>;
      lawyers: Set<string>;
      assistants: Set<string>;
      vouchers: FeeBillRecord[];
      totalClaim: number;
      totalSettled: number;
      totalOutstanding: number;
    }>();

    activeBills.forEach((b) => {
      const key = b.division.trim() || 'Unspecified Division';
      if (!map.has(key)) {
        map.set(key, {
          division: key,
          circle: b.circle || '',
          cases: new Set<string>(),
          lawyers: new Set<string>(),
          assistants: new Set<string>(),
          vouchers: [],
          totalClaim: 0,
          totalSettled: 0,
          totalOutstanding: 0,
        });
      }

      const item = map.get(key)!;
      if (b.caseNumber) item.cases.add(b.caseNumber);
      if (b.lawyerName) item.lawyers.add(b.lawyerName);
      if (b.assistantName) item.assistants.add(b.assistantName);
      item.vouchers.push(b);
      item.totalClaim += Number(b.totalFeeAmount) || 0;
      if (b.paymentStatus === 'Settled') {
        item.totalSettled += Number(b.settledAmount) || Number(b.totalFeeAmount) || 0;
      } else {
        item.totalOutstanding += Number(b.totalFeeAmount) || 0;
      }
    });

    let list = Array.from(map.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) =>
        g.division.toLowerCase().includes(q) ||
        g.circle.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.totalClaim - a.totalClaim);
  }, [activeBills, searchQuery]);

  // Export handlers
  const handleExportExcel = async () => {
    const blob = await generateFeeBillsExcel({ bills: activeBills });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Fee_Bills_Pivot_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const blob = generateFeeBillsCSV({ bills: activeBills });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Fee_Bills_Pivot_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 6 Executive Financial KPI Cards */}
      {!hideHeaderKpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Claims</span>
              <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{formatINR(totalClaimsAmount)}</div>
            <div className="text-[11px] text-slate-500 font-semibold">{totalClaimsCount} Vouchers</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Settled & Paid</span>
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatINR(settledAmount)}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">{settledBills.length} Disbursed</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Outstanding</span>
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">{formatINR(unsettledAmount)}</div>
            <div className="text-[11px] text-amber-600 font-semibold">{unsettledBills.length} In Pipeline</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Settlement Rate</span>
              <div className="p-1.5 bg-purple-100 dark:bg-purple-950/60 rounded-lg text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-purple-700 dark:text-purple-300">
              {totalClaimsCount > 0 ? Math.round((settledBills.length / totalClaimsCount) * 100) : 0}%
            </div>
            <div className="text-[11px] text-purple-600 font-semibold">Of Claims Cleared</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Distinct Cases</span>
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-300">{distinctCases}</div>
            <div className="text-[11px] text-indigo-600 font-semibold">Cases Represented</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">Law Officers</span>
              <div className="p-1.5 bg-sky-100 dark:bg-sky-950/60 rounded-lg text-sky-600 dark:text-sky-400">
                <User className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-sky-900 dark:text-sky-300">{distinctLawyers}</div>
            <div className="text-[11px] text-sky-600 font-semibold">Empaneled Advocates</div>
          </div>
        </div>
      )}

      {/* Pivot Mode Navigation & Export Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Layers className="w-4 h-4 text-blue-600" /> Pivot View Mode:
          </span>
          <button
            type="button"
            onClick={() => { setPivotMode('case'); setExpandedGroups({}); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              pivotMode === 'case'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> Group by Case Number ({caseGroups.length})
          </button>
          <button
            type="button"
            onClick={() => { setPivotMode('lawyer'); setExpandedGroups({}); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              pivotMode === 'lawyer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Group by Lawyer ({lawyerGroups.length})
          </button>
          <button
            type="button"
            onClick={() => { setPivotMode('division'); setExpandedGroups({}); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              pivotMode === 'division'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Group by Division ({divisionGroups.length})
          </button>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <input
            type="text"
            placeholder="Filter matrix records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold cursor-pointer"
            title="Expand All Groups"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold cursor-pointer"
            title="Collapse All Groups"
          >
            Collapse
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PIVOT VIEW: GROUP BY CASE NUMBER                                       */}
      {/* ========================================================================= */}
      {pivotMode === 'case' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Case-Level Fee Expenditure Rollup Matrix ({caseGroups.length} Cases)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Aggregating all vouchers and advocate spendings by Court Case
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {caseGroups.map((group) => {
              const isExpanded = Boolean(expandedGroups[group.caseNumber]);
              return (
                <div key={group.caseNumber} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  {/* Group Header Row */}
                  <div
                    onClick={() => toggleGroup(group.caseNumber)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-blue-900 dark:text-blue-300">{group.caseNumber}</span>
                          {group.caseYear && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                              {group.caseYear}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                            {group.caseType || 'General Case'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            &bull; {group.division} ({group.circle})
                          </span>
                        </div>

                        {/* Associated Lawyers & Assistants */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                          <span>
                            <strong>Advocates:</strong> {Array.from(group.lawyers).join(', ') || 'None'}
                          </span>
                          {group.assistants.size > 0 && (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              &bull; <strong>Assistants:</strong> {Array.from(group.assistants).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Group Metrics */}
                    <div className="flex items-center gap-4 text-xs font-semibold shrink-0 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Vouchers</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{group.vouchers.length}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Claimed</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatINR(group.totalClaim)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Settled</span>
                        <span className="font-black text-emerald-600 text-sm">{formatINR(group.totalSettled)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-amber-600 uppercase font-bold block">Outstanding</span>
                        <span className="font-black text-amber-600 text-sm">{formatINR(group.totalOutstanding)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Vouchers Table */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                            <th className="py-2 px-3">Voucher Ref & Date</th>
                            <th className="py-2 px-3">Lawyer Name</th>
                            <th className="py-2 px-3">Assistant</th>
                            <th className="py-2 px-3 text-right">Appearance (₹)</th>
                            <th className="py-2 px-3 text-right">Conference (₹)</th>
                            <th className="py-2 px-3 text-right">Verifying (₹)</th>
                            <th className="py-2 px-3 text-right">Assistance 1/3 (₹)</th>
                            <th className="py-2 px-3 text-right">Total Claim (₹)</th>
                            <th className="py-2 px-3 text-right">Settled (₹)</th>
                            <th className="py-2 px-3">Pendency Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {group.vouchers.map((v) => (
                            <tr key={v.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                              <td className="py-2 px-3 font-bold text-blue-900 dark:text-blue-300">
                                <div>{v.feeBillNumber}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{v.feeBillDate}</div>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                {v.lawyerName}
                                <span className="block text-[10px] text-slate-400 font-normal">{v.lawyerDesignation}</span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                {v.assistantName || '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-medium">{formatINR(v.appearanceAmount)}</td>
                              <td className="py-2 px-3 text-right font-medium">{formatINR(v.conferenceAmount)}</td>
                              <td className="py-2 px-3 text-right font-medium">{formatINR(v.verifyingAmount)}</td>
                              <td className="py-2 px-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatINR(v.assistanceAmount)}</td>
                              <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatINR(v.totalFeeAmount)}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-600">{formatINR(v.settledAmount || 0)}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    v.paymentStatus === 'Settled'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {v.currentPendency}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PIVOT VIEW: GROUP BY LAWYER                                             */}
      {/* ========================================================================= */}
      {pivotMode === 'lawyer' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Lawyer-Level Fee Expenditure Rollup Matrix ({lawyerGroups.length} Advocates)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Aggregating all vouchers and court cases handled per Law Officer
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {lawyerGroups.map((group) => {
              const isExpanded = Boolean(expandedGroups[group.lawyerName]);
              return (
                <div key={group.lawyerName} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div
                    onClick={() => toggleGroup(group.lawyerName)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-indigo-950 dark:text-indigo-200">{group.lawyerName}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                            {group.designation || 'Advocate'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                          <span>
                            <strong>Cases Represented:</strong> {Array.from(group.cases).join(', ')}
                          </span>
                          {group.assistants.size > 0 && (
                            <span className="text-purple-600 dark:text-purple-400">
                              &bull; <strong>Associated Assistants:</strong> {Array.from(group.assistants).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold shrink-0 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cases</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{group.cases.size}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Vouchers</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{group.vouchers.length}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Claimed</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatINR(group.totalClaim)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Settled</span>
                        <span className="font-black text-emerald-600 text-sm">{formatINR(group.totalSettled)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-amber-600 uppercase font-bold block">Outstanding</span>
                        <span className="font-black text-amber-600 text-sm">{formatINR(group.totalOutstanding)}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                            <th className="py-2 px-3">Case Number</th>
                            <th className="py-2 px-3">Voucher Ref & Date</th>
                            <th className="py-2 px-3">Division</th>
                            <th className="py-2 px-3">Assistant</th>
                            <th className="py-2 px-3 text-right">Claim Amount (₹)</th>
                            <th className="py-2 px-3 text-right">Settled (₹)</th>
                            <th className="py-2 px-3">Pendency Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {group.vouchers.map((v) => (
                            <tr key={v.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{v.caseNumber}</td>
                              <td className="py-2 px-3 font-bold text-blue-900 dark:text-blue-300">
                                <div>{v.feeBillNumber}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{v.feeBillDate}</div>
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{v.division}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{v.assistantName || '-'}</td>
                              <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatINR(v.totalFeeAmount)}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-600">{formatINR(v.settledAmount || 0)}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    v.paymentStatus === 'Settled'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {v.currentPendency}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PIVOT VIEW: GROUP BY DIVISION                                           */}
      {/* ========================================================================= */}
      {pivotMode === 'division' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Division-Level Expenditure Rollup Matrix ({divisionGroups.length} Divisions)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Aggregating all legal spendings across Highways Divisions
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {divisionGroups.map((group) => {
              const isExpanded = Boolean(expandedGroups[group.division]);
              return (
                <div key={group.division} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div
                    onClick={() => toggleGroup(group.division)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100">{group.division} Division</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                            {group.circle} Circle
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                          <span>
                            <strong>Empaneled Advocates:</strong> {Array.from(group.lawyers).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold shrink-0 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cases</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{group.cases.size}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Vouchers</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{group.vouchers.length}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Claimed</span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatINR(group.totalClaim)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Settled</span>
                        <span className="font-black text-emerald-600 text-sm">{formatINR(group.totalSettled)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-amber-600 uppercase font-bold block">Outstanding</span>
                        <span className="font-black text-amber-600 text-sm">{formatINR(group.totalOutstanding)}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                            <th className="py-2 px-3">Lawyer Name</th>
                            <th className="py-2 px-3">Assistant</th>
                            <th className="py-2 px-3">Case Number</th>
                            <th className="py-2 px-3">Voucher Ref</th>
                            <th className="py-2 px-3 text-right">Claim Amount (₹)</th>
                            <th className="py-2 px-3 text-right">Settled (₹)</th>
                            <th className="py-2 px-3">Pendency Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {group.vouchers.map((v) => (
                            <tr key={v.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{v.lawyerName}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{v.assistantName || '-'}</td>
                              <td className="py-2 px-3 font-bold text-blue-900 dark:text-blue-300">{v.caseNumber}</td>
                              <td className="py-2 px-3 font-mono text-[11px]">{v.feeBillNumber}</td>
                              <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatINR(v.totalFeeAmount)}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-600">{formatINR(v.settledAmount || 0)}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    v.paymentStatus === 'Settled'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {v.currentPendency}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
