'use client';

import React from 'react';
import { Search, X, LayoutGrid, Table, ArrowUpDown, Filter } from 'lucide-react';

interface FilterControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeConfig: string;
  onConfigChange: (config: string) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  totalResults: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  search,
  onSearchChange,
  activeConfig,
  onConfigChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
}) => {
  const configOptions = [
    { label: 'All Lanes', value: 'ALL' },
    { label: '4-Lane', value: '4-Lane' },
    { label: '2-Lane (PS)', value: '2-Lane (Paved Shoulder)' },
    { label: '2-Lane', value: '2-Lane' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by NH code (e.g. NH-181) or section location..."
          className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Configuration Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 hidden lg:flex">
          <Filter className="w-3.5 h-3.5" /> Lanes:
        </span>
        {configOptions.map((opt) => {
          const isActive = activeConfig === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onConfigChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Sort & View Toggle */}
      <div className="flex items-center gap-3">
        {/* Sort Selector */}
        <div className="relative flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
          >
            <option value="length_desc">Sort: Length (Longest)</option>
            <option value="length_asc">Sort: Length (Shortest)</option>
            <option value="road_code_asc">Sort: Road Code (A-Z)</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onViewModeChange('table')}
            title="Table View"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid Card View"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
