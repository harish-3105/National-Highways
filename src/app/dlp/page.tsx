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
import { ModulePageHeader } from '@/components/common/ModulePageHeader';
import { ExportDataModal } from '@/components/common/ExportDataModal';
import { DLP_COLUMNS } from '@/lib/export/columns';
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
  Building2,
  X,
  RotateCcw,
} from 'lucide-react';

const CATEGORY_BADGES: Record<
  DlpWorkCategory,
  { label: string; bg: string; text: string }
> = {
  DLP: { label: 'Under DLP', bg: 'bg-lime-50 dark:bg-lime-950/40', text: 'text-lime-800 dark:text-lime-200' },
  CONSTRUCTION: { label: 'Construction', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-900 dark:text-emerald-100' },
  STMC: { label: 'STMC', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-200' },
  PBMC: { label: 'PBMC', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-200' },
  NO_DLP: { label: 'No DLP', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300' },
};

export default function DlpPage() {
  const [corridors, setCorridors] = useState<DlpCorridor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Circle / Division Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'DLP' | 'CONSTRUCTION' | 'PBMC' | 'STMC' | 'NO_DLP' | 'EXPIRY_ALERTS'>('ALL');
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
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM' | 'MASTER_DATA'>('LIST');

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
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

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

  const handleRestoreCorridor = async (item: DlpCorridor) => {
    try {
      const res = await fetch('/api/dlp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action: 'restore' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDlpCorridors();
        setNotificationMsg(`Corridor ${item.highway_code} restored to active status.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to restore corridor');
      }
    } catch (err) {
      console.error('Failed to restore corridor:', err);
    }
  };

  const divisionOptions = selectedCircle
    ? (masterData.circleDivisionMap[selectedCircle] || [])
    : (masterData.divisions || []);

  // Client-side Filter Logic (Two-Level Filter: Corridors + Granular Stretches)
  const filteredCorridors = useMemo(() => {
    const hasCategoryFilter = Boolean(selectedCategoryFilter && selectedCategoryFilter !== 'ALL');
    const hasStatusFilter = statusFilter !== 'ALL';
    const hasDateFilter = Boolean(dateRangeFilter.startDate || dateRangeFilter.endDate);
    const hasSearchFilter = Boolean(searchTerm.trim());

    return corridors
      .map((c) => {
        const matchingStretches = (c.work_stretches || []).filter((s) => {
          // 1. KPI Category filter
          if (hasCategoryFilter) {
            if (selectedCategoryFilter === 'EXPIRY_ALERTS') {
              if (s.computed_status !== 'EXPIRING_SOON' && s.computed_status !== 'EXPIRED' && s.category !== 'NO_DLP') {
                return false;
              }
            } else if (s.category !== selectedCategoryFilter) {
              return false;
            }
          }

          // 2. Status filter on child stretches
          if (hasStatusFilter) {
            if (s.computed_status !== statusFilter) return false;
          }

          // 3. Date Range filter on child stretches
          if (hasDateFilter) {
            const checkDate = s.dlp_till_date || s.dlp_ended_on_date || s.commencement_date;
            if (!checkDate) return false;
            if (dateRangeFilter.startDate && checkDate < dateRangeFilter.startDate) return false;
            if (dateRangeFilter.endDate && checkDate > dateRangeFilter.endDate) return false;
          }

          // 4. Search filter on child stretches if corridor itself didn't match
          if (hasSearchFilter) {
            const term = searchTerm.toLowerCase();
            const corridorMatches =
              c.highway_code.toLowerCase().includes(term) ||
              c.division_name.toLowerCase().includes(term) ||
              (c.remarks && c.remarks.toLowerCase().includes(term));

            if (!corridorMatches) {
              const stretchMatches =
                (s.contractor_name && s.contractor_name.toLowerCase().includes(term)) ||
                (s.work_name && s.work_name.toLowerCase().includes(term)) ||
                (s.scheme && s.scheme.toLowerCase().includes(term)) ||
                (s.remarks && s.remarks.toLowerCase().includes(term));
              if (!stretchMatches) return false;
            }
          }

          return true;
        });

        return {
          ...c,
          all_work_stretches: c.all_work_stretches || c.work_stretches || [],
          work_stretches: matchingStretches,
        };
      })
      .filter((c) => {
        // Circle filter
        if (selectedCircle) {
          const circleOfDiv = getCircleForDivision(c.division_name, masterData.circleDivisionMap);
          if (circleOfDiv !== selectedCircle) return false;
        }

        // Division filter
        if (selectedDivision && c.division_name.toLowerCase() !== selectedDivision.toLowerCase()) {
          return false;
        }

        // When any category, status, date, or search filter is active, only show corridors that have matching stretches
        const isFilterActive = hasCategoryFilter || hasStatusFilter || hasDateFilter || hasSearchFilter;
        if (isFilterActive && c.work_stretches.length === 0) {
          return false;
        }

        return true;
      });
  }, [corridors, selectedCircle, selectedDivision, selectedCategoryFilter, statusFilter, dateRangeFilter, searchTerm, masterData.circleDivisionMap]);

  // Executive KPI summary calculations (Total across entire registered database)
  const totalStretchesCount = useMemo(() => {
    return corridors.reduce((sum, c) => sum + (c.work_stretches?.length || 0), 0);
  }, [corridors]);

  // 1. Expiry & Warranty Alerts (R1 C1)
  const expiringSoonCount = useMemo(() => {
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.computed_status === 'EXPIRING_SOON') count++;
      });
    });
    return count;
  }, [corridors]);

  const expiredCount = useMemo(() => {
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.computed_status === 'EXPIRED' || s.category === 'NO_DLP') count++;
      });
    });
    return count;
  }, [corridors]);

  const expiringSoonKm = useMemo(() => {
    let km = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.computed_status === 'EXPIRING_SOON') km += Number(s.length_km || 0);
      });
    });
    return Math.round(km * 100) / 100;
  }, [corridors]);

  const expiredKm = useMemo(() => {
    let km = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.computed_status === 'EXPIRED' || s.category === 'NO_DLP') km += Number(s.length_km || 0);
      });
    });
    return Math.round(km * 100) / 100;
  }, [corridors]);

  // 2. Under Construction (R1 C2)
  const { constructionKm, constructionCount } = useMemo(() => {
    let km = 0;
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'CONSTRUCTION') {
          km += Number(s.length_km || 0);
          count++;
        }
      });
    });
    return { constructionKm: Math.round(km * 100) / 100, constructionCount: count };
  }, [corridors]);

  // 3. Under DLP (R2 C1)
  const { activeDlpKm, activeDlpCount } = useMemo(() => {
    let km = 0;
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'DLP') {
          km += Number(s.length_km || 0);
          count++;
        }
      });
    });
    return { activeDlpKm: Math.round(km * 100) / 100, activeDlpCount: count };
  }, [corridors]);

  // 4. PBMC (R2 C2)
  const { pbmcKm, pbmcCount } = useMemo(() => {
    let km = 0;
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'PBMC') {
          km += Number(s.length_km || 0);
          count++;
        }
      });
    });
    return { pbmcKm: Math.round(km * 100) / 100, pbmcCount: count };
  }, [corridors]);

  // 5. STMC (R3 C1)
  const { stmcKm, stmcCount } = useMemo(() => {
    let km = 0;
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'STMC') {
          km += Number(s.length_km || 0);
          count++;
        }
      });
    });
    return { stmcKm: Math.round(km * 100) / 100, stmcCount: count };
  }, [corridors]);

  // 6. Under No DLP (R3 C2)
  const { noDlpKm, noDlpCount } = useMemo(() => {
    let km = 0;
    let count = 0;
    corridors.forEach((c) => {
      c.work_stretches?.forEach((s) => {
        if (s.category === 'NO_DLP' || s.computed_status === 'EXPIRED') {
          km += Number(s.length_km || 0);
          count++;
        }
      });
    });
    return { noDlpKm: Math.round(km * 100) / 100, noDlpCount: count };
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
            existingDlpCorridors={corridors}
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

            {/* Unified Module Page Header */}
            <ModulePageHeader
              icon={ShieldCheck}
              title="Defect Liability Period (DLP) & Maintenance Portal"
              subtitle="2D Continuous Coordinates • Rows 7–12 Granular Format • Automated Lifecycle Tracking"
              onRefresh={() => fetchDlpCorridors()}
              isLoading={loading}
              refreshLabel="Refresh"
              masterConfig={{
                onClick: () => setUiMode(uiMode === 'MASTER_DATA' ? 'LIST' : 'MASTER_DATA'),
                label: uiMode === 'MASTER_DATA' ? 'DLP Portal' : 'Master Config',
                title: uiMode === 'MASTER_DATA' ? 'Back to DLP Portal' : 'Configure DLP Master Options',
              }}
              archiveToggle={{
                showArchived,
                onToggle: () => setShowArchived((v) => !v),
                activeLabel: "Hide Archived",
                inactiveLabel: "Show Archived",
              }}
              importAction={{
                disabled: true,
                disabledReason: "DLP Excel Import coming soon",
              }}
              exportAction={{
                onClick: () => setIsExportModalOpen(true),
                label: "Export",
              }}
              primaryAction={{
                onClick: () => {
                  setSelectedCorridorForEdit(null);
                  setUiMode('FORM');
                },
                label: "Add New",
              }}
            />

            {/* In-Page Master Data Config Mode */}
            {uiMode === 'MASTER_DATA' && (
              <DlpMasterDataModal
                isPageMode
                onClose={() => setUiMode('LIST')}
                masterData={masterData}
                onRefresh={() => {
                  fetchMasterData();
                  fetchDlpCorridors();
                }}
              />
            )}

            {/* Main Corridors List Mode */}
            {uiMode === 'LIST' && (
              <>
                {/* 6 Executive KPI Cards (3 Rows × 2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* ROW 1, COL 1: Expiry & Warranty Alerts */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryFilter === 'EXPIRY_ALERTS') {
                    setSelectedCategoryFilter('ALL');
                  } else {
                    setSelectedCategoryFilter('EXPIRY_ALERTS');
                  }
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  selectedCategoryFilter === 'EXPIRY_ALERTS'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Expiry &amp; Warranty Alerts</span>
                    {selectedCategoryFilter === 'EXPIRY_ALERTS' && (
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono flex items-baseline gap-2 flex-wrap">
                    <span className="text-amber-600 dark:text-amber-400">{expiringSoonCount}</span>
                    <span className="text-xs font-semibold text-slate-500 font-sans">Expiring Soon (&le;90d)</span>
                    <span className="text-slate-300 dark:text-slate-700 font-normal">&bull;</span>
                    <span className="text-rose-600 dark:text-rose-400">{expiredCount}</span>
                    <span className="text-xs font-semibold text-slate-500 font-sans">Expired</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Total Span: {(expiringSoonKm + expiredKm).toFixed(2)} km &bull; Stretches nearing completion or passed validity
                </div>
              </button>

              {/* ROW 1, COL 2: Under Construction */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryFilter === 'CONSTRUCTION') {
                    setSelectedCategoryFilter('ALL');
                  } else {
                    setSelectedCategoryFilter('CONSTRUCTION');
                  }
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  selectedCategoryFilter === 'CONSTRUCTION'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Under Construction</span>
                    {selectedCategoryFilter === 'CONSTRUCTION' && (
                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                    <Construction className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {constructionKm.toFixed(2)} <span className="text-sm font-semibold text-slate-500 font-sans">km</span>
                    <span className="text-sm font-normal text-slate-400 font-sans ml-2">({constructionCount} works)</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Capital highway widening &amp; strengthening &bull; Auto-graduates to 5Y DLP on completion
                </div>
              </button>

              {/* ROW 2, COL 1: Under DLP */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryFilter === 'DLP') {
                    setSelectedCategoryFilter('ALL');
                  } else {
                    setSelectedCategoryFilter('DLP');
                  }
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  selectedCategoryFilter === 'DLP'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Under DLP</span>
                    {selectedCategoryFilter === 'DLP' && (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {activeDlpKm.toFixed(2)} <span className="text-sm font-semibold text-slate-500 font-sans">km</span>
                    <span className="text-sm font-normal text-slate-400 font-sans ml-2">({activeDlpCount} works)</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Active defect liability warranty &bull; Contractor maintenance obligation active
                </div>
              </button>

              {/* ROW 2, COL 2: PBMC */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryFilter === 'PBMC') {
                    setSelectedCategoryFilter('ALL');
                  } else {
                    setSelectedCategoryFilter('PBMC');
                  }
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  selectedCategoryFilter === 'PBMC'
                    ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>PBMC</span>
                    {selectedCategoryFilter === 'PBMC' && (
                      <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    {pbmcKm.toFixed(2)} <span className="text-sm font-semibold text-slate-500 font-sans">km</span>
                    <span className="text-sm font-normal text-slate-400 font-sans ml-2">({pbmcCount} works)</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Performance Based Maintenance Contracts &bull; 5-Year asset management
                </div>
              </button>

              {/* ROW 3, COL 1: STMC */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryFilter === 'STMC') {
                    setSelectedCategoryFilter('ALL');
                  } else {
                    setSelectedCategoryFilter('STMC');
                  }
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  selectedCategoryFilter === 'STMC'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>STMC</span>
                    {selectedCategoryFilter === 'STMC' && (
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {stmcKm.toFixed(2)} <span className="text-sm font-semibold text-slate-500 font-sans">km</span>
                    <span className="text-sm font-normal text-slate-400 font-sans ml-2">({stmcCount} works)</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Short Term Maintenance Contracts &bull; 1-Year periodic surface renewal
                </div>
              </button>

              {/* ROW 3, COL 2: Under No DLP */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCategoryFilter === 'NO_DLP') {
                    setSelectedCategoryFilter('ALL');
                  } else {
                    setSelectedCategoryFilter('NO_DLP');
                  }
                }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  selectedCategoryFilter === 'NO_DLP'
                    ? 'border-slate-500 ring-2 ring-slate-500/20 bg-slate-100 dark:bg-slate-800/60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>Under No DLP</span>
                    {selectedCategoryFilter === 'NO_DLP' && (
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        Active Filter
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
                    {noDlpKm.toFixed(2)} <span className="text-sm font-semibold text-slate-500 font-sans">km</span>
                    <span className="text-sm font-normal text-slate-400 font-sans ml-2">({noDlpCount} works)</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Annual Work &bull; Expired warranty &bull; Maintenance gap stretches
                </div>
              </button>
            </div>

            {/* Filter Toolbar (Option A Proportional Layout) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 mb-6 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
                {/* Search Input (4 cols) */}
                <div className="relative col-span-1 sm:col-span-2 md:col-span-4">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search highway, contract, stretch, contractor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Circle Filter (2 cols) */}
                <div className="col-span-1 md:col-span-2">
                  <SearchableSelect
                    options={['All Circles', ...(masterData.circles || [])]}
                    value={selectedCircle ? `${selectedCircle}` : 'All Circles'}
                    onChange={(val) => {
                      setSelectedCircle(val === 'All Circles' ? '' : val);
                      setSelectedDivision('');
                    }}
                    placeholder="Circle..."
                  />
                </div>

                {/* Division Filter (2 cols) */}
                <div className="col-span-1 md:col-span-2">
                  <SearchableSelect
                    options={['All Divisions', ...divisionOptions]}
                    value={selectedDivision ? `${selectedDivision}` : 'All Divisions'}
                    onChange={(val) => setSelectedDivision(val === 'All Divisions' ? '' : val)}
                    placeholder="Division..."
                  />
                </div>

                {/* Calendar Date Filter (2 cols) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-2">
                  <DlpCalendarDateFilter
                    dateRange={dateRangeFilter}
                    onChangeDateRange={setDateRangeFilter}
                    matchingCount={filteredCorridors.length}
                    totalCount={corridors.length}
                  />
                </div>

                {/* Status Filter Segmented Control (2 cols) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-2 h-[38px] flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                  {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`flex-1 h-full py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center ${
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

              {/* Active Filter Chips / Status Banner */}
              {(() => {
                const isFilterActive =
                  selectedCategoryFilter !== 'ALL' ||
                  statusFilter !== 'ALL' ||
                  Boolean(dateRangeFilter.startDate || dateRangeFilter.endDate) ||
                  Boolean(searchTerm.trim()) ||
                  Boolean(selectedCircle) ||
                  Boolean(selectedDivision);

                if (!isFilterActive) return null;

                const totalFilteredStretches = filteredCorridors.reduce((sum, c) => sum + (c.work_stretches?.length || 0), 0);

                return (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-500">Active Filters:</span>
                      {selectedCategoryFilter !== 'ALL' && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold rounded-md flex items-center gap-1">
                          Category: {selectedCategoryFilter === 'EXPIRY_ALERTS' ? 'Expiry Alerts' : selectedCategoryFilter}
                          <button
                            type="button"
                            onClick={() => setSelectedCategoryFilter('ALL')}
                            className="hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      )}
                      {statusFilter !== 'ALL' && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold rounded-md flex items-center gap-1">
                          Status: {statusFilter}
                          <button
                            type="button"
                            onClick={() => setStatusFilter('ALL')}
                            className="hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      )}
                      {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold rounded-md flex items-center gap-1">
                          Date: {formatDateIndian(dateRangeFilter.startDate)} &rarr; {formatDateIndian(dateRangeFilter.endDate)}
                          <button
                            type="button"
                            onClick={() => setDateRangeFilter({ startDate: null, endDate: null, preset: null })}
                            className="hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      )}
                      {selectedCircle && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold rounded-md flex items-center gap-1">
                          Circle: {selectedCircle}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCircle('');
                              setSelectedDivision('');
                            }}
                            className="hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      )}
                      {selectedDivision && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold rounded-md flex items-center gap-1">
                          Division: {selectedDivision}
                          <button
                            type="button"
                            onClick={() => setSelectedDivision('')}
                            className="hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      )}
                      {searchTerm.trim() && (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold rounded-md flex items-center gap-1">
                          Search: &quot;{searchTerm}&quot;
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="hover:text-red-500 font-black ml-0.5 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        Showing <strong className="text-blue-600 dark:text-blue-400">{filteredCorridors.length}</strong> corridors ({totalFilteredStretches} works)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryFilter('ALL');
                          setStatusFilter('ALL');
                          setDateRangeFilter({ startDate: null, endDate: null, preset: null });
                          setSelectedCircle('');
                          setSelectedDivision('');
                          setSearchTerm('');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold cursor-pointer"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                );
              })()}
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
                              setSelectedCategoryFilter('ALL');
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
                                  const rawStretches = item.all_work_stretches || item.work_stretches || [];
                                  const catSums: Record<DlpWorkCategory, number> = {
                                    DLP: 0,
                                    CONSTRUCTION: 0,
                                    STMC: 0,
                                    PBMC: 0,
                                    NO_DLP: 0,
                                  };
                                  rawStretches.forEach((s) => {
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
                                {item.status === 'DELETED' || (item as any).delete_status === 'DELETED' ? (
                                  <button
                                    onClick={() => handleRestoreCorridor(item)}
                                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md transition-colors cursor-pointer"
                                    title="Restore Archived Corridor"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <>
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
                                  </>
                                )}
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
                                                        className="border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                                                      >
                                                        {/* Work Boundary Header: Left = Contractor, Middle = Work Name, Right = DLP Date / Status & Span */}
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                                          {/* Left: Contractor & Category Badge */}
                                                          <div className="flex items-center gap-2 shrink-0">
                                                            <HardHat className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 max-w-[220px] truncate" title={contractorName}>
                                                              {contractorName.includes('Departmental') ? contractorName : contractorName}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] shrink-0 ${catBadge.bg} ${catBadge.text}`}>
                                                              {catBadge.label}
                                                            </span>
                                                          </div>

                                                          {/* Middle: Name of the Work (Wrapped cleanly inside work boundary) */}
                                                          <div className="flex-1 min-w-0 md:px-3">
                                                            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 break-words leading-relaxed">
                                                              {workName}
                                                            </h5>
                                                          </div>

                                                          {/* Right: DLP Ended / Till Date based on type & Work Span */}
                                                          <div className="flex items-center gap-2 shrink-0 flex-wrap md:justify-end text-xs">
                                                            <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px] shadow-2xs">
                                                              {(() => {
                                                                const firstStretch = stretches[0];
                                                                if (isAllNoDlp) {
                                                                  return `DLP Ended: ${formatDateIndian(firstStretch?.dlp_ended_on_date || firstStretch?.dlp_till_date)}`;
                                                                }
                                                                if (primaryCat === 'CONSTRUCTION') {
                                                                  const pct = firstStretch?.physical_progress_pct ?? 0;
                                                                  const compDate = formatDateIndian(firstStretch?.actual_completion_date);
                                                                  return `Progress: ${pct}% • ${compDate === '—' ? 'In Progress' : `Comp: ${compDate}`}`;
                                                                }
                                                                return `DLP Till: ${formatDateIndian(firstStretch?.dlp_till_date)}`;
                                                              })()}
                                                            </span>
                                                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-md font-mono text-blue-700 dark:text-blue-300 font-extrabold text-[11px]">
                                                              Span: {totalWorkKm.toFixed(3)} km
                                                            </span>
                                                          </div>
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
                                                                  <td className="px-2 py-1.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                    Km {s.chainage_from_km} &rarr; Km {s.chainage_to_km}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                    {s.road_width_from_m}m &rarr; {s.road_width_to_m}m
                                                                  </td>
                                                                  <td className="px-2 py-1.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                                                    {Number(s.length_km || 0).toFixed(3)} km
                                                                  </td>
                                                                  <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                    {primaryCat === 'NO_DLP'
                                                                      ? formatDateIndian(s.dlp_ended_on_date || s.dlp_till_date)
                                                                      : formatDateIndian(s.commencement_date)}
                                                                  </td>
                                                                  <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 break-words max-w-[200px]">
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

  {/* Server-Side Export Modal */}
  <ExportDataModal
    module="dlp"
    moduleTitle="DLP & Maintenance Works"
    totalCount={totalStretchesCount}
    filteredCount={filteredCorridors.reduce((sum, c) => sum + (c.work_stretches?.length || 0), 0)}
    selectedIds={[]}
    columns={DLP_COLUMNS}
    filters={{
      division: selectedDivision,
      category: selectedCategoryFilter,
      status: statusFilter,
      search: searchTerm,
      includeDeleted: showArchived,
    }}
    isOpen={isExportModalOpen}
    onClose={() => setIsExportModalOpen(false)}
  />
</div>
  );
}
