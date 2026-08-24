'use client';

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { parseDateString } from '@/lib/formatters';

interface DatePickerInputProps {
  label?: string;
  value: string; // YYYY-MM-DD or DD.MM.YYYY
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  maxToday?: boolean;
  helpText?: string;
  placeholder?: string;
}

function normalizeToYmd(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = parseDateString(s);
  if (!d || isNaN(d.getTime())) return s;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  maxToday = false,
  helpText,
}) => {
  const normalizedValue = useMemo(() => normalizeToYmd(value), [value]);
  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="date"
          value={normalizedValue || ''}
          max={maxToday ? todayStr : undefined}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-xs font-semibold outline-none transition-all ${
            disabled
              ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
              : error
              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
          }`}
        />
        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
      </div>

      {error && <span className="text-[11px] font-semibold text-rose-500">{error}</span>}
      {!error && helpText && <span className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</span>}
    </div>
  );
};

export default DatePickerInput;
