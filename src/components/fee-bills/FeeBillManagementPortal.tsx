'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { EMPTY_MASTER_DATA, formatINR } from '@/lib/feeBillMasterData';
import { FeeBillListTable } from './FeeBillListTable';
import { FeeBillDataEntryForm } from './FeeBillDataEntryForm';
import { FeeBillPendencyTracker } from './FeeBillPendencyTracker';
import { FeeBillAnalysisDashboard } from './FeeBillAnalysisDashboard';
import { MasterDataManagement } from './MasterDataManagement';
import { FeeBillDetailModal } from './FeeBillDetailModal';
import { FeeBillAuditModal } from './FeeBillAuditModal';
import { ExportDataModal } from '@/components/common/ExportDataModal';
import { FEE_BILLS_COLUMNS } from '@/lib/export/columns';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { ModulePageHeader } from '@/components/common/ModulePageHeader';
import {
  FileText,
  Plus,
  Clock,
  PieChart,
  Search,
  AlertTriangle,
  Archive,
  RefreshCw,
  Download,
  DollarSign,
  CheckCircle2,
  Scale,
  X,
  RotateCcw,
} from 'lucide-react';

type PortalTab = 'workspace' | 'create' | 'settings';
type WorkspaceViewMode = 'ledger' | 'analytics' | 'pendency';
type KpiCardType = 'all' | 'settled' | 'pending' | 'cases';

export function FeeBillManagementPortal() {
  const [activeTab, setActiveTab] = useState<PortalTab>('workspace');
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('ledger');
  const [activeKpiCard, setActiveKpiCard] = useState<KpiCardType>('all');
  const [bills, setBills] = useState<FeeBillRecord[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<FeeBillMasterDataConfig>(EMPTY_MASTER_DATA);

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
    return new Set(activeBills.map((b) => String(b.caseDetails || '').trim().toUpperCase()).filter(Boolean)).size;
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
      } else {
        alert(data.message || 'Error saving fee bill voucher.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Error connecting to server: ' + msg);
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
        key={editingBill?.id || 'new-fee-bill'}
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
      {/* Unified Module Page Header */}
      <ModulePageHeader
        title="Legal & Lawyer Fee Bill Portal"
        subtitle="Highways Department • G.O. Claims, Assistance Fee Calculator & Pendency Audit System"
        onRefresh={() => {
          fetchMasterData();
          fetchFeeBills();
        }}
        isLoading={loading}
        refreshLabel="Refresh"
        masterConfig={{
          onClick: () => setActiveTab(activeTab === 'settings' ? 'workspace' : 'settings'),
          label: activeTab === 'settings' ? 'Fee Claims' : 'Master Config',
          title: "Configure Fee Bill Master Data Options",
        }}
        archiveToggle={{
          showArchived,
          onToggle: () => setShowArchived((v) => !v),
          activeLabel: "Hide Archived",
          inactiveLabel: "Show Archived",
        }}
        importAction={{
          disabled: true,
          disabledReason: "Fee Bills Excel Import coming soon",
        }}
        exportAction={{
          onClick: () => setIsExportModalOpen(true),
          label: "Export",
        }}
        primaryAction={{
          onClick: () => {
            setEditingBill(null);
            setActiveTab('create');
          },
          label: "Add New",
        }}
      />

      {/* WORKSPACE AREA */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* 4 Quadrants Interactive KPI Dashboard (Corridors Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {/* Quadrant 1: Total Fee Claims */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('all');
                setPaymentStatusFilter('ALL');
              }}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                activeKpiCard === 'all'
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Total Fee Claims
                  {activeKpiCard === 'all' && (
                    <span className="normal-case text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      Active
                    </span>
                  )}
                </span>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(totalClaimsAmount)}{' '}
                  <span className="text-sm font-normal text-slate-500">({totalClaimsCount} Vouchers)</span>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                Master Fee Bill Ledger &bull; All Claims
              </div>
            </button>

            {/* Quadrant 2: Settled & Disbursed */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('settled');
                setPaymentStatusFilter('Settled');
              }}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                activeKpiCard === 'settled'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Settled & Paid
                  {activeKpiCard === 'settled' && (
                    <span className="normal-case text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  )}
                </span>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatINR(settledAmount)}{' '}
                  <span className="text-sm font-normal text-slate-500">({settledBills.length} Disbursed)</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {totalClaimsCount > 0 ? Math.round((settledBills.length / totalClaimsCount) * 100) : 0}% Clearance Rate &bull; Disbursed & Settled
              </div>
            </button>

            {/* Quadrant 3: Outstanding & Pending Settlement */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('pending');
                setPaymentStatusFilter('Pending');
              }}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                activeKpiCard === 'pending'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Outstanding & Pipeline
                  {activeKpiCard === 'pending' && (
                    <span className="normal-case text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      Active
                    </span>
                  )}
                </span>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {formatINR(unsettledAmount)}{' '}
                  <span className="text-sm font-normal text-slate-500">({unsettledBills.length} In Pipeline)</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                Under Scrutiny &bull; Awaiting G.O. / Payment Sanction
              </div>
            </button>

            {/* Quadrant 4: Cases & Advocates Overview */}
            <button
              type="button"
              onClick={() => {
                setActiveKpiCard('cases');
                setViewMode('analytics');
              }}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                activeKpiCard === 'cases'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Cases & Counsel Overview
                  {activeKpiCard === 'cases' && (
                    <span className="normal-case text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      Active
                    </span>
                  )}
                </span>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">
                  {distinctCases} <span className="text-sm font-normal text-slate-500">Cases</span> &bull; {distinctLawyers}{' '}
                  <span className="text-sm font-normal text-slate-500">Advocates</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Empaneled Law Officers &bull; Click to Open Analytics Matrix
              </div>
            </button>
          </div>

          {/* Symmetrical Single-Bar Toolbar (Option A Layout) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs mb-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
              {/* Left Side: Search + Circle + Division Filters */}
              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                {/* Search Bar with Quick Clear */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by advocate, case no, voucher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Circle Select */}
                <div className="w-full sm:w-48">
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
                <div className="w-full sm:w-52">
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all cursor-pointer"
                    title="Reset all filters and search"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Right Side: Segmented View Mode Switcher */}
              <div className="flex items-center gap-1.5 shrink-0 self-start xl:self-auto">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('ledger')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'ledger'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('analytics')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'analytics'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <PieChart className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('pendency')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'pendency'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Pendency</span>
                  </button>
                </div>
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

          {viewMode === 'analytics' && (
            <FeeBillAnalysisDashboard
              bills={bills}
              masterData={masterData}
              hideHeaderKpis={true}
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
        </div>
      )}

      {/* SETTINGS AREA */}
      {activeTab === 'settings' && (
        <MasterDataManagement
          masterData={masterData}
          onUpdateMasterData={(newData: FeeBillMasterDataConfig) => handleUpdateMasterData(newData)}
          onClose={() => setActiveTab('workspace')}
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

      {/* Server-Side Styled Export Modal */}
      <ExportDataModal
        module="fee-bills"
        moduleTitle="Advocate Fee Bills"
        totalCount={bills.length}
        filteredCount={activeBills.length}
        selectedIds={[]}
        columns={FEE_BILLS_COLUMNS}
        filters={{
          circle: selectedCircle || undefined,
          division: selectedDivision || undefined,
          paymentStatus: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
          search: searchTerm,
          includeDeleted: showArchived,
        }}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
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
              This action soft-deletes the record. Historical records remain preserved in PostgreSQL audit logs and can be restored using &quot;Show Archived&quot;.
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
