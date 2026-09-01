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
 * Builds a professionally decorated Excel workbook buffer
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

    // 1. Configure Header Columns
    worksheet.columns = activeColumns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || Math.max(col.header.length + 4, 14),
    }));

    // Style Header Row (Row 1)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
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

    // 2. Populate Data Rows
    data.forEach((item) => {
      const rowValues: Record<string, unknown> = {};

      activeColumns.forEach((col) => {
        let val = item[col.key];

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

        rowValues[col.key] = String(val);
      });

      const addedRow = worksheet.addRow(rowValues);
      addedRow.height = 20;

      // Style Data Cells
      addedRow.eachCell((cell, colNumber) => {
        const colDef = activeColumns[colNumber - 1];
        if (!colDef) return;

        cell.font = DATA_FONT;
        cell.border = CELL_BORDERS;

        const isLongText = colDef.category === 'remarks' || colDef.category === 'issues' || (colDef.width && colDef.width >= 35);

        cell.alignment = {
          vertical: 'middle',
          horizontal: colDef.align,
          wrapText: Boolean(isLongText),
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
