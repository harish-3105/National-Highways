import * as XLSX from 'xlsx';
import { HighwayCorridor } from '@/app/api/highways/route';

export interface ExportColumnOption {
  key: keyof HighwayCorridor | 'dlp_count';
  label: string;
  category: 'core' | 'route' | 'meta';
  defaultSelected: boolean;
}

export const EXPORT_COLUMNS: ExportColumnOption[] = [
  { key: 'road_code', label: 'Road Code (e.g. NH-181)', category: 'core', defaultSelected: true },
  { key: 'road_name', label: 'Corridor Section Title', category: 'core', defaultSelected: true },
  { key: 'from_location', label: 'Start Location', category: 'route', defaultSelected: true },
  { key: 'to_location', label: 'End Location', category: 'route', defaultSelected: true },
  { key: 'from_chainage', label: 'Start Chainage (Km)', category: 'route', defaultSelected: true },
  { key: 'to_chainage', label: 'End Chainage (Km)', category: 'route', defaultSelected: true },
  { key: 'length_km', label: 'Length (km)', category: 'route', defaultSelected: true },
  { key: 'configuration', label: 'Lane Configuration', category: 'core', defaultSelected: true },
  { key: 'status', label: 'Corridor Status', category: 'meta', defaultSelected: true },
  { key: 'dlp_count', label: 'Active DLP Warranty Count', category: 'meta', defaultSelected: false },
  { key: 'created_at', label: 'Created Timestamp', category: 'meta', defaultSelected: false },
  { key: 'updated_at', label: 'Last Updated Timestamp', category: 'meta', defaultSelected: false },
];

export interface ExportOptions {
  selectedKeys: string[];
  format: 'csv' | 'xlsx';
  fileNamePrefix?: string;
}

export function generateExportFile(
  data: HighwayCorridor[],
  options: ExportOptions
) {
  if (!data || data.length === 0) {
    throw new Error('No corridors selected or available for export.');
  }

  const activeColumns = EXPORT_COLUMNS.filter((col) =>
    options.selectedKeys.includes(col.key)
  );

  if (activeColumns.length === 0) {
    throw new Error('Please select at least one parameter column to export.');
  }

  // Format rows into key-value objects matching active column labels
  const formattedData = data.map((corridor) => {
    const rowObj: Record<string, unknown> = {};
    activeColumns.forEach((col) => {
      let val = (corridor as unknown as Record<string, unknown>)[col.key];
      if (val === null || val === undefined) {
        val = '';
      } else if (col.key === 'created_at' || col.key === 'updated_at') {
        val = new Date(val as string).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      }
      rowObj[col.label] = val;
    });
    return rowObj;
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `${options.fileNamePrefix || 'TN_National_Highways_Catalog'}_${timestamp}`;

  if (options.format === 'csv') {
    // Generate CSV file via XLSX utility (handles quotes and commas perfectly)
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${fileName}.csv`);
  } else {
    // Generate XLSX workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Auto-fit column widths
    const colWidths = activeColumns.map((col) => {
      const maxContentLen = Math.max(
        col.label.length,
        ...formattedData.map((r) => String(r[col.label] || '').length)
      );
      return { wch: Math.min(Math.max(maxContentLen + 2, 12), 50) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Highway Catalog');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, `${fileName}.xlsx`);
  }
}

function triggerDownload(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
