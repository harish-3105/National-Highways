'use client';

import React, { useState } from 'react';
import { FeeBillRecord } from '@/types/feeBill';
import {
  FEE_BILL_EXPORT_COLUMNS,
  generateFeeBillsExcel,
  generateFeeBillsCSV,
} from '@/lib/export/feeBillsExportGenerator';
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

interface ExportFeeBillsModalProps {
  allBills: FeeBillRecord[];
  filteredBills: FeeBillRecord[];
  selectedIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  identification: '1. Voucher & Court Case Identification (6 Fields)',
  jurisdiction: '2. Counsel & Jurisdiction (6 Fields)',
  financial: '3. Fee Claim Breakdown & Amounts (9 Fields)',
  settlement: '4. G.O., Sanction & Settlement Status (12 Fields)',
};

export const ExportFeeBillsModal: React.FC<ExportFeeBillsModalProps> = ({
  allBills,
  filteredBills,
  selectedIds = [],
  isOpen,
  onClose,
}) => {
  const [scope, setScope] = useState<'all' | 'filtered' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'filtered'
  );
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    FEE_BILL_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key)
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const selectedBills = allBills.filter((b) => selectedIds.includes(String(b.id)));

  const getTargetData = (): FeeBillRecord[] => {
    if (scope === 'selected') return selectedBills;
    if (scope === 'filtered') return filteredBills;
    return allBills;
  };

  const handleToggleKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSelectAllKeys = () => {
    setSelectedKeys(FEE_BILL_EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleSelectDefaultKeys = () => {
    setSelectedKeys(FEE_BILL_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key));
  };

  const handleToggleCategory = (category: string) => {
    const catKeys = FEE_BILL_EXPORT_COLUMNS.filter((c) => c.category === category).map((c) => c.key);
    const allSelected = catKeys.every((k) => selectedKeys.includes(k));
    if (allSelected) {
      setSelectedKeys(selectedKeys.filter((k) => !catKeys.includes(k)));
    } else {
      setSelectedKeys(Array.from(new Set([...selectedKeys, ...catKeys])));
    }
  };

  const handleExecuteExport = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const targetData = getTargetData();

    if (targetData.length === 0) {
      setErrorMsg('No fee bill vouchers found matching the chosen export scope.');
      return;
    }

    if (selectedKeys.length === 0) {
      setErrorMsg('Please select at least one field column to include in the export.');
      return;
    }

    try {
      setLoading(true);
      const filename = `Legal_Fee_Bills_${scope}_${new Date().toISOString().split('T')[0]}.${format}`;

      let blob: Blob;
      if (format === 'xlsx') {
        blob = generateFeeBillsExcel({
          bills: targetData,
          selectedColumns: selectedKeys,
          filename,
        });
      } else {
        blob = generateFeeBillsCSV({
          bills: targetData,
          selectedColumns: selectedKeys,
          filename,
        });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg(`Successfully generated ${format.toUpperCase()} report with ${targetData.length} vouchers.`);
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

  const activeCount = getTargetData().length;
  const categories = ['identification', 'jurisdiction', 'financial', 'settlement'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Custom Export Legal Fee Bills
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Customize row scope, select specific columns, and choose export format
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
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Choose Row Scope */}
          <div>
            <label className="block font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              1. Select Voucher Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">Active Filtered View</span>
                <span className="text-base font-extrabold mt-1">{filteredBills.length} Matching</span>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-xs">All Vouchers</span>
                <span className="text-base font-extrabold mt-1">{allBills.length} Total</span>
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
                <span className="font-semibold text-xs">Selected Vouchers</span>
                <span className="text-base font-extrabold mt-1">{selectedIds.length} Selected</span>
              </button>
            </div>
          </div>

          {/* Section 2: Choose Column Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                2. Select Columns to Include ({selectedKeys.length} / {FEE_BILL_EXPORT_COLUMNS.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllKeys}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleSelectDefaultKeys}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 max-h-[280px] overflow-y-auto">
              {categories.map((catKey) => {
                const catCols = FEE_BILL_EXPORT_COLUMNS.filter((c) => c.category === catKey);
                const allSelected = catCols.every((c) => selectedKeys.includes(c.key));

                return (
                  <div key={catKey} className="space-y-2 first:pt-0 pt-3 border-t first:border-t-0 border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {CATEGORY_LABELS[catKey]}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(catKey)}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {catCols.map((col) => {
                        const isSelected = selectedKeys.includes(col.key);
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => handleToggleKey(col.key)}
                            className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <span
                              className={`text-xs ${
                                isSelected ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500'
                              }`}
                            >
                              {col.label}
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

          {/* Section 3: Format Selection */}
          <div>
            <label className="block font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
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
                  <div className="text-[11px] text-slate-400 font-normal">Auto-formatted spreadsheet</div>
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
                  <div className="text-[11px] text-slate-400 font-normal">Standard comma-separated text</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="text-xs font-semibold text-slate-500">
            Exporting <span className="font-bold text-slate-900 dark:text-slate-100">{activeCount} Vouchers</span> with{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{selectedKeys.length} Fields</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={loading || activeCount === 0 || selectedKeys.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
