import * as XLSX from 'xlsx';
import { FeeBillRecord } from '@/types/feeBill';

export interface FeeBillsExportOptions {
  bills: FeeBillRecord[];
  selectedColumns?: string[];
  filename?: string;
}

export const ALL_FEE_BILL_COLUMNS = [
  { key: 'feeBillNumber', label: 'Fee Bill Number' },
  { key: 'feeBillDate', label: 'Fee Bill Date' },
  { key: 'circle', label: 'Circle Jurisdiction' },
  { key: 'division', label: 'Division Jurisdiction' },
  { key: 'lawyerName', label: 'Lead Law Officer / Advocate' },
  { key: 'lawyerDesignation', label: 'Lawyer Designation' },
  { key: 'assistantName', label: 'Assistant Law Officer' },
  { key: 'assistantDesignation', label: 'Assistant Designation' },
  { key: 'caseNumber', label: 'Court Case Number' },
  { key: 'caseYear', label: 'Case Year' },
  { key: 'caseType', label: 'Case Type' },
  { key: 'casePertainsTo', label: 'Pertains To' },
  { key: 'appearanceAmount', label: 'Appearance Fee (₹)' },
  { key: 'conferenceAmount', label: 'Conference Fee (₹)' },
  { key: 'verifyingAmount', label: 'Verifying Fee (₹)' },
  { key: 'assistanceAmount', label: 'Assistance Fee (₹)' },
  { key: 'totalFeeAmount', label: 'Total Claim Amount (₹)' },
  { key: 'goStatus', label: 'G.O. Required Status' },
  { key: 'statusOfObtainingGo', label: 'Status of Obtaining G.O.' },
  { key: 'goNumber', label: 'G.O. Number' },
  { key: 'goDate', label: 'G.O. Date' },
  { key: 'statusOfPaymentProposal', label: 'Status of Payment Proposal' },
  { key: 'proceedingLetterNo', label: 'Proceeding / Letter No.' },
  { key: 'proceedingLetterDate', label: 'Proceeding Date' },
  { key: 'sanctionedAmount', label: 'Sanctioned Amount (₹)' },
  { key: 'isSanctioned', label: 'Sanctioned?' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'settledAmount', label: 'Settled Amount (₹)' },
  { key: 'itCess', label: 'IT Cess Deduction (₹)' },
  { key: 'amountDeposited', label: 'Amount Deposited (₹)' },
  { key: 'utrRbiReference', label: 'UTR / RBI Reference No.' },
  { key: 'paymentDate', label: 'Payment / Settlement Date' },
  { key: 'currentPendency', label: 'Current Pendency Stage' },
];

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
      }
      rowObj[col.label] = val;
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
}
