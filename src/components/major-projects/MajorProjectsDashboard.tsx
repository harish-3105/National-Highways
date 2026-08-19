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
} from 'lucide-react';
import { MajorProject } from '@/app/api/major-projects/route';
import { OngoingWorksMasterData } from '@/app/api/ongoing-works/master-data/route';
import { MajorProjectsTable } from './MajorProjectsTable';
import { AddMajorProjectModal } from './AddMajorProjectModal';
import { EditMajorProjectModal } from './EditMajorProjectModal';
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<'ALL' | 'IN_PROGRESS' | 'TENDER_STAGE'>('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [viewingProject, setViewingProject] = useState<MajorProject | null>(null);
  const [editingProject, setEditingProject] = useState<MajorProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<MajorProject | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/major-projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load major projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const matchesDivision =
        selectedDivision === 'ALL' ||
        (p.division || '').toLowerCase() === selectedDivision.toLowerCase();
      const matchesStage =
        selectedStage === 'ALL' || p.work_stage === selectedStage;
      const matchesSearch =
        !searchTerm.trim() ||
        (p.name_of_work || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.scheme || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.division || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.stage_remarks || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDivision && matchesStage && matchesSearch;
    });
  }, [projects, selectedDivision, selectedStage, searchTerm]);

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

  const nextSNo = useMemo(() => {
    if (projects.length === 0) return 1;
    return Math.max(...projects.map((p) => p.s_no || 0)) + 1;
  }, [projects]);

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

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchProjects}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
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
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Works */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Ongoing Works</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {totalCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">All registered works</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Project Cost */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Capital Outlay</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹ {totalCostCr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Approved Outlay</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-6 h-6" />
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
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Under Execution</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {inProgressCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Physical works active</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Activity className="w-6 h-6" />
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
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Tender / Pre-Construction</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {tenderCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Bidding / Scrutiny / LOA</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by work, NH, scheme, division..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Divisions ({divisionsList.length})</option>
            {divisionsList.map((d) => (
              <option key={d} value={d}>
                {d} Division
              </option>
            ))}
          </select>

          {/* Stage Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStage === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({projects.length})
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
          </div>
        </div>
      </div>

      {/* Main Table */}
      <MajorProjectsTable
        projects={filteredProjects}
        loading={loading}
        onView={(p) => setViewingProject(p)}
        onEdit={(p) => setEditingProject(p)}
        onDelete={(p) => setDeletingProject(p)}
      />

      {/* Modal Suite */}
      <AddMajorProjectModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchProjects}
        nextSNo={nextSNo}
        masterDivisions={masterData.divisions}
        masterSchemes={masterData.schemes}
      />

      <EditMajorProjectModal
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSuccess={fetchProjects}
        masterDivisions={masterData.divisions}
        masterSchemes={masterData.schemes}
      />

      <ViewMajorProjectModal
        project={viewingProject}
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        onEdit={(p) => {
          setViewingProject(null);
          setEditingProject(p);
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
