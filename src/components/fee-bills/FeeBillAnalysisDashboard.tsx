'use client';

import React, { useState, useMemo } from 'react';
import { FeeBillRecord, FeeBillMasterDataConfig } from '@/types/feeBill';
import { formatINR, formatDateDMY } from '@/lib/feeBillMasterData';
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Building,
  User,
  Scale,
  FileText,
  Download,
  Filter,
  Layers,
  Sparkles,
  ArrowUpDown,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  generateFeeBillsExcel,
  generatePivotMatrixExcel,
  generatePivotMatrixCSV,
} from '@/lib/export/feeBillsExportGenerator';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { ExportFeeBillsModal } from './ExportFeeBillsModal';

export type PivotDimensionKey =
  | 'lawyerName'
  | 'caseNumber'
  | 'circle'
  | 'division'
  | 'caseType'
  | 'caseYear'
  | 'currentPendency'
  | 'paymentStatus'
  | 'goStatus'
  | 'isSanctioned'
  | 'none';

export type PivotMetricKey =
  | 'totalFeeAmount'
  | 'settledAmount'
  | 'outstandingAmount'
  | 'voucherCount'
  | 'avgClaim';

export type PivotSortOrder = 'total_desc' | 'total_asc' | 'alpha_asc' | 'count_desc';

const ROW_DIMENSIONS: { key: PivotDimensionKey; label: string }[] = [
  { key: 'lawyerName', label: 'Advocate / Law Officer' },
  { key: 'caseNumber', label: 'Court Case Number' },
  { key: 'circle', label: 'Circle Jurisdiction' },
  { key: 'division', label: 'Division Jurisdiction' },
  { key: 'caseType', label: 'Case Type' },
  { key: 'caseYear', label: 'Case Year' },
  { key: 'currentPendency', label: 'Pendency Stage' },
  { key: 'paymentStatus', label: 'Payment Status' },
];

const COL_DIMENSIONS: { key: PivotDimensionKey; label: string }[] = [
  { key: 'paymentStatus', label: 'Payment Status (Settled vs Unsettled)' },
  { key: 'none', label: 'None (Simple Summary)' },
  { key: 'circle', label: 'Circle Jurisdiction' },
  { key: 'division', label: 'Division Jurisdiction' },
  { key: 'caseType', label: 'Case Type' },
  { key: 'currentPendency', label: 'Pendency Stage' },
  { key: 'goStatus', label: 'Whether G.O. Required' },
];

const METRIC_OPTIONS: { key: PivotMetricKey; label: string; isCurrency: boolean }[] = [
  { key: 'totalFeeAmount', label: 'Total Claim Amount (₹)', isCurrency: true },
  { key: 'settledAmount', label: 'Settled Amount (₹)', isCurrency: true },
  { key: 'outstandingAmount', label: 'Outstanding Balance (₹)', isCurrency: true },
  { key: 'voucherCount', label: 'Voucher Count (#)', isCurrency: false },
  { key: 'avgClaim', label: 'Average Claim per Voucher (₹)', isCurrency: true },
];

interface FeeBillAnalysisDashboardProps {
  bills: FeeBillRecord[];
  masterData: FeeBillMasterDataConfig;
  hideHeaderKpis?: boolean;
  initialPivotMode?: string;
  onViewBill?: (bill: FeeBillRecord) => void;
  onEditBill?: (bill: FeeBillRecord) => void;
}

