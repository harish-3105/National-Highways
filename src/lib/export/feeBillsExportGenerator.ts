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
  { key: 'receiptDate', label: 'Receipt Date in Office', category: 'identification', defaultSelected: true },
  { key: 'caseDetails', label: 'Court Case Details / Particulars', category: 'identification', defaultSelected: true },
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
  { key: 'settledAmount', label: 'Lawyer Settled Amount (₹)', category: 'financial', defaultSelected: true },
  { key: 'itCess', label: 'Lawyer IT Cess Deduction (₹)', category: 'financial', defaultSelected: false },
  { key: 'amountDeposited', label: 'Lawyer Net Deposited (₹)', category: 'financial', defaultSelected: false },
  { key: 'assistantSettledAmount', label: 'Assistant Settled Amount (₹)', category: 'financial', defaultSelected: false },
  { key: 'assistantItCess', label: 'Assistant IT Cess (₹)', category: 'financial', defaultSelected: false },
  { key: 'assistantAmountDeposited', label: 'Assistant Net Deposited (₹)', category: 'financial', defaultSelected: false },

  // 4. G.O., Sanction & Settlement Status
  { key: 'goStatus', label: 'Whether G.O. Required', category: 'settlement', defaultSelected: true },
  { key: 'statusOfObtainingGo', label: 'Status of Obtaining G.O.', category: 'settlement', defaultSelected: false },
  { key: 'goNumber', label: 'G.O. Number', category: 'settlement', defaultSelected: false },
  { key: 'goDate', label: 'G.O. Date', category: 'settlement', defaultSelected: false },
  { key: 'goReferenceLetterNo', label: 'G.O. Proposal Reference Letter No.', category: 'settlement', defaultSelected: false },
  { key: 'goReferenceLetterDate', label: 'G.O. Proposal Reference Letter Date', category: 'settlement', defaultSelected: false },
  { key: 'statusOfPaymentProposal', label: 'Status of Payment Proposal', category: 'settlement', defaultSelected: false },
  { key: 'letterNumber', label: 'Reference Letter No.', category: 'settlement', defaultSelected: false },
  { key: 'letterDate', label: 'Reference Letter Date', category: 'settlement', defaultSelected: false },
  { key: 'proceedingLetterNo', label: 'Proceeding / Letter No.', category: 'settlement', defaultSelected: false },
  { key: 'proceedingLetterDate', label: 'Proceeding Date', category: 'settlement', defaultSelected: false },
  { key: 'isSanctioned', label: 'Sanctioned Status', category: 'settlement', defaultSelected: true },
  { key: 'paymentStatus', label: 'Payment Status (Settled / Pending)', category: 'settlement', defaultSelected: true },
  { key: 'utrRbiReference', label: 'Lawyer UTR / RBI Ref No.', category: 'settlement', defaultSelected: false },
  { key: 'paymentDate', label: 'Lawyer Payment Date', category: 'settlement', defaultSelected: false },
  { key: 'assistantUtrRbiReference', label: 'Assistant UTR / RBI Ref No.', category: 'settlement', defaultSelected: false },
  { key: 'assistantPaymentDate', label: 'Assistant Payment Date', category: 'settlement', defaultSelected: false },
  { key: 'currentPendency', label: 'Current Pendency Stage', category: 'settlement', defaultSelected: true },
  { key: 'remarks', label: 'Remarks / Notes', category: 'settlement', defaultSelected: false },
];

export const ALL_FEE_BILL_COLUMNS = FEE_BILL_EXPORT_COLUMNS;

