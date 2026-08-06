import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type DatasetType =
  | 'HIGHWAYS_MASTER'
  | 'DLP_CONTRACTS'
  | 'HIGHWAY_MILESTONES'
  | 'ACCIDENT_BLACKSPOTS'
  | 'LEGAL_CASES';

export interface ParseResult<T = any> {
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
  from_location?: string;
  to_location?: string;
  from_chainage?: string;
  to_chainage?: string;
  length_km: number;
  configuration: string;
  status: string;
}

export interface DLPRow {
  highway_code: string;
  stretch_name: string;
  from_km: number;
  to_km: number;
  length_km: number;
  contractor_name: string;
  contract_mode: string;
  work_description?: string;
  doc_date?: string;
  dlp_expiry_date?: string;
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

const cleanString = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
};

const parseIndianDate = (dstr: string): string | null => {
  if (!dstr) return null;
  const m1 = dstr.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const month = m1[2].padStart(2, '0');
    const year = m1[3];
    return `${year}-${month}-${day}`;
  }
  const m2 = dstr.match(/(\d{1,2})[./-](\d{4})/);
  if (m2) {
    const month = m2[1].padStart(2, '0');
    const year = m2[2];
    return `${year}-${month}-01`;
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
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
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
    const col2 = cleanString(row[2]);
    const col3 = cleanString(row[3]);

    if (
      col2.toLowerCase().includes('new nh') ||
      col3.toLowerCase().includes('name of section') ||
      col2.toLowerCase().includes('nh no')
    ) {
      continue;
    }

    if ((/^\d+$/.test(col0) && col2) || (col2.toUpperCase().startsWith('NH') && /^\d+/.test(col2.replace(/NH-?/i, '')))) {
      const roadCode = col2.toUpperCase().startsWith('NH') ? col2.toUpperCase() : `NH-${col2.toUpperCase()}`;
      const roadName = col3 || `National Highway ${col2}`;
      const lengthKm = parseFloat(cleanString(row[6])) || parseFloat(cleanString(row[4])) || 0;

      const l6 = parseFloat(cleanString(row[11])) || 0;
      const l4 = parseFloat(cleanString(row[10])) || 0;
      const l2ps = parseFloat(cleanString(row[9])) || 0;

      let config = '2-Lane';
      if (l6 > 0) config = '6-Lane';
      else if (l4 > 0) config = '4-Lane';
      else if (l2ps > 0) config = '2-Lane (Paved Shoulder)';

      parsedData.push({
        road_code: roadCode,
        road_name: roadName,
        from_location: roadName.split('-')[0]?.trim() || 'Start',
        to_location: roadName.split('-').pop()?.trim() || 'End',
        from_chainage: cleanString(row[4]) || '0',
        to_chainage: cleanString(row[5]) || '0',
        length_km: lengthKm,
        configuration: config,
        status: 'ACTIVE',
      });
    }
  }

  result.totalRows = rawRows.length;
  result.validRows = parsedData.length;
  result.data = parsedData;

  if (parsedData.length === 0) {
    result.success = false;
    result.errors.push(
      'Could not find valid Highway Master rows. Expected columns: [Sl.No, NH No, Road Name, Length].'
    );
  }
}

function parseDLPContracts(rawRows: any[][], result: ParseResult) {
  const parsedData: DLPRow[] = [];
  const now = new Date();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const col1 = cleanString(row[1]); // Division
    const col2 = cleanString(row[2]); // NH No
    const col3 = cleanString(row[3]); // From Chainage
    const col4 = cleanString(row[4]); // To Chainage
    const col5 = cleanString(row[5]); // Total Length

    const rowStr = row.map(cleanString).join(' ');

    if (
      rowStr.toLowerCase().includes('status of length') ||
      rowStr.toLowerCase().includes('sub total') ||
      rowStr.toLowerCase().includes('no.of contracts') ||
      col2.toLowerCase().includes('nh no') ||
      col2.toLowerCase().includes('nhno')
    ) {
      continue;
    }

    if (col2 && (col2.match(/\d+/) || rowStr.includes('DLP') || rowStr.includes('STMC') || rowStr.includes('PBMC'))) {
      const nhNum = col2.replace(/[^0-9A-Z]/gi, '');
      if (!nhNum || nhNum.toLowerCase() === 'nhno') continue;

      const nhCode = `NH-${nhNum}`;

      const fromKmVal = parseFloat(col3.replace('/', '.').replace(/[^0-9.]/g, '')) || 0;
      const toKmVal = parseFloat(col4.replace('/', '.').replace(/[^0-9.]/g, '')) || 0;
      const totalLen = parseFloat(col5) || Math.abs(toKmVal - fromKmVal) || 0;

      const contractorMatch = rowStr.match(/(?:M\/s\.|Thiru\.|Contractor[:\s]*)([^,\n\.]+)/i);
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

      parsedData.push({
        highway_code: nhCode,
        stretch_name: `${col1 ? col1 + ' Division - ' : ''}${col2} (Km ${col3} to ${col4})`.trim(),
        from_km: fromKmVal,
        to_km: toKmVal,
        length_km: totalLen,
        contractor_name: contractorMatch ? contractorMatch[0].trim() : `${col1 || 'PWD'} Division Contractor`,
        contract_mode: mode,
        work_description: rowStr.slice(0, 500),
        doc_date: undefined,
        dlp_expiry_date: dlpDateStr || undefined,
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

/**
 * Advanced multi-sheet matrix parser for TN-NH-Bar chart workbooks
 */
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

        const kmVal = kmStr ? parseFloat(kmStr.replace('/', '.').replace(/[^0-9.]/g, '')) : NaN;
        const pcuVal = pcuStr ? parseInt(pcuStr.replace(/[^0-9]/g, '')) : undefined;

        if (town || !isNaN(kmVal) || carriageway || rowWidth) {
          parsedData.push({
            highway_code: nhCode,
            chainage_km: !isNaN(kmVal) ? kmVal : c,
            town_name: town || undefined,
            traffic_pcu: !isNaN(pcuVal!) ? pcuVal : undefined,
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
}
