'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableSelectProps {
  label?: string;
  options: readonly string[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helpText?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  required = false,
  error,
  disabled = false,
  helpText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When opening, reset search and focus input if available
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(
        value ? filteredOptions.findIndex((opt) => opt === value) : 0
      );
      if (options.length > 5 && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll active item into view when highlightedIndex changes
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-dropdown-item]');
      const currentItem = items[highlightedIndex] as HTMLElement | undefined;
      if (currentItem) {
        currentItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    },
    [onChange]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  // Dynamic Height Calculation:
  // If list <= 10 items: show full list without inner scroll cutoffs.
  // If list > 10 items: enable smooth scrolling with max-h-72 or max-h-80.
  const isShortList = filteredOptions.length <= 10;
  const listHeightClass = isShortList
    ? 'max-h-none'
    : 'max-h-72 sm:max-h-80 overflow-y-auto';

  return (
    <div
      className="relative flex flex-col gap-1.5 w-full"
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border min-h-[42px] transition-all cursor-pointer select-none outline-none ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800 opacity-60'
            : error
            ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 shadow-xs'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-blue-500/20'
        }`}
      >
        <span
          className={`text-xs font-semibold truncate flex-1 ${
            value
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500 font-normal'
          }`}
        >
          {value || placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 right-0 z-[9999] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '100%' }}
        >
          {/* Search Header for lists > 5 options */}
          {options.length > 5 && (
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter options..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
                />
              </div>
              {searchTerm && (
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded shrink-0">
                  {filteredOptions.length} found
                </span>
              )}
            </div>
          )}

          {/* Dynamic Scrollable or Full-Length Options Container */}
          <div
            ref={listRef}
            className={`dropdown-scroll divide-y divide-slate-100 dark:divide-slate-800/40 ${listHeightClass}`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt}
                    data-dropdown-item
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center font-medium">
                No matching options found
              </div>
            )}
          </div>

          {/* Bottom count badge for long lists */}
          {options.length > 10 && !isShortList && (
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[10.5px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-between shrink-0">
              <span>Showing {filteredOptions.length} of {options.length} options</span>
              <span className="text-[9.5px]">Scroll for more</span>
            </div>
          )}
        </div>
      )}

      {error && <span className="text-[11px] font-semibold text-rose-500">{error}</span>}
      {!error && helpText && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</span>
      )}
    </div>
  );
};

export default SearchableSelect;
