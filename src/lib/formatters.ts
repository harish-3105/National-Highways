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
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
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

  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const delayYears = Math.round((diffDays / 365.25) * 100) / 100;

  if (delayYears <= 0) {
    return { delayYears: 0, isDelayed: false, humanText: 'On Schedule', compactText: 'On Schedule' };
  }

  const totalMonths = Math.round(delayYears * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);

  const humanStr = parts.length > 0 ? parts.join(' & ') : `${delayYears.toFixed(2)} Yrs`;
  const compactStr = years > 0 && months > 0 ? `${years}y ${months}m delay` : years > 0 ? `${years}y delay` : `${months}m delay`;

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
 * Formats a decimal year duration into human-readable "X Years & Y Months (Z.ZZ Yrs)" string.
 */
export function formatDelayHumanReadable(yearsVal: number | string | null | undefined): string {
  if (yearsVal === null || yearsVal === undefined || yearsVal === '') return 'Nil / On Schedule';
  const val = Number(yearsVal);
  if (isNaN(val) || val <= 0) return 'Nil / On Schedule';

  const totalMonths = Math.round(val * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  }

  if (parts.length === 0) {
    return `${val.toFixed(2)} Yrs (< 1 Mo)`;
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

  const totalMonths = Math.round(val * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years > 0 && months > 0) {
    return `${years}y ${months}m delay`;
  }
  if (years > 0) {
    return `${years}y delay`;
  }
  return `${months}m delay`;
}
