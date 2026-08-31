'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Activity,
  Clock,
  CheckCircle2,
  RefreshCw,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  Archive,
  AlertTriangle,
  RotateCcw,
  Percent,
  X,
  History,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import { OngoingWorksMasterData } from '@/app/api/ongoing-works/master-data/route';
import { calculateProjectDelay, calculateFinancialProgress } from '@/lib/formatters';
import { MajorProjectsTable } from './MajorProjectsTable';
import { OngoingWorkEntryForm } from './OngoingWorkEntryForm';
import { ModulePageHeader } from '@/components/common/ModulePageHeader';
import { ViewMajorProjectModal } from './ViewMajorProjectModal';
import { DeleteMajorProjectModal } from './DeleteMajorProjectModal';
import { OngoingWorksMasterDataModal } from './OngoingWorksMasterDataModal';
import { ProjectHistoryModal } from './ProjectHistoryModal';
import { ExportMajorProjectsModal } from './ExportMajorProjectsModal';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const MajorProjectsDashboard: React.FC = () => {
  const [projects, setProjects] = useState<MajorProject[]>([]);
  const [masterData, setMasterData] = useState<OngoingWorksMasterData>({
    rawItems: [],
    circles: [],
    divisions: [],
    schemes: [],
    circleDivisionMap: {},
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Screen state: 'LIST' | 'FORM' | 'MASTER_DATA'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM' | 'MASTER_DATA'>('LIST');
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<MajorProject | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCircle, setSelectedCircle] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [activeKpiFilter, setActiveKpiFilter] = useState<
    'ACTIVE_ALL' | 'ABOVE_50CR' | 'IN_PROGRESS' | 'TENDER_STAGE' | 'DELAYED' | 'COMPLETED'
  >('ACTIVE_ALL');

  // Range Filters
  const [delayMin, setDelayMin] = useState<string>('');
  const [delayMax, setDelayMax] = useState<string>('');
  const [progressMin, setProgressMin] = useState<string>('');
  const [progressMax, setProgressMax] = useState<string>('');

  // Modals state
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [viewingProject, setViewingProject] = useState<MajorProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<MajorProject | null>(null);
  const [historyProject, setHistoryProject] = useState<MajorProject | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/major-projects?${showArchived ? 'includeDeleted=true' : ''}&completionFilter=ALL`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load major projects:', err);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  const handleRestoreProject = async (project: MajorProject) => {
    try {
      const res = await fetch('/api/major-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          delete_status: 'ACTIVE',
          actionSource: 'MANUAL_EDIT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to restore project:', err);
    }
  };

  const handleSaveProject = async (projectData: Partial<MajorProject>) => {
    try {
      const res = await fetch('/api/major-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          actionSource: projectData.id ? 'MANUAL_EDIT' : 'MANUAL_ADD',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUiMode('LIST');
        setSelectedProjectForEdit(null);
        fetchProjects();
      } else {
        alert(`Save failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
      alert('Network error while saving project.');
    }
  };

  const fetchMasterData = useCallback(async () => {
    try {
      const res = await fetch('/api/ongoing-works/master-data');
      const data = await res.json();
      if (data) {
        setMasterData(data);
      }
    } catch (err) {
      console.error('Failed to load master data config:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchMasterData();
  }, [fetchProjects, fetchMasterData]);

  // Circles list for filter dropdown (merged master + active project circles)
  const circlesList = useMemo(() => {
    const set = new Set<string>(masterData.circles || []);
    projects.forEach((p) => {
      if (p.circle) set.add(p.circle);
    });
    return Array.from(set).sort();
  }, [projects, masterData.circles]);

  // Divisions list for filter dropdown (hierarchical based on selected Circle)
  const divisionsList = useMemo(() => {
    if (selectedCircle && selectedCircle !== 'ALL') {
      const circleDivs = masterData.circleDivisionMap?.[selectedCircle] || [];
      const set = new Set<string>(circleDivs);
      projects.forEach((p) => {
        if ((p.circle || '').toLowerCase() === selectedCircle.toLowerCase() && p.division) {
          set.add(p.division);
        }
      });
      return Array.from(set).sort();
    }
    const set = new Set<string>(masterData.divisions || []);
    projects.forEach((p) => {
      if (p.division) set.add(p.division);
    });
    return Array.from(set).sort();
  }, [projects, masterData.divisions, masterData.circleDivisionMap, selectedCircle]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const isCompleted = p.work_stage === 'COMPLETED';
      const delayInfo = calculateProjectDelay(
        p.scheduled_completion_date,
        p.likely_completion_date || p.probable_completion_date,
        p.progress_percent
      );
      const effectiveCost = Number(
        p.revised_cost_cr && Number(p.revised_cost_cr) > 0
          ? p.revised_cost_cr
          : p.project_cost_cr || 0
      );

      // 1. Single Mutually-Exclusive KPI Filter
      if (activeKpiFilter === 'ACTIVE_ALL') {
        if (isCompleted) return false;
      } else if (activeKpiFilter === 'ABOVE_50CR') {
        if (effectiveCost < 50) return false;
      } else if (activeKpiFilter === 'IN_PROGRESS') {
        if (p.work_stage !== 'IN_PROGRESS') return false;
      } else if (activeKpiFilter === 'TENDER_STAGE') {
        if (p.work_stage !== 'TENDER_STAGE') return false;
      } else if (activeKpiFilter === 'DELAYED') {
        if (!delayInfo.isDelayed) return false;
      } else if (activeKpiFilter === 'COMPLETED') {
        if (!isCompleted) return false;
      }

      // 2. Circle filter
      const matchesCircle =
        selectedCircle === 'ALL' ||
        (p.circle || '').toLowerCase() === selectedCircle.toLowerCase();

      // 3. Division filter
      const matchesDivision =
        selectedDivision === 'ALL' ||
        (p.division || '').toLowerCase() === selectedDivision.toLowerCase();

      // 4. Delay Range Filter (in years)
      let matchesDelayRange = true;
      const overrun = delayInfo.delayYears;
      if (delayMin !== '') {
        matchesDelayRange = matchesDelayRange && overrun >= Number(delayMin);
      }
      if (delayMax !== '') {
        matchesDelayRange = matchesDelayRange && overrun <= Number(delayMax);
      }

      // 5. Progress Range Filter (in %)
      let matchesProgressRange = true;
      const prog =
        p.progress_percent !== undefined && p.progress_percent !== null ? Number(p.progress_percent) : 0;
      if (progressMin !== '') {
        matchesProgressRange = matchesProgressRange && prog >= Number(progressMin);
      }
      if (progressMax !== '') {
        matchesProgressRange = matchesProgressRange && prog <= Number(progressMax);
      }

      // 6. Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        (p.name_of_work || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.scheme || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.circle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.division || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.pmis_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.job_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contractor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.de_name_phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.detailed_stage_status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.stage_remarks || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.progress_remarks || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.issue_land || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.issue_forest || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.issue_utility || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.issue_railways || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.issue_others || '').toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesCircle &&
        matchesDivision &&
        matchesDelayRange &&
        matchesProgressRange &&
        matchesSearch
      );
    });
  }, [
    projects,
    activeKpiFilter,
    selectedCircle,
    selectedDivision,
    delayMin,
    delayMax,
    progressMin,
    progressMax,
    searchTerm,
  ]);

  // Aggregate KPI metrics
  const totalCount = projects.length;
  const activeCount = useMemo(() => {
    return projects.filter((p) => p.work_stage !== 'COMPLETED').length;
  }, [projects]);

  const completedCount = useMemo(() => {
    return projects.filter((p) => p.work_stage === 'COMPLETED').length;
  }, [projects]);

  const completedCostCr = useMemo(() => {
    return projects
      .filter((p) => p.work_stage === 'COMPLETED')
      .reduce((sum, p) => sum + (Number(p.revised_cost_cr || p.project_cost_cr) || 0), 0);
  }, [projects]);

  const totalCostCr = useMemo(() => {
    return projects.reduce((sum, p) => sum + (Number(p.project_cost_cr) || 0), 0);
  }, [projects]);

  const inProgressCount = useMemo(() => {
    return projects.filter((p) => p.work_stage === 'IN_PROGRESS').length;
  }, [projects]);

  const tenderCount = useMemo(() => {
    return projects.filter((p) => p.work_stage === 'TENDER_STAGE').length;
  }, [projects]);

  const delayedCount = useMemo(() => {
    return projects.filter((p) => {
      const delay = calculateProjectDelay(
        p.scheduled_completion_date,
        p.likely_completion_date || p.probable_completion_date,
        p.progress_percent
      );
      return delay.isDelayed;
    }).length;
  }, [projects]);

  const above50CrCount = useMemo(() => {
    return projects.filter((p) => {
      const cost = Number(
        p.revised_cost_cr && Number(p.revised_cost_cr) > 0
          ? p.revised_cost_cr
          : p.project_cost_cr || 0
      );
      return cost >= 50;
    }).length;
  }, [projects]);

  const nextSNo = useMemo(() => {
    if (projects.length === 0) return 1;
    return Math.max(...projects.map((p) => p.s_no || 0)) + 1;
  }, [projects]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      selectedCircle !== 'ALL' ||
      selectedDivision !== 'ALL' ||
      activeKpiFilter !== 'ACTIVE_ALL' ||
      delayMin !== '' ||
      delayMax !== '' ||
      progressMin !== '' ||
      progressMax !== ''
    );
  }, [
    searchTerm,
    selectedCircle,
    selectedDivision,
    activeKpiFilter,
    delayMin,
    delayMax,
    progressMin,
    progressMax,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCircle('ALL');
    setSelectedDivision('ALL');
    setActiveKpiFilter('ACTIVE_ALL');
    setDelayMin('');
    setDelayMax('');
    setProgressMin('');
    setProgressMax('');
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredProjects.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  if (uiMode === 'FORM') {
    return (
      <OngoingWorkEntryForm
        key={selectedProjectForEdit?.id || 'new-ongoing-work'}
        initialData={selectedProjectForEdit || undefined}
        nextSNo={nextSNo}
        masterCircles={masterData.circles}
        masterDivisions={masterData.divisions}
        masterSchemes={masterData.schemes}
        circleDivisionMap={masterData.circleDivisionMap}
        onSave={handleSaveProject}
        onCancel={() => {
          setUiMode('LIST');
          setSelectedProjectForEdit(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Module Page Header */}
      <ModulePageHeader
        badge="Works Module"
        title="Ongoing Works"
        subtitle="Capital infrastructure works, bypasses, ROBs, flyovers, and four-laning projects across Tamil Nadu divisions."
        onRefresh={fetchProjects}
        isLoading={loading}
        refreshLabel="Refresh"
        masterConfig={{
          onClick: () => setUiMode(uiMode === 'MASTER_DATA' ? 'LIST' : 'MASTER_DATA'),
          label: uiMode === 'MASTER_DATA' ? 'Works List' : 'Master Config',
          title: uiMode === 'MASTER_DATA' ? 'Back to Ongoing Works' : 'Configure Division & Scheme Dropdown Options',
        }}
        archiveToggle={{
          showArchived,
          onToggle: () => setShowArchived((v) => !v),
          activeLabel: "Hide Archived",
          inactiveLabel: "Show Archived",
        }}
        importAction={{
          disabled: true,
          disabledReason: "Works Excel Import coming soon",
        }}
        exportAction={{
          onClick: () => setIsExportModalOpen(true),
          label: "Custom Export",
        }}
        primaryAction={{
          onClick: () => {
            setSelectedProjectForEdit(null);
            setUiMode('FORM');
          },
          label: "Add Work",
        }}
      />

      {/* In-Page Master Data Config Mode */}
      {uiMode === 'MASTER_DATA' && (
        <OngoingWorksMasterDataModal
          isPageMode
          onClose={() => setUiMode('LIST')}
          masterData={masterData}
          onRefresh={fetchMasterData}
        />
      )}

      {/* Main Works List Mode */}
      {uiMode === 'LIST' && (
        <>
          {/* 6 Executive KPI Summary Quadrant Cards (3 Rows × 2 Columns with single-select mutually-exclusive filtering) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Row 1, Col 1: Active Ongoing Works */}
            <button
              type="button"
              onClick={() => setActiveKpiFilter('ACTIVE_ALL')}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                activeKpiFilter === 'ACTIVE_ALL'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Active Ongoing Works
              {activeKpiFilter === 'ACTIVE_ALL' && (
                <span className="normal-case text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Active
                </span>
              )}
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {activeCount} <span className="text-sm font-normal text-slate-500 font-sans">Active Works</span> &bull;{' '}
              <span className="text-base font-semibold text-slate-700 dark:text-slate-300 font-sans">{totalCount}</span>{' '}
              <span className="text-sm font-normal text-slate-500 font-sans">Total</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            Capital Highway Stretches Under Real-Time Monitoring
          </div>
        </button>

        {/* Row 1, Col 2: Capital Outlay */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter((prev) => (prev === 'ABOVE_50CR' ? 'ACTIVE_ALL' : 'ABOVE_50CR'))}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeKpiFilter === 'ABOVE_50CR'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Capital Outlay Budget
              {activeKpiFilter === 'ABOVE_50CR' && (
                <span className="normal-case text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  &ge;₹50 Cr Filter Active
                </span>
              )}
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              ₹ {totalCostCr.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              <span className="text-sm font-normal text-slate-500 font-sans">Cr Outlay</span> &bull;{' '}
              <span className="text-base font-semibold text-emerald-600 font-sans">{above50CrCount}</span>{' '}
              <span className="text-sm font-normal text-slate-500 font-sans">&ge;₹50 Cr</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Sanctioned Project Budget &bull; Click to filter major works (&ge; ₹50 Cr)
          </div>
        </button>

        {/* Row 2, Col 1: Under Execution */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter((prev) => (prev === 'IN_PROGRESS' ? 'ACTIVE_ALL' : 'IN_PROGRESS'))}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeKpiFilter === 'IN_PROGRESS'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Under Active Execution
              {activeKpiFilter === 'IN_PROGRESS' && (
                <span className="normal-case text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  Active
                </span>
              )}
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 font-mono">
              {inProgressCount} <span className="text-sm font-normal text-slate-500 font-sans">Projects On-Site</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            Physical Civil Construction & Road Laying In Progress
          </div>
        </button>

        {/* Row 2, Col 2: Tender Stage */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter((prev) => (prev === 'TENDER_STAGE' ? 'ACTIVE_ALL' : 'TENDER_STAGE'))}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeKpiFilter === 'TENDER_STAGE'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Tender & Pre-Construction
              {activeKpiFilter === 'TENDER_STAGE' && (
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
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
              {tenderCount} <span className="text-sm font-normal text-slate-500 font-sans">Projects</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            DPR Preparation, Bidding, Evaluation & Pre-Construction
          </div>
        </button>

        {/* Row 3, Col 1: Delayed Works */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter((prev) => (prev === 'DELAYED' ? 'ACTIVE_ALL' : 'DELAYED'))}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeKpiFilter === 'DELAYED'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Delayed Works (Time Overrun)
              {activeKpiFilter === 'DELAYED' && (
                <span className="normal-case text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  Active
                </span>
              )}
            </span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {delayedCount} <span className="text-sm font-normal text-slate-500 font-sans">Overrun Projects</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            Time Overrun &gt; 0 Years &bull; Critical Milestone Review
          </div>
        </button>

        {/* Row 3, Col 2: Completed Works */}
        <button
          type="button"
          onClick={() => setActiveKpiFilter((prev) => (prev === 'COMPLETED' ? 'ACTIVE_ALL' : 'COMPLETED'))}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
            activeKpiFilter === 'COMPLETED'
              ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/40 dark:bg-teal-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Completed Works (100% Done)
              {activeKpiFilter === 'COMPLETED' && (
                <span className="normal-case text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  Active
                </span>
              )}
            </span>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 rounded-lg text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 font-mono">
              {completedCount} <span className="text-sm font-normal text-slate-500 font-sans">Works</span> &bull;{' '}
              <span className="text-base font-semibold text-teal-600 font-sans">
                ₹ {completedCostCr.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>{' '}
              <span className="text-sm font-normal text-slate-500 font-sans">Cr Completed</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
            100% Physical Progress Achieved &bull; Fully Operational
          </div>
        </button>
      </div>

      {/* Comprehensive 2-Tier Filter Panel (Option A) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Tier 1: Search Bar, Circle & Division Cascade, and Mega Projects Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search works by name, job number, PMIS ID, contractor..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Circle & Division Cascading Selects & 50Cr Button */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap sm:flex-nowrap shrink-0">
            {/* Circle Filter */}
            <div className="w-full sm:w-44">
              <SearchableSelect
                options={['All Circles', ...circlesList]}
                value={selectedCircle === 'ALL' || !selectedCircle ? 'All Circles' : selectedCircle}
                onChange={(val) => {
                  const newCircle = val === 'All Circles' ? 'ALL' : val;
                  setSelectedCircle(newCircle);
                  setSelectedDivision('ALL');
                }}
                placeholder="Circle..."
              />
            </div>

            {/* Division Filter */}
            <div className="w-full sm:w-44">
              <SearchableSelect
                options={['All Divisions', ...divisionsList]}
                value={selectedDivision === 'ALL' || !selectedDivision ? 'All Divisions' : selectedDivision}
                onChange={(val) => setSelectedDivision(val === 'All Divisions' ? 'ALL' : val)}
                placeholder="Division..."
              />
            </div>

            {/* ≥ ₹50 Cr Mega Works Toggle */}
            <button
              onClick={() => setActiveKpiFilter((prev) => (prev === 'ABOVE_50CR' ? 'ACTIVE_ALL' : 'ABOVE_50CR'))}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 border shrink-0 ${
                activeKpiFilter === 'ABOVE_50CR'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
              }`}
              title="Toggle filter for Mega Projects (Cost ≥ ₹50 Cr)"
            >
              <span>⚡ &ge; ₹50 Cr</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  activeKpiFilter === 'ABOVE_50CR'
                    ? 'bg-amber-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {above50CrCount}
              </span>
            </button>
          </div>
        </div>

        {/* Tier 2: Delay (Yrs) & Physical Progress (%) Range Sliders + Result Counts & Reset */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 1. Delay (Years) Range Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/70">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Delay (Yrs):</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Min"
                  value={delayMin}
                  onChange={(e) => setDelayMin(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-rose-500 text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-400 font-normal text-[11px]">to</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Max"
                  value={delayMax}
                  onChange={(e) => setDelayMax(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-rose-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {(delayMin !== '' || delayMax !== '') && (
                <button
                  onClick={() => {
                    setDelayMin('');
                    setDelayMax('');
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Delay Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Progress (%) Range Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/70">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                <Percent className="w-3.5 h-3.5 text-emerald-500" />
                <span>Progress (%):</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0%"
                  value={progressMin}
                  onChange={(e) => setProgressMin(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-400 font-normal text-[11px]">to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100%"
                  value={progressMax}
                  onChange={(e) => setProgressMax(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {(progressMin !== '' || progressMax !== '') && (
                <button
                  onClick={() => {
                    setProgressMin('');
                    setProgressMax('');
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Progress Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results Badge & Reset Action */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              Showing {filteredProjects.length} work{filteredProjects.length === 1 ? '' : 's'}
            </span>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-200 dark:border-rose-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating / Inline Selected Row Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs animate-in fade-in duration-150 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded-md">
              {selectedIds.length}
            </span>
            <span className="font-bold text-blue-950 dark:text-blue-200">
              {selectedIds.length === 1 ? 'project row selected' : 'project rows selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Selected ({selectedIds.length})
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold cursor-pointer transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Main Ongoing Works Table */}
      <MajorProjectsTable
        projects={filteredProjects}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onView={(project) => setViewingProject(project)}
        onEdit={(project) => {
          setSelectedProjectForEdit(project);
          setUiMode('FORM');
        }}
        onDelete={(project) => setDeletingProject(project)}
        onRestore={handleRestoreProject}
        onHistory={(project) => setHistoryProject(project)}
      />

      {/* Custom Export Modal (Corridors Style with Row/Col/Format picker) */}
      <ExportMajorProjectsModal
        allProjects={projects}
        filteredProjects={filteredProjects}
        selectedIds={selectedIds}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

        </>
      )}

      {/* View Modal */}
      <ViewMajorProjectModal
        project={viewingProject}
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        onEdit={(project) => {
          setViewingProject(null);
          setSelectedProjectForEdit(project);
          setUiMode('FORM');
        }}
      />

      {/* Soft Delete Confirmation Modal */}
      <DeleteMajorProjectModal
        project={deletingProject}
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onSuccess={() => {
          setDeletingProject(null);
          fetchProjects();
        }}
      />

      {/* Historical Snapshot Timeline & Trendline Modal */}
      <ProjectHistoryModal
        project={historyProject}
        isOpen={!!historyProject}
        onClose={() => setHistoryProject(null)}
      />
    </div>
  );
};

export default MajorProjectsDashboard;
