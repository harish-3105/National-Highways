'use client';

import React, { useState } from 'react';
import { MajorProject } from '@/app/api/major-projects/route';
import {
  MAJOR_PROJECTS_EXPORT_COLUMNS,
  generateMajorProjectsExportFile,
} from '@/lib/export/majorProjectsExportGenerator';
import {
  X,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface ExportMajorProjectsModalProps {
  allProjects: MajorProject[];
  filteredProjects: MajorProject[];
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  core: '1. Basic Project Identification (Cols A–G)',
  contract: '2. Sanction, Contract & Agreement (Cols H–N)',
  physical: '3. Physical Progress & Length (Cols O–R)',
  financial: '4. Financial Progress & Expenditure (Cols S–X)',
  timeline: '5. Completion Timeline & Overrun (Cols Y–AD)',
  engineering: '6. Engineering & Personnel (Cols AE–AH)',
  bottlenecks: '7. Clearance Bottlenecks & Issues (5 Fields)',
};

export const ExportMajorProjectsModal: React.FC<ExportMajorProjectsModalProps> = ({
  allProjects,
  filteredProjects,
  selectedIds,
  isOpen,
  onClose,
}) => {
  const [scope, setScope] = useState<'all' | 'filtered' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    MAJOR_PROJECTS_EXPORT_COLUMNS.map((c) => c.key)
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const selectedProjects = allProjects.filter((p) => selectedIds.includes(p.id));

  const getTargetData = () => {
    if (scope === 'selected') return selectedProjects;
    if (scope === 'filtered') return filteredProjects;
    return allProjects;
  };

  const handleToggleKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSelectAll = () => {
    setSelectedKeys(MAJOR_PROJECTS_EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleSelectStandard27 = () => {
    // Select all except the 5 clearance bottleneck fields and contract extra cols
    const standard27Keys = MAJOR_PROJECTS_EXPORT_COLUMNS.filter(
      (c) => c.category !== 'bottlenecks' && c.key !== 'loa_date' && c.key !== 'agreement_date' && c.key !== 'contract_cum_expenditure_cr'
    ).map((c) => c.key);
    setSelectedKeys(standard27Keys);
  };

  const handleClearAll = () => {
    setSelectedKeys([]);
  };

  const handleExecuteExport = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const targetData = getTargetData();

    if (targetData.length === 0) {
      setErrorMsg('No projects found matching the chosen export scope.');
      return;
    }

    if (selectedKeys.length === 0) {
      setErrorMsg('Please select at least one column to include in the export.');
      return;
    }

    try {
      setLoading(true);
      generateMajorProjectsExportFile(targetData, {
        selectedKeys,
        format,
        fileNamePrefix: `TN_NH_Ongoing_Works_${scope}`,
      });

      setSuccessMsg(`Successfully generated ${format.toUpperCase()} report with ${targetData.length} records.`);
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

  const categories = Array.from(new Set(MAJOR_PROJECTS_EXPORT_COLUMNS.map((c) => c.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Custom Export Ongoing Works
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose works scope, column parameters, and output format
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs md:text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Choose Works Scope */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2 text-xs uppercase tracking-wider">
              1. Select Works Scope (Rows)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">All Ongoing Works</span>
                <span className="text-base font-extrabold mt-1">{allProjects.length} Total</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">Filtered List</span>
                <span className="text-base font-extrabold mt-1">{filteredProjects.length} Matching</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('selected')}
                disabled={selectedIds.length === 0}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedIds.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50 dark:bg-slate-800/20'
                    : scope === 'selected'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">Checked Rows</span>
                <span className="text-base font-extrabold mt-1">{selectedIds.length} Selected</span>
              </button>
            </div>
          </div>

          {/* Section 2: Choose Columns */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                2. Select Columns ({selectedKeys.length} / {MAJOR_PROJECTS_EXPORT_COLUMNS.length} selected)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Select All (35)
                </button>
                <button
                  type="button"
                  onClick={handleSelectStandard27}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold rounded-lg cursor-pointer transition-colors border border-blue-200 dark:border-blue-800"
                >
                  Standard 27
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30 max-h-56 overflow-y-auto space-y-4">
              {categories.map((cat) => {
                const cols = MAJOR_PROJECTS_EXPORT_COLUMNS.filter((c) => c.category === cat);
                return (
                  <div key={cat} className="space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block border-b border-slate-200 dark:border-slate-700 pb-1">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                      {cols.map((col) => {
                        const isChecked = selectedKeys.includes(col.key);
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => handleToggleKey(col.key)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-white dark:bg-slate-800 border-emerald-500 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="text-xs leading-tight line-clamp-1">{col.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Choose Format */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2 text-xs uppercase tracking-wider">
              3. Select Download Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  format === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="block font-bold text-xs">Excel Workbook</span>
                  <span className="text-[11px] text-slate-500 font-normal">.xlsx file with autofit cols</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-left">
                  <span className="block font-bold text-xs">CSV Spreadsheet</span>
                  <span className="text-[11px] text-slate-500 font-normal">.csv plain text data</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Exporting <strong className="text-slate-900 dark:text-slate-100">{getTargetData().length}</strong> records &bull; <strong className="text-slate-900 dark:text-slate-100">{selectedKeys.length}</strong> columns
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={loading || getTargetData().length === 0 || selectedKeys.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