export const FeeBillAnalysisDashboard: React.FC<FeeBillAnalysisDashboardProps> = ({
  bills,
  masterData,
  hideHeaderKpis = false,
  onViewBill,
  onEditBill,
}) => {
  const [rowDimension, setRowDimension] = useState<PivotDimensionKey>('lawyerName');
  const [colDimension, setColDimension] = useState<PivotDimensionKey>('paymentStatus');
  const [metric, setMetric] = useState<PivotMetricKey>('totalFeeAmount');
  const [sortOrder, setSortOrder] = useState<PivotSortOrder>('total_desc');
  const [pivotSearchQuery, setPivotSearchQuery] = useState('');
  const [isRawExportOpen, setIsRawExportOpen] = useState(false);

  // Drill-down Drawer State
  const [drillDownSlice, setDrillDownSlice] = useState<{
    title: string;
    subTitle: string;
    bills: FeeBillRecord[];
    totalAmount: number;
  } | null>(null);

  const activeBills = useMemo(() => {
    return bills.filter((b) => !b.isDeleted && b.delete_status !== 'DELETED');
  }, [bills]);

  // Overall Financial KPIs
  const totalClaimsCount = activeBills.length;
  const totalClaimsAmount = activeBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  const settledBills = activeBills.filter((b) => b.paymentStatus === 'Settled');
  const settledAmount = settledBills.reduce(
    (acc, b) => acc + (Number(b.settledAmount) || Number(b.totalFeeAmount) || 0),
    0
  );

  const unsettledBills = activeBills.filter((b) => b.paymentStatus !== 'Settled');
  const unsettledAmount = unsettledBills.reduce((acc, b) => acc + (Number(b.totalFeeAmount) || 0), 0);

  const distinctCases = useMemo(() => {
    return new Set(activeBills.map((b) => String(b.caseNumber || '').trim().toUpperCase()).filter(Boolean)).size;
  }, [activeBills]);

  const distinctLawyers = useMemo(() => {
    return new Set(activeBills.map((b) => (b.lawyerName || '').trim().toUpperCase()).filter(Boolean)).size;
  }, [activeBills]);

  // Helper to extract clean dimension values
  const getDimensionValue = (bill: FeeBillRecord, key: PivotDimensionKey): string => {
    if (key === 'none') return 'Total';
    if (key === 'paymentStatus') {
      return bill.paymentStatus === 'Settled' ? 'Settled' : 'Unsettled';
    }
    const val = (bill as unknown as Record<string, unknown>)[key];
    if (val === null || val === undefined || String(val).trim() === '') {
      const dimLabel = ROW_DIMENSIONS.find((d) => d.key === key)?.label || COL_DIMENSIONS.find((d) => d.key === key)?.label || key;
      return `Unspecified ${dimLabel}`;
    }
    return String(val).trim();
  };

  // Helper to calculate cell metric value
  const computeMetricValue = (cellBills: FeeBillRecord[], metricKey: PivotMetricKey): number => {
    if (cellBills.length === 0) return 0;
    if (metricKey === 'voucherCount') return cellBills.length;
    if (metricKey === 'totalFeeAmount') {
      return cellBills.reduce((sum, b) => sum + (Number(b.totalFeeAmount) || 0), 0);
    }
    if (metricKey === 'settledAmount') {
      return cellBills.reduce(
        (sum, b) => (b.paymentStatus === 'Settled' ? sum + (Number(b.settledAmount) || Number(b.totalFeeAmount) || 0) : sum),
        0
      );
    }
    if (metricKey === 'outstandingAmount') {
      return cellBills.reduce(
        (sum, b) => (b.paymentStatus !== 'Settled' ? sum + (Number(b.totalFeeAmount) || 0) : sum),
        0
      );
    }
    if (metricKey === 'avgClaim') {
      const total = cellBills.reduce((sum, b) => sum + (Number(b.totalFeeAmount) || 0), 0);
      return cellBills.length > 0 ? total / cellBills.length : 0;
    }
    return 0;
  };

  // -------------------------------------------------------------
  // DYNAMIC PIVOT MATRIX COMPUTATION ENGINE
  // -------------------------------------------------------------
  const pivotMatrix = useMemo(() => {
    // 1. Collect all distinct column headers
    const colSet = new Set<string>();
    activeBills.forEach((b) => {
      colSet.add(getDimensionValue(b, colDimension));
    });
    let columns = Array.from(colSet);
    // Sort columns sensibly
    if (colDimension === 'paymentStatus') {
      columns.sort((a, b) => (a === 'Unsettled' ? -1 : 1));
    } else {
      columns.sort((a, b) => a.localeCompare(b));
    }

    // 2. Build 2D Cell Map: `rowKey` -> `colKey` -> FeeBillRecord[]
    const rowMap = new Map<string, { colMap: Map<string, FeeBillRecord[]>; allBills: FeeBillRecord[] }>();

    activeBills.forEach((b) => {
      const rowKey = getDimensionValue(b, rowDimension);
      const colKey = getDimensionValue(b, colDimension);

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, { colMap: new Map(), allBills: [] });
      }
      const rowEntry = rowMap.get(rowKey)!;
      rowEntry.allBills.push(b);

      if (!rowEntry.colMap.has(colKey)) {
        rowEntry.colMap.set(colKey, []);
      }
      rowEntry.colMap.get(colKey)!.push(b);
    });

    // 3. Transform into Pivot Rows
    let rows = Array.from(rowMap.entries()).map(([rowLabel, entry]) => {
      const cellValues: { colLabel: string; value: number; count: number; bills: FeeBillRecord[] }[] = [];
      columns.forEach((col) => {
        const matchingBills = entry.colMap.get(col) || [];
        const val = computeMetricValue(matchingBills, metric);
        cellValues.push({
          colLabel: col,
          value: val,
          count: matchingBills.length,
          bills: matchingBills,
        });
      });

      const rowTotalValue = computeMetricValue(entry.allBills, metric);

      return {
        rowLabel,
        cells: cellValues,
        rowTotal: rowTotalValue,
        voucherCount: entry.allBills.length,
        allBills: entry.allBills,
      };
    });

    // 4. Apply search filter on row labels
    if (pivotSearchQuery.trim()) {
      const q = pivotSearchQuery.toLowerCase();
      rows = rows.filter((r) => r.rowLabel.toLowerCase().includes(q));
    }

    // 5. Apply sorting
    if (sortOrder === 'total_desc') {
      rows.sort((a, b) => b.rowTotal - a.rowTotal);
    } else if (sortOrder === 'total_asc') {
      rows.sort((a, b) => a.rowTotal - b.rowTotal);
    } else if (sortOrder === 'alpha_asc') {
      rows.sort((a, b) => a.rowLabel.localeCompare(b.rowLabel));
    } else if (sortOrder === 'count_desc') {
      rows.sort((a, b) => b.voucherCount - a.voucherCount);
    }

    // 6. Compute Column Grand Totals
    const colTotals: { colLabel: string; value: number; count: number; bills: FeeBillRecord[] }[] = columns.map((col) => {
      const matchingBills = activeBills.filter((b) => getDimensionValue(b, colDimension) === col);
      return {
        colLabel: col,
        value: computeMetricValue(matchingBills, metric),
        count: matchingBills.length,
        bills: matchingBills,
      };
    });

    const grandTotalValue = computeMetricValue(activeBills, metric);

    // Max value for cell heatmap color intensity calculation
    let maxCellValue = 0;
    rows.forEach((r) => {
      r.cells.forEach((c) => {
        if (c.value > maxCellValue) maxCellValue = c.value;
      });
    });

    return {
      columns,
      rows,
      colTotals,
      grandTotalValue,
      totalVouchers: activeBills.length,
      maxCellValue,
    };
  }, [activeBills, rowDimension, colDimension, metric, sortOrder, pivotSearchQuery]);

  const activeMetricConfig = METRIC_OPTIONS.find((m) => m.key === metric) || METRIC_OPTIONS[0];

  // Helper to format values
  const formatValue = (num: number, isCurrency: boolean = activeMetricConfig.isCurrency) => {
    if (isCurrency) return formatINR(num);
    return num.toLocaleString('en-IN');
  };

  // Export handlers
  const handleExportPivotExcel = () => {
    const rowTitle = ROW_DIMENSIONS.find((r) => r.key === rowDimension)?.label || 'Row Dimension';
    const colTitle = COL_DIMENSIONS.find((c) => c.key === colDimension)?.label || 'Column Dimension';

    const blob = generatePivotMatrixExcel({
      rowTitle,
      colTitle,
      metricTitle: activeMetricConfig.label,
      columnHeaders: pivotMatrix.columns,
      rows: pivotMatrix.rows.map((r) => ({
        rowLabel: r.rowLabel,
        values: r.cells.map((c) => (activeMetricConfig.isCurrency ? formatValue(c.value) : c.value)),
        rowTotal: activeMetricConfig.isCurrency ? formatValue(r.rowTotal) : r.rowTotal,
        voucherCount: r.voucherCount,
      })),
      columnTotals: pivotMatrix.colTotals.map((c) => (activeMetricConfig.isCurrency ? formatValue(c.value) : c.value)),
      grandTotal: activeMetricConfig.isCurrency ? formatValue(pivotMatrix.grandTotalValue) : pivotMatrix.grandTotalValue,
      totalVouchers: pivotMatrix.totalVouchers,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Fee_Bills_Pivot_${rowDimension}_by_${colDimension}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPivotCSV = () => {
    const rowTitle = ROW_DIMENSIONS.find((r) => r.key === rowDimension)?.label || 'Row Dimension';
    const colTitle = COL_DIMENSIONS.find((c) => c.key === colDimension)?.label || 'Column Dimension';

    const blob = generatePivotMatrixCSV({
      rowTitle,
      colTitle,
      metricTitle: activeMetricConfig.label,
      columnHeaders: pivotMatrix.columns,
      rows: pivotMatrix.rows.map((r) => ({
        rowLabel: r.rowLabel,
        values: r.cells.map((c) => c.value),
        rowTotal: r.rowTotal,
        voucherCount: r.voucherCount,
      })),
      columnTotals: pivotMatrix.colTotals.map((c) => c.value),
      grandTotal: pivotMatrix.grandTotalValue,
      totalVouchers: pivotMatrix.totalVouchers,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Fee_Bills_Pivot_${rowDimension}_by_${colDimension}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportRawExcel = async () => {
    const blob = await generateFeeBillsExcel({ bills: activeBills });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Fee_Bills_Raw_Vouchers_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Quick Preset Handlers
  const applyPreset = (row: PivotDimensionKey, col: PivotDimensionKey, met: PivotMetricKey) => {
    setRowDimension(row);
    setColDimension(col);
    setMetric(met);
    setSortOrder('total_desc');
  };

  return (
    <div className="space-y-5">
      {/* Optional Top Executive KPIs (when not hidden) */}
      {!hideHeaderKpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Claims</span>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{formatINR(totalClaimsAmount)}</div>
            <div className="text-[11px] text-slate-500 font-semibold">{totalClaimsCount} Vouchers</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Settled & Paid</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatINR(settledAmount)}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">{settledBills.length} Disbursed</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Outstanding</span>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">{formatINR(unsettledAmount)}</div>
            <div className="text-[11px] text-amber-600 font-semibold">{unsettledBills.length} In Pipeline</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Settlement Rate</span>
            <div className="text-xl font-black text-purple-700 dark:text-purple-300">
              {totalClaimsCount > 0 ? Math.round((settledBills.length / totalClaimsCount) * 100) : 0}%
            </div>
            <div className="text-[11px] text-purple-600 font-semibold">Clearance Rate</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Distinct Cases</span>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-300">{distinctCases}</div>
            <div className="text-[11px] text-indigo-600 font-semibold">Cases Represented</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">Law Officers</span>
            <div className="text-xl font-black text-sky-900 dark:text-sky-300">{distinctLawyers}</div>
            <div className="text-[11px] text-sky-600 font-semibold">Empaneled Advocates</div>
          </div>
        </div>
      )}

      {/* DYNAMIC PIVOT CONFIGURATION BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Multi-Dimensional Fee Analytics
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Interactive cross-tabulated matrix analytics &bull; Click any cell to inspect underlying vouchers
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportPivotExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Export dynamic cross-tab matrix to Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Analytics (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPivotCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Export dynamic matrix to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setIsRawExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Custom Export raw vouchers to Excel/CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Data (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Dimension Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Row Dimension */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>🏷️ Group Rows By</span>
            </label>
            <SearchableSelect
              options={ROW_DIMENSIONS.map((d) => ({ label: d.label, value: d.key }))}
              value={rowDimension}
              onChange={(val) => setRowDimension(val as PivotDimensionKey)}
              compact={true}
            />
          </div>

          {/* Column Dimension */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>📊 Pivot Columns By</span>
            </label>
            <SearchableSelect
              options={COL_DIMENSIONS.map((d) => ({ label: d.label, value: d.key }))}
              value={colDimension}
              onChange={(val) => setColDimension(val as PivotDimensionKey)}
              compact={true}
            />
          </div>

          {/* Value Metric */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>💰 Summarize Metric</span>
            </label>
            <SearchableSelect
              options={METRIC_OPTIONS.map((m) => ({ label: m.label, value: m.key }))}
              value={metric}
              onChange={(val) => setMetric(val as PivotMetricKey)}
              compact={true}
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Sort Rows By</span>
            </label>
            <SearchableSelect
              options={[
                { label: 'Grand Total (Highest First)', value: 'total_desc' },
                { label: 'Grand Total (Lowest First)', value: 'total_asc' },
                { label: 'Row Name (A → Z)', value: 'alpha_asc' },
                { label: 'Voucher Count (Most First)', value: 'count_desc' },
              ]}
              value={sortOrder}
              onChange={(val) => setSortOrder(val as PivotSortOrder)}
              compact={true}
            />
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Presets:</span>
          </span>

          <button
            type="button"
            onClick={() => applyPreset('lawyerName', 'paymentStatus', 'totalFeeAmount')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
              rowDimension === 'lawyerName' && colDimension === 'paymentStatus' && metric === 'totalFeeAmount'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            🏛️ Advocate &times; Status
          </button>

          <button
            type="button"
            onClick={() => applyPreset('caseNumber', 'paymentStatus', 'totalFeeAmount')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
              rowDimension === 'caseNumber' && colDimension === 'paymentStatus' && metric === 'totalFeeAmount'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            📂 Case &times; Status
          </button>

          <button
            type="button"
            onClick={() => applyPreset('circle', 'division', 'totalFeeAmount')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
              rowDimension === 'circle' && colDimension === 'division' && metric === 'totalFeeAmount'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            🌐 Circle &times; Division
          </button>

          <button
            type="button"
            onClick={() => applyPreset('currentPendency', 'circle', 'voucherCount')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
              rowDimension === 'currentPendency' && colDimension === 'circle' && metric === 'voucherCount'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            ⏳ Stage &times; Circle
          </button>

          <button
            type="button"
            onClick={() => applyPreset('caseType', 'paymentStatus', 'totalFeeAmount')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
              rowDimension === 'caseType' && colDimension === 'paymentStatus' && metric === 'totalFeeAmount'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            ⚖️ Case Type &times; Status
          </button>
        </div>
      </div>

      {/* SEARCH WITHIN PIVOT ROWS */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={pivotSearchQuery}
            onChange={(e) => setPivotSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          {pivotSearchQuery && (
            <button
              type="button"
              onClick={() => setPivotSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <span>Showing {pivotMatrix.rows.length} rows</span>
          <span>&bull;</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{pivotMatrix.totalVouchers} vouchers</span>
        </div>
      </div>

      {/* PIVOT 2D CROSS-TABULATION MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4 font-extrabold text-slate-700 dark:text-slate-300 min-w-[220px] sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <div className="flex items-center gap-1.5">
                    <span>{ROW_DIMENSIONS.find((r) => r.key === rowDimension)?.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      {pivotMatrix.rows.length}
                    </span>
                  </div>
                </th>

                {pivotMatrix.columns.map((col) => (
                  <th
                    key={col}
                    className="py-3.5 px-4 font-extrabold text-slate-700 dark:text-slate-300 text-right min-w-[140px] whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{col}</span>
                      {col === 'Settled' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Settled status" />
                      )}
                      {col === 'Unsettled' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsettled status" />
                      )}
                    </div>
                  </th>
                ))}

                <th className="py-3.5 px-4 font-extrabold text-blue-700 dark:text-blue-400 text-right min-w-[150px] bg-blue-50/60 dark:bg-blue-950/40 border-l border-slate-200 dark:border-slate-700 sticky right-0 z-10">
                  <div className="flex items-center justify-end gap-1">
                    <span>Row Total ({activeMetricConfig.isCurrency ? '₹' : '#'})</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {pivotMatrix.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={pivotMatrix.columns.length + 2}
                    className="py-12 text-center text-slate-400 font-semibold"
                  >
                    No matching vouchers found for the selected dimensions and search filter.
                  </td>
                </tr>
              ) : (
                pivotMatrix.rows.map((row) => {
                  return (
                    <tr
                      key={row.rowLabel}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Row Label (Click to drill down into entire row) */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors z-10">
                        <button
                          type="button"
                          onClick={() =>
                            setDrillDownSlice({
                              title: `${ROW_DIMENSIONS.find((r) => r.key === rowDimension)?.label}: ${row.rowLabel}`,
                              subTitle: `All Vouchers across all categories (${row.voucherCount} Vouchers)`,
                              bills: row.allBills,
                              totalAmount: row.allBills.reduce(
                                (s, b) => s + (Number(b.totalFeeAmount) || 0),
                                0
                              ),
                            })
                          }
                          className="flex items-center gap-2 text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer w-full group/btn"
                        >
                          <span className="truncate max-w-[200px] sm:max-w-xs">{row.rowLabel}</span>
                          <span className="text-[10px] font-bold text-slate-400 group-hover/btn:text-blue-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full shrink-0">
                            {row.voucherCount}
                          </span>
                        </button>
                      </td>

                      {/* Cell Values for each Column */}
                      {row.cells.map((cell) => {
                        const intensity =
                          pivotMatrix.maxCellValue > 0
                            ? Math.min(Math.round((cell.value / pivotMatrix.maxCellValue) * 100), 100)
                            : 0;

                        return (
                          <td
                            key={cell.colLabel}
                            className="py-3 px-4 text-right transition-colors"
                            style={{
                              backgroundColor:
                                cell.value > 0
                                  ? `rgba(59, 130, 246, ${Math.max(intensity * 0.0015, 0.02)})`
                                  : undefined,
                            }}
                          >
                            {cell.value > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setDrillDownSlice({
                                    title: `${row.rowLabel} &bull; ${cell.colLabel}`,
                                    subTitle: `${ROW_DIMENSIONS.find((r) => r.key === rowDimension)?.label} &times; ${cell.colLabel} (${cell.count} Vouchers)`,
                                    bills: cell.bills,
                                    totalAmount: cell.bills.reduce(
                                      (s, b) => s + (Number(b.totalFeeAmount) || 0),
                                      0
                                    ),
                                  })
                                }
                                className="inline-flex flex-col items-end hover:scale-105 transition-all text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold cursor-pointer"
                                title={`Click to view ${cell.count} vouchers`}
                              >
                                <span>{formatValue(cell.value)}</span>
                                <span className="text-[9px] font-semibold text-slate-400">
                                  {cell.count} {cell.count === 1 ? 'voucher' : 'vouchers'}
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-mono text-[11px]">&mdash;</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Grand Total */}
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 bg-blue-50/40 dark:bg-blue-950/20 border-l border-slate-200 dark:border-slate-700 sticky right-0 z-10">
                        <button
                          type="button"
                          onClick={() =>
                            setDrillDownSlice({
                              title: `${row.rowLabel} (Row Total)`,
                              subTitle: `Full Row Summary (${row.voucherCount} Vouchers)`,
                              bills: row.allBills,
                              totalAmount: row.allBills.reduce(
                                (s, b) => s + (Number(b.totalFeeAmount) || 0),
                                0
                              ),
                            })
                          }
                          className="inline-flex flex-col items-end hover:scale-105 transition-all text-blue-700 dark:text-blue-300 font-black cursor-pointer"
                        >
                          <span>{formatValue(row.rowTotal)}</span>
                          <span className="text-[9px] font-bold text-slate-500">
                            {row.voucherCount} Total
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Column Grand Subtotals Footer Row */}
            {pivotMatrix.rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-slate-100">
                  <td className="py-3.5 px-4 font-black sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
                        GRAND TOTAL
                      </span>
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                        {pivotMatrix.totalVouchers} Vouchers
                      </span>
                    </div>
                  </td>

                  {pivotMatrix.colTotals.map((cTot) => (
                    <td key={cTot.colLabel} className="py-3.5 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span>{formatValue(cTot.value)}</span>
                        <span className="text-[9px] font-semibold text-slate-500">
                          {cTot.count} Vouchers
                        </span>
                      </div>
                    </td>
                  ))}

                  <td className="py-3.5 px-4 text-right font-black text-base text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 border-l border-slate-300 dark:border-slate-700 sticky right-0 z-10">
                    <div className="flex flex-col items-end">
                      <span>{formatValue(pivotMatrix.grandTotalValue)}</span>
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        100% Overall Total
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* INTERACTIVE DRILL-DOWN SLIDE-OUT DRAWER / MODAL */}
      {drillDownSlice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                    Drill-Down Slice
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate max-w-lg">
                    {drillDownSlice.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {drillDownSlice.subTitle} &bull; Total Value:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {formatINR(drillDownSlice.totalAmount)}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const blob = await generateFeeBillsExcel({ bills: drillDownSlice.bills });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Pivot_Drilldown_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Slice (.xlsx)</span>
                </button>

                <button
                  onClick={() => setDrillDownSlice(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body: Voucher Cards */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {drillDownSlice.bills.map((bill, bIdx) => (
                <div
                  key={bill.id}
                  className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-3 rounded-2xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                        #{bIdx + 1} &bull; {bill.feeBillNumber}
                      </span>
                      <span className="text-slate-400 text-xs">&bull;</span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {bill.caseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          bill.paymentStatus === 'Settled'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {bill.paymentStatus === 'Settled' ? 'Settled' : 'Unsettled'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span><strong>Lawyer:</strong> {bill.lawyerName} ({bill.lawyerDesignation || 'Advocate'})</span>
                      <span>&bull;</span>
                      <span><strong>Circle:</strong> {bill.circle}</span>
                      <span>&bull;</span>
                      <span><strong>Division:</strong> {bill.division}</span>
                    </div>

                    {/* Fee Breakdown Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1">
                      {Number(bill.appearanceAmount) > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold">
                          Appearance: {formatINR(bill.appearanceAmount)}
                        </span>
                      )}
                      {Number(bill.conferenceAmount) > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold">
                          Conference: {formatINR(bill.conferenceAmount)}
                        </span>
                      )}
                      {Number(bill.assistanceAmount) > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold">
                          Assistance: {formatINR(bill.assistanceAmount)}
                        </span>
                      )}
                      {Number(bill.itCess) > 0 && (
                        <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-1.5 py-0.5 rounded font-semibold">
                          IT Cess: &minus;{formatINR(bill.itCess)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between sm:justify-center">
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900 dark:text-slate-100">
                        {formatINR(bill.totalFeeAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {formatDateDMY(bill.feeBillDate)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onViewBill && (
                        <button
                          type="button"
                          onClick={() => {
                            setDrillDownSlice(null);
                            onViewBill(bill);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      )}
                      {onEditBill && (
                        <button
                          type="button"
                          onClick={() => {
                            setDrillDownSlice(null);
                            onEditBill(bill);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Total {drillDownSlice.bills.length} vouchers in this category slice
              </span>
              <button
                onClick={() => setDrillDownSlice(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Scope & Field Selection Export Modal */}
      <ExportFeeBillsModal
        allBills={activeBills}
        filteredBills={activeBills}
        isOpen={isRawExportOpen}
        onClose={() => setIsRawExportOpen(false)}
      />
    </div>
  );
};
