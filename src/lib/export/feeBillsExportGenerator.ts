import * as XLSX from 'xlsx';
import { FeeBillRecord } from '@/types/feeBill';
import { formatDateDMY } from '@/lib/feeBillMasterData';

export interface FeeBillsExportOptions {
  bills: FeeBillRecord[];
  selectedColumns?: string[];
  filename?: string;
}

export interface FeeBillExportColumn {
  key: string;
  label: string;
  category: 'identification' | 'jurisdiction' | 'financial' | 'settlement';
  defaultSelected?: boolean;
}

export const FEE_BILL_EXPORT_COLUMNS: FeeBillExportColumn[] = [
  // 1. Voucher & Court Case Identification
  { key: 'feeBillNumber', label: 'Fee Bill Voucher No.', category: 'identification', defaultSelected: true },
  { key: 'feeBillDate', label: 'Fee Bill Date', category: 'identification', defaultSelected: true },
  { key: 'caseNumber', label: 'Court Case Number', category: 'identification', defaultSelected: true },
  { key: 'caseYear', label: 'Case Year', category: 'identification', defaultSelected: true },
  { key: 'caseType', label: 'Case Type (e.g. WP, WA, CMA)', category: 'identification', defaultSelected: true },
  { key: 'casePertainsTo', label: 'Case Pertains To', category: 'identification', defaultSelected: true },

  // 2. Counsel & Jurisdiction
  { key: 'circle', label: 'Circle Jurisdiction', category: 'jurisdiction', defaultSelected: true },
  { key: 'division', label: 'Division Jurisdiction', category: 'jurisdiction', defaultSelected: true },
  { key: 'lawyerName', label: 'Lead Law Officer / Advocate', category: 'jurisdiction', defaultSelected: true },
  { key: 'lawyerDesignation', label: 'Lawyer Designation', category: 'jurisdiction', defaultSelected: true },
  { key: 'assistantName', label: 'Assistant Law Officer', category: 'jurisdiction', defaultSelected: false },
  { key: 'assistantDesignation', label: 'Assistant Designation', category: 'jurisdiction', defaultSelected: false },

  // 3. Fee Claim Breakdown & Amounts
  { key: 'appearanceAmount', label: 'Appearance Fee (₹)', category: 'financial', defaultSelected: true },
  { key: 'conferenceAmount', label: 'Conference Fee (₹)', category: 'financial', defaultSelected: true },
  { key: 'verifyingAmount', label: 'Opinion / Vetting Fee (₹)', category: 'financial', defaultSelected: true },
  { key: 'assistanceAmount', label: 'Assistance Fee 1/3 (₹)', category: 'financial', defaultSelected: true },
  { key: 'totalFeeAmount', label: 'Total Claim Amount (₹)', category: 'financial', defaultSelected: true },
  { key: 'sanctionedAmount', label: 'Sanctioned Amount (₹)', category: 'financial', defaultSelected: true },
  { key: 'settledAmount', label: 'Settled Amount (₹)', category: 'financial', defaultSelected: true },
  { key: 'itCess', label: 'IT Cess Deduction (₹)', category: 'financial', defaultSelected: false },
  { key: 'amountDeposited', label: 'Net Amount Deposited (₹)', category: 'financial', defaultSelected: false },

  // 4. G.O., Sanction & Settlement Status
  { key: 'goStatus', label: 'Whether G.O. Required', category: 'settlement', defaultSelected: true },
  { key: 'statusOfObtainingGo', label: 'Status of Obtaining G.O.', category: 'settlement', defaultSelected: false },
  { key: 'goNumber', label: 'G.O. Number', category: 'settlement', defaultSelected: false },
  { key: 'goDate', label: 'G.O. Date', category: 'settlement', defaultSelected: false },
  { key: 'statusOfPaymentProposal', label: 'Status of Payment Proposal', category: 'settlement', defaultSelected: false },
  { key: 'letterNumber', label: 'Reference Letter No.', category: 'settlement', defaultSelected: false },
  { key: 'letterDate', label: 'Reference Letter Date', category: 'settlement', defaultSelected: false },
  { key: 'proceedingLetterNo', label: 'Proceeding / Letter No.', category: 'settlement', defaultSelected: false },
  { key: 'proceedingLetterDate', label: 'Proceeding Date', category: 'settlement', defaultSelected: false },
  { key: 'isSanctioned', label: 'Sanctioned Status', category: 'settlement', defaultSelected: true },
  { key: 'paymentStatus', label: 'Payment Status (Settled / Not Settled)', category: 'settlement', defaultSelected: true },
  { key: 'utrRbiReference', label: 'UTR / RBI Reference No.', category: 'settlement', defaultSelected: false },
  { key: 'paymentDate', label: 'Payment / Settlement Date', category: 'settlement', defaultSelected: false },
  { key: 'currentPendency', label: 'Current Pendency Stage', category: 'settlement', defaultSelected: true },
];

export const ALL_FEE_BILL_COLUMNS = FEE_BILL_EXPORT_COLUMNS;

