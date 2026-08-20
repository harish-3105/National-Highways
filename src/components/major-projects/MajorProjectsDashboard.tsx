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
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import { OngoingWorksMasterData } from '@/app/api/ongoing-works/master-data/route';
import { calculateProjectDelay, calculateFinancialProgress } from '@/lib/formatters';
import { MajorProjectsTable } from './MajorProjectsTable';
import { OngoingWorkEntryForm } from './OngoingWorkEntryForm';
import { ViewMajorProjectModal } from './ViewMajorProjectModal';
import { DeleteMajorProjectModal } from './DeleteMajorProjectModal';
import { OngoingWorksMasterDataModal } from './OngoingWorksMasterDataModal';

export const MajorProjectsDashboard: React.FC = () => {
  const [projects, setProjects] = useState<MajorProject[]>([]);
  const [masterData, setMasterData] = useState<OngoingWorksMasterData>({
    rawItems: [],
    divisions: [],
    schemes: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Screen state: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<MajorProject | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<'ALL' | 'IN_PROGRESS' | 'TENDER_STAGE' | 'DELAYED'>('ALL');
  const [costAbove50CrOnly, setCostAbove50CrOnly] = useState<boolean>(false);

  // Range Filters
  const [delayMin, setDelayMin] = useState<string>('');
  const [delayMax, setDelayMax] = useState<string>('');
  const [progressMin, setProgressMin] = useState<string>('');
  const [progressMax, setProgressMax] = useState<string>('');

  // Modals state
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [viewingProject, setViewingProject] = useState<MajorProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<MajorProject | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/major-projects?${showArchived ? 'includeDeleted=true' : ''}`);
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
        body: JSON.stringify(projectData),
      });
      const data = await res.json();
      if (data.success) {
        setUiMode('LIST');
        setSelectedProjectForEdit(null);
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to save project:', err);
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

  // Divisions list for filter dropdown (merged master + active project divisions)
  const divisionsList = useMemo(() => {
    const set = new Set<string>(masterData.divisions || []);
    projects.forEach((p) => {
      if (p.division) set.add(p.division);
    });
    return Array.from(set).sort();
  }, [projects, masterData.divisions]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Division filter
      const matchesDivision =
        selectedDivision === 'ALL' ||
        (p.division || '').toLowerCase() === selectedDivision.toLowerCase();

      // Dynamic Delay Calculation for accurate stage & range filtering
      const delayInfo = calculateProjectDelay(
        p.scheduled_completion_date,
        p.likely_completion_date || p.probable_completion_date,
        p.progress_percent
      );

      // 2. Stage filter
      let matchesStage = true;
      if (selectedStage === 'IN_PROGRESS') {
        matchesStage = p.work_stage === 'IN_PROGRESS';
      } else if (selectedStage === 'TENDER_STAGE') {
        matchesStage = p.work_stage === 'TENDER_STAGE';
      } else if (selectedStage === 'DELAYED') {
        matchesStage = delayInfo.isDelayed;
      }

      // 3. Delay Range Filter (in years)
      let matchesDelayRange = true;
      const overrun = delayInfo.delayYears;
      if (delayMin !== '') {
        matchesDelayRange = matchesDelayRange && overrun >= Number(delayMin);
      }
      if (delayMax !== '') {
        matchesDelayRange = matchesDelayRange && overrun <= Number(delayMax);
      }

      // 4. Progress Range Filter (in %)
      let matchesProgressRange = true;
      const prog =
        p.progress_percent !== undefined && p.progress_percent !== null ? Number(p.progress_percent) : 0;
      if (progressMin !== '') {
        matchesProgressRange = matchesProgressRange && prog >= Number(progressMin);
      }
      if (progressMax !== '') {
        matchesProgressRange = matchesProgressRange && prog <= Number(progressMax);
      }

      // 5. Cost ≥ ₹50 Cr Filter (based on revised_cost if present, else project_cost)
      let matchesCost50Cr = true;
      if (costAbove50CrOnly) {
        const effectiveCost = Number(
          p.revised_cost_cr && Number(p.revised_cost_cr) > 0
            ? p.revised_cost_cr
            : p.project_cost_cr || 0
        );
        matchesCost50Cr = effectiveCost >= 50;
      }

      // 6. Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        (p.name_of_work || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.scheme || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.division || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.pmis_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.job_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contractor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.de_name_phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.detailed_stage_status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.stage_remarks || '').toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesDivision &&
        matchesStage &&
        matchesDelayRange &&
        matchesProgressRange &&
        matchesCost50Cr &&
        matchesSearch
      );
    });
  }, [
    projects,
    selectedDivision,
    selectedStage,
    costAbove50CrOnly,
    delayMin,
    delayMax,
    progressMin,
    progressMax,
    searchTerm,
  ]);

  // Aggregate KPI metrics
  const totalCount = projects.length;
  const totalCostCr = useMemo(() => {
    return projects.reduce((sum, p) => sum + (Number(p.project_cost_cr) || 0), 0);
  }, [projects]);

  const inProgressCount = useMemo(() => {
    return projects.filter((p) => p.work_stage === 'IN_PROGRESS').length;
  }, [projects]);

  const tenderCount = useMemo(() => {
    return projects.filter((p) => p.work_stage === 'TENDER_STAGE').length;
  }, [projects]);

  // Dynamic live delayed count
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

  // Mega project (≥ 50 Cr) count
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
      selectedDivision !== 'ALL' ||
      selectedStage !== 'ALL' ||
      costAbove50CrOnly ||
      delayMin !== '' ||
      delayMax !== '' ||
      progressMin !== '' ||
      progressMax !== ''
    );
  }, [
    searchTerm,
    selectedDivision,
    selectedStage,
    costAbove50CrOnly,
    delayMin,
    delayMax,
    progressMin,
    progressMax,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDivision('ALL');
    setSelectedStage('ALL');
    setCostAbove50CrOnly(false);
    setDelayMin('');
    setDelayMax('');
    setProgressMin('');
    setProgressMax('');
  };

  if (uiMode === 'FORM') {
    return (
      <OngoingWorkEntryForm
        initialData={selectedProjectForEdit || undefined}
        nextSNo={nextSNo}
        masterDivisions={masterData.divisions}
        masterSchemes={masterData.schemes}
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
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white font-extrabold text-xs rounded-md uppercase tracking-wider">
              Works Module
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Ongoing Works
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capital infrastructure works, bypasses, ROBs, flyovers, and four-laning projects across Tamil Nadu divisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={fetchProjects}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showArchived
                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={showArchived ? 'Hide Archived Records' : 'Show Archived Records'}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
          </button>
          <button
            onClick={() => setIsMasterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Configure Division & Scheme Dropdown Options"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Master Config</span>
          </button>
          <button
            onClick={() => {
              setSelectedProjectForEdit(null);
              setUiMode('FORM');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work</span>
          </button>
        </div>
      </div>

      {/* 5 Top KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Works */}
        <div
          onClick={() => setSelectedStage('ALL')}
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            selectedStage === 'ALL' && !hasActiveFilters
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Total Ongoing Works</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {totalCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">All registered works</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Project Cost */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Total Capital Outlay</span>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹ {totalCostCr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Approved Outlay</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: In Progress (Execution) */}
        <div
          onClick={() => setSelectedStage(selectedStage === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            selectedStage === 'IN_PROGRESS'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Under Execution</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {inProgressCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Physical works active</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tender Stage */}
        <div
          onClick={() => setSelectedStage(selectedStage === 'TENDER_STAGE' ? 'ALL' : 'TENDER_STAGE')}
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            selectedStage === 'TENDER_STAGE'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Tender / Pre-Const.</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {tenderCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Bidding / Scrutiny</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Delayed Works (Time Overrun) */}
        <div
          onClick={() => {
            if (selectedStage === 'DELAYED') {
              setSelectedStage('ALL');
              setDelayMin('');
            } else {
              setSelectedStage('DELAYED');
              setDelayMin('0.01');
            }
          }}
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            selectedStage === 'DELAYED' || (delayMin !== '' && Number(delayMin) > 0)
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Delayed Works</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {delayedCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Time Overrun &gt; 0y</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Tier 1: Search, Division & Stage Tabs */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by work, NH, scheme, division..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            {/* Division Filter */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Divisions ({divisionsList.length})</option>
              {divisionsList.map((d) => (
                <option key={d} value={d}>
                  {d} Division
                </option>
              ))}
            </select>

            {/* ≥ ₹50 Cr Filter Toggle */}
            <button
              onClick={() => setCostAbove50CrOnly(!costAbove50CrOnly)}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 border ${
                costAbove50CrOnly
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
              }`}
              title="Toggle filter for Mega Projects (Cost ≥ ₹50 Cr)"
            >
              <span>⚡ &ge; ₹50 Cr</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  costAbove50CrOnly
                    ? 'bg-amber-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {above50CrCount}
              </span>
            </button>

            {/* Stage Selector Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSelectedStage('ALL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStage === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setSelectedStage('IN_PROGRESS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStage === 'IN_PROGRESS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setSelectedStage('TENDER_STAGE')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStage === 'TENDER_STAGE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tender ({tenderCount})
              </button>
              <button
                onClick={() => setSelectedStage('DELAYED')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStage === 'DELAYED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                Delayed ({delayedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: From & To Range Filters for Delay & Physical Progress */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
            {/* 1. Delay (Years) Range Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Delay (Yrs):</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="From"
                  value={delayMin}
                  onChange={(e) => setDelayMin(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-rose-500"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="To"
                  value={delayMax}
                  onChange={(e) => setDelayMax(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Quick delay preset chips */}
              <div className="hidden sm:flex items-center gap-1 ml-1 text-[10.5px]">
                <button
                  onClick={() => {
                    if (delayMin === '0.01' && delayMax === '0.99') {
                      setDelayMin('');
                      setDelayMax('');
                    } else {
                      setDelayMin('0.01');
                      setDelayMax('0.99');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    delayMin === '0.01' && delayMax === '0.99'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Delayed strictly under 1 year (< 1 yr)"
                >
                  &lt; 1y
                </button>
                <button
                  onClick={() => {
                    if (delayMin === '1' && delayMax === '3') {
                      setDelayMin('');
                      setDelayMax('');
                    } else {
                      setDelayMin('1');
                      setDelayMax('3');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    delayMin === '1' && delayMax === '3'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Delayed 1 to 3 years inclusive (1 – 3 yrs)"
                >
                  1 – 3y
                </button>
                <button
                  onClick={() => {
                    if (delayMin === '3.01' && delayMax === '') {
                      setDelayMin('');
                      setDelayMax('');
                    } else {
                      setDelayMin('3.01');
                      setDelayMax('');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    delayMin === '3.01' && delayMax === ''
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Delayed strictly over 3 years (> 3 yrs)"
                >
                  &gt; 3y
                </button>
              </div>

              {(delayMin !== '' || delayMax !== '') && (
                <button
                  onClick={() => {
                    setDelayMin('');
                    setDelayMax('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Delay Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Progress (%) Range Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-500" />
                <span>Progress (%):</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min"
                  value={progressMin}
                  onChange={(e) => setProgressMin(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max"
                  value={progressMax}
                  onChange={(e) => setProgressMax(e.target.value)}
                  className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Quick progress preset chips */}
              <div className="hidden sm:flex items-center gap-1 ml-1 text-[10.5px]">
                <button
                  onClick={() => {
                    if (progressMin === '0' && progressMax === '24.9') {
                      setProgressMin('');
                      setProgressMax('');
                    } else {
                      setProgressMin('0');
                      setProgressMax('24.9');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    progressMin === '0' && progressMax === '24.9'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Progress strictly under 25% (< 25%)"
                >
                  &lt; 25%
                </button>
                <button
                  onClick={() => {
                    if (progressMin === '25' && progressMax === '49.9') {
                      setProgressMin('');
                      setProgressMax('');
                    } else {
                      setProgressMin('25');
                      setProgressMax('49.9');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    progressMin === '25' && progressMax === '49.9'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Progress 25% to 49.9% (25 – 50%)"
                >
                  25 – 50%
                </button>
                <button
                  onClick={() => {
                    if (progressMin === '50' && progressMax === '74.9') {
                      setProgressMin('');
                      setProgressMax('');
                    } else {
                      setProgressMin('50');
                      setProgressMax('74.9');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    progressMin === '50' && progressMax === '74.9'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Progress 50% to 74.9% (50 – 75%)"
                >
                  50 – 75%
                </button>
                <button
                  onClick={() => {
                    if (progressMin === '75' && progressMax === '100') {
                      setProgressMin('');
                      setProgressMax('');
                    } else {
                      setProgressMin('75');
                      setProgressMax('100');
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-semibold ${
                    progressMin === '75' && progressMax === '100'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Progress 75% to 100% (75 – 100%)"
                >
                  75 – 100%
                </button>
              </div>

              {(progressMin !== '' || progressMax !== '') && (
                <button
                  onClick={() => {
                    setProgressMin('');
                    setProgressMax('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Progress Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer font-bold text-xs self-end md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <MajorProjectsTable
        projects={filteredProjects}
        loading={loading}
        onView={(p) => setViewingProject(p)}
        onEdit={(p) => {
          setSelectedProjectForEdit(p);
          setUiMode('FORM');
        }}
        onDelete={(p) => setDeletingProject(p)}
        onRestore={handleRestoreProject}
      />

      {/* Modal Suite */}
      <ViewMajorProjectModal
        project={viewingProject}
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        onEdit={(p) => {
          setViewingProject(null);
          setSelectedProjectForEdit(p);
          setUiMode('FORM');
        }}
      />

      <DeleteMajorProjectModal
        project={deletingProject}
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onSuccess={fetchProjects}
      />

      <OngoingWorksMasterDataModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterData={masterData}
        onRefresh={fetchMasterData}
      />
    </div>
  );
};
