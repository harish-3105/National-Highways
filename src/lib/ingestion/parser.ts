import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type DatasetType =
  | 'HIGHWAYS_MASTER'
  | 'HIGHWAY_SUB_CHAINAGES'
  | 'DLP_CONTRACTS'
  | 'HIGHWAY_MILESTONES'
  | 'ACCIDENT_BLACKSPOTS'
  | 'LEGAL_CASES';

export interface ParseResult<T = unknown> {
  success: boolean;
  datasetType: DatasetType;
  fileName: string;
  totalRows: number;
  validRows: number;
  data: T[];
  errors: string[];
  warnings: string[];
}

export interface HighwayRow {
  road_code: string;
  road_name: string;
  old_nh_no?: string;
  new_nh_no?: string;
  from_location?: string;
  to_location?: string;
  from_chainage?: string;
  to_chainage?: string;
  length_km: number;
  length_less_than_2l?: number;
  length_2l?: number;
  length_2l_ps?: number;
  length_4l?: number;
  length_6l?: number;
  configuration: string;
  status: string;
  delete_status?: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
}

export interface SubChainageRow {
  id?: string;
  highway_code: string;
  breakdown_type?: 'MICRO_LANE' | 'MACRO_PCU';
  division_name?: string;
  stretch_name?: string;
  from_km: number;
  to_km: number;
  length_km: number;
  lane_configuration: string;
  pcu_count: number;
  dpr_status?: string;
  delete_status?: string;
}

export interface DLPRow {
  highway_code: string;
  division_name?: string;
  stretch_name: string;
  from_km: number;
  to_km: number;
  length_km: number;
  dlp_contract_count?: number;
  dlp_length_km?: number;
  dlp_chainage?: string;
  dlp_expiry_date?: string;
  construction_project_count?: number;
  construction_length_km?: number;
  construction_chainage?: string;
  stmc_contract_count?: number;
  stmc_length_km?: number;
  stmc_chainage?: string;
  stmc_expiry_date?: string;
  pbmc_project_count?: number;
  pbmc_length_km?: number;
  pbmc_chainage?: string;
  pbmc_expiry_date?: string;
  no_dlp_length_km?: number;
  no_dlp_chainage?: string;
  no_dlp_expiry_date?: string;
  uncontracted_after_2027_km?: number;
  sub_contracts?: any[];
  contractor_name: string;
  contract_mode: string;
  work_description?: string;
  doc_date?: string;
  days_remaining?: number;
  status: string;
}

export interface MilestoneRow {
  highway_code: string;
  chainage_km: number;
  town_name?: string;
  traffic_pcu?: number;
  row_width?: string;
  carriageway_spec?: string;
  remarks?: string;
}

export interface BlackspotRow {
  highway_code: string;
  chainage_km: number;
  location_name: string;
  latitude: number;
  longitude: number;
  severity: string;
  accidents_count: number;
  fatalities_count: number;
  mitigation_status: string;
}

export interface LegalCaseRow {
  case_number: string;
  title: string;
  court_name: string;
  case_type: string;
  status: string;
  petitioner?: string;
  respondent?: string;
  lawyer_name?: string;
  next_hearing_date?: string;
  summary?: string;
}

/**
 * Clean multi-line Alt+Enter text and normalize spaces
 */
const cleanString = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Round floating numbers to 3 decimal places e.g. 60.599999999999994 -> 60.6
 */
const roundTo3Decimals = (num: number): number => {
  return Math.round(num * 1000) / 1000;
};

/**
 * Converts Indian chainage notation (e.g. 63/2, 110/2, 0/0, 60/600) into clean decimal numbers (63.2, 110.2, 0.0, 60.6)
 */
/**
 * Converts Indian chainage notation (e.g. 63/2, 110/2, 0/0, 60/600) into clean decimal numbers (63.2, 110.2, 0.0, 60.6)
 * Handles thousand separator commas and decimal typos (e.g. 103,467 -> 103.467).
 */
const parseChainageValue = (val: any): number => {
  if (val === null || val === undefined) return 0;
  let str = cleanString(val);
  if (!str || str === '-') return 0;

  // Handle thousand separator commas or decimal comma typos e.g. 103,467 -> 103.467
  if (/^\d+,\d{3}$/.test(str)) {
    str = str.replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }

  // Handle slash notation e.g. 63/2, 110/2, 60/600
  const slashMatch = str.match(/^(\d+)\/(\d+)$/);
  if (slashMatch) {
    const whole = parseFloat(slashMatch[1]);
    const fracStr = slashMatch[2];
    const valNum = fracStr.length >= 3 ? whole + parseFloat(fracStr) / 1000 : whole + parseFloat(fracStr) / 10;
    return valNum > 9999 ? 0 : roundTo3Decimals(valNum);
  }

  // Extract first valid decimal number e.g. 28.5 out of '28.5 km (Strengthening)'
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    if (isNaN(num) || num > 9999) return 0;
    return roundTo3Decimals(num);
  }

  return 0;
};

