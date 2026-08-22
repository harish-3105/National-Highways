'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { DEFAULT_MASTER_DATA, formatINR } from '@/lib/feeBillMasterData';
import { FeeBillListTable } from './FeeBillListTable';
import { FeeBillDataEntryForm } from './FeeBillDataEntryForm';
import { FeeBillPendencyTracker } from './FeeBillPendencyTracker';
import { FeeBillAnalysisDashboard } from './FeeBillAnalysisDashboard';
import { MasterDataManagement } from './MasterDataManagement';
import { FeeBillDetailModal } from './FeeBillDetailModal';
import { FeeBillAuditModal } from './FeeBillAuditModal';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
  FileText,
  Plus,
  Clock,
  PieChart,
  Settings,
  Search,
  AlertTriangle,
  Archive,
  RefreshCw,
  Download,
  Layers,
  DollarSign,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { generateFeeBillsExcel } from '@/lib/export/feeBillsExportGenerator';

type PortalTab = 'workspace' | 'create' | 'settings';
type WorkspaceViewMode = 'ledger' | 'pivot' | 'pendency' | 'analytics';
type KpiCardType = 'all' | 'settled' | 'pending' | 'cases';

export function FeeBillManagementPortal() {
  const [activeTab, setActiveTab] = useState<PortalTab>('workspace');
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('ledger');
  const [activeKpiCard, setActiveKpiCard] = useState<KpiCardType>('all');
  const [bills, setBills] = useState<FeeBillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<FeeBillMasterDataConfig>(DEFAULT_MASTER_DATA);

  // Filters (Shared globally across all workspace views)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [viewingBill, setViewingBill] = useState<FeeBillRecord | null>(null);
  const [editingBill, setEditingBill] = useState<FeeBillRecord | null>(null);
  const [auditingBill, setAuditingBill] = useState<FeeBillRecord | null>(null);
  const [deletingBill, setDeletingBill] = useState<FeeBillRecord | null>(null);

  // Fetch Central Master Data Config from Database
  const fetchMasterData = useCallback(async () => {
    try {
      const res = await fetch('/api/fee-bills/master-data');
      const data = await res.json();
      if (data.success && data.masterData) {
        setMasterData(data.masterData);
      }
    } catch {
      // keep fallback state
    }
  }, []);

  // Fetch Fee Bills Ledger Records from Database
  const fetchFeeBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCircle) params.set('circle', selectedCircle);
      if (selectedDivision) params.set('division', selectedDivision);
      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') params.set('paymentStatus', paymentStatusFilter);
      if (showArchived) params.set('includeDeleted', 'true');

      const res = await fetch(`/api/fee-bills?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.feeBills)) {
        setBills(data.feeBills);
      }
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCircle, selectedDivision, paymentStatusFilter, showArchived]);

  useEffect(() => {
    fetchMasterData();
    fetchFeeBills();
  }, [fetchMasterData, fetchFeeBills]);

  // Overall Financial KPIs for Active Filtered Results
  const activeBills = useMemo(() => {
    return bills.filter((b) => !b.isDeleted && b.delete_status !== 'DELETED');
  }, [bills]);

  const totalClaimsCount = activeBills.length;
  const totalClaimsAmount = activeBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  const settledBills = activeBills.filter((b) => b.paymentStatus === 'Settled');
  const settledAmount = settledBills.reduce(
    (acc, b) => acc + (Number(b.settledAmount) || Number(b.totalFeeAmount) || 0),
    0
  );

  const unsettledBills = activeBills.filter((b) => b.paymentStatus !== 'Settled');
  const unsettledAmount = unsettledBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  const distinctCases = useMemo(() => {
    return new Set(activeBills.map((b) => (b.caseNumber || '').trim().toUpperCase()).filter(Boolean)).size;
  }, [activeBills]);

  const distinctLawyers = useMemo(() => {
    return new Set(activeBills.map((b) => (b.lawyerName || '').trim().toUpperCase()).filter(Boolean)).size;
  }, [activeBills]);

  const hasActiveFilters = Boolean(
    searchTerm || selectedCircle || selectedDivision || paymentStatusFilter !== 'ALL' || showArchived
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCircle('');
    setSelectedDivision('');
    setPaymentStatusFilter('ALL');
    setActiveKpiCard('all');
    setShowArchived(false);
  };

  // Export handlers
  const handleExportExcel = async () => {
    const active = bills.filter((b) => !b.isDeleted && b.delete_status !== 'DELETED');
    const blob = await generateFeeBillsExcel({ bills: active });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Fee_Bills_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Persist updated master data centrally to database
  const handleUpdateMasterData = async (newData: FeeBillMasterDataConfig) => {
    setMasterData(newData);
    try {
      await fetch('/api/fee-bills/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch {
      // error handling
    }
  };

  const handleSaveBill = async (record: FeeBillRecord) => {
    try {
      const res = await fetch('/api/fee-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const data = await res.json();
      if (data.success) {
        setEditingBill(null);
        setActiveTab('workspace');
        fetchFeeBills();
      }
    } catch {
      // error handling
    }
  };

  const handleDeleteBill = async (bill: FeeBillRecord) => {
    try {
      const res = await fetch(`/api/fee-bills?id=${encodeURIComponent(bill.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeletingBill(null);
        fetchFeeBills();
      }
    } catch {
      // error handling
    }
  };

  const handleRestoreBill = async (bill: FeeBillRecord) => {
    try {
      const restoredRecord: FeeBillRecord = {
        ...bill,
        delete_status: 'ACTIVE',
        isDeleted: false,
      };
      const res = await fetch('/api/fee-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoredRecord),
      });
      const data = await res.json();
      if (data.success) {
        fetchFeeBills();
      }
    } catch {
      // error handling
    }
  };

  const availableDivisions = (masterData.divisions || []).filter(
    (d) => (!selectedCircle || d.circleName === selectedCircle) && d.active
  );

  if (activeTab === 'create') {
    return (
      <FeeBillDataEntryForm
        initialData={editingBill || undefined}
        existingBills={bills}
        masterData={masterData}
        onSave={handleSaveBill}
        onCancel={() => {
          setEditingBill(null);
          setActiveTab('workspace');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md text-lg">
            ₹
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
              Legal & Lawyer Fee Bill Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Highways Department &bull; G.O. Claims, Assistance Fee Calculator & Pendency Audit System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              fetchMasterData();
              fetchFeeBills();
            }}
            disabled={loading}
            className="p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingBill(null);
              setActiveTab('create');
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Fee Bill Voucher</span>
          </button>
        </div>
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fee Claims Workspace ({bills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Master Data Config</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Mutually Exclusive Interactive KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: All Claims */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('all');
                setPaymentStatusFilter('ALL');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeKpiCard === 'all'
                  ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Total Claims
                </span>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatINR(totalClaimsAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mt-1">
                <span>{totalClaimsCount} Vouchers</span>
                {activeKpiCard === 'all' && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </button>

            {/* Card 2: Settled Claims */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('settled');
                setPaymentStatusFilter('Settled');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeKpiCard === 'settled'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Settled & Paid
                </span>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {formatINR(settledAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mt-1">
                <span>{settledBills.length} Disbursed</span>
                {activeKpiCard === 'settled' && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </button>

            {/* Card 3: Pending Settlement */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('pending');
                setPaymentStatusFilter('Not Settled');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeKpiCard === 'pending'
                  ? 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Pending Settlement
                </span>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
                {formatINR(unsettledAmount)}
              </div>
              <div className="flex items-center justify-between text-xs text-amber-600 font-semibold mt-1">
                <span>{unsettledBills.length} In Scrutiny</span>
                {activeKpiCard === 'pending' && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </button>

            {/* Card 4: Cases & Advocates Represented */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('cases');
                setViewMode('pivot');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeKpiCard === 'cases'
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Cases & Counsel
                </span>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-indigo-900 dark:text-indigo-200">
                {distinctCases} <span className="text-sm font-semibold text-slate-500">Cases</span>
              </div>
              <div className="flex items-center justify-between text-xs text-indigo-600 font-semibold mt-1">
                <span>{distinctLawyers} Advocates</span>
                {activeKpiCard === 'cases' && (
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Streamlined Single-Bar Toolbar (Layout A) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left Side: Compact Search + Circle + Division Filters */}
              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                {/* Search Bar with Quick Clear */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Voucher, Case, Advocate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Circle Select */}
                <div className="w-40">
                  <SearchableSelect
                    options={['All Circles', ...(masterData.circles || []).filter((c) => c.active).map((c) => c.name)]}
                    value={selectedCircle ? `${selectedCircle}` : 'All Circles'}
                    onChange={(val) => {
                      setSelectedCircle(val === 'All Circles' ? '' : val);
                      setSelectedDivision('');
                    }}
                    placeholder="Circle..."
                  />
                </div>

                {/* Division Select */}
                <div className="w-44">
                  <SearchableSelect
                    options={['All Divisions', ...availableDivisions.map((d) => d.name)]}
                    value={selectedDivision ? `${selectedDivision}` : 'All Divisions'}
                    onChange={(val) => setSelectedDivision(val === 'All Divisions' ? '' : val)}
                    placeholder="Division..."
                  />
                </div>

                {/* Clear Filters Button (Shows only when active filters exist) */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                    title="Reset all filters and search"
                  >
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Right Side: View Switcher + Show Archived */}
              <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                {/* Segmented View Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('ledger')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'ledger'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('pivot')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'pivot'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Pivot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('pendency')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'pendency'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendency</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('analytics')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'analytics'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </button>
                </div>

                {/* Show Archived Toggle */}
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    showArchived
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle soft deleted vouchers"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{showArchived ? 'Archived' : 'Show Archived'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Active View Display */}
          {viewMode === 'ledger' && (
            <FeeBillListTable
              bills={bills}
              loading={loading}
              masterData={masterData}
              onView={(b) => setViewingBill(b)}
              onEdit={(b) => {
                setEditingBill(b);
                setActiveTab('create');
              }}
              onAudit={(b) => setAuditingBill(b)}
              onDelete={(b) => setDeletingBill(b)}
              onRestore={(b) => handleRestoreBill(b)}
            />
          )}

          {viewMode === 'pivot' && (
            <FeeBillAnalysisDashboard
              bills={bills}
              masterData={masterData}
              hideHeaderKpis={true}
              initialPivotMode="case"
              onViewBill={(b) => setViewingBill(b)}
              onEditBill={(b) => {
                setEditingBill(b);
                setActiveTab('create');
              }}
            />
          )}

          {viewMode === 'pendency' && (
            <FeeBillPendencyTracker
              bills={bills}
              masterData={masterData}
              onViewBill={(b) => setViewingBill(b)}
            />
          )}

          {viewMode === 'analytics' && (
            <FeeBillAnalysisDashboard
              bills={bills}
              masterData={masterData}
              hideHeaderKpis={true}
              initialPivotMode="circle"
              onViewBill={(b) => setViewingBill(b)}
              onEditBill={(b) => {
                setEditingBill(b);
                setActiveTab('create');
              }}
            />
          )}
        </div>
      )}

      {/* SETTINGS AREA */}
      {activeTab === 'settings' && (
        <MasterDataManagement
          masterData={masterData}
          onUpdateMasterData={(newData) => handleUpdateMasterData(newData)}
        />
      )}

      {/* Modals Suite */}
      <FeeBillDetailModal contract={viewingBill} onClose={() => setViewingBill(null)} />

      <FeeBillAuditModal
        contract={auditingBill}
        isOpen={!!auditingBill}
        paymentStatuses={masterData.paymentStatuses}
        onClose={() => setAuditingBill(null)}
        onSuccess={() => fetchFeeBills()}
      />

      {/* Delete Confirmation Overlay Modal */}
      {deletingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Soft Delete Fee Bill Record?
            </h3>
            <p className="text-xs text-slate-500">
              Voucher Ref: <strong>{deletingBill.feeBillNumber}</strong> ({deletingBill.lawyerName})
            </p>
            <p className="text-xs text-slate-400">
              This action soft-deletes the record. Historical records remain preserved in PostgreSQL audit logs and can be restored using "Show Archived".
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingBill(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBill(deletingBill)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Soft Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
