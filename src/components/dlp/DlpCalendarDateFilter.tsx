'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { DatePickerInput } from '@/components/common/DatePickerInput';

export interface DateRangeState {
  startDate: string | null;
  endDate: string | null;
  preset: string | null;
}

export type DateRangeFilter = DateRangeState;

interface DlpCalendarDateFilterProps {
  dateRange: DateRangeState;
  onChangeDateRange: (newRange: DateRangeState) => void;
  totalFilteredCount?: number;
  matchingCount?: number;
  totalCount?: number;
}

const formatDateToLocalIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIsoToDdMmYyyy = (iso: string | null): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return iso;
};

export const DlpCalendarDateFilter: React.FC<DlpCalendarDateFilterProps> = ({
  dateRange,
  onChangeDateRange,
  totalFilteredCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyPreset = (presetKey: string) => {
    const today = new Date();
    const todayStr = formatDateToLocalIso(today);

    if (presetKey === 'ALL') {
      onChangeDateRange({ startDate: null, endDate: null, preset: null });
    } else if (presetKey === 'THIS_MONTH') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthName = today.toLocaleString('default', { month: 'short' });
      onChangeDateRange({
        startDate: formatDateToLocalIso(startOfMonth),
        endDate: formatDateToLocalIso(endOfMonth),
        preset: `${monthName} ${today.getFullYear()}`,
      });
    } else if (presetKey === 'NEXT_MONTH') {
      const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      const nextMonthName = startOfNextMonth.toLocaleString('default', { month: 'short' });
      onChangeDateRange({
        startDate: formatDateToLocalIso(startOfNextMonth),
        endDate: formatDateToLocalIso(endOfNextMonth),
        preset: `${nextMonthName} ${startOfNextMonth.getFullYear()}`,
      });
    } else if (presetKey === 'NEXT_30') {
      const next30 = new Date(today);
      next30.setDate(today.getDate() + 30);
      onChangeDateRange({
        startDate: todayStr,
        endDate: formatDateToLocalIso(next30),
        preset: 'Next 30 Days',
      });
    } else if (presetKey === 'NEXT_90') {
      const next90 = new Date(today);
      next90.setDate(today.getDate() + 90);
      onChangeDateRange({
        startDate: todayStr,
        endDate: formatDateToLocalIso(next90),
        preset: 'Next 90 Days',
      });
    } else if (presetKey === 'EXPIRED') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      onChangeDateRange({
        startDate: '2000-01-01',
        endDate: formatDateToLocalIso(yesterday),
        preset: 'Expired Before Today',
      });
    }
    setIsOpen(false);
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeDateRange({ startDate: null, endDate: null, preset: null });
  };

  const isFilterActive = dateRange.startDate !== null || dateRange.endDate !== null;

  return (
    <div className="relative w-full text-left" ref={popoverRef}>
      {/* Filter Trigger Container */}
      <div className="flex items-center w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 h-[38px] inline-flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            isFilterActive
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate">
              {dateRange.preset
                ? `Expiry: ${dateRange.preset}`
                : dateRange.startDate && dateRange.endDate
                ? `${formatIsoToDdMmYyyy(dateRange.startDate)} → ${formatIsoToDdMmYyyy(dateRange.endDate)}`
                : 'Manual Date Filter'}
            </span>
          </div>
        </button>

        {isFilterActive && (
          <button
            type="button"
            onClick={clearFilter}
            className="ml-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Manual Date Filter Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Filter by DLP Expiry Date
              </span>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={clearFilter}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Quick Presets Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              Quick Filter Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('THIS_MONTH')}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-colors"
              >
                Current Month
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('NEXT_MONTH')}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-colors"
              >
                Next Month
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('NEXT_30')}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-colors"
              >
                Next 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('NEXT_90')}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-colors"
              >
                Next 90 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('EXPIRED')}
                className="col-span-2 px-2.5 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold text-left transition-colors"
              >
                Expired Before Today
              </button>
            </div>
          </div>

          {/* Manual Date Inputs using shared DatePickerInput */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              Custom Expiry Date Range
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <DatePickerInput
                  label="From Date"
                  value={dateRange.startDate || ''}
                  onChange={(val) =>
                    onChangeDateRange({
                      ...dateRange,
                      startDate: val || null,
                      preset: null,
                    })
                  }
                  placeholder="DD/MM/YYYY"
                />
              </div>

              <div>
                <DatePickerInput
                  label="To Date"
                  value={dateRange.endDate || ''}
                  onChange={(val) =>
                    onChangeDateRange({
                      ...dateRange,
                      endDate: val || null,
                      preset: null,
                    })
                  }
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>
          </div>

          {/* Footer Summary */}
          {totalFilteredCount !== undefined && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 text-center">
              Matching Contracts: <strong>{totalFilteredCount}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
