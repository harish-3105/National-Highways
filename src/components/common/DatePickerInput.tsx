'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
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
  min?: string;
  max?: string;
  helpText?: string;
  placeholder?: string;
  className?: string;
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

function formatToDmy(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  }
  return ymd;
}

function parseDmyToYmd(dmy: string): string {
  if (!dmy) return '';
  const clean = dmy.trim();
  const match = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return normalizeToYmd(clean);
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  maxToday = false,
  min,
  max,
  helpText,
  placeholder = 'DD/MM/YYYY',
  className = '',
}) => {
  const hiddenDateRef = useRef<HTMLInputElement>(null);
  const normalizedYmd = useMemo(() => normalizeToYmd(value), [value]);
  const [displayText, setDisplayText] = useState(() => formatToDmy(normalizedYmd));

  useEffect(() => {
    setDisplayText(formatToDmy(normalizedYmd));
  }, [normalizedYmd]);

  const todayYmd = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayText(raw);
    const parsed = parseDmyToYmd(raw);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      onChange(parsed);
    } else if (!raw.trim()) {
      onChange('');
    }
  };

  const handleBlur = () => {
    const parsed = parseDmyToYmd(displayText);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      onChange(parsed);
      setDisplayText(formatToDmy(parsed));
    } else if (!displayText.trim()) {
      onChange('');
      setDisplayText('');
    } else {
      // Revert to current normalized value if incomplete/invalid
      setDisplayText(formatToDmy(normalizedYmd));
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ymd = e.target.value;
    onChange(ymd);
    setDisplayText(formatToDmy(ymd));
  };

  const openCalendar = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === 'function') {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
        hiddenDateRef.current.click();
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Visible Text Input with DD/MM/YYYY display format */}
        <input
          type="text"
          value={displayText}
          placeholder={placeholder}
          onChange={handleTextChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-xs font-semibold outline-none transition-all font-mono ${
            disabled
              ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
              : error
              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
          }`}
        />

        {/* Hidden Native Date Input for Calendar Picker */}
        <input
          ref={hiddenDateRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={normalizedYmd || ''}
          min={min ? normalizeToYmd(min) : undefined}
          max={max ? normalizeToYmd(max) : maxToday ? todayYmd : undefined}
          onChange={handlePickerChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
        />

        <button
          type="button"
          onClick={openCalendar}
          disabled={disabled}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
          title="Open calendar picker"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {error && <span className="text-[11px] font-semibold text-rose-500">{error}</span>}
      {!error && helpText && <span className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</span>}
    </div>
  );
};

export default DatePickerInput;