const parseSafeInteger = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const str = cleanString(val);
  if (!str || str === '-') return 0;
  if (str.includes('/') || str.length > 5) return 1;
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num) || num > 1000) return 1;
  return num;
};

const cleanBullet = (str: string): string => {
  if (!str) return '';
  const s = String(str).trim();
  if (/^\d{1,2}\)\s*/.test(s)) return s.replace(/^\d{1,2}\)\s*/, '');
  if (/^\d{1,2}\.\s+/.test(s)) return s.replace(/^\d{1,2}\.\s+/, '');
  return s;
};

const cleanTitleOrGenerate = (rawStr: string, index: number, type: string): string => {
  if (!rawStr) return `${type} Sub-Stretch ${index + 1}`;
  let clean = cleanBullet(rawStr);
  clean = clean.replace(/[,;]+$/, '').trim();

  if (/^\d{1,2}[./-]\d{4}$/.test(clean) || /^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(clean) || /^\d{4}$/.test(clean)) {
    return `${type} Sub-Stretch ${index + 1}`;
  }

  if (clean === '0' || clean === '-' || clean === 'N/A' || !clean) {
    return `${type} Sub-Stretch ${index + 1}`;
  }

  return clean;
};

/**
 * Standardize Indian Date formats (DD.MM.YYYY, DD-MM-YYYY, DD/MM/YYYY, MM.YYYY, YY, Excel Serial Numbers) to ISO YYYY-MM-DD.
 * Handles invalid calendar dates (e.g. Feb 31st -> Feb 28th) and Excel raw serial numbers (e.g. 45800).
 */
