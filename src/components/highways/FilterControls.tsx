'use client';

import React from 'react';
import { Search, X, LayoutGrid, Table, ArrowUpDown, Filter } from 'lucide-react';
import { SearchableSelect } from '@/components/common/SearchableSelect';

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
    { label: '2-Lane', value: '2-Lane' },
    { label: '2-Lane (PS)', value: '2-Lane (Paved Shoulder)' },
    { label: '4-Lane', value: '4-Lane' },
    { label: '4-Lane (PS)', value: '4-Lane (Paved Shoulder)' },
    { label: '6-Lane+', value: '6-Lane' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 mb-6 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5">
      {/* Left: Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by NH code (e.g. NH-181), stretch name, or division..."
          className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Center: Carriageway Lane Segmented Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-slate-400" /> Lanes:
        </span>
        {configOptions.map((opt) => {
          const isActive = activeConfig === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onConfigChange(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Sort Dropdown + Count Badge + View Mode Switcher */}
      <div className="flex items-center justify-between xl:justify-end gap-2.5 shrink-0">
        {/* Sort Selector */}
        <div className="w-44">
          <SearchableSelect
            options={['Sort: Length (Longest)', 'Sort: Length (Shortest)', 'Sort: Road Code (A-Z)']}
            value={
              sortBy === 'length_desc'
                ? 'Sort: Length (Longest)'
                : sortBy === 'length_asc'
                ? 'Sort: Length (Shortest)'
                : 'Sort: Road Code (A-Z)'
            }
            onChange={(val) => {
              if (val.includes('Longest')) onSortChange('length_desc');
              else if (val.includes('Shortest')) onSortChange('length_asc');
              else onSortChange('code_asc');
            }}
            placeholder="Sort by..."
          />
        </div>

        {/* Result Counter Pill */}
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hidden sm:inline-block shrink-0">
          {totalResults} corridor{totalResults === 1 ? '' : 's'}
        </span>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => onViewModeChange('table')}
            title="Table View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid Card View"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
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
