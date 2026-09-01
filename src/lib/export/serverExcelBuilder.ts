import ExcelJS from 'exceljs';
import { ExportColumnDef } from './columns';

export interface SheetExportPayload {
  sheetName: string;
  columns: ExportColumnDef[];
  selectedKeys?: string[];
  data: Record<string, unknown>[];
}

export interface WorkbookExportOptions {
  fileNamePrefix: string;
  sheets: SheetExportPayload[];
  format?: 'xlsx' | 'csv';
}

const CREAM_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF2CC' }, // Soft Pastel Cream
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Arial',
  size: 11,
  bold: true,
  color: { argb: 'FF1E293B' }, // Dark Slate
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  name: 'Arial',
  size: 10,
  color: { argb: 'FF0F172A' },
};

const THIN_BORDER: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: 'FFCBD5E1' }, // Light Slate Border
};

const CELL_BORDERS: Partial<ExcelJS.Borders> = {
  top: THIN_BORDER,
  left: THIN_BORDER,
  bottom: THIN_BORDER,
  right: THIN_BORDER,
};

/**
 * Formats a value for display measurement & string representation
 */
function getDisplayValue(val: unknown, colDef: ExportColumnDef): string {
  if (val === null || val === undefined) return '';

  if (colDef.dataType === 'date') {
    if (val instanceof Date) {
      return val.toISOString().slice(0, 10);
    }
    if (typeof val === 'string' && val.trim()) {
      const parsed = new Date(val);
      return !isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : val;
    }
    return '';
  }

  if (colDef.dataType === 'currency') {
    const num = Number(val);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (colDef.dataType === 'number') {
    const num = Number(val);
    if (isNaN(num)) return '';
    const digits = colDef.key.includes('length') || colDef.key.includes('chainage') ? 3 : 2;
    return num.toFixed(digits);
  }

  if (colDef.dataType === 'integer') {
    const num = Number(val);
    if (isNaN(num)) return '';
    return Math.round(num).toString();
  }

  if (colDef.dataType === 'percent') {
    const num = Number(val);
    if (isNaN(num)) return '';
    return `${num.toFixed(1)}%`;
  }

  return String(val);
}

/**
 * Builds a professionally decorated Excel workbook buffer with automated column & row sizing
 */
export async function buildExcelWorkbook(options: WorkbookExportOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tamil Nadu National Highways Management System';
  workbook.lastModifiedBy = 'PWD NH Portal Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const sheetPayload of options.sheets) {
    const { sheetName, columns, selectedKeys, data } = sheetPayload;

    // Filter columns based on user selection or defaults
    const activeColumns = columns.filter((col) =>
      selectedKeys && selectedKeys.length > 0
        ? selectedKeys.includes(col.key)
        : col.defaultSelected
    );

    if (activeColumns.length === 0) continue;

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
      properties: { defaultRowHeight: 20 },
    });

    // Native Excel Print Setup (Fits all columns on 1 page wide in Landscape A4)
    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9, // A4 Paper
      fitToPage: true,
      fitToWidth: 1, // Fit all columns onto 1 page horizontally
      fitToHeight: 0, // Allow data rows to flow naturally across vertical pages
      margins: {
        left: 0.25, // Narrow 0.25" margins to maximize printable width
        right: 0.25,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
      printTitlesRow: '1:1', // Repeat cream header row on every printed page
      showGridLines: true,
    };

    // 1. Calculate data-driven column widths (purely sized to data values, not header length)
    const columnWidths = activeColumns.map((col) => {
      let maxDataLen = 0;

      for (const item of data) {
        const rawVal = item[col.key];
        const displayStr = getDisplayValue(rawVal, col);
        if (!displayStr) continue;

        const lines = displayStr.split(/\r?\n/);
        for (const line of lines) {
          if (line.length > maxDataLen) {
            maxDataLen = line.length;
          }
        }
      }

      // If empty data / template, provide a sensible default
      if (data.length === 0 || maxDataLen === 0) {
        maxDataLen = col.width ? Math.min(col.width, 14) : 10;
      }

      // Type-specific minimum floor to guarantee numbers & dates never overflow (###)
      let typeFloor = 8;
      if (col.dataType === 'date') typeFloor = 10;
      else if (col.dataType === 'currency') typeFloor = 10;
      else if (col.dataType === 'number') typeFloor = 8;
      else if (col.dataType === 'percent') typeFloor = 6;
      else if (col.dataType === 'integer') typeFloor = 6;

      const isLongTextCol =
        col.category === 'remarks' ||
        col.category === 'issues' ||
        col.key.includes('details') ||
        col.key.includes('name_of_work') ||
        col.key.includes('prayer') ||
        col.key.includes('stretch_name') ||
        col.key.includes('petitioner') ||
        col.key.includes('respondent') ||
        (col.width && col.width >= 35);

      let optimalWidth: number;
      if (isLongTextCol) {
        // For long text fields, cap at 28-30 chars to preserve horizontal print budget
        optimalWidth = Math.min(Math.max(maxDataLen + 1, 16), 30);
      } else {
        // For regular data fields, fit tightly to the data values
        optimalWidth = Math.min(Math.max(maxDataLen + 1, typeFloor), 24);
      }

      return optimalWidth;
    });

    // Configure Header Columns with data-driven snug widths
    worksheet.columns = activeColumns.map((col, idx) => ({
      header: col.header,
      key: col.key,
      width: columnWidths[idx],
    }));

    // Calculate dynamic Header Row Height based on the most wrapped header
    let maxHeaderLines = 1;
    activeColumns.forEach((col, idx) => {
      const colW = columnWidths[idx] || 10;
      const words = col.header.split(/\s+/);
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
      if (lines > maxHeaderLines) {
        maxHeaderLines = lines;
      }
    });

    // Style Header Row (Row 1) with dynamic vertical height to display tall multi-line headers
    const headerRow = worksheet.getRow(1);
    headerRow.height = Math.min(Math.max(26, maxHeaderLines * 14 + 10), 75);
    headerRow.eachCell((cell) => {
      cell.fill = CREAM_HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = CELL_BORDERS;
    });

    // 2. Populate Data Rows with Dynamic Auto Row Height Fit
    data.forEach((item) => {
      const rowValues: Record<string, unknown> = {};
      let maxLinesInRow = 1;

      activeColumns.forEach((col, colIdx) => {
        let val = item[col.key];
        const colWidth = columnWidths[colIdx] || 15;

        if (val === null || val === undefined) {
          rowValues[col.key] = '';
          return;
        }

        // Format dates cleanly as string YYYY-MM-DD or standard display
        if (col.dataType === 'date') {
          if (val instanceof Date) {
            rowValues[col.key] = val.toISOString().slice(0, 10);
          } else if (typeof val === 'string' && val.trim()) {
            const parsed = new Date(val);
            rowValues[col.key] = !isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : val;
          } else {
            rowValues[col.key] = '';
          }
          return;
        }

        // Numbers & Currencies
        if (col.dataType === 'number' || col.dataType === 'currency' || col.dataType === 'integer' || col.dataType === 'percent') {
          const num = Number(val);
          rowValues[col.key] = isNaN(num) ? '' : num;
          return;
        }

        const strVal = String(val);
        rowValues[col.key] = strVal;

        // Calculate approximate rendered lines for this cell
        if (strVal) {
          const rawLines = strVal.split(/\r?\n/);
          let cellLines = 0;
          for (const line of rawLines) {
            const effectiveW = Math.max(colWidth - 1, 6);
            const wrappedCount = Math.max(1, Math.ceil(line.length / effectiveW));
            cellLines += wrappedCount;
          }
          if (cellLines > maxLinesInRow) {
            maxLinesInRow = cellLines;
          }
        }
      });

      const addedRow = worksheet.addRow(rowValues);

      // Dynamically auto-fit row height
      if (maxLinesInRow === 1) {
        addedRow.height = 20; // Snug, clean default height
      } else {
        // 16pt per line + 4pt padding, capped safely at 160pt
        addedRow.height = Math.min(Math.max(22, maxLinesInRow * 16 + 4), 160);
      }

      // Style Data Cells
      addedRow.eachCell((cell, colNumber) => {
        const colDef = activeColumns[colNumber - 1];
        const colWidth = columnWidths[colNumber - 1] || 15;
        if (!colDef) return;

        cell.font = DATA_FONT;
        cell.border = CELL_BORDERS;

        const cellValStr = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
        const needsWrap =
          maxLinesInRow > 1 ||
          colDef.category === 'remarks' ||
          colDef.category === 'issues' ||
          cellValStr.includes('\n') ||
          cellValStr.length > colWidth;

        cell.alignment = {
          vertical: maxLinesInRow > 1 ? 'top' : 'middle',
          horizontal: colDef.align,
          wrapText: Boolean(needsWrap),
        };

        // Apply specific Excel number formats
        if (colDef.dataType === 'currency') {
          cell.numFmt = '#,##0.00';
        } else if (colDef.dataType === 'number') {
          cell.numFmt = colDef.key.includes('length') || colDef.key.includes('chainage') ? '#,##0.000' : '#,##0.00';
        } else if (colDef.dataType === 'integer') {
          cell.numFmt = '#,##0';
        } else if (colDef.dataType === 'percent') {
          cell.numFmt = '0.0%';
        }
      });
    });

    // 3. Auto-filter across all columns
    if (activeColumns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: Math.max(data.length + 1, 1), column: activeColumns.length },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Builds a standard CSV string buffer from dataset
 */
export function buildCsvBuffer(sheetPayload: SheetExportPayload): Buffer {
  const { columns, selectedKeys, data } = sheetPayload;
  const activeColumns = columns.filter((col) =>
    selectedKeys && selectedKeys.length > 0
      ? selectedKeys.includes(col.key)
      : col.defaultSelected
  );

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = activeColumns.map((c) => escapeCsv(c.header)).join(',');
  const dataRows = data.map((row) =>
    activeColumns.map((c) => escapeCsv(row[c.key])).join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  return Buffer.from(csvContent, 'utf-8');
}