export const parseIndianDate = (dval: any): string | null => {
  if (dval === null || dval === undefined) return null;

  // Handle Raw Excel Date Serial Numbers (e.g. 45800 -> 2025-06-03)
  if (typeof dval === 'number' || (typeof dval === 'string' && /^\d{5}$/.test(dval.trim()))) {
    const num = typeof dval === 'number' ? dval : parseInt(dval.trim(), 10);
    if (num > 30000 && num < 70000) {
      try {
        const parsedObj = XLSX.SSF.parse_date_code(num);
        if (parsedObj) {
          const y = parsedObj.y;
          const m = String(parsedObj.m).padStart(2, '0');
          const d = String(parsedObj.d).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch {
        // Fallthrough if SSF parse fails
      }
    }
  }

  const dstr = String(dval);
  const clean = cleanBullet(dstr);

  // Match DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
  const m1 = clean.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m1) {
    let day = parseInt(m1[1], 10);
    let month = parseInt(m1[2], 10);
    const year = parseInt(m1[3], 10);

    if (month < 1 || month > 12) month = 1;
    const maxDays = new Date(year, month, 0).getDate();
    if (day > maxDays) day = maxDays;

    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  // Match 2-Digit Year Notation e.g. 24.05.27 -> 2027-05-24
  const m2digit = clean.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/);
  if (m2digit) {
    let day = parseInt(m2digit[1], 10);
    let month = parseInt(m2digit[2], 10);
    const year = 2000 + parseInt(m2digit[3], 10);

    if (month < 1 || month > 12) month = 1;
    const maxDays = new Date(year, month, 0).getDate();
    if (day > maxDays) day = maxDays;

    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  // Match MM.YYYY e.g. 05.2027 -> 2027-05-31
  const m2 = clean.match(/(\d{1,2})[./-](\d{4})/);
  if (m2) {
    let month = parseInt(m2[1], 10);
    const year = parseInt(m2[2], 10);
    if (month < 1 || month > 12) month = 1;
    const lastDay = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, '0');
    return `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  }

  return null;
};

export async function parseDatasetFile(
  fileBuffer: Buffer,
  fileName: string,
  datasetType: DatasetType
): Promise<ParseResult> {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  let workbook: XLSX.WorkBook | null = null;
  let rawRows: any[][] = [];

  if (isCsv) {
    const textContent = fileBuffer.toString('utf-8');
    const parsed = Papa.parse<string[]>(textContent, { skipEmptyLines: true });
    rawRows = parsed.data;
  } else {
    workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const targetSheetName =
      workbook.SheetNames.find((name) => /summary/i.test(name) && !/copy/i.test(name)) ||
      workbook.SheetNames.find((name) => /summary/i.test(name)) ||
      workbook.SheetNames.find((name) => !/copy/i.test(name)) ||
      workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  }

  const result: ParseResult = {
    success: true,
    datasetType,
    fileName,
    totalRows: 0,
    validRows: 0,
    data: [],
    errors: [],
    warnings: [],
  };

  switch (datasetType) {
    case 'HIGHWAYS_MASTER':
      parseHighwaysMaster(rawRows, result);
      break;
    case 'HIGHWAY_SUB_CHAINAGES':
      parseSubChainages(workbook, rawRows, result);
      break;
    case 'DLP_CONTRACTS':
      parseDLPContracts(rawRows, result);
      break;
    case 'HIGHWAY_MILESTONES':
      parseMilestones(workbook, rawRows, result);
      break;
    case 'ACCIDENT_BLACKSPOTS':
      parseBlackspots(rawRows, result);
      break;
    case 'LEGAL_CASES':
      parseLegalCases(rawRows, result);
      break;
    default:
      result.success = false;
      result.errors.push(`Unsupported dataset type: ${datasetType}`);
  }

  return result;
}

function parseHighwaysMaster(rawRows: any[][], result: ParseResult) {
  const parsedData: HighwayRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const col0 = cleanString(row[0]);
    const col1 = cleanString(row[1]); // Old NH No.
    const col2 = cleanString(row[2]); // New NH No.
    const col3 = cleanString(row[3]); // Name of Section/Road
    const rowStr = row.map(cleanString).join(' ').toLowerCase();

    // Exclusion filter for summary / subtotal / title header rows
    if (
      rowStr.includes('total') ||
      rowStr.includes('sub total') ||
      rowStr.includes('summary') ||
      col0.toLowerCase().includes('total') ||
      col2.toLowerCase().includes('new nh') ||
      col3.toLowerCase().includes('name of section') ||
      col2.toLowerCase().includes('nh no')
    ) {
      continue;
    }

    // Only process rows where col0 is a valid numeric S. No. (e.g. 1, 2, 3... 11)
    if (!/^\d+$/.test(col0)) {
      continue;
    }

    const oldNhNo = col1 ? cleanString(col1) : '-';
    const newNhNo = col2 ? cleanString(col2) : '';

    if (!newNhNo && !col2) continue;

    const roadCode = newNhNo
      ? (newNhNo.toUpperCase().startsWith('NH') ? newNhNo.toUpperCase() : `NH-${newNhNo.toUpperCase()}`)
      : (col2.toUpperCase().startsWith('NH') ? col2.toUpperCase() : `NH-${col2.toUpperCase()}`);

    const roadName = col3 || `National Highway ${roadCode}`;
    const lengthKm = roundTo3Decimals(parseChainageValue(row[6]) || parseChainageValue(row[4]) || 0);

    // Scan all multi-lane breakdown columns: Col 7 (>2L / <2L), Col 8 (2L), Col 9 (2L+PS), Col 10 (4L), Col 11 (6L)
    const lLess2l = parseChainageValue(row[7]);
    const l2 = parseChainageValue(row[8]);
    const l2ps = parseChainageValue(row[9]);
    const l4 = parseChainageValue(row[10]);
    const l6 = parseChainageValue(row[11]);

    const maxLane = Math.max(l6, l4, l2ps, l2, lLess2l);
    let config = '2-Lane';
    if (maxLane > 0) {
      if (maxLane === l6) config = '6-Lane';
      else if (maxLane === l4) config = '4-Lane';
      else if (maxLane === l2ps) config = '2-Lane (Paved Shoulder)';
      else if (maxLane === l2) config = '2-Lane';
      else if (maxLane === lLess2l) config = '<2-Lane';
    }

    const fromLoc = roadName.split('-')[0]?.trim() || 'Start';
    const toLoc = roadName.split('-').pop()?.trim() || 'End';

    parsedData.push({
      road_code: roadCode,
      road_name: roadName,
      old_nh_no: oldNhNo,
      new_nh_no: newNhNo || roadCode.replace(/^NH-?/, ''),
      from_location: fromLoc,
      to_location: toLoc,
      from_chainage: cleanString(row[4]) || '0',
      to_chainage: cleanString(row[5]) || '0',
      length_km: lengthKm,
      length_less_than_2l: lLess2l,
      length_2l: l2,
      length_2l_ps: l2ps,
      length_4l: l4,
      length_6l: l6,
      configuration: config,
      status: 'ACTIVE',
      delete_status: 'KEEP',
      start_latitude: undefined,
      start_longitude: undefined,
      end_latitude: undefined,
      end_longitude: undefined,
    });
  }

  result.totalRows = rawRows.length;
  result.validRows = parsedData.length;
  result.data = parsedData;

  if (parsedData.length === 0) {
    result.success = false;
    result.errors.push(
      'Could not find valid Highway Master rows. Expected columns: [Sl.No, Old NH No, New NH No, Road Name, Length].'
    );
  }
}

const parsePcuInteger = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const str = cleanString(val);
  if (!str || str === '-') return 0;
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num) || num > 1000000) return 0;
  return num;
};

function parseSubChainages(
  workbook: XLSX.WorkBook | null,
  rawRows: any[][],
  result: ParseResult
) {
  const parsedData: SubChainageRow[] = [];

  let rowsNH: any[][] = rawRows;
  let rowsPCU: any[][] = [];

  if (workbook) {
    const sheetNHName = workbook.SheetNames.find((name) => /^nh$/i.test(name.trim())) || workbook.SheetNames[0];
    const sheetPCUName = workbook.SheetNames.find((name) => /^pcu/i.test(name.trim()));

    if (sheetNHName && workbook.Sheets[sheetNHName]) {
      rowsNH = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNHName], { header: 1, defval: '' });
    }
    if (sheetPCUName && workbook.Sheets[sheetPCUName]) {
      rowsPCU = XLSX.utils.sheet_to_json(workbook.Sheets[sheetPCUName], { header: 1, defval: '' });
    }
  }

  const parseRowsForType = (rows: any[][], type: 'MICRO_LANE' | 'MACRO_PCU') => {
    let curDiv = '';
    let curStretch = '';
    let curCode = '';
    let curPcu = 0;
    let curDpr = '';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rowStr = row.map((v: any) => cleanString(v)).join(' ').toLowerCase();
      const col4Str = cleanString(row[4]).toLowerCase();

      if (
        rowStr.includes('total') ||
        rowStr.includes('national highways') ||
        rowStr.includes('actual traffic count') ||
        rowStr.includes('chianage from') ||
        col4Str.includes('length') ||
        col4Str.includes('total') ||
        col4Str.includes('division')
      ) {
        continue;
      }

      if (row[1]) curDiv = cleanString(row[1]);
      if (row[2]) curStretch = cleanString(row[2]);
      if (row[3]) {
        const code = normalizeNhCode(row[3]);
        if (code) curCode = code;
      }

      if (type === 'MICRO_LANE') {
        if (row[8]) {
          const pcu = parsePcuInteger(row[8]);
          if (pcu > 0) curPcu = pcu;
        }
        if (row[9]) curDpr = cleanString(row[9]);
      } else {
        if (row[7]) {
          const pcu = parsePcuInteger(row[7]);
          if (pcu > 0) curPcu = pcu;
        }
        if (row[8]) curDpr = cleanString(row[8]);
      }

      if (typeof row[4] === 'string' && /[a-zA-Z]/.test(row[4])) continue;
      if (typeof row[5] === 'string' && /[a-zA-Z]/.test(row[5])) continue;

      const fromKm = parseChainageValue(row[4]);
      const toKm = parseChainageValue(row[5]);

      if (isNaN(fromKm) || isNaN(toKm) || toKm <= fromKm) {
        continue;
      }

      const laneConfig = type === 'MICRO_LANE' ? cleanString(row[6]) : 'Primary';
      const lenColIdx = type === 'MICRO_LANE' ? 7 : 6;
      const lenKm = roundTo3Decimals(parseChainageValue(row[lenColIdx]) || Math.max(0, toKm - fromKm));

      if (curCode && toKm > fromKm) {
        parsedData.push({
          highway_code: curCode,
          breakdown_type: type,
          division_name: curDiv || undefined,
          stretch_name: curStretch || undefined,
          from_km: fromKm,
          to_km: toKm,
          length_km: lenKm,
          lane_configuration: laneConfig || '2-Lane',
          pcu_count: curPcu,
          dpr_status: curDpr || undefined,
          delete_status: 'ACTIVE',
        });
      }
    }
  };

  parseRowsForType(rowsNH, 'MICRO_LANE');
  if (rowsPCU.length > 0) {
    parseRowsForType(rowsPCU, 'MACRO_PCU');
  }

  result.totalRows = rowsNH.length + rowsPCU.length;
  result.validRows = parsedData.length;
  result.data = parsedData;

  if (parsedData.length === 0) {
    result.success = false;
    result.errors.push('Could not find valid Sub-Chainage rows in sheets NH or PCU.');
  }
}

export function getRawCellLines(val: any): string[] {
  if (val === null || val === undefined) return [];
  const rawStr = String(val).trim();
  if (!rawStr || rawStr === '-') return [];
  return rawStr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const normalizeNhCode = (col2: any): string => {
  if (!col2) return '';
  let str = String(col2).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    str = parts[parts.length - 1].trim();
  }
  str = str.replace(/extn/i, 'E').replace(/ext/i, 'E').replace(/\s+/g, '');
  const clean = str.replace(/[^0-9A-Z]/gi, '').toUpperCase();
  if (!clean || clean === 'NHNO') return '';
  return clean.startsWith('NH') ? clean : `NH-${clean}`;
};

function parseDLPContracts(rawRows: any[][], result: ParseResult) {
  const parsedData: DLPRow[] = [];
  const now = new Date();

  // Forward fill memory state for vertically merged Excel cells
  let currentDivision = '';
  let currentNHNo = '';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rawCol1 = cleanString(row[1]); // Division
    const rawCol2 = cleanString(row[2]); // NH No

    if (rawCol1 && !rawCol1.toLowerCase().includes('division') && !rawCol1.toLowerCase().includes('sub total') && !rawCol1.toLowerCase().includes('status')) {
      currentDivision = rawCol1;
    }
    if (rawCol2 && !rawCol2.toLowerCase().includes('nh no')) {
      currentNHNo = rawCol2;
    }

    const col1 = rawCol1 || currentDivision;
    const col2 = rawCol2; // Must explicitly be present on the row to filter out subtotal calculation rows

    const col3 = cleanString(row[3]); // From Chainage
    const col4 = cleanString(row[4]); // To Chainage
    const col5 = cleanString(row[5]); // Total Length

    const rowStr = row.map(cleanString).join(' ');
    const rowStrLower = rowStr.toLowerCase();

    // Filter out summary / subtotal / title header rows
    if (
      rowStrLower.includes('status of length') ||
      rowStrLower.includes('sub total') ||
      rowStrLower.includes('subtotal') ||
      rowStrLower.includes('division sub total') ||
      rowStrLower.includes('no.of contracts') ||
      !col2 ||
      col2.toLowerCase().includes('nh no') ||
      col2.toLowerCase().includes('nhno') ||
      rowStrLower.includes('grand total')
    ) {
      continue;
    }

    if (col2 && (col2.match(/\d+/) || rowStr.includes('DLP') || rowStr.includes('STMC') || rowStr.includes('PBMC'))) {
      const nhCode = normalizeNhCode(col2);
      if (!nhCode) continue;
      const fromKmVal = parseChainageValue(col3);
      const toKmVal = parseChainageValue(col4);
      const totalLen = parseChainageValue(col5) || roundTo3Decimals(Math.abs(toKmVal - fromKmVal)) || 0;

      const dlpMatch = rowStr.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{4})/);
      const dlpDateStr = dlpMatch ? parseIndianDate(dlpMatch[1]) : undefined;

      let daysRemaining = 0;
      let status = 'ACTIVE';

      if (dlpDateStr) {
        const dlpDate = new Date(dlpDateStr);
        daysRemaining = Math.ceil((dlpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) status = 'EXPIRED';
        else if (daysRemaining <= 90) status = 'EXPIRING_SOON';
      }

      let mode = 'EPC';
      if (/STMC/i.test(rowStr)) mode = 'STMC';
      else if (/PBMC/i.test(rowStr)) mode = 'PBMC';

      // DLP (Cols 6, 7, 8, 9)
      const dlpCount = parseSafeInteger(row[6]);
      const dlpLen = parseChainageValue(row[7]) || 0;
      const dlpChainageLines = getRawCellLines(row[8]);
      const dlpDateLines = getRawCellLines(row[9]);

      const dlpChainage = dlpChainageLines.join(', ');
      const dlpExpiryStr = dlpDateLines.join(', ');

      // Construction (Cols 10, 11, 12)
      const constructionCount = parseSafeInteger(row[10]);
      const constructionChainageLines = getRawCellLines(row[11]);
      const constructionLen = parseChainageValue(row[12]) || 0;
      const constructionChainage = constructionChainageLines.join(', ');

      // STMC (Cols 13, 14, 15, 16)
      const stmcCount = parseSafeInteger(row[13]);
      const stmcLen = parseChainageValue(row[14]) || 0;
      const stmcChainageLines = getRawCellLines(row[15]);
      const stmcDateLines = getRawCellLines(row[16]);
      const stmcChainage = stmcChainageLines.join(', ');
      const stmcExpiryStr = stmcDateLines.join(', ');

      // PBMC (Cols 17, 18, 19, 20)
      const pbmcCount = parseSafeInteger(row[17]);
      const pbmcLen = parseChainageValue(row[18]) || 0;
      const pbmcChainageLines = getRawCellLines(row[19]);
      const pbmcDateLines = getRawCellLines(row[20]);
      const pbmcChainage = pbmcChainageLines.join(', ');
      const pbmcExpiryStr = pbmcDateLines.join(', ');

      // No DLP (Cols 21, 22, 23)
      const noDlpLen = parseChainageValue(row[21]) || 0;
      const noDlpChainageLines = getRawCellLines(row[22]);
      const noDlpDateLines = getRawCellLines(row[23]);
      const noDlpChainage = noDlpChainageLines.join(', ');
      const noDlpExpiryStr = noDlpDateLines.join(', ');

      // Uncontracted (Col 24 or Col 31)
      const uncontractedLen = parseChainageValue(row[24]) || parseChainageValue(row[31]) || 0;

      // Remarks (Col 25)
      let remarks = cleanString(row[25]) || cleanString(row[row.length - 1]);
      if (!remarks || remarks === '-' || /^\d+(\.\d+)?$/.test(remarks)) {
        remarks = cleanString(row[18]) || cleanString(row[17]) || cleanString(row[16]);
      }
      if (!remarks || remarks === '-' || /^\d+(\.\d+)?$/.test(remarks)) {
        remarks = `Maintenance & DLP period under ${col1.trim()} Division (${mode})`;
      }

      const subContracts: any[] = [];

      // 1. DLP Sub-Contracts
      if (dlpLen > 0 || dlpChainageLines.length > 0) {
        const count = Math.max(dlpCount, dlpChainageLines.length, dlpDateLines.length, 1);
        for (let k = 0; k < count; k++) {
          const rawTitle = dlpChainageLines[k] || dlpChainageLines[0] || '';
          const title = cleanTitleOrGenerate(rawTitle, k, 'DLP');

          const rawDateStr = dlpDateLines[k] || dlpDateLines[0] || dlpExpiryStr;
          const expDate = parseIndianDate(rawDateStr) || undefined;

          let dRem = 0;
          let st = 'ACTIVE';
          if (expDate) {
            dRem = Math.ceil((new Date(expDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (dRem < 0) st = 'EXPIRED';
            else if (dRem <= 90) st = 'EXPIRING_SOON';
          }
          subContracts.push({
            id: `sub-dlp-${i}-${k + 1}`,
            maintenance_type: 'DLP',
            sub_stretch_title: title,
            length_km: count === 1 ? dlpLen : roundTo3Decimals(dlpLen / count),
            contractor_name: `${col1.trim()} Division DLP Contractor`,
            expiry_date: expDate,
            days_remaining: dRem,
            status: st,
            remarks: `Under DLP Guarantee (${col1.trim()} Division)`,
          });
        }
      }

      // 2. STMC Sub-Contracts
      if (stmcLen > 0 || stmcChainageLines.length > 0) {
        const rawTitle = stmcChainageLines[0] || stmcChainage || '';
        const title = cleanTitleOrGenerate(rawTitle, 0, 'STMC');
        const rawDateStr = stmcDateLines[0] || stmcExpiryStr;
        const expDate = parseIndianDate(rawDateStr) || undefined;
        let dRem = 0;
        let st = 'ACTIVE';
        if (expDate) {
          dRem = Math.ceil((new Date(expDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (dRem < 0) st = 'EXPIRED';
          else if (dRem <= 90) st = 'EXPIRING_SOON';
        }
        subContracts.push({
          id: `sub-stmc-${i}-1`,
          maintenance_type: 'STMC',
          sub_stretch_title: title,
          length_km: stmcLen,
          contractor_name: `${col1.trim()} Division STMC Contractor`,
          expiry_date: expDate,
          days_remaining: dRem,
          status: st,
          remarks: stmcExpiryStr || `Short-Term Maintenance Contract under ${col1.trim()} Division`,
        });
      }

      // 3. Construction Sub-Contracts
      if (constructionLen > 0 || constructionChainageLines.length > 0) {
        const rawTitle = constructionChainageLines[0] || constructionChainage || '';
        const title = cleanTitleOrGenerate(rawTitle, 0, 'Construction');
        subContracts.push({
          id: `sub-const-${i}-1`,
          maintenance_type: 'CONSTRUCTION',
          sub_stretch_title: title,
          length_km: constructionLen,
          contractor_name: `${col1.trim()} Construction / Tender Agency`,
          expiry_date: undefined,
          days_remaining: 0,
          status: 'ACTIVE',
          remarks: `Length under Construction / Tender projects (${col1.trim()} Division)`,
        });
      }

      // 4. PBMC Sub-Contracts
      if (pbmcLen > 0 || pbmcChainageLines.length > 0) {
        const rawTitle = pbmcChainageLines[0] || pbmcChainage || '';
        const title = cleanTitleOrGenerate(rawTitle, 0, 'PBMC');
        const rawDateStr = pbmcDateLines[0] || pbmcExpiryStr;
        const expDate = parseIndianDate(rawDateStr) || undefined;
        let dRem = 0;
        let st = 'ACTIVE';
        if (expDate) {
          dRem = Math.ceil((new Date(expDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (dRem < 0) st = 'EXPIRED';
          else if (dRem <= 90) st = 'EXPIRING_SOON';
        }
        subContracts.push({
          id: `sub-pbmc-${i}-1`,
          maintenance_type: 'PBMC',
          sub_stretch_title: title,
          length_km: pbmcLen,
          contractor_name: `${col1.trim()} Division PBMC Contractor`,
          expiry_date: expDate,
          days_remaining: dRem,
          status: st,
          remarks: `Performance-Based Maintenance Contract under ${col1.trim()} Division`,
        });
      }

      // 5. No DLP Sub-Contracts
      if (noDlpLen > 0 || noDlpChainageLines.length > 0) {
        const rawTitle = noDlpChainageLines[0] || noDlpChainage || '';
        const title = cleanTitleOrGenerate(rawTitle, 0, 'No DLP');
        const rawDateStr = noDlpDateLines[0] || noDlpChainageLines.find((s) => s.match(/\d{2}\.\d{2}\.\d{4}/)) || noDlpExpiryStr;
        const expDate = parseIndianDate(rawDateStr) || undefined;
        let dRem = 0;
        let st = 'ACTIVE';
        if (expDate) {
          dRem = Math.ceil((new Date(expDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (dRem < 0) st = 'EXPIRED';
          else if (dRem <= 90) st = 'EXPIRING_SOON';
        }
        subContracts.push({
          id: `sub-nodlp-${i}-1`,
          maintenance_type: 'NO_DLP',
          sub_stretch_title: title,
          length_km: noDlpLen,
          contractor_name: `Departmental Maintenance (${col1.trim()})`,
          expiry_date: expDate,
          days_remaining: dRem,
          status: st,
          remarks: `Length under NO DLP as on date`,
        });
      }

      // 6. Uncontracted Sub-Contracts
      if (uncontractedLen > 0) {
        subContracts.push({
          id: `sub-uncontracted-${i}-1`,
          maintenance_type: 'UNCONTRACTED',
          sub_stretch_title: `Uncontracted Length after 31.03.2027 (${uncontractedLen} km)`,
          length_km: uncontractedLen,
          contractor_name: `Pending Tender Sanction`,
          expiry_date: '2027-03-31',
          days_remaining: 234,
          status: 'EXPIRING_SOON',
          remarks: `Additional Length Required as DLP Expires Before 31.03.2027`,
        });
      }

      const chainageRange = (col3 || col4) ? ` (Km ${col3 || '0'} to ${col4 || '0'})` : '';
      const stretchTitle = `${col1 ? col1.trim() + ' Division - ' : ''}${nhCode}${chainageRange}`.trim();

      parsedData.push({
        highway_code: nhCode,
        division_name: col1.trim(),
        stretch_name: stretchTitle,
        from_km: fromKmVal,
        to_km: toKmVal,
        length_km: totalLen,
        dlp_contract_count: dlpCount,
        dlp_length_km: dlpLen,
        dlp_chainage: dlpChainage,
        dlp_expiry_date: parseIndianDate(dlpExpiryStr) || dlpDateStr || undefined,
        construction_project_count: constructionCount,
        construction_length_km: constructionLen,
        construction_chainage: constructionChainage,
        stmc_contract_count: stmcCount,
        stmc_length_km: stmcLen,
        stmc_chainage: stmcChainage,
        stmc_expiry_date: parseIndianDate(stmcExpiryStr) || undefined,
        pbmc_project_count: pbmcCount,
        pbmc_length_km: pbmcLen,
        pbmc_chainage: pbmcChainage,
        pbmc_expiry_date: parseIndianDate(pbmcExpiryStr) || undefined,
        no_dlp_length_km: noDlpLen,
        no_dlp_chainage: noDlpChainage,
        no_dlp_expiry_date: parseIndianDate(noDlpExpiryStr) || undefined,
        uncontracted_after_2027_km: uncontractedLen,
        sub_contracts: subContracts,
        contractor_name: `${col1.trim()} Division (Contractor DLP)`,
        contract_mode: mode,
        work_description: remarks.replace(/\n+/g, ' ').trim(),
        doc_date: undefined,
        days_remaining: daysRemaining,
        status: status,
      });
    }
  }

  result.totalRows = rawRows.length;
  result.validRows = parsedData.length;
  result.data = parsedData;

  if (parsedData.length === 0) {
    result.success = false;
    result.errors.push('Could not extract DLP Contract records from the uploaded file.');
  }
}

function parseMilestones(workbook: XLSX.WorkBook | null, rawRows: any[][], result: ParseResult) {
  const parsedData: MilestoneRow[] = [];

  const sheetsToParse: { sheetName: string; rows: any[][] }[] = [];

  if (workbook && workbook.SheetNames.length > 0) {
    for (const sName of workbook.SheetNames) {
      const sh = workbook.Sheets[sName];
      const rows = XLSX.utils.sheet_to_json(sh, { header: 1 }) as any[][];
      sheetsToParse.push({ sheetName: sName, rows });
    }
  } else {
    sheetsToParse.push({ sheetName: 'Sheet1', rows: rawRows });
  }

  for (const { sheetName, rows } of sheetsToParse) {
    const sheetUpper = sheetName.trim().toUpperCase();
    const nhMatch = sheetUpper.match(/NH\s*[-:\s]?\s*(\d+[A-Z]?)/i);
    const nhCode = nhMatch ? `NH-${nhMatch[1]}` : `NH-${sheetName.replace(/[^0-9A-Z]/gi, '') || 'MASTER'}`;

    let kmRow: any[] | null = null;
    let townsRow: any[] | null = null;
    let pcuRow: any[] | null = null;
    let rowWidthRow: any[] | null = null;
    let carriagewayRow: any[] | null = null;
    let remarksRow: any[] | null = null;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const label = cleanString(row[0]).toLowerCase();

      if (label === 'km' || label.startsWith('km')) kmRow = row;
      else if (label.includes('town') || label.includes('landmark')) townsRow = row;
      else if (label.includes('traffic') || label.includes('pcu')) pcuRow = row;
      else if (label.includes('row')) rowWidthRow = row;
      else if (label.includes('carriageway')) carriagewayRow = row;
      else if (label.includes('remarks') || label.includes('other')) remarksRow = row;
    }

    if (kmRow || townsRow) {
      const maxCols = Math.max(
        kmRow ? kmRow.length : 0,
        townsRow ? townsRow.length : 0,
        pcuRow ? pcuRow.length : 0,
        carriagewayRow ? carriagewayRow.length : 0
      );

      for (let c = 1; c < maxCols; c++) {
        const kmStr = kmRow && kmRow[c] !== undefined ? cleanString(kmRow[c]) : '';
        const town = townsRow && townsRow[c] !== undefined ? cleanString(townsRow[c]) : '';
        const pcuStr = pcuRow && pcuRow[c] !== undefined ? cleanString(pcuRow[c]) : '';
        const rowWidth = rowWidthRow && rowWidthRow[c] !== undefined ? cleanString(rowWidthRow[c]) : '';
        const carriageway = carriagewayRow && carriagewayRow[c] !== undefined ? cleanString(carriagewayRow[c]) : '';
        const remarks = remarksRow && remarksRow[c] !== undefined ? cleanString(remarksRow[c]) : '';

        const kmVal = parseChainageValue(kmStr);
        
        const rawPcuDigits = pcuStr ? pcuStr.replace(/[^0-9]/g, '').slice(0, 9) : '';
        const pcuVal = rawPcuDigits ? parseInt(rawPcuDigits, 10) : undefined;

        if (town || !isNaN(kmVal) || carriageway || rowWidth) {
          parsedData.push({
            highway_code: nhCode,
            chainage_km: !isNaN(kmVal) ? kmVal : c,
            town_name: town || undefined,
            traffic_pcu: pcuVal,
            row_width: rowWidth || undefined,
            carriageway_spec: carriageway || undefined,
            remarks: remarks || undefined,
          });
        }
      }
    }
  }

  result.totalRows = parsedData.length;
  result.validRows = parsedData.length;
  result.data = parsedData;

  if (parsedData.length === 0) {
    result.success = false;
    result.errors.push('Could not extract Milestone Bar Chart records from the uploaded file.');
  }
}

function parseBlackspots(rawRows: any[][], result: ParseResult) {
  const parsedData: BlackspotRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const nhCode = cleanString(row[0]) || 'NH-MASTER';
    const locationName = cleanString(row[1]);
    const lat = parseFloat(cleanString(row[2]));
    const lng = parseFloat(cleanString(row[3]));

    if (locationName && !isNaN(lat) && !isNaN(lng)) {
      parsedData.push({
        highway_code: nhCode.toUpperCase().startsWith('NH') ? nhCode.toUpperCase() : `NH-${nhCode.toUpperCase()}`,
        chainage_km: parseFloat(cleanString(row[4])) || 0,
        location_name: locationName,
        latitude: lat,
        longitude: lng,
        severity: cleanString(row[5]).toUpperCase() || 'HIGH',
        accidents_count: parseInt(cleanString(row[6])) || 1,
        fatalities_count: parseInt(cleanString(row[7])) || 0,
        mitigation_status: cleanString(row[8]) || 'PROPOSED',
      });
    }
  }

  result.totalRows = rawRows.length;
  result.validRows = parsedData.length;
  result.data = parsedData;
}

function parseLegalCases(rawRows: any[][], result: ParseResult) {
  const parsedData: LegalCaseRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const caseNumber = cleanString(row[0]);
    const title = cleanString(row[1]);
    const courtName = cleanString(row[2]);

    if (caseNumber && title) {
      parsedData.push({
        case_number: caseNumber,
        title: title,
        court_name: courtName || 'High Court of Madras',
        case_type: cleanString(row[3]) || 'Land Acquisition',
        status: cleanString(row[4]).toUpperCase() || 'PENDING',
        petitioner: cleanString(row[5]) || undefined,
        respondent: cleanString(row[6]) || 'Highways Department',
        lawyer_name: cleanString(row[7]) || undefined,
        next_hearing_date: parseIndianDate(cleanString(row[8])) || undefined,
      });
    }
  }

  result.totalRows = rawRows.length;
  result.validRows = parsedData.length;
  result.data = parsedData;
  return result;
}
