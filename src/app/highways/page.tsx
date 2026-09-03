'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HighwayCorridor, HighwaysApiResponse } from '@/app/api/highways/route';
import { KpiHeaderCards } from '@/components/highways/KpiHeaderCards';
import { FilterControls } from '@/components/highways/FilterControls';
import { HighwaysTable } from '@/components/highways/HighwaysTable';
import { HighwaysGrid } from '@/components/highways/HighwaysGrid';
import { HighwayEntryForm } from '@/components/highways/HighwayEntryForm';
import { HighwayMasterDataModal } from '@/components/highways/HighwayMasterDataModal';
import { HighwayMasterData } from '@/app/api/highways/master-data/route';
import { ViewHighwayModal } from '@/components/highways/ViewHighwayModal';
import { DeleteHighwayModal } from '@/components/highways/DeleteHighwayModal';
import { ExportDataModal } from '@/components/common/ExportDataModal';
import { HIGHWAYS_L1_COLUMNS } from '@/lib/export/columns';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ModulePageHeader } from '@/components/common/ModulePageHeader';
import { Route } from 'lucide-react';

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
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);

  // Master Data Configuration State
  const [masterData, setMasterData] = useState<HighwayMasterData>({
    rawItems: [],
    circles: [],
    divisions: [],
    configurations: [],
  });

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/highways/master-data');
      const data = await res.json();
      if (data && Array.isArray(data.configurations)) {
        setMasterData(data);
      }
    } catch (err) {
      console.warn('Master data fetch note:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Archive Toggle
  const [showArchived, setShowArchived] = useState(false);

  // Screen State: 'LIST' | 'FORM' | 'MASTER_DATA'
  const [uiMode, setUiMode] = useState<'LIST' | 'FORM' | 'MASTER_DATA'>('LIST');
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

  const handleRestoreHighway = async (highway: HighwayCorridor) => {
    try {
      const res = await fetch('/api/highways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: highway.id,
          action: 'restore',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchHighways();
      } else {
        alert(data.message || 'Failed to restore corridor');
      }
    } catch (err) {
      console.error('Failed to restore highway:', err);
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
            masterData={masterData}
            onSave={handleSaveHighway}
            onCancel={() => {
              setUiMode('LIST');
              setSelectedHighwayForEdit(null);
            }}
          />
        ) : (
          <>
            {/* Unified Module Page Header */}
            <ModulePageHeader
              icon={Route}
              title="Master Corridor Catalog & Management"
              subtitle="Verified Level 1 ground-truth inventory with Old/New NH numbers, multi-lane breakdown, Add, Edit, Print, and Data Export."
              onRefresh={() => fetchHighways()}
              isLoading={loading}
              refreshLabel="Refresh"
              masterConfig={{
                onClick: () => setUiMode(uiMode === 'MASTER_DATA' ? 'LIST' : 'MASTER_DATA'),
                label: uiMode === 'MASTER_DATA' ? 'Corridors' : 'Master Config',
                title: uiMode === 'MASTER_DATA' ? 'Back to Corridors Catalog' : 'Configure Corridor Dropdown Options',
              }}
              archiveToggle={{
                showArchived,
                onToggle: () => setShowArchived((v) => !v),
                activeLabel: "Hide Archived",
                inactiveLabel: "Show Archived",
              }}
              importAction={{
                disabled: true,
                disabledReason: "Highways Excel Import coming soon",
              }}
              exportAction={{
                onClick: () => setIsExportModalOpen(true),
                label: "Export",
              }}
              primaryAction={{
                onClick: () => {
                  setSelectedHighwayForEdit(null);
                  setUiMode('FORM');
                },
                label: "Add New",
              }}
            />

            {/* In-Page Master Data Config Mode */}
            {uiMode === 'MASTER_DATA' && (
              <HighwayMasterDataModal
                isPageMode
                onClose={() => setUiMode('LIST')}
                masterData={masterData}
                onRefresh={() => {
                  fetchMasterData();
                  fetchHighways();
                }}
              />
            )}

            {/* Main Corridors List Mode */}
            {uiMode === 'LIST' && (
              <>
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
                    onRestore={handleRestoreHighway}
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

      <ExportDataModal
        module="highways"
        moduleTitle="Master Corridor Catalog"
        totalCount={allCorridors.length > 0 ? allCorridors.length : corridors.length}
        filteredCount={displayedCorridors.length}
        selectedIds={selectedIds}
        columns={HIGHWAYS_L1_COLUMNS}
        isCorridorsModule={true}
        filters={{
          search: debouncedSearch,
          config: activeConfig,
          includeDeleted: showArchived,
        }}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