const DATE_KEYS = new Set([
  'feeBillDate',
  'receiptDate',
  'goDate',
  'letterDate',
  'proceedingLetterDate',
  'paymentDate',
  'assistantPaymentDate',
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

  // Auto-fit column widths based on data content values + 8 (4-char bilateral padding)
  const allKeys = ['S.No', ...activeCols.map((c) => c.label)];
  const colWidths = allKeys.map((k) => {
    let maxDataLen = 0;
    for (const r of formattedData) {
      const str = String(r[k] || '');
      const lines = str.split(/\r?\n/);
      for (const line of lines) {
        if (line.length > maxDataLen) maxDataLen = line.length;
      }
    }
    if (formattedData.length === 0 || maxDataLen === 0) maxDataLen = 8;
    return { wch: Math.min(Math.max(maxDataLen + 8, 14), 36) };
  });
  worksheet['!cols'] = colWidths;

  // Calculate dynamic header row height
  let maxHeaderLines = 1;
  allKeys.forEach((k, idx) => {
    const colW = colWidths[idx]?.wch || 10;
    const words = k.split(/\s+/);
    let currentLineLen = 0;
    let lines = 1;
    for (const word of words) {
      if (currentLineLen + word.length + (currentLineLen > 0 ? 1 : 0) <= Math.max(colW - 1, 4)) {
        currentLineLen += word.length + (currentLineLen > 0 ? 1 : 0);
      } else {
        lines++;
        currentLineLen = word.length;
      }
    }
    if (lines > maxHeaderLines) maxHeaderLines = lines;
  });

  const rowHeights = [
    { hpt: Math.min(Math.max(26, maxHeaderLines * 14 + 10), 75) }, // Dynamic Header Row Height
    ...formattedData.map((r) => {
      let maxLines = 1;
      allKeys.forEach((k, cIdx) => {
        const str = String(r[k] || '');
        const w = colWidths[cIdx].wch;
        if (str) {
          const rawLines = str.split(/\r?\n/);
          let cellLines = 0;
          for (const line of rawLines) {
            cellLines += Math.max(1, Math.ceil(line.length / Math.max(w - 1, 6)));
          }
          if (cellLines > maxLines) maxLines = cellLines;
        }
      });
      return { hpt: maxLines > 1 ? Math.min(Math.max(22, maxLines * 16 + 4), 160) : 20 };
    }),
  ];
  worksheet['!rows'] = rowHeights;

  // Print setup for Landscape A4 & Narrow Margins
  worksheet['!margins'] = { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };
  worksheet['!pageSetup'] = { orientation: 'landscape', scale: 100, fitToWidth: 1, fitToHeight: 0 };

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
    let maxDataLen = 0;
    for (const r of dataRows) {
      const str = String(r[k] || '');
      const lines = str.split(/\r?\n/);
      for (const line of lines) {
        if (line.length > maxDataLen) maxDataLen = line.length;
      }
    }
    if (dataRows.length === 0 || maxDataLen === 0) maxDataLen = 8;
    return { wch: Math.min(Math.max(maxDataLen + 8, 14), 36) };
  });
  worksheet['!cols'] = colWidths;

  // Calculate dynamic header row height
  let maxHeaderLines = 1;
  allCols.forEach((k, idx) => {
    const colW = colWidths[idx]?.wch || 10;
    const words = k.split(/\s+/);
    let currentLineLen = 0;
    let lines = 1;
    for (const word of words) {
      if (currentLineLen + word.length + (currentLineLen > 0 ? 1 : 0) <= Math.max(colW - 1, 4)) {
        currentLineLen += word.length + (currentLineLen > 0 ? 1 : 0);
      } else {
        lines++;
        currentLineLen = word.length;
      }
    }
    if (lines > maxHeaderLines) maxHeaderLines = lines;
  });

  const rowHeights = [
    { hpt: Math.min(Math.max(26, maxHeaderLines * 14 + 10), 75) }, // Dynamic Header Row Height
    ...dataRows.map((r) => {
      let maxLines = 1;
      allCols.forEach((k, cIdx) => {
        const str = String(r[k] || '');
        const w = colWidths[cIdx].wch;
        if (str) {
          const rawLines = str.split(/\r?\n/);
          let cellLines = 0;
          for (const line of rawLines) {
            cellLines += Math.max(1, Math.ceil(line.length / Math.max(w - 1, 6)));
          }
          if (cellLines > maxLines) maxLines = cellLines;
        }
      });
      return { hpt: maxLines > 1 ? Math.min(Math.max(22, maxLines * 16 + 4), 160) : 20 };
    }),
  ];
  worksheet['!rows'] = rowHeights;

  // Print setup for Landscape A4 & Narrow Margins
  worksheet['!margins'] = { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };
  worksheet['!pageSetup'] = { orientation: 'landscape', scale: 100, fitToWidth: 1, fitToHeight: 0 };

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

