'use client';

import React, { useState } from 'react';
import { HighwayCorridor } from '@/app/api/highways/route';
import { EXPORT_COLUMNS, generateExportFile } from '@/lib/export/exportGenerator';
import { X, Download, CheckSquare, Square, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportHighwayModalProps {
  allCorridors: HighwayCorridor[];
  filteredCorridors: HighwayCorridor[];
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportHighwayModal: React.FC<ExportHighwayModalProps> = ({
  allCorridors,
  filteredCorridors,
  selectedIds,
  isOpen,
  onClose,
}) => {
  const [scope, setScope] = useState<'all' | 'filtered' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key)
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const selectedCorridors = allCorridors.filter((c) => selectedIds.includes(c.id));

  const getTargetData = () => {
    if (scope === 'selected') return selectedCorridors;
    if (scope === 'filtered') return filteredCorridors;
    return allCorridors;
  };

  const handleToggleKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSelectAllKeys = () => {
    setSelectedKeys(EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleSelectDefaultKeys = () => {
    setSelectedKeys(EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key));
  };

  const handleExecuteExport = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const targetData = getTargetData();

    if (targetData.length === 0) {
      setErrorMsg('No highways found matching the chosen export scope.');
      return;
    }

    if (selectedKeys.length === 0) {
      setErrorMsg('Please check at least one parameter column to include in the export.');
      return;
    }

    try {
      setLoading(true);
      generateExportFile(targetData, {
        selectedKeys,
        format,
        fileNamePrefix: `TN_Highway_Catalog_${scope}`,
      });

      setSuccessMsg(`Successfully generated ${format.toUpperCase()} report with ${targetData.length} corridors.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = getTargetData().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Custom Export Highway Catalog
              </h3>
              <p className="text-xs text-slate-500">
                Select highways, parameters, and download format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

          {/* Section 1: Choose Highway Scope */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
              1. Select Highway Scope
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
                <span className="font-semibold text-xs">All Corridors</span>
                <span className="text-base font-extrabold mt-1">{allCorridors.length} Total</span>
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
                <span className="text-base font-extrabold mt-1">{filteredCorridors.length} Matching</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('selected')}
                disabled={selectedIds.length === 0}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedIds.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
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

          {/* Section 2: Choose Parameters / Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                2. Select Parameters to Include ({selectedKeys.length} / {EXPORT_COLUMNS.length})
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

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
              {/* Core Parameters */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Identification & Lane Spec
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPORT_COLUMNS.filter((c) => c.category === 'core').map((col) => {
                    const isSelected = selectedKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleToggleKey(col.key)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span className={`text-xs ${isSelected ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                          {col.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Route & Geometry Parameters */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Route Endpoints & Chainage Distance
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPORT_COLUMNS.filter((c) => c.category === 'route').map((col) => {
                    const isSelected = selectedKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleToggleKey(col.key)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span className={`text-xs ${isSelected ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                          {col.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metadata Parameters */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Status & System Timestamps
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPORT_COLUMNS.filter((c) => c.category === 'meta').map((col) => {
                    const isSelected = selectedKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleToggleKey(col.key)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span className={`text-xs ${isSelected ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                          {col.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: File Format Selection */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
              3. Choose File Format
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
                  <div className="text-[11px] text-slate-400 font-normal">Auto-formatted sheet</div>
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
                  <div className="text-[11px] text-slate-400 font-normal">Lightweight standard</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="text-xs font-medium text-slate-500">
            Exporting <span className="font-bold text-slate-900 dark:text-slate-100">{activeCount} Corridors</span> with <span className="font-bold text-slate-900 dark:text-slate-100">{selectedKeys.length} Parameters</span>
          </div>

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
              onClick={handleExecuteExport}
              disabled={loading || activeCount === 0 || selectedKeys.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()} Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
