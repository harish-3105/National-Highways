/**
 * Department Human-Readable Formatters & Dynamic Engineering Calculations
 */

/**
 * Parses diverse date formats (DD.MM.YYYY, DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD) into JavaScript Date objects safely.
 */
export function parseDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === '-' || s === 'NA' || s === 'N/A' || s === '--') return null;

  // DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return d;
  }

  // YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return d;
  }

  // DD.MM.YY or DD-MM-YY or DD/MM/YY (2-digit year support e.g. 25 -> 2025)
  const dmy2Match = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2})$/);
  if (dmy2Match) {
    const day = parseInt(dmy2Match[1], 10);
    const month = parseInt(dmy2Match[2], 10) - 1;
    const shortYear = parseInt(dmy2Match[3], 10);
    const year = shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return d;
  }

  // 8 straight digits: DDMMYYYY
  const ddmmyyyyMatch = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return d;
  }

  // 6 straight digits: DDMMYY
  const ddmmyyMatch = s.match(/^(\d{2})(\d{2})(\d{2})$/);
  if (ddmmyyMatch) {
    const day = parseInt(ddmmyyMatch[1], 10);
    const month = parseInt(ddmmyyMatch[2], 10) - 1;
    const shortYear = parseInt(ddmmyyMatch[3], 10);
    const year = shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return d;
  }

  // ISO timestamp (e.g. 2025-05-10T00:00:00.000Z)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export interface ProjectDelayResult {
  delayYears: number;
  isDelayed: boolean;
  humanText: string;
  compactText: string;
}

/**
 * Dynamically computes project delay (Time Overrun) using live dates.
 * Strict Formula:
 *   Delay = Current Date - Scheduled Completion Date (for active ongoing works)
 *   If Current Date <= Scheduled Date (or work physically 100% completed), Delay = 0 (On Schedule).
 */
export function calculateProjectDelay(
  scheduledDateStr: string | null | undefined,
  likelyDateStr?: string | null | undefined,
  progressPercent?: number | null
): ProjectDelayResult {
  const scheduled = parseDateString(scheduledDateStr);
  if (!scheduled) {
    return { delayYears: 0, isDelayed: false, humanText: 'On Schedule', compactText: 'On Schedule' };
  }

  // Pure Current Date minus Scheduled Date
  const now = new Date();
  const diffMs = now.getTime() - scheduled.getTime();

  // If not past scheduled deadline or if already 100% completed
  if (diffMs <= 0 || (progressPercent !== null && progressPercent !== undefined && Number(progressPercent) >= 100)) {
    return { delayYears: 0, isDelayed: false, humanText: 'On Schedule', compactText: 'On Schedule' };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return { delayYears: 0, isDelayed: false, humanText: 'On Schedule', compactText: 'On Schedule' };
  }

  const delayYears = Math.round((diffDays / 365.25) * 100) / 100;
  const years = Math.floor(diffDays / 365.25);
  const remainingDays = diffDays - Math.floor(years * 365.25);
  const months = Math.floor(remainingDays / 30.4375);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  if (parts.length === 0 && diffDays > 0) {
    parts.push(`${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`);
  }

  const humanStr = parts.join(' & ');

  let compactStr = '';
  if (years > 0 && months > 0) {
    compactStr = `${years}y ${months}m delay`;
  } else if (years > 0) {
    compactStr = `${years}y delay`;
  } else if (months > 0) {
    compactStr = `${months}m delay`;
  } else {
    compactStr = `${diffDays}d delay`;
  }

  return {
    delayYears,
    isDelayed: true,
    humanText: `${humanStr} (${delayYears.toFixed(2)} Yrs)`,
    compactText: compactStr,
  };
}

/**
 * Dynamically computes Financial Progress (%)
 * Formula:
 *   Total Financial Expenditure / MAX(Revised RCE Cost, Original TPC Sanction Cost) * 100
 */
