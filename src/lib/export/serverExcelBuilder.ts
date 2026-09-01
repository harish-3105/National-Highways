import ExcelJS from 'exceljs';
import { ExportColumnDef } from './columns';

export interface SheetExportPayload {
  sheetName: string;
  columns: ExportColumnDef[];
  selectedKeys?: string[];
  data: Record<string, unknown>[];
  titleRows?: string[];
}

export interface WorkbookExportOptions {
  fileNamePrefix: string;
  sheets: SheetExportPayload[];
  format?: 'xlsx' | 'csv';
}

const CREAM_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF9CB9C' }, // Official Departmental Peach-Cream from sample file
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Arial Narrow',
  size: 18,
  bold: true,
  color: { argb: 'FF0F172A' }, // Dark Slate
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  name: 'Arial Narrow',
  size: 16,
  color: { argb: 'FF0F172A' },
};

const THIN_BLACK_BORDER: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: 'FF000000' }, // Solid Black Grid Border
};

const CELL_BORDERS: Partial<ExcelJS.Borders> = {
  top: THIN_BLACK_BORDER,
  left: THIN_BLACK_BORDER,
  bottom: THIN_BLACK_BORDER,
  right: THIN_BLACK_BORDER,
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
 * Calculates the number of rendered text lines given a string and column width
 */
function calculateWrappedLines(text: string, colWidth: number): number {
  if (!text) return 1;
  const rawParagraphs = text.split(/\r?\n/);
  let totalLines = 0;
  for (const para of rawParagraphs) {
    const words = para.trim().split(/\s+/);
    if (words.length === 0 || (words.length === 1 && words[0] === '')) {
      totalLines += 1;
      continue;
    }
    let currentLineLen = 0;
    let paraLines = 1;
    for (const word of words) {
      if (currentLineLen + word.length + (currentLineLen > 0 ? 1 : 0) <= Math.max(colWidth - 2, 4)) {
        currentLineLen += word.length + (currentLineLen > 0 ? 1 : 0);
      } else {
        paraLines++;
        currentLineLen = word.length;
      }
    }
    totalLines += paraLines;
  }
  return Math.max(totalLines, 1);
}

/**
 * Builds an ExcelJS Workbook from structured sheet payloads
 */
export async function buildExcelWorkbook(options: WorkbookExportOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tamil Nadu National Highways Management System';
  workbook.lastModifiedBy = 'PWD NH Portal Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const sheetPayload of options.sheets) {
    const { sheetName, columns, selectedKeys, data, titleRows = [] } = sheetPayload;

    // Filter columns based on user selection or defaults
    const activeColumns = columns.filter((col) =>
      selectedKeys && selectedKeys.length > 0
        ? selectedKeys.includes(col.key)
        : col.defaultSelected
    );

    if (activeColumns.length === 0) continue;

    const has2TierHeader = activeColumns.some((col) => Boolean(col.groupHeader));
    const numTitleRows = titleRows.length;
    const totalHeaderRows = numTitleRows + (has2TierHeader ? 2 : 1);

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: totalHeaderRows }], // Freeze title & header row(s)
      properties: { defaultRowHeight: 28 },
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
      printTitlesRow: `1:${totalHeaderRows}`, // Repeat titles & cream header row(s) on every printed page
      showGridLines: true,
    };

    // 1. Calculate column widths (ensures full display of column headers + data values with padding)
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
        maxDataLen = col.width ? Math.min(col.width, 14) : 8;
      }

      // Type-specific minimum floor to guarantee numbers & dates never overflow (###)
      let typeFloor = 6;
      if (col.dataType === 'date') typeFloor = 10;
      else if (col.dataType === 'currency') typeFloor = 10;
      else if (col.dataType === 'number') typeFloor = 8;
      else if (col.dataType === 'percent') typeFloor = 6;
      else if (col.dataType === 'integer') typeFloor = 5;

      const effectiveDataLen = Math.max(maxDataLen, typeFloor);
      const dataPaddedWidth = effectiveDataLen + 8; // 4 chars bilateral padding for data values

      // Ensure column width expands enough to fully display the header content
      const headerLen = col.header ? col.header.length : 8;
      const headerPaddedWidth = headerLen + 4; // breathing room for header title

      const isLongTextCol =
        col.category === 'remarks' ||
        col.category === 'issues' ||
        col.key.includes('details') ||
        col.key.includes('name_of_work') ||
        col.key.includes('work_name') ||
        col.key.includes('prayer') ||
        col.key.includes('stretch_name') ||
        col.key.includes('petitioner') ||
        col.key.includes('respondent') ||
        (col.width && col.width >= 35);

      let optimalWidth: number;
      if (isLongTextCol) {
        // For long text fields, expand up to 48 chars to fully display headers and content
        optimalWidth = Math.min(Math.max(dataPaddedWidth, headerPaddedWidth, 24), 48);
      } else {
        // For standard fields, ensure the column expands enough to fully display the header
        optimalWidth = Math.min(Math.max(dataPaddedWidth, headerPaddedWidth, typeFloor + 8), 36);
      }

      return optimalWidth;
    });

    // Configure Header Columns with data-driven snug widths
    worksheet.columns = activeColumns.map((col, idx) => ({
      key: col.key,
      width: columnWidths[idx],
    }));

    // Calculate dynamic Sub-Header Row Height based on the most wrapped sub-header
    let maxSubHeaderLines = 1;
    activeColumns.forEach((col, idx) => {
      const colW = columnWidths[idx] || 10;
      const lines = calculateWrappedLines(col.header, colW);
      if (lines > maxSubHeaderLines) {
        maxSubHeaderLines = lines;
      }
    });

    // -------------------------------------------------------------------------
    // TOP TITLE ROWS (e.g. "National Highways", "Status of Length Maintenance")
    // -------------------------------------------------------------------------
    titleRows.forEach((titleText, tIdx) => {
      const rowIdx = tIdx + 1;
      const tRow = worksheet.getRow(rowIdx);
      tRow.height = tIdx === 0 ? 38 : 34;
      if (activeColumns.length > 1) {
        worksheet.mergeCells(rowIdx, 1, rowIdx, activeColumns.length);
      }
      for (let c = 1; c <= activeColumns.length; c++) {
        const cCell = worksheet.getCell(rowIdx, c);
        cCell.fill = CREAM_HEADER_FILL;
        cCell.border = CELL_BORDERS;
      }
      const cell = worksheet.getCell(rowIdx, 1);
      cell.value = titleText;
      cell.font = {
        name: 'Arial Narrow',
        size: 18,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const headerStartRow = numTitleRows + 1;

    if (has2TierHeader) {
      // -----------------------------------------------------------------------
      // 2-TIER DEPARTMENTAL HEADER (Row 1: Category Groups, Row 2: Sub-headers)
      // -----------------------------------------------------------------------
      const groupRowIdx = headerStartRow;
      const subHeaderRowIdx = headerStartRow + 1;

      // Track group widths to calculate vertical height for Tier 1 group headers
      let maxGroupLines = 1;
      let currentGroup = '';
      let groupStartCol = 1;
      let currentGroupWidth = 0;

      const groupSpans: { group: string; startCol: number; endCol: number; totalWidth: number }[] = [];

      activeColumns.forEach((col, idx) => {
        const colNum = idx + 1;
        const grp = col.groupHeader || col.header;
        const colW = columnWidths[idx] || 15;

        if (idx === 0) {
          currentGroup = grp;
          groupStartCol = 1;
          currentGroupWidth = colW;
        } else if (grp !== currentGroup) {
          groupSpans.push({
            group: currentGroup,
            startCol: groupStartCol,
            endCol: colNum - 1,
            totalWidth: currentGroupWidth,
          });
          currentGroup = grp;
          groupStartCol = colNum;
          currentGroupWidth = colW;
        } else {
          currentGroupWidth += colW;
        }

        if (idx === activeColumns.length - 1) {
          groupSpans.push({
            group: currentGroup,
            startCol: groupStartCol,
            endCol: colNum,
            totalWidth: currentGroupWidth,
          });
        }
      });

      // Calculate maximum lines required across all category group headers
      groupSpans.forEach((span) => {
        const gLines = calculateWrappedLines(span.group, span.totalWidth);
        if (gLines > maxGroupLines) {
          maxGroupLines = gLines;
        }
      });

      const row1 = worksheet.getRow(groupRowIdx);
      row1.height = Math.min(Math.max(36, maxGroupLines * 28 + 12), 140);
      const row2 = worksheet.getRow(subHeaderRowIdx);
      row2.height = Math.min(Math.max(36, maxSubHeaderLines * 28 + 12), 150);

      // Render Sub-Headers in subHeaderRowIdx
      activeColumns.forEach((col, idx) => {
        const colNum = idx + 1;
        const cell2 = worksheet.getCell(subHeaderRowIdx, colNum);
        cell2.value = col.header;
        cell2.fill = CREAM_HEADER_FILL;
        cell2.font = { name: 'Arial Narrow', size: 18, bold: true, color: { argb: 'FF0F172A' } };
        cell2.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell2.border = CELL_BORDERS;
      });

      // Render Category Groups in groupRowIdx
      groupSpans.forEach((span) => {
        if (span.startCol < span.endCol) {
          worksheet.mergeCells(groupRowIdx, span.startCol, groupRowIdx, span.endCol);
        }
        const cell1 = worksheet.getCell(groupRowIdx, span.startCol);
        cell1.value = span.group;
      });

      // Style all cells in groupRowIdx
      for (let c = 1; c <= activeColumns.length; c++) {
        const cell1 = worksheet.getCell(groupRowIdx, c);
        cell1.fill = CREAM_HEADER_FILL;
        cell1.font = { name: 'Arial Narrow', size: 18, bold: true, color: { argb: 'FF0F172A' } };
        cell1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell1.border = CELL_BORDERS;
      }
    } else {
      // -----------------------------------------------------------------------
      // 1-TIER STANDARD HEADER (Single Header Row)
      // -----------------------------------------------------------------------
      const headerRow = worksheet.getRow(headerStartRow);
      headerRow.height = Math.min(Math.max(38, maxSubHeaderLines * 28 + 14), 160);
      activeColumns.forEach((col, idx) => {
        const cell = worksheet.getCell(headerStartRow, idx + 1);
        cell.value = col.header;
        cell.fill = CREAM_HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
        cell.border = CELL_BORDERS;
      });
    }

    // 2. Populate Data Rows with Dynamic Auto Row Height Fit
    data.forEach((item) => {
      const rowValues: Record<string, unknown> = {};
      let maxLinesInRow = 1;
      const isParentRow = Boolean(item._isParent);

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

      // Dynamically auto-fit row height for 16pt font
      if (isParentRow) {
        addedRow.height = 30;
      } else if (maxLinesInRow === 1) {
        addedRow.height = 28;
      } else {
        addedRow.height = Math.min(Math.max(28, maxLinesInRow * 24 + 8), 240);
      }

      // Style Data Cells
      addedRow.eachCell((cell, colNumber) => {
        const colDef = activeColumns[colNumber - 1];
        if (!colDef) return;

        if (isParentRow) {
          cell.font = { name: 'Arial Narrow', size: 16, bold: true, color: { argb: 'FF0F172A' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        } else {
          cell.font = DATA_FONT;
        }
        cell.border = CELL_BORDERS;

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
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
      const filterRowIdx = totalHeaderRows;
      worksheet.autoFilter = {
        from: { row: filterRowIdx, column: 1 },
        to: { row: Math.max(data.length + filterRowIdx, filterRowIdx), column: activeColumns.length },
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
  const { columns, selectedKeys, data, titleRows = [] } = sheetPayload;
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

  const has2TierHeader = activeColumns.some((col) => Boolean(col.groupHeader));
  const rows: string[] = [];

  // Top Title Rows
  titleRows.forEach((t) => {
    rows.push(escapeCsv(t));
  });

  if (has2TierHeader) {
    const groupRow = activeColumns.map((c) => escapeCsv(c.groupHeader || c.header)).join(',');
    rows.push(groupRow);
  }

  const headerRow = activeColumns.map((c) => escapeCsv(c.header)).join(',');
  rows.push(headerRow);

  data.forEach((row) => {
    rows.push(activeColumns.map((c) => escapeCsv(row[c.key])).join(','));
  });

  return Buffer.from(rows.join('\r\n'), 'utf-8');
}
