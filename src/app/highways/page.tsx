'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HighwayCorridor, HighwaysApiResponse } from '@/app/api/highways/route';
import { KpiHeaderCards } from '@/components/highways/KpiHeaderCards';
import { FilterControls } from '@/components/highways/FilterControls';
import { HighwaysTable } from '@/components/highways/HighwaysTable';
import { HighwaysGrid } from '@/components/highways/HighwaysGrid';
import { HighwayEntryForm } from '@/components/highways/HighwayEntryForm';
import { ViewHighwayModal } from '@/components/highways/ViewHighwayModal';
import { DeleteHighwayModal } from '@/components/highways/DeleteHighwayModal';
import { ExportHighwayModal } from '@/components/highways/ExportHighwayModal';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Route, RefreshCw, Plus, Download } from 'lucide-react';

export default function HighwaysPage() {
  const [allCorridors, setAllCorridors] = useState<HighwayCorridor[]>([]);
  const [corridors, setCorridors] = useState<HighwayCorridor[]>([]);
  const [aggregates, setAggregates] = useState<{
    totalCorridors: number;
    totalLengthKm: number;
    laneDistribution: Record<string, number>;
    laneLengthsKm?: {
      lessThan2l: number;
      lane2l: number;
      lane2lPs: number;
      lane4l: number;
      lane6l: number;
    };
    corridorsWithDlp: number;
  }>({
    totalCorridors: 0,
    totalLengthKm: 0,
    laneDistribution: {},
    laneLengthsKm: { lessThan2l: 0, lane2l: 0, lane2lPs: 0, lane4l: 0, lane6l: 0 },
    corridorsWithDlp: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [activeConfig, setActiveConfig] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('length_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Selection & Export States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Archive Toggle
  const [showArchived, setShowArchived] = useState(false);

  // Screen State: 'LIST' | 'FORM'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedHighwayForEdit, setSelectedHighwayForEdit] = useState<HighwayCorridor | null>(null);

  // Modal Visibility States
  const [viewingHighway, setViewingHighway] = useState<HighwayCorridor | null>(null);
  const [deletingHighway, setDeletingHighway] = useState<HighwayCorridor | null>(null);

  const [activeLaneFilter, setActiveLaneFilter] = useState<string | null>(null);

  const displayedCorridors = React.useMemo(() => {
    if (!activeLaneFilter) return corridors;
    return corridors.filter((c) => {
      if (activeLaneFilter === 'lessThan2l') return Number(c.length_less_than_2l) > 0;
      if (activeLaneFilter === 'lane2l') return Number(c.length_2l) > 0;
      if (activeLaneFilter === 'lane2lPs') return Number(c.length_2l_ps) > 0;
      if (activeLaneFilter === 'lane4l') return Number(c.length_4l) > 0;
      if (activeLaneFilter === 'lane6l') return Number(c.length_6l) > 0;
      return true;
    });
  }, [corridors, activeLaneFilter]);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchHighways = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeConfig && activeConfig !== 'ALL') params.set('config', activeConfig);
      if (sortBy) params.set('sortBy', sortBy);
      if (showArchived) params.set('includeDeleted', 'true');

      const res = await fetch(`/api/highways?${params.toString()}`);
      const data: HighwaysApiResponse = await res.json();

      if (data.success) {
        setCorridors(data.corridors || []);
        setAggregates(
          data.aggregates || {
            totalCorridors: 0,
            totalLengthKm: 0,
            laneDistribution: {},
            corridorsWithDlp: 0,
          }
        );
      }

      // Also fetch un-filtered all corridors for complete export pool if search/filter active
      if (debouncedSearch || activeConfig !== 'ALL') {
        const resAll = await fetch('/api/highways');
        const dataAll: HighwaysApiResponse = await resAll.json();
        if (dataAll.success) {
          setAllCorridors(dataAll.corridors || []);
        }
      } else {
        setAllCorridors(data.corridors || []);
      }
    } catch (err) {
      console.error('Failed to fetch highways:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeConfig, sortBy, showArchived]);

  useEffect(() => {
    fetchHighways();
  }, [fetchHighways]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(corridors.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSaveHighway = async (formData: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/highways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setUiMode('LIST');
        setSelectedHighwayForEdit(null);
        fetchHighways();
      }
    } catch (err) {
      console.error('Failed to save highway:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Global Navigation Header */}
      <NavigationHeader />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {uiMode === 'FORM' ? (
          <HighwayEntryForm
            initialData={selectedHighwayForEdit || undefined}
            onSave={handleSaveHighway}
            onCancel={() => {
              setUiMode('LIST');
              setSelectedHighwayForEdit(null);
            }}
          />
        ) : (
          <>
            {/* Page Header Title */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Route className="w-6 h-6 text-blue-600" />
                  Master Corridor Catalog & Management
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Verified Level 1 ground-truth inventory with Old/New NH numbers, multi-lane breakdown, Add, Edit, Print, and Data Export.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={() => fetchHighways()}
                  disabled={loading}
                  className="p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  title="Refresh Catalog"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Catalog
                </button>

                <button
                  onClick={() => {
                    setSelectedHighwayForEdit(null);
                    setUiMode('FORM');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Highway
                </button>
              </div>
            </div>

        {/* Section A: KPI Summary Cards */}
        <KpiHeaderCards
          totalCorridors={aggregates.totalCorridors}
          totalLengthKm={aggregates.totalLengthKm}
          laneDistribution={aggregates.laneDistribution}
          laneLengthsKm={aggregates.laneLengthsKm}
          corridorsWithDlp={aggregates.corridorsWithDlp}
          loading={loading && corridors.length === 0}
          activeLaneFilter={activeLaneFilter}
          onSelectLaneFilter={(key) => setActiveLaneFilter((prev) => prev === key ? null : key)}
        />

        {/* Section B: Filter & Search Bar */}
        <div className="print:hidden">
          <FilterControls
            search={search}
            onSearchChange={setSearch}
            activeConfig={activeConfig}
            onConfigChange={setActiveConfig}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={displayedCorridors.length}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived((v) => !v)}
          />
        </div>

        {/* Section C: Master Catalog View */}
        {viewMode === 'table' ? (
          <HighwaysTable
            corridors={displayedCorridors}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onView={(h) => setViewingHighway(h)}
            onEdit={(h) => {
              setSelectedHighwayForEdit(h);
              setUiMode('FORM');
            }}
            onDelete={(h) => setDeletingHighway(h)}
            activeLaneFilter={activeLaneFilter}
          />
        ) : (
          <HighwaysGrid
            corridors={displayedCorridors}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onView={(h) => setViewingHighway(h)}
            onEdit={(h) => {
              setSelectedHighwayForEdit(h);
              setUiMode('FORM');
            }}
            onDelete={(h) => setDeletingHighway(h)}
          />
        )}
          </>
        )}
      </main>

      {/* Modals Suite */}
      <ViewHighwayModal
        highway={viewingHighway}
        isOpen={Boolean(viewingHighway)}
        onClose={() => setViewingHighway(null)}
        onEdit={(h) => {
          setViewingHighway(null);
          setSelectedHighwayForEdit(h);
          setUiMode('FORM');
        }}
      />

      <DeleteHighwayModal
        highway={deletingHighway}
        isOpen={Boolean(deletingHighway)}
        onClose={() => setDeletingHighway(null)}
        onSuccess={() => fetchHighways()}
      />

      <ExportHighwayModal
        allCorridors={allCorridors.length > 0 ? allCorridors : corridors}
        filteredCorridors={corridors}
        selectedIds={selectedIds}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
