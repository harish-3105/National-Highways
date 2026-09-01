import * as XLSX from 'xlsx';
import { HighwayCorridor } from '@/app/api/highways/route';

export interface ExportColumnOption {
  key: keyof HighwayCorridor | 'dlp_count';
  label: string;
  category: 'core' | 'route' | 'meta';
  defaultSelected: boolean;
}

export const EXPORT_COLUMNS: ExportColumnOption[] = [
  { key: 'old_nh_no', label: 'Old NH No.', category: 'core', defaultSelected: true },
  { key: 'new_nh_no', label: 'New NH No.', category: 'core', defaultSelected: true },
  { key: 'road_code', label: 'Road Code (e.g. NH-181)', category: 'core', defaultSelected: true },
  { key: 'road_name', label: 'Corridor Section Title', category: 'core', defaultSelected: true },
  { key: 'from_location', label: 'Start Location', category: 'route', defaultSelected: true },
  { key: 'to_location', label: 'End Location', category: 'route', defaultSelected: true },
  { key: 'from_chainage', label: 'Start Chainage (Km)', category: 'route', defaultSelected: true },
  { key: 'to_chainage', label: 'End Chainage (Km)', category: 'route', defaultSelected: true },
  { key: 'length_km', label: 'Total Length (km)', category: 'route', defaultSelected: true },
  { key: 'length_less_than_2l', label: 'Length <2L (km)', category: 'route', defaultSelected: true },
  { key: 'length_2l', label: 'Length 2L (km)', category: 'route', defaultSelected: true },
  { key: 'length_2l_ps', label: 'Length 2L+PS (km)', category: 'route', defaultSelected: true },
  { key: 'length_4l', label: 'Length 4L (km)', category: 'route', defaultSelected: true },
  { key: 'length_6l', label: 'Length 6L (km)', category: 'route', defaultSelected: true },
  { key: 'configuration', label: 'Primary Lane Configuration', category: 'core', defaultSelected: true },
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
      let maxLen = col.label.length;
      for (const r of formattedData) {
        const str = String(r[col.label] || '');
        const lines = str.split(/\r?\n/);
        for (const line of lines) {
          if (line.length > maxLen) maxLen = line.length;
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 14), 55) };
    });
    worksheet['!cols'] = colWidths;

    // Auto-fit row heights
    const rowHeights = [
      { hpt: 28 }, // Header Row
      ...formattedData.map((r) => {
        let maxLines = 1;
        activeColumns.forEach((col, cIdx) => {
          const str = String(r[col.label] || '');
          const w = colWidths[cIdx].wch;
          if (str) {
            const rawLines = str.split(/\r?\n/);
            let cellLines = 0;
            for (const line of rawLines) {
              cellLines += Math.max(1, Math.ceil(line.length / Math.max(w - 2, 8)));
            }
            if (cellLines > maxLines) maxLines = cellLines;
          }
        });
        return { hpt: maxLines > 1 ? Math.min(Math.max(24, maxLines * 18 + 6), 180) : 22 };
      }),
    ];
    worksheet['!rows'] = rowHeights;

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
