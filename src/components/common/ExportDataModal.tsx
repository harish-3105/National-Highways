'use client';

import React, { useState } from 'react';
import { ExportColumnDef } from '@/lib/export/columns';
import {
  X,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Layers,
} from 'lucide-react';

export interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: 'highways' | 'dlp' | 'ongoing-works' | 'major-projects' | 'legal' | 'fee-bills' | 'staff';
  moduleTitle: string;
  totalCount: number;
  filteredCount: number;
  selectedIds?: string[];
  columns: ExportColumnDef[];
  filters?: Record<string, unknown>;
  isCorridorsModule?: boolean;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  module,
  moduleTitle,
  totalCount,
  filteredCount,
  selectedIds = [],
  columns,
  filters = {},
  isCorridorsModule = false,
}) => {
  const [scope, setScope] = useState<'all' | 'filtered' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    columns.filter((c) => c.defaultSelected).map((c) => c.key)
  );
  const [corridorLevels, setCorridorLevels] = useState<('L1' | 'L2_MACRO' | 'L2_MICRO')[]>([
    'L1',
    'L2_MACRO',
    'L2_MICRO',
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleToggleKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSelectAllKeys = () => {
    setSelectedKeys(columns.map((c) => c.key));
  };

  const handleSelectDefaultKeys = () => {
    setSelectedKeys(columns.filter((c) => c.defaultSelected).map((c) => c.key));
  };

  const handleToggleCorridorLevel = (level: 'L1' | 'L2_MACRO' | 'L2_MICRO') => {
    if (corridorLevels.includes(level)) {
      if (corridorLevels.length === 1) {
        setErrorMsg('At least one corridor level must be selected.');
        return;
      }
      setCorridorLevels(corridorLevels.filter((l) => l !== level));
    } else {
      setCorridorLevels([...corridorLevels, level]);
    }
  };

  const handleExecuteExport = async (isTemplate = false) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedKeys.length === 0 && !isCorridorsModule) {
      setErrorMsg('Please select at least one parameter column to export.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module,
          scope: isTemplate ? 'all' : scope,
          selectedIds: scope === 'selected' ? selectedIds : [],
          selectedKeys,
          format,
          corridorLevels,
          emptyTemplate: isTemplate,
          filters,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.message || `Server error: ${response.statusText}`);
      }

      // Extract filename from header or fallback
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `${module}_export.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Native Blob Download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const countLabel = isTemplate
        ? 'Blank Template'
        : `${scope === 'selected' ? selectedIds.length : scope === 'filtered' ? filteredCount : totalCount} records`;

      setSuccessMsg(`Successfully generated ${format.toUpperCase()} (${countLabel}).`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Export failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(columns.map((c) => c.category)));

  const categoryLabels: Record<string, string> = {
    core: 'Core Identification & Details',
    technical: 'Technical & Engineering Specifications',
    financial: 'Financial Estimates & Expenditures',
    dates: 'Milestones & Critical Dates',
    status: 'Progress & Live Status',
    remarks: 'Observations & Official Remarks',
    issues: 'Inter-Agency Clearance Bottlenecks',
  };

  const activeRecordsCount =
    scope === 'selected' ? selectedIds.length : scope === 'filtered' ? filteredCount : totalCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Custom Export: {moduleTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Server-side styled spreadsheet generator with pastel cream headers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs md:text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Choose Record Scope */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
              1. Select Record Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">All Records</span>
                <span className="text-base font-extrabold mt-1">{totalCount} Total</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">Filtered List</span>
                <span className="text-base font-extrabold mt-1">{filteredCount} Matching</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('selected')}
                disabled={selectedIds.length === 0}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedIds.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 dark:bg-slate-800/20'
                    : scope === 'selected'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">Checked Rows</span>
                <span className="text-base font-extrabold mt-1">{selectedIds.length} Selected</span>
              </button>
            </div>
          </div>

          {/* Section 1.5: Special Multi-Level Corridor Selector (Only if Corridors Module) */}
          {isCorridorsModule && (
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Corridor Hierarchical Levels (Multi-Sheet Workbook)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleCorridorLevel('L1')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    corridorLevels.includes('L1')
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                  }`}
                >
                  {corridorLevels.includes('L1') ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs">Level 1 Master</div>
                    <div className="text-[10px] opacity-75 font-normal">Corridor Catalog</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCorridorLevel('L2_MACRO')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    corridorLevels.includes('L2_MACRO')
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                  }`}
                >
                  {corridorLevels.includes('L2_MACRO') ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs">Level 2 Macro</div>
                    <div className="text-[10px] opacity-75 font-normal">Traffic PCU & DPR</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCorridorLevel('L2_MICRO')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    corridorLevels.includes('L2_MICRO')
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                  }`}
                >
                  {corridorLevels.includes('L2_MICRO') ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs">Level 2 Micro</div>
                    <div className="text-[10px] opacity-75 font-normal">Lane Geometry & ROW</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Choose Column Parameters */}
          {!isCorridorsModule && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  2. Select Columns to Include ({selectedKeys.length} / {columns.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllKeys}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleSelectDefaultKeys}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3.5 max-h-64 overflow-y-auto">
                {categories.map((cat, idx) => {
                  const catCols = columns.filter((c) => c.category === cat);
                  if (catCols.length === 0) return null;
                  return (
                    <div key={cat} className={idx > 0 ? 'pt-3 border-t border-slate-200 dark:border-slate-700/60' : ''}>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        {categoryLabels[cat] || cat}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {catCols.map((col) => {
                          const isSelected = selectedKeys.includes(col.key);
                          return (
                            <button
                              key={col.key}
                              type="button"
                              onClick={() => handleToggleKey(col.key)}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                              )}
                              <span
                                className={`text-xs truncate ${
                                  isSelected ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'
                                }`}
                              >
                                {col.header}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: File Format Selection */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
              {isCorridorsModule ? '2. Choose File Format' : '3. Choose File Format'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  format === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">Excel Workbook (.xlsx)</div>
                  <div className="text-[11px] text-slate-400 font-normal">
                    Cream headers, auto-widths, frozen panes
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">CSV Document (.csv)</div>
                  <div className="text-[11px] text-slate-400 font-normal">Plain standard tabular file</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          {/* Template Download Option */}
          <button
            type="button"
            onClick={() => handleExecuteExport(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline cursor-pointer"
            title="Download empty template containing only the column headers"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Download Official Import Template</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleExecuteExport(false)}
              disabled={loading || activeRecordsCount === 0 || (!isCorridorsModule && selectedKeys.length === 0)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating {format.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Export {activeRecordsCount} {activeRecordsCount === 1 ? 'Record' : 'Records'} (
                    {format.toUpperCase()})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
