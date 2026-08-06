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

/**
 * Unified file parser for Excel (.xlsx, .xls) and CSV (.csv) files
 */
export async function parseDatasetFile(
  fileBuffer: Buffer,
  fileName: string,
  datasetType: DatasetType
): Promise<ParseResult> {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  let rawRows: any[][] = [];

  if (isCsv) {
    const textContent = fileBuffer.toString('utf-8');
    const parsed = Papa.parse<string[]>(textContent, { skipEmptyLines: true });
    rawRows = parsed.data;
  } else {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
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

  if (rawRows.length === 0) {
    result.success = false;
    result.errors.push(`File ${fileName} is completely empty.`);
    return result;
  }

  switch (datasetType) {
    case 'HIGHWAYS_MASTER':
      parseHighwaysMaster(rawRows, result);
      break;
    case 'DLP_CONTRACTS':
      parseDLPContracts(rawRows, result);
      break;
    case 'HIGHWAY_MILESTONES':
      parseMilestones(rawRows, result);
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

    // Skip table header rows
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

      // Extract lane configuration
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

    const rowStr = row.map(cleanString).join(' ');

    // Skip table header rows
    if (rowStr.toLowerCase().includes('contractor name') && rowStr.toLowerCase().includes('dlp date')) {
      continue;
    }

    if (rowStr.includes('DLP') || rowStr.includes('STMC') || rowStr.includes('PBMC') || rowStr.includes('M/s.')) {
      const nhMatch = rowStr.match(/NH\s*[-:\s]?\s*(\d+[A-Z]?)/i);
      const nhCode = nhMatch ? `NH-${nhMatch[1]}` : 'NH-GENERAL';
      const contractorMatch = rowStr.match(/(?:M\/s\.|Thiru\.|Contractor[:\s]*)([^,\n\.]+)/i);

      const dlpMatch = rowStr.match(/DLP[:\s]*(?:upto|to|completed on)?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i);
      const docMatch = rowStr.match(/DOC[:\s]*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i);

      const docDateStr = docMatch ? parseIndianDate(docMatch[1]) : undefined;
      const dlpDateStr = dlpMatch ? parseIndianDate(dlpMatch[1]) : undefined;

      let daysRemaining = 0;
      let status = 'ACTIVE';

      if (dlpDateStr) {
        const dlpDate = new Date(dlpDateStr);
        daysRemaining = Math.ceil((dlpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) status = 'EXPIRED';
        else if (daysRemaining <= 90) status = 'EXPIRING_SOON';
      }

      parsedData.push({
        highway_code: nhCode,
        stretch_name: rowStr.slice(0, 100),
        from_km: 0,
        to_km: 0,
        length_km: 0,
        contractor_name: contractorMatch ? contractorMatch[0].trim() : 'Contractor Unspecified',
        contract_mode: rowStr.includes('STMC') ? 'STMC' : rowStr.includes('PBMC') ? 'PBMC' : 'EPC',
        work_description: rowStr,
        doc_date: docDateStr || undefined,
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

function parseMilestones(rawRows: any[][], result: ParseResult) {
  const parsedData: MilestoneRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const nhCode = cleanString(row[0]) || 'NH-MASTER';
    const chainageKm = parseFloat(cleanString(row[1])) || 0;
    const townName = cleanString(row[2]);

    if (
      townName.toLowerCase().includes('town name') ||
      nhCode.toLowerCase().includes('nh no')
    ) {
      continue;
    }

    if (townName || chainageKm > 0) {
      parsedData.push({
        highway_code: nhCode.toUpperCase().startsWith('NH') ? nhCode.toUpperCase() : `NH-${nhCode.toUpperCase()}`,
        chainage_km: chainageKm,
        town_name: townName,
        traffic_pcu: parseInt(cleanString(row[3])) || undefined,
        row_width: cleanString(row[4]) || undefined,
        carriageway_spec: cleanString(row[5]) || undefined,
      });
    }
  }

  result.totalRows = rawRows.length;
  result.validRows = parsedData.length;
  result.data = parsedData;
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
