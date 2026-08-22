'use client';

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export type SelectOption = string | { label: string; value: string };

interface SearchableSelectProps {
  label?: string;
  options: readonly SelectOption[] | SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helpText?: string;
  className?: string;
  compact?: boolean;
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
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to { label, value } format
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const q = searchTerm.toLowerCase();
    return normalizedOptions.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchTerm]);

  // Current selected option label
  const selectedLabel = useMemo(() => {
    const found = normalizedOptions.find((opt) => opt.value === value);
    return found ? found.label : value;
  }, [normalizedOptions, value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate exact trigger position in viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // If trigger is completely scrolled out of the visible screen, close dropdown
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < 280 && spaceAbove > spaceBelow;

    const maxDropdownHeight = openUpward
      ? Math.max(160, Math.min(spaceAbove - 16, window.innerHeight * 0.75))
      : Math.max(160, Math.min(spaceBelow - 16, window.innerHeight * 0.75));

    setDropdownPosition(openUpward ? 'top' : 'bottom');
    setDropdownStyle({
      position: 'fixed',
      top: openUpward ? undefined : Math.round(rect.bottom + 4),
      bottom: openUpward ? Math.round(window.innerHeight - rect.top + 4) : undefined,
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      maxHeight: Math.round(maxDropdownHeight),
      zIndex: 999999,
    });
  }, []);

  // Update layout when opened, resized, or scrolled
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(
        value ? filteredOptions.findIndex((opt) => opt.value === value) : 0
      );

      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 40);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-dropdown-item]');
      const currentItem = items[highlightedIndex] as HTMLElement | undefined;
      if (currentItem) {
        currentItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Prevent wheel events inside dropdown from scrolling the page
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isScrollingUp = e.deltaY < 0;
    const isScrollingDown = e.deltaY > 0;
    const isAtTop = el.scrollTop <= 0;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      e.stopPropagation();
    }
  };

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
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
          handleSelect(filteredOptions[highlightedIndex].value);
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

  return (
    <div
      className={`relative flex flex-col gap-1 w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={`flex items-center justify-between rounded-xl border transition-all cursor-pointer select-none outline-none ${
          compact
            ? 'px-3 py-1.5 min-h-[36px] text-xs'
            : 'px-3.5 py-2.5 min-h-[42px] text-xs'
        } ${
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
          className={`font-semibold truncate flex-1 ${
            value
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500 font-normal'
          }`}
        >
          {selectedLabel || placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Render dropdown menu directly in document.body via Portal to prevent any parent overflow clipping */}
      {mounted &&
        isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={dropdownMenuRef}
            data-dropdown-container
            onWheel={handleWheel}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 overscroll-contain"
            style={{
              ...dropdownStyle,
              overscrollBehavior: 'contain',
            }}
          >
            {/* Search Filter Header - Included for EVERY dropdown across all modules */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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

            {/* Full-Length Options Container with Page Scroll Isolation */}
            <div
              ref={listRef}
              data-dropdown-list
              onWheel={handleWheel}
              className="dropdown-scroll divide-y divide-slate-100 dark:divide-slate-800/40 overflow-y-auto overscroll-contain flex-1 min-h-0"
              style={{
                overscrollBehavior: 'contain',
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      data-dropdown-item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(opt.value);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`px-3 py-2 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
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
          </div>,
          document.body
        )}

      {error && <span className="text-[11px] font-semibold text-rose-500">{error}</span>}
      {!error && helpText && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</span>
      )}
    </div>
  );
};

export default SearchableSelect;