export function calculateFinancialProgress(
  cummExpenditureCr: number | null | undefined,
  revisedCostCr: number | null | undefined,
  projectCostCr: number | null | undefined
): number | null {
  const exp = Number(cummExpenditureCr || 0);
  const rev = Number(revisedCostCr || 0);
  const tpc = Number(projectCostCr || 0);
  const denominator = Math.max(rev, tpc);
  if (denominator <= 0 || exp <= 0) return null;
  const pct = (exp / denominator) * 100;
  return Math.min(100, Math.round(pct * 10) / 10);
}

/**
 * Dynamically computes Contract Value Progress (%)
 * Formula:
 *   Cumulative Expenditure of Contract Value / Contract Value * 100
 */
export function calculateContractProgress(
  contractCumExpenditureCr: number | null | undefined,
  contractValueCr: number | null | undefined
): number | null {
  const exp = Number(contractCumExpenditureCr || 0);
  const val = Number(contractValueCr || 0);
  if (val <= 0 || exp <= 0) return null;
  const pct = (exp / val) * 100;
  return Math.min(100, Math.round(pct * 10) / 10);
}

/**
 * Formats a decimal year duration into human-readable "X Years & Y Months (Z.ZZ Yrs)" string.
 */
export function formatDelayHumanReadable(yearsVal: number | string | null | undefined): string {
  if (yearsVal === null || yearsVal === undefined || yearsVal === '') return 'Nil / On Schedule';
  const val = Number(yearsVal);
  if (isNaN(val) || val <= 0) return 'Nil / On Schedule';

  const totalDays = Math.round(val * 365.25);
  const years = Math.floor(totalDays / 365.25);
  const remainingDays = totalDays - Math.floor(years * 365.25);
  const months = Math.floor(remainingDays / 30.4375);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  if (parts.length === 0 && totalDays > 0) {
    parts.push(`${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}`);
  }

  const humanStr = parts.join(' & ');
  return `${humanStr} (${val.toFixed(2)} Yrs)`;
}

/**
 * Compact version for badges, chips, and small table cells.
 */
export function formatDelayCompact(yearsVal: number | string | null | undefined): string {
  if (yearsVal === null || yearsVal === undefined || yearsVal === '') return 'On Schedule';
  const val = Number(yearsVal);
  if (isNaN(val) || val <= 0) return 'On Schedule';

  const totalDays = Math.round(val * 365.25);
  const years = Math.floor(totalDays / 365.25);
  const remainingDays = totalDays - Math.floor(years * 365.25);
  const months = Math.floor(remainingDays / 30.4375);

  if (years > 0 && months > 0) {
    return `${years}y ${months}m delay`;
  }
  if (years > 0) {
    return `${years}y delay`;
  }
  if (months > 0) {
    return `${months}m delay`;
  }
  return `${totalDays}d delay`;
}

/**
 * Safely adds years to any date string (ISO or Indian formats) and returns formatted 'YYYY-MM-DD'.
 */
export function addYearsToDateString(dateStr: string | null | undefined, years: number | string | null | undefined): string | null {
  if (!dateStr || years === null || years === undefined || years === '') return null;
  const numYears = Number(years);
  if (isNaN(numYears) || numYears <= 0) return null;
  const d = parseDateString(dateStr);
  if (!d) return null;
  d.setFullYear(d.getFullYear() + numYears);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Normalizes any Indian/ISO date string to standard ISO 'YYYY-MM-DD' for PostgreSQL database columns.
 */
export function normalizeDateForDb(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === '-' || s === 'NA' || s === 'N/A' || s === '--') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = parseDateString(s);
  if (!d) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats any date string into standard Indian format 'DD/MM/YYYY'.
 */
export function formatDateIndian(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const s = String(dateStr).trim();
  if (!s || s === '-' || s === 'NA' || s === 'N/A' || s === '--') return '—';
  const d = parseDateString(s);
  if (!d) return s;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
