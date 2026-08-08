'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';

export interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
  preset: string | null;
}

interface DlpCalendarDateFilterProps {
  dateRange: DateRangeFilter;
  onChangeDateRange: (range: DateRangeFilter) => void;
  matchingCount: number;
  totalCount: number;
}

export function DlpCalendarDateFilter({
  dateRange,
  onChangeDateRange,
  matchingCount,
  totalCount,
}: DlpCalendarDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === 'ALL') {
      onChangeDateRange({ startDate: null, endDate: null, preset: null });
    } else if (presetKey === 'AUG_2026') {
      onChangeDateRange({ startDate: '2026-08-01', endDate: '2026-08-31', preset: 'Aug 2026' });
    } else if (presetKey === 'SEP_2026') {
      onChangeDateRange({ startDate: '2026-09-01', endDate: '2026-09-30', preset: 'Sep 2026' });
    } else if (presetKey === 'NEXT_30') {
      onChangeDateRange({ startDate: '2026-08-07', endDate: '2026-09-06', preset: 'Next 30 Days' });
    } else if (presetKey === 'NEXT_90') {
      onChangeDateRange({ startDate: '2026-08-07', endDate: '2026-11-05', preset: 'Next 90 Days' });
    } else if (presetKey === 'EXPIRED') {
      onChangeDateRange({ startDate: '2000-01-01', endDate: '2026-08-06', preset: 'Expired Before Today' });
    }
    setIsOpen(false);
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeDateRange({ startDate: null, endDate: null, preset: null });
  };

  const isFilterActive = dateRange.startDate !== null || dateRange.endDate !== null;

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Filter Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          isFilterActive
            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        <span>
          {dateRange.preset
            ? `Expiry: ${dateRange.preset}`
            : dateRange.startDate && dateRange.endDate
            ? `${dateRange.startDate} → ${dateRange.endDate}`
            : 'Manual Date Filter'}
        </span>

        {isFilterActive && (
          <span
            onClick={clearFilter}
            className="p-0.5 hover:bg-amber-700 rounded-full transition-colors"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Manual Date Filter Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Filter by DLP Expiry Date
              </span>
            </div>
            {isFilterActive && (
              <button
                onClick={() => onChangeDateRange({ startDate: null, endDate: null, preset: null })}
                className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Filter Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleApplyPreset('AUG_2026')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                  dateRange.preset === 'Aug 2026'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                }`}
              >
                Aug 2026
              </button>
              <button
                onClick={() => handleApplyPreset('SEP_2026')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                  dateRange.preset === 'Sep 2026'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                }`}
              >
                Sep 2026
              </button>
              <button
                onClick={() => handleApplyPreset('NEXT_30')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                  dateRange.preset === 'Next 30 Days'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                }`}
              >
                Next 30 Days
              </button>
              <button
                onClick={() => handleApplyPreset('EXPIRED')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                  dateRange.preset === 'Expired Before Today'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                }`}
              >
                Already Expired
              </button>
            </div>
          </div>

          {/* Manual Start / End Date Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Manual Date Range Selection
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">From Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate || ''}
                  onChange={(e) =>
                    onChangeDateRange({
                      ...dateRange,
                      startDate: e.target.value || null,
                      preset: 'Custom Range',
                    })
                  }
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">To Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate || ''}
                  onChange={(e) =>
                    onChangeDateRange({
                      ...dateRange,
                      endDate: e.target.value || null,
                      preset: 'Custom Range',
                    })
                  }
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">
              Showing <strong className="text-slate-900 dark:text-slate-100">{matchingCount}</strong> of {totalCount} contracts
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
