'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HighwayCorridor, HighwaysApiResponse } from '@/app/api/highways/route';
import { KpiHeaderCards } from '@/components/highways/KpiHeaderCards';
import { FilterControls } from '@/components/highways/FilterControls';
import { HighwaysTable } from '@/components/highways/HighwaysTable';
import { HighwaysGrid } from '@/components/highways/HighwaysGrid';
import { Route, Upload, RefreshCw } from 'lucide-react';

export default function HighwaysPage() {
  const [corridors, setCorridors] = useState<HighwayCorridor[]>([]);
  const [aggregates, setAggregates] = useState({
    totalCorridors: 0,
    totalLengthKm: 0,
    laneDistribution: {} as Record<string, number>,
    corridorsWithDlp: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [activeConfig, setActiveConfig] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('length_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
    } catch (err) {
      console.error('Failed to fetch highways:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeConfig, sortBy]);

  useEffect(() => {
    fetchHighways();
  }, [fetchHighways]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Global Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold">
              NH
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                Tamil Nadu National Highways
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Corridor Catalog & Infrastructure Inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHighways()}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/ingest"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Data Ingestion Engine</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Route className="w-6 h-6 text-blue-600" />
              Master Corridor Catalog (Phase 1.1)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verified ground-truth inventory of National Highways across Tamil Nadu PWD divisions.
            </p>
          </div>
        </div>

        {/* Section A: KPI Summary Cards */}
        <KpiHeaderCards
          totalCorridors={aggregates.totalCorridors}
          totalLengthKm={aggregates.totalLengthKm}
          laneDistribution={aggregates.laneDistribution}
          corridorsWithDlp={aggregates.corridorsWithDlp}
          loading={loading && corridors.length === 0}
        />

        {/* Section B: Filter & Search Bar */}
        <FilterControls
          search={search}
          onSearchChange={setSearch}
          activeConfig={activeConfig}
          onConfigChange={setActiveConfig}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={corridors.length}
        />

        {/* Section C: Master Catalog View */}
        {viewMode === 'table' ? (
          <HighwaysTable corridors={corridors} loading={loading} />
        ) : (
          <HighwaysGrid corridors={corridors} loading={loading} />
        )}
      </main>
    </div>
  );
}
