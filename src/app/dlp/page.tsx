'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { DlpCalendarDateFilter, DateRangeFilter } from '@/components/dlp/DlpCalendarDateFilter';
import { DlpContractEntryForm } from '@/components/dlp/DlpContractEntryForm';
import { DlpMasterDataModal } from '@/components/dlp/DlpMasterDataModal';
import DeleteDlpContractModal from '@/components/dlp/DeleteDlpContractModal';
import ViewDlpContractModal from '@/components/dlp/ViewDlpContractModal';
import { getCircleForDivision } from '@/lib/dlp/masterData';
import { formatDateIndian } from '@/lib/formatters';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { DlpCorridor, DlpWorkStretch, DlpWorkCategory, DlpMasterData } from '@/types/dlp';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  Archive,
  SlidersHorizontal,
  HardHat,
  Construction,
} from 'lucide-react';

const CATEGORY_BADGES: Record<
  DlpWorkCategory,
  { label: string; bg: string; text: string }
> = {
  DLP: { label: 'Under DLP', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-800 dark:text-emerald-200' },
  CONSTRUCTION: { label: 'Construction', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-800 dark:text-blue-200' },
  STMC: { label: 'STMC', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-800 dark:text-amber-200' },
  PBMC: { label: 'PBMC', bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-800 dark:text-purple-200' },
  NO_DLP: { label: 'No DLP', bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200' },
};

export default function DlpPage() {
  const [corridors, setCorridors] = useState<DlpCorridor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Circle / Division Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    startDate: null,
    endDate: null,
    preset: null,
  });

  // Accordion Expand State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Screen state: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');

  // Master Data Configuration State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [masterData, setMasterData] = useState<DlpMasterData>({
    rawItems: [],
    circles: [],
    divisions: [],
    schemes: [],
    circleDivisionMap: {},
  });

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/dlp/master-data');
      const data = await res.json();
      if (data && Array.isArray(data.divisions)) {
        setMasterData(data);
      }
    } catch (err) {
      console.warn('DLP master data fetch note:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Modal States
  const [selectedCorridorForView, setSelectedCorridorForView] = useState<DlpCorridor | null>(null);
  const [selectedCorridorForEdit, setSelectedCorridorForEdit] = useState<DlpCorridor | null>(null);
  const [selectedCorridorForDelete, setSelectedCorridorForDelete] = useState<DlpCorridor | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchDlpCorridors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedDivision) params.set('division', selectedDivision);
      if (showArchived) params.set('includeDeleted', 'true');

      const res = await fetch(`/api/dlp?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.corridors)) {
        setCorridors(data.corridors);
        const initExpanded: Record<string, boolean> = {};
        data.corridors.forEach((c: DlpCorridor) => {
          initExpanded[c.id] = true;
        });
        setExpandedRows(initExpanded);
      }
    } catch (err) {
      console.error('Failed to fetch DLP corridors:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDivision, showArchived]);

  useEffect(() => {
    fetchDlpCorridors();
  }, [fetchDlpCorridors]);

  const handleSaveCorridor = async (corridorData: Partial<DlpCorridor>) => {
    try {
      const isEdit = Boolean(corridorData.id);
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/dlp', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corridorData),
      });
      const data = await res.json();
      if (data.success) {
        setUiMode('LIST');
        setSelectedCorridorForEdit(null);
        setNotificationMsg(
          isEdit
            ? `Successfully updated corridor ${corridorData.highway_code} & maintenance works.`
            : `Successfully created new corridor ${corridorData.highway_code} with ${corridorData.work_stretches?.length || 0} work stretches.`
        );
        setTimeout(() => setNotificationMsg(null), 5000);
        fetchDlpCorridors();
      } else {
        alert(`Error saving record: ${data.error || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to save DLP corridor: ${msg}`);
    }
  };

  const divisionOptions = selectedCircle
    ? (masterData.circleDivisionMap[selectedCircle] || [])
    : (masterData.divisions || []);

  // Client-side Filter Logic
  const filteredCorridors = useMemo(() => {
    return corridors.filter((c) => {
      // Circle filter
      if (selectedCircle) {
        const circleOfDiv = getCircleForDivision(c.division_name, masterData.circleDivisionMap);
        if (circleOfDiv !== selectedCircle) return false;
      }

      // Division filter
      if (selectedDivision && c.division_name.toLowerCase() !== selectedDivision.toLowerCase()) {
        return false;
      }

      // Status filter on child stretches
      if (statusFilter !== 'ALL') {
        const hasMatchingStretch = c.work_stretches?.some((s) => s.computed_status === statusFilter);
        if (!hasMatchingStretch) return false;
      }

      // Date Range Filter on child stretches
      if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
        const hasDateMatch = c.work_stretches?.some((s) => {
          if (!s.dlp_till_date) return false;
          if (dateRangeFilter.startDate && s.dlp_till_date < dateRangeFilter.startDate) return false;
          if (dateRangeFilter.endDate && s.dlp_till_date > dateRangeFilter.endDate) return false;
          return true;
        });
        if (!hasDateMatch) return false;
      }

      return true;
    });
  }, [corridors, selectedCircle, selectedDivision, statusFilter, dateRangeFilter]);

  // Executive KPI summary calculations
  const totalStretchesCount = useMemo(() => {
    return corridors.reduce((sum, c) => sum + (c.work_stretches?.length || 0), 0);
  }, [corridors]);

  const activeDlpKm = useMemo(() => {
    let km = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'DLP') km += Number(s.length_km || 0);
      });
    });
    return Math.round(km * 100) / 100;
  }, [corridors]);

  const constructionKm = useMemo(() => {
    let km = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'CONSTRUCTION') km += Number(s.length_km || 0);
      });
    });
    return Math.round(km * 100) / 100;
  }, [corridors]);

  const expiringSoonCount = useMemo(() => {
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.computed_status === 'EXPIRING_SOON') count++;
      });
    });
    return count;
  }, [corridors]);

  const renderStatusBadge = (stretch: DlpWorkStretch) => {
    const days = stretch.days_remaining;
    if (stretch.category === 'CONSTRUCTION') {
      const pct = stretch.physical_progress_pct ?? 0;
      return (
        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
          {pct >= 100 ? '100% Completed' : `${pct}% In Progress`}
        </span>
      );
    }

    if (days === undefined || days === null) {
      return (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[10px]">
          N/A
        </span>
      );
    }
    if (days <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-[10px]">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Expired</span>
        </span>
      );
    }
    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px]">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{days}d left</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800 text-[10px]">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span>{days}d left</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {uiMode === 'FORM' ? (
          <DlpContractEntryForm
            initialData={selectedCorridorForEdit || undefined}
            masterData={masterData}
            onSave={handleSaveCorridor}
            onCancel={() => {
              setUiMode('LIST');
              setSelectedCorridorForEdit(null);
            }}
          />
        ) : (
          <>
            {notificationMsg && (
              <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-sm shadow-md animate-fade-in flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{notificationMsg}</span>
              </div>
            )}

            {/* Header Banner */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  Defect Liability Period (DLP) &amp; Maintenance Portal
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  2D Continuous Coordinates &bull; Rows 7&ndash;12 Granular Format &bull; Automated Lifecycle Tracking
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchDlpCorridors()}
                  disabled={loading}
                  className="p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  title="Refresh Records"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsMasterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Configure DLP Master Options"
                >
                  <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Master Config</span>
                </button>

                <button
                  onClick={() => setShowArchived((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    showArchived
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={showArchived ? 'Hide Archived Records' : 'Show Archived Records'}
                >
                  <Archive className="w-4 h-4" />
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </button>

                <button
                  onClick={() => {
                    setSelectedCorridorForEdit(null);
                    setUiMode('FORM');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> New Corridor Entry
                </button>
              </div>
            </div>

            {/* 4 Executive KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corridors / Stretches</span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {corridors.length} <span className="text-xs text-slate-400 font-sans font-normal">({totalStretchesCount} works)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Total registered master corridors</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active DLP Length</span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeDlpKm.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">km</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Stretches with live defect warranty</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Construction</span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <Construction className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {constructionKm.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">km</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Active capital &amp; widening works</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring Soon (90d)</span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {expiringSoonCount} <span className="text-xs text-slate-400 font-sans font-normal">stretches</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Maintenance expiring in &le; 90 days</p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Search Input */}
                <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search highway, work, contractor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Circle Filter */}
                <div className="w-full">
                  <SearchableSelect
                    options={['All Circles', ...(masterData.circles || [])]}
                    value={selectedCircle ? `${selectedCircle}` : 'All Circles'}
                    onChange={(val) => {
                      setSelectedCircle(val === 'All Circles' ? '' : val);
                      setSelectedDivision('');
                    }}
                    placeholder="Filter Circle..."
                  />
                </div>

                {/* Division Filter */}
                <div className="w-full">
                  <SearchableSelect
                    options={['All Divisions', ...divisionOptions]}
                    value={selectedDivision ? `${selectedDivision}` : 'All Divisions'}
                    onChange={(val) => setSelectedDivision(val === 'All Divisions' ? '' : val)}
                    placeholder="Filter Division..."
                  />
                </div>

                {/* Calendar Date Filter */}
                <DlpCalendarDateFilter
                  dateRange={dateRangeFilter}
                  onChangeDateRange={setDateRangeFilter}
                  matchingCount={filteredCorridors.length}
                  totalCount={corridors.length}
                />

                {/* Status Filter Pills */}
                <div className="h-[38px] flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                  {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`flex-1 h-full py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        statusFilter === st
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : st === 'EXPIRING_SOON' ? 'Expiring' : 'Expired'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DLP Corridors Ledger Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Highway &amp; Division</th>
                      <th className="py-4 px-6">Chainage Limits</th>
                      <th className="py-4 px-6">Total Length</th>
                      <th className="py-4 px-6">Sub-Work Stretches Breakdown</th>
                      <th className="py-4 px-6 max-w-xs">Corridor Remarks</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="font-semibold text-sm">Loading DLP corridor records...</p>
                        </td>
                      </tr>
                    ) : filteredCorridors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                          <p className="font-bold text-sm">No DLP corridor records found.</p>
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedCircle('');
                              setSelectedDivision('');
                              setStatusFilter('ALL');
                              setDateRangeFilter({ startDate: null, endDate: null, preset: null });
                            }}
                            className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredCorridors.map((item) => {
                        const circleName = getCircleForDivision(item.division_name || '');
                        const isExpanded = !!expandedRows[item.id];
                        const stretchCount = item.work_stretches?.length || 0;

                        return (
                          <React.Fragment key={item.id}>
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  {stretchCount > 0 && (
                                    <button
                                      onClick={() => toggleRowExpand(item.id)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                                      title={isExpanded ? 'Collapse Stretches' : 'Expand Stretches'}
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  )}
                                  <div>
                                    <div className="font-extrabold text-blue-600 flex items-center gap-1.5">
                                      <span>{item.highway_code}</span>
                                      {stretchCount > 0 && (
                                        <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded font-bold text-[10px] flex items-center gap-0.5">
                                          <Layers className="w-2.5 h-2.5" />
                                          {stretchCount}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-500 font-semibold text-[11px]">
                                      {item.division_name} Division
                                      {circleName ? <span className="text-slate-400 block text-[10px] font-normal">{circleName} Circle</span> : null}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-100">
                                Km {item.from_km} &rarr; Km {item.to_km}
                              </td>

                              <td className="py-4 px-6 font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                {item.total_length_km} km
                              </td>

                              <td className="py-4 px-6">
                                {(() => {
                                  const catSums: Record<DlpWorkCategory, number> = {
                                    DLP: 0,
                                    CONSTRUCTION: 0,
                                    STMC: 0,
                                    PBMC: 0,
                                    NO_DLP: 0,
                                  };
                                  (item.work_stretches || []).forEach((s) => {
                                    if (catSums[s.category] !== undefined) {
                                      catSums[s.category] += Number(s.length_km || 0);
                                    }
                                  });
                                  const activeSum = catSums.DLP + catSums.CONSTRUCTION + catSums.STMC + catSums.PBMC;
                                  const cLen = Number(item.total_length_km || 0);
                                  const unworkedNoDlp = Math.max(0, Math.round((cLen - activeSum) * 1000) / 1000);

                                  return (
                                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                                      {catSums.DLP > 0 && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_BADGES.DLP.bg} ${CATEGORY_BADGES.DLP.text}`}>
                                          DLP: {catSums.DLP.toFixed(2)}km
                                        </span>
                                      )}
                                      {catSums.CONSTRUCTION > 0 && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_BADGES.CONSTRUCTION.bg} ${CATEGORY_BADGES.CONSTRUCTION.text}`}>
                                          Construction: {catSums.CONSTRUCTION.toFixed(2)}km
                                        </span>
                                      )}
                                      {catSums.STMC > 0 && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_BADGES.STMC.bg} ${CATEGORY_BADGES.STMC.text}`}>
                                          STMC: {catSums.STMC.toFixed(2)}km
                                        </span>
                                      )}
                                      {catSums.PBMC > 0 && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_BADGES.PBMC.bg} ${CATEGORY_BADGES.PBMC.text}`}>
                                          PBMC: {catSums.PBMC.toFixed(2)}km
                                        </span>
                                      )}
                                      {unworkedNoDlp > 0 && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_BADGES.NO_DLP.bg} ${CATEGORY_BADGES.NO_DLP.text}`}>
                                          No DLP: {unworkedNoDlp.toFixed(2)}km
                                        </span>
                                      )}
                                      {activeSum === 0 && unworkedNoDlp === 0 && (
                                        <span className="text-slate-400 text-[10px] italic">No active works</span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>

                              <td className="py-4 px-6 max-w-xs">
                                <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed text-[11px]">
                                  {item.remarks || '—'}
                                </p>
                              </td>

                              <td className="py-4 px-6 text-right space-x-1">
                                <button
                                  onClick={() => setSelectedCorridorForView(item)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                                  title="View Complete Corridor Record"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCorridorForEdit(item);
                                    setUiMode('FORM');
                                  }}
                                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Record"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setSelectedCorridorForDelete(item)}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md transition-colors cursor-pointer"
                                  title="Soft-Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>

                            {/* Accordion Sub-Stretches Nested Row (3-Tier Hierarchy: Contractor -> Work Name -> Stretches) */}
                            {isExpanded && stretchCount > 0 && (
                              <tr className="bg-slate-50/80 dark:bg-slate-900/40">
                                <td colSpan={6} className="px-8 py-4">
                                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-blue-600" />
                                        Sub-Work Packages &amp; Stretches ({stretchCount} Stretches)
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Contractor &bull; Work Name &bull; Granular 2D Stretches
                                      </span>
                                    </div>

                                    {/* 3-Tier Grouping Renderer */}
                                    {(() => {
                                      const contractorMap = new Map<string, Map<string, DlpWorkStretch[]>>();

                                      (item.work_stretches || []).forEach((s) => {
                                        const isNoDlp = s.category === 'NO_DLP' || s.computed_status === 'EXPIRED';
                                        const contractor = isNoDlp
                                          ? 'Departmental / Uncontracted (No DLP)'
                                          : (s.contractor_name?.trim() || 'Unassigned Contractor');
                                        const work = isNoDlp
                                          ? (s.scheme || 'Annual Work')
                                          : (s.work_name?.trim() || 'Unspecified Work');

                                        if (!contractorMap.has(contractor)) {
                                          contractorMap.set(contractor, new Map());
                                        }
                                        const workMap = contractorMap.get(contractor)!;
                                        if (!workMap.has(work)) {
                                          workMap.set(work, []);
                                        }
                                        workMap.get(work)!.push(s);
                                      });

                                      return (
                                        <div className="space-y-4">
                                          {Array.from(contractorMap.entries()).map(([contractorName, worksMap], cIdx) => {
                                            const allContractorStretches = Array.from(worksMap.values()).flat();
                                            const totalContractorKm = allContractorStretches.reduce((acc, curr) => acc + Number(curr.length_km || 0), 0);

                                            return (
                                              <div
                                                key={cIdx}
                                                className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30"
                                              >
                                                {/* Tier 1: Contractor Banner */}
                                                <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                                                  <div className="flex items-center gap-2">
                                                    <HardHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                                      {contractorName.includes('Departmental') ? contractorName : `Contractor: ${contractorName}`}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-slate-500 font-medium">
                                                      {worksMap.size} {worksMap.size === 1 ? 'Work Package' : 'Work Packages'} &bull; {allContractorStretches.length} Stretches
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono font-bold text-blue-600 dark:text-blue-400 text-[10px]">
                                                      {totalContractorKm.toFixed(3)} km
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Tier 2: Works under this Contractor */}
                                                <div className="p-3 space-y-3">
                                                  {Array.from(worksMap.entries()).map(([workName, stretches], wIdx) => {
                                                    const isAllNoDlp = stretches.every((s) => s.category === 'NO_DLP' || s.computed_status === 'EXPIRED');
                                                    const primaryCat = isAllNoDlp ? 'NO_DLP' : (stretches[0]?.category || 'DLP');
                                                    const catBadge = CATEGORY_BADGES[primaryCat] || CATEGORY_BADGES.NO_DLP;
                                                    const totalWorkKm = stretches.reduce((acc, curr) => acc + Number(curr.length_km || 0), 0);

                                                    return (
                                                      <div
                                                        key={wIdx}
                                                        className="border border-slate-200/80 dark:border-slate-700/60 rounded-lg p-2.5 bg-white dark:bg-slate-900 space-y-2"
                                                      >
                                                        {/* Work Header */}
                                                        <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                                          <div className="flex items-center gap-2">
                                                            <span className={`px-1.5 py-0.5 rounded font-extrabold text-[9px] ${catBadge.bg} ${catBadge.text}`}>
                                                              {catBadge.label}
                                                            </span>
                                                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                              {workName}
                                                            </span>
                                                          </div>
                                                          <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                                                            Total Work Span: {totalWorkKm.toFixed(3)} km ({stretches.length} {stretches.length === 1 ? 'stretch' : 'stretches'})
                                                          </span>
                                                        </div>

                                                        {/* Tier 3: Discrete Stretches Table */}
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full text-left text-[11px]">
                                                            <thead className="text-[9px] font-bold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/40">
                                                              <tr>
                                                                <th className="px-2 py-1">Stretch</th>
                                                                <th className="px-2 py-1">Chainage Limits</th>
                                                                <th className="px-2 py-1">Road Width</th>
                                                                <th className="px-2 py-1">Length</th>
                                                                <th className="px-2 py-1">{primaryCat === 'NO_DLP' ? 'Ended Date' : 'Commencement'}</th>
                                                                <th className="px-2 py-1">{primaryCat === 'NO_DLP' ? 'Scheme' : 'DLP Till / Progress'}</th>
                                                                <th className="px-2 py-1">Status</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                              {stretches.map((s, sIdx) => (
                                                                <tr key={s.id || sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                  <td className="px-2 py-1.5 font-bold text-slate-500 font-mono text-[10px]">
                                                                    #{sIdx + 1}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 font-mono text-slate-700 dark:text-slate-300">
                                                                    Km {s.chainage_from_km} &rarr; Km {s.chainage_to_km}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-400">
                                                                    {s.road_width_from_m}m &rarr; {s.road_width_to_m}m
                                                                  </td>
                                                                  <td className="px-2 py-1.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                                    {Number(s.length_km || 0).toFixed(3)} km
                                                                  </td>
                                                                  <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400">
                                                                    {primaryCat === 'NO_DLP'
                                                                      ? formatDateIndian(s.dlp_ended_on_date || s.dlp_till_date)
                                                                      : formatDateIndian(s.commencement_date)}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                                                                    {s.category === 'CONSTRUCTION' ? (
                                                                      <span className="font-semibold">{s.physical_progress_pct ?? 0}% Complete</span>
                                                                    ) : primaryCat === 'NO_DLP' ? (
                                                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.scheme || 'Annual Work'}</span>
                                                                    ) : (
                                                                      formatDateIndian(s.dlp_till_date)
                                                                    )}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 whitespace-nowrap">
                                                                    {renderStatusBadge(s)}
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* View Modal */}
      <ViewDlpContractModal
        corridor={selectedCorridorForView}
        onClose={() => setSelectedCorridorForView(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDlpContractModal
        corridor={selectedCorridorForDelete}
        isOpen={!!selectedCorridorForDelete}
        onClose={() => setSelectedCorridorForDelete(null)}
        onSuccess={() => fetchDlpCorridors()}
      />

      {/* Master Data Configuration Modal */}
      <DlpMasterDataModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterData={masterData}
        onRefresh={() => {
          fetchMasterData();
          fetchDlpCorridors();
        }}
      />
    </div>
  );
}
