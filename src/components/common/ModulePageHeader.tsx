'use client';

import React from 'react';
import {
  LucideIcon,
  RefreshCw,
  Archive,
  EyeOff,
  SlidersHorizontal,
  Upload,
  Plus,
  Download,
} from 'lucide-react';

export interface ModulePageHeaderProps {
  // Title / Identity
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  badge?: string;
  title: string;
  subtitle?: string;

  // Row 1, Col 1: Refresh Tool
  onRefresh?: () => void;
  isLoading?: boolean;
  refreshLabel?: string;

  // Row 2, Col 1: Archive Toggle
  archiveToggle?: {
    showArchived: boolean;
    onToggle: () => void;
    archivedCount?: number;
    activeLabel?: string;
    inactiveLabel?: string;
    disabled?: boolean;
  };

  // Row 1, Col 2: Master Data Config
  masterConfig?: {
    onClick: () => void;
    label?: string;
    disabled?: boolean;
    title?: string;
  };

  // Row 2, Col 2: Import Data
  importAction?: {
    onClick?: () => void;
    label?: string;
    disabled?: boolean;
    disabledReason?: string;
  };

  // Row 1, Col 3: Primary Action (Add / New)
  primaryAction?: {
    onClick: () => void;
    label: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  };

  // Row 2, Col 3: Export Data
  exportAction?: {
    onClick?: () => void;
    label?: string;
    disabled?: boolean;
    disabledReason?: string;
  };

  // Optional custom extra slot
  extraContent?: React.ReactNode;
  className?: string;
}

export const ModulePageHeader: React.FC<ModulePageHeaderProps> = ({
  icon: Icon,
  iconClassName = 'w-6 h-6 text-blue-600 dark:text-blue-400',
  badge,
  title,
  subtitle,
  onRefresh,
  isLoading = false,
  refreshLabel = 'Refresh',
  archiveToggle,
  masterConfig,
  importAction,
  primaryAction,
  exportAction,
  extraContent,
  className = '',
}) => {
  const PrimaryIcon = primaryAction?.icon || Plus;

  return (
    <div
      className={`mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs transition-all ${className}`}
    >
      {/* Left: Module Title & Context Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {badge && (
            <span className="px-2.5 py-0.5 bg-blue-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider shadow-xs">
              {badge}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5 truncate">
            {Icon && (
              <span className="shrink-0 flex items-center justify-center">
                <Icon className={iconClassName} />
              </span>
            )}
            <span className="truncate">{title}</span>
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {subtitle}
          </p>
        )}
        {extraContent && <div className="mt-2">{extraContent}</div>}
      </div>

      {/* Right: Symmetrical 3-Column × 2-Row Action Grid */}
      <div className="shrink-0">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* ================= COLUMN 1 ================= */}
          {/* Col 1, Row 1: Refresh Button */}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Live Data"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
              <span className="truncate">{refreshLabel}</span>
            </button>
          ) : (
            <div className="invisible" />
          )}

          {/* ================= COLUMN 2 ================= */}
          {/* Col 2, Row 1: Master Data Config */}
          {masterConfig ? (
            <button
              type="button"
              onClick={masterConfig.onClick}
              disabled={masterConfig.disabled}
              title={masterConfig.title || 'Configure Master Dropdown Options'}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="truncate">{masterConfig.label || 'Master Config'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Master configuration not applicable"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-semibold rounded-xl opacity-40 cursor-not-allowed"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="truncate">Master Config</span>
            </button>
          )}

          {/* ================= COLUMN 3 ================= */}
          {/* Col 3, Row 1: Primary Action (Add / New) */}
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PrimaryIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{primaryAction.label}</span>
            </button>
          ) : (
            <div className="invisible" />
          )}

          {/* ================= COLUMN 1 (Row 2) ================= */}
          {/* Col 1, Row 2: Archive Toggle */}
          {archiveToggle ? (
            <button
              type="button"
              onClick={archiveToggle.onToggle}
              disabled={archiveToggle.disabled}
              title={
                archiveToggle.showArchived
                  ? 'Hide Deleted / Archived Records'
                  : 'Show Deleted / Archived Records'
              }
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                archiveToggle.showArchived
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {archiveToggle.showArchived ? (
                <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              )}
              <span className="truncate">
                {archiveToggle.showArchived
                  ? archiveToggle.activeLabel || 'Hide Archived'
                  : archiveToggle.inactiveLabel ||
                    (archiveToggle.archivedCount !== undefined
                      ? `Archived (${archiveToggle.archivedCount})`
                      : 'Show Archived')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Archive toggle not applicable"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-semibold rounded-xl opacity-40 cursor-not-allowed"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="truncate">Archived</span>
            </button>
          )}

          {/* ================= COLUMN 2 (Row 2) ================= */}
          {/* Col 2, Row 2: Import Data */}
          {importAction && !importAction.disabled && importAction.onClick ? (
            <button
              type="button"
              onClick={importAction.onClick}
              title="Import Data File"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate">{importAction.label || 'Import Data'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={importAction?.disabledReason || 'Module Import coming soon'}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-semibold rounded-xl opacity-40 cursor-not-allowed"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="truncate">{importAction?.label || 'Import Data'}</span>
            </button>
          )}

          {/* ================= COLUMN 3 (Row 2) ================= */}
          {/* Col 3, Row 2: Export Data */}
          {exportAction && !exportAction.disabled && exportAction.onClick ? (
            <button
              type="button"
              onClick={exportAction.onClick}
              title="Export Module Data"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">{exportAction.label || 'Export Data'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={exportAction?.disabledReason || 'Module Export coming soon'}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-semibold rounded-xl opacity-40 cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="truncate">{exportAction?.label || 'Export Data'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
