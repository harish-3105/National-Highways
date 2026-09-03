import { DlpWorkCategory, DlpWorkStretch } from '@/types/dlp';

export interface BreakdownBadgeItem {
  id: string;
  category: DlpWorkCategory;
  scopeType: 'FULL' | 'STRENGTHENING' | 'WIDENING';
  label: string;
  lengthKm: number;
  bg: string;
  text: string;
}

export const CATEGORY_BADGES: Record<
  DlpWorkCategory,
  { label: string; bg: string; text: string }
> = {
  DLP: { label: 'DLP', bg: 'bg-lime-50 dark:bg-lime-950/40', text: 'text-lime-800 dark:text-lime-200' },
  CONSTRUCTION: { label: 'Construction', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-900 dark:text-emerald-100' },
  STMC: { label: 'STMC', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-200' },
  PBMC: { label: 'PBMC', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-200' },
  NO_DLP: { label: 'No DLP', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300' },
};

/**
 * Merges 1D intervals [from, to] into unique non-overlapping segments.
 */
export function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (intervals.length === 0) return [];
  const sorted = intervals
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number])
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);

  if (sorted.length === 0) return [];

  const merged: Array<[number, number]> = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

/**
 * Computes total unique length in km from a set of 1D intervals.
 */
export function computeTotalIntervalLength(intervals: Array<[number, number]>): number {
  const merged = mergeIntervals(intervals);
  const sum = merged.reduce((acc, [a, b]) => acc + (b - a), 0);
  return Math.round(sum * 1000) / 1000;
}

/**
 * Determines whether a stretch is Strengthening (center carriageway), Widening (sides/shoulders), or Full Width.
 */
export function classifyStretchScope(stretch: DlpWorkStretch): 'FULL' | 'STRENGTHENING' | 'WIDENING' {
  const wFrom = Number(stretch.road_width_from_m ?? 0);
  const wTo = Number(stretch.road_width_to_m ?? 0);
  const name = (stretch.work_name || '').toLowerCase();
  const remarks = (stretch.remarks || '').toLowerCase();
  const combinedText = `${name} ${remarks}`;

  // 1. Text overrides if explicitly specified
  if (combinedText.includes('full width') || combinedText.includes('entire width') || combinedText.includes('both sides & center')) {
    return 'FULL';
  }
  if (combinedText.includes('widen') || combinedText.includes('paved shoulder') || combinedText.includes('shoulder')) {
    return 'WIDENING';
  }
  if (combinedText.includes('strengthen') || combinedText.includes('resurfac') || combinedText.includes('main carriageway')) {
    return 'STRENGTHENING';
  }

  // 2. Width geometry offsets (0m = Centerline)
  if (wFrom >= 3.5 || (wFrom > 0 && wTo > 7.0)) {
    return 'WIDENING';
  }
  if (wFrom === 0 && wTo > 0 && wTo <= 7.0) {
    return 'STRENGTHENING';
  }
  if (wFrom === 0 && wTo >= 10.0) {
    return 'FULL';
  }

  return 'FULL';
}

/**
 * Computes the 2D spatial work breakdown badges for a corridor.
 * Accurately tracks active categories, partial-width unworked slices, and unworked No DLP spans.
 */
export function compute2dWorkBreakdown(
  totalLengthKm: number,
  stretches: DlpWorkStretch[]
): BreakdownBadgeItem[] {
  const cLen = Number(totalLengthKm) || 0;
  const activeStretches = (stretches || []).filter((s) => s.status !== 'DELETED');

  if (activeStretches.length === 0) {
    if (cLen <= 0) return [];
    return [
      {
        id: 'no-dlp-full',
        category: 'NO_DLP',
        scopeType: 'FULL',
        label: `No DLP: ${cLen.toFixed(2)}km`,
        lengthKm: cLen,
        bg: CATEGORY_BADGES.NO_DLP.bg,
        text: CATEGORY_BADGES.NO_DLP.text,
      },
    ];
  }

  // Group active stretches by category and scope
  type GroupKey = `${DlpWorkCategory}_${'FULL' | 'STRENGTHENING' | 'WIDENING'}`;
  const groupIntervals: Record<GroupKey, Array<[number, number]>> = {
    DLP_FULL: [],
    DLP_STRENGTHENING: [],
    DLP_WIDENING: [],
    CONSTRUCTION_FULL: [],
    CONSTRUCTION_STRENGTHENING: [],
    CONSTRUCTION_WIDENING: [],
    STMC_FULL: [],
    STMC_STRENGTHENING: [],
    STMC_WIDENING: [],
    PBMC_FULL: [],
    PBMC_STRENGTHENING: [],
    PBMC_WIDENING: [],
    NO_DLP_FULL: [],
    NO_DLP_STRENGTHENING: [],
    NO_DLP_WIDENING: [],
  };

  // Keep track of all intervals per scope regardless of category
  const allStrengtheningIntervals: Array<[number, number]> = [];
  const allWideningIntervals: Array<[number, number]> = [];
  const allActiveIntervals: Array<[number, number]> = [];

  activeStretches.forEach((s) => {
    const fromKm = Number(s.chainage_from_km ?? 0);
    const toKm = Number(s.chainage_to_km ?? 0);
    if (toKm <= fromKm) return;

    const scope = classifyStretchScope(s);
    const key: GroupKey = `${s.category}_${scope}`;
    groupIntervals[key].push([fromKm, toKm]);

    if (s.category !== 'NO_DLP') {
      allActiveIntervals.push([fromKm, toKm]);
      if (scope === 'FULL') {
        allStrengtheningIntervals.push([fromKm, toKm]);
        allWideningIntervals.push([fromKm, toKm]);
      } else if (scope === 'STRENGTHENING') {
        allStrengtheningIntervals.push([fromKm, toKm]);
      } else if (scope === 'WIDENING') {
        allWideningIntervals.push([fromKm, toKm]);
      }
    }
  });

  const badges: BreakdownBadgeItem[] = [];

  // 1. Add active work badges
  const categories: DlpWorkCategory[] = ['DLP', 'CONSTRUCTION', 'STMC', 'PBMC', 'NO_DLP'];
  const scopes: Array<'FULL' | 'STRENGTHENING' | 'WIDENING'> = ['FULL', 'STRENGTHENING', 'WIDENING'];

  categories.forEach((cat) => {
    if (cat === 'NO_DLP') return; // Handled explicitly below
    const cfg = CATEGORY_BADGES[cat];

    scopes.forEach((scope) => {
      const key: GroupKey = `${cat}_${scope}`;
      const len = computeTotalIntervalLength(groupIntervals[key]);
      if (len > 0) {
        let label = `${cfg.label}: ${len.toFixed(2)}km`;
        if (scope === 'STRENGTHENING') {
          label = `${cfg.label} (Strengthening): ${len.toFixed(2)}km`;
        } else if (scope === 'WIDENING') {
          label = `${cfg.label} (Widening): ${len.toFixed(2)}km`;
        }

        badges.push({
          id: `${cat}-${scope}`,
          category: cat,
          scopeType: scope,
          label,
          lengthKm: len,
          bg: cfg.bg,
          text: cfg.text,
        });
      }
    });
  });

  // 2. Compute partial-width unworked slices under No DLP
  // A. Stretches that have widening work but NO strengthening work
  const mergedStrengthening = mergeIntervals(allStrengtheningIntervals);
  const mergedWidening = mergeIntervals(allWideningIntervals);

  let unworkedStrengtheningKm = 0;
  mergedWidening.forEach(([wFrom, wTo]) => {
    // Check overlap with strengthening
    let covered = 0;
    mergedStrengthening.forEach(([sFrom, sTo]) => {
      const overlapStart = Math.max(wFrom, sFrom);
      const overlapEnd = Math.min(wTo, sTo);
      if (overlapEnd > overlapStart) {
        covered += overlapEnd - overlapStart;
      }
    });
    const gap = (wTo - wFrom) - covered;
    if (gap > 0) {
      unworkedStrengtheningKm += gap;
    }
  });
  unworkedStrengtheningKm = Math.round(unworkedStrengtheningKm * 1000) / 1000;

  // B. Stretches that have strengthening work but NO widening work
  let unworkedWideningKm = 0;
  mergedStrengthening.forEach(([sFrom, sTo]) => {
    let covered = 0;
    mergedWidening.forEach(([wFrom, wTo]) => {
      const overlapStart = Math.max(sFrom, wFrom);
      const overlapEnd = Math.min(sTo, wTo);
      if (overlapEnd > overlapStart) {
        covered += overlapEnd - overlapStart;
      }
    });
    const gap = (sTo - sFrom) - covered;
    if (gap > 0) {
      unworkedWideningKm += gap;
    }
  });
  unworkedWideningKm = Math.round(unworkedWideningKm * 1000) / 1000;

  if (unworkedStrengtheningKm > 0) {
    badges.push({
      id: 'no-dlp-strengthening',
      category: 'NO_DLP',
      scopeType: 'STRENGTHENING',
      label: `No DLP (Strengthening): ${unworkedStrengtheningKm.toFixed(2)}km`,
      lengthKm: unworkedStrengtheningKm,
      bg: CATEGORY_BADGES.NO_DLP.bg,
      text: CATEGORY_BADGES.NO_DLP.text,
    });
  }

  if (unworkedWideningKm > 0) {
    badges.push({
      id: 'no-dlp-widening',
      category: 'NO_DLP',
      scopeType: 'WIDENING',
      label: `No DLP (Widening): ${unworkedWideningKm.toFixed(2)}km`,
      lengthKm: unworkedWideningKm,
      bg: CATEGORY_BADGES.NO_DLP.bg,
      text: CATEGORY_BADGES.NO_DLP.text,
    });
  }

  // 3. Compute pure untouched longitudinal corridor span under No DLP
  const totalActiveSpan = computeTotalIntervalLength(allActiveIntervals);
  const untouchedFullSpan = Math.max(0, Math.round((cLen - totalActiveSpan) * 1000) / 1000);

  if (untouchedFullSpan > 0) {
    badges.push({
      id: 'no-dlp-full',
      category: 'NO_DLP',
      scopeType: 'FULL',
      label: `No DLP: ${untouchedFullSpan.toFixed(2)}km`,
      lengthKm: untouchedFullSpan,
      bg: CATEGORY_BADGES.NO_DLP.bg,
      text: CATEGORY_BADGES.NO_DLP.text,
    });
  }

  return badges;
}
