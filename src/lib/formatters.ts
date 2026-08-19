/**
 * Department Human-Readable Formatters & Conversions
 */

/**
 * Formats a decimal year duration into human-readable "X Years & Y Months (Z.ZZ Yrs)" string.
 * Examples:
 *   2.02 -> "2 Years (2.02 Yrs)"
 *   1.83 -> "1 Year & 10 Months (1.83 Yrs)"
 *   0.58 -> "7 Months (0.58 Yrs)"
 *   3.00 -> "3 Years (3.00 Yrs)"
 *   1.00 -> "1 Year (1.00 Yr)"
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
 * Examples:
 *   2.02 -> "2y delay"
 *   1.83 -> "1y 10m delay"
 *   0.58 -> "7m delay"
 *   3.00 -> "3y delay"
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