const DATE_KEYS = new Set([
  'feeBillDate',
  'goDate',
  'letterDate',
  'proceedingLetterDate',
  'paymentDate',
]);

export function generateFeeBillsExcel(options: FeeBillsExportOptions): Blob {
  const { bills, selectedColumns } = options;

  const activeCols = selectedColumns && selectedColumns.length > 0
    ? ALL_FEE_BILL_COLUMNS.filter((c) => selectedColumns.includes(c.key))
    : ALL_FEE_BILL_COLUMNS;

  const formattedData = bills.map((bill, idx) => {
    const rowObj: Record<string, unknown> = {
      'S.No': idx + 1,
    };
    activeCols.forEach((col) => {
      let val: unknown = (bill as unknown as Record<string, unknown>)[col.key];
      if (val === null || val === undefined) {
        val = '';
      } else if (DATE_KEYS.has(col.key)) {
        val = formatDateDMY(String(val));
      }
      rowObj[col.label] = val;
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Auto-fit column widths
  const allKeys = ['S.No', ...activeCols.map((c) => c.label)];
  const colWidths = allKeys.map((k) => {
    const maxContentLen = Math.max(
      k.length,
      ...formattedData.map((r) => String(r[k] || '').length)
    );
    return { wch: Math.min(Math.max(maxContentLen + 3, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Legal Fee Bills');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function generateFeeBillsCSV(options: FeeBillsExportOptions): Blob {
  const { bills, selectedColumns } = options;
  const activeCols = selectedColumns && selectedColumns.length > 0
    ? ALL_FEE_BILL_COLUMNS.filter((c) => selectedColumns.includes(c.key))
    : ALL_FEE_BILL_COLUMNS;

  const formattedData = bills.map((bill, idx) => {
    const rowObj: Record<string, unknown> = {
      'S.No': idx + 1,
    };
    activeCols.forEach((col) => {
      let val: unknown = (bill as unknown as Record<string, unknown>)[col.key];
      if (val === null || val === undefined) {
        val = '';
      } else if (DATE_KEYS.has(col.key)) {
        val = formatDateDMY(String(val));
      }
      rowObj[col.label] = val;
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
}

export interface PivotMatrixExportOptions {
  rowTitle: string;
  colTitle: string;
  metricTitle: string;
  columnHeaders: string[];
  rows: {
    rowLabel: string;
    values: (number | string)[];
    rowTotal: number | string;
    voucherCount: number;
  }[];
  columnTotals: (number | string)[];
  grandTotal: number | string;
  totalVouchers: number;
}

export function generatePivotMatrixExcel(options: PivotMatrixExportOptions): Blob {
  const { rowTitle, columnHeaders, rows, columnTotals, grandTotal, totalVouchers } = options;

  const dataRows: Record<string, unknown>[] = rows.map((r, idx) => {
    const obj: Record<string, unknown> = {
      'S.No': idx + 1,
      [rowTitle]: r.rowLabel,
    };
    columnHeaders.forEach((col, cIdx) => {
      obj[col] = r.values[cIdx] ?? 0;
    });
    obj['Grand Total'] = r.rowTotal;
    obj['Total Vouchers'] = r.voucherCount;
    return obj;
  });

  // Add Summary Total Row
  const totalRowObj: Record<string, unknown> = {
    'S.No': '',
    [rowTitle]: 'TOTAL',
  };
  columnHeaders.forEach((col, cIdx) => {
    totalRowObj[col] = columnTotals[cIdx] ?? 0;
  });
  totalRowObj['Grand Total'] = grandTotal;
  totalRowObj['Total Vouchers'] = totalVouchers;
  dataRows.push(totalRowObj);

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  const allCols = ['S.No', rowTitle, ...columnHeaders, 'Grand Total', 'Total Vouchers'];
  const colWidths = allCols.map((k) => {
    const maxContentLen = Math.max(
      k.length,
      ...dataRows.map((r) => String(r[k] || '').length)
    );
    return { wch: Math.min(Math.max(maxContentLen + 4, 14), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Matrix');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function generatePivotMatrixCSV(options: PivotMatrixExportOptions): Blob {
  const { rowTitle, columnHeaders, rows, columnTotals, grandTotal, totalVouchers } = options;

  const dataRows: Record<string, unknown>[] = rows.map((r, idx) => {
    const obj: Record<string, unknown> = {
      'S.No': idx + 1,
      [rowTitle]: r.rowLabel,
    };
    columnHeaders.forEach((col, cIdx) => {
      obj[col] = r.values[cIdx] ?? 0;
    });
    obj['Grand Total'] = r.rowTotal;
    obj['Total Vouchers'] = r.voucherCount;
    return obj;
  });

  const totalRowObj: Record<string, unknown> = {
    'S.No': '',
    [rowTitle]: 'TOTAL',
  };
  columnHeaders.forEach((col, cIdx) => {
    totalRowObj[col] = columnTotals[cIdx] ?? 0;
  });
  totalRowObj['Grand Total'] = grandTotal;
  totalRowObj['Total Vouchers'] = totalVouchers;
  dataRows.push(totalRowObj);

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
}

