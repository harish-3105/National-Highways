import { SubChainageStretch } from '@/app/api/sub-chainages/route';

export interface DetectedLaneInfo {
  matchedStretch: SubChainageStretch | null;
  laneConfig: string | null;
  totalCarriagewayWidthMeters: number;
  centerlineWidthMeters: number;
  totalWidthMeters: number; // Centerline offset (0 to half-width)
  importantTown?: string | null;
  pcuCount?: number | null;
}

export interface SpanCapacityCheckResult {
  valid: boolean;
  overlappingCount: number;
  bottlenecks: Array<{
    subStretch: SubChainageStretch;
    maxAllowedCenterlineWidth: number;
    maxAllowedCarriagewayWidth: number;
    overlapFromKm: number;
    overlapToKm: number;
    laneConfig: string;
  }>;
}

/**
 * Extracts full carriageway width and centerline offset width from lane configuration.
 * Lateral road width is measured from Centerline (0), so full 2-Lane (7m) = 0 to 3.5m,
 * full 4-Lane (14m) = 0 to 7.0m, full 2L+PS (10m) = 0 to 5.0m, etc.
 */
export function getLaneWidthFromConfig(
  laneConfig?: string | null,
  carriagewayWidth?: string | null
): { carriagewayWidth: number; centerlineWidth: number; totalWidth: number } {
  let fullWidth = 7.0;

  // 1. If explicit numeric carriageway width is stored (e.g. "7.0", "10.0m", "14.0")
  if (carriagewayWidth) {
    const parsed = parseFloat(carriagewayWidth.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      fullWidth = parsed;
    }
  } else {
    // 2. Derive standard full carriageway width from lane configuration name
    const norm = (laneConfig || '').toLowerCase();

    if (norm.includes('6l') || norm.includes('6-lane')) {
      fullWidth = 20.0;
    } else if (norm.includes('4l') || norm.includes('4-lane')) {
      fullWidth = 14.0;
    } else if (norm.includes('2l+ps') || norm.includes('paved')) {
      fullWidth = 10.0;
    } else if (norm.includes('2l') || norm.includes('2-lane')) {
      fullWidth = 7.0;
    } else if (norm.includes('< 2') || norm.includes('single') || norm.includes('intermediate') || norm.includes('1-lane')) {
      fullWidth = 3.75;
    }
  }

  const halfWidth = Math.round((fullWidth / 2) * 1000) / 1000;

  return {
    carriagewayWidth: fullWidth,
    centerlineWidth: halfWidth,
    totalWidth: halfWidth,
  };
}

/**
 * Detects the Level 2 Micro-Lane sub-chainage stretch and its centerline lane width for a given chainage span.
 * Strictly uses MICRO_LANE breakdown data (ignoring MACRO_PCU traffic tiers).
 */
export function detectLaneWidthForChainage(
  fromKm: number,
  toKm: number,
  subChainages: SubChainageStretch[]
): DetectedLaneInfo {
  if (!subChainages || subChainages.length === 0 || (fromKm === 0 && toKm === 0)) {
    return {
      matchedStretch: null,
      laneConfig: null,
      totalCarriagewayWidthMeters: 7.0,
      centerlineWidthMeters: 3.5,
      totalWidthMeters: 3.5,
    };
  }

  // Strictly filter for MICRO_LANE physical records
  const microStretches = subChainages.filter(
    (s) =>
      s.delete_status !== 'DELETED' &&
      s.delete_status !== 'SOFT_DELETE' &&
      s.breakdown_type !== 'MACRO_PCU' &&
      s.lane_configuration?.toLowerCase() !== 'primary' &&
      s.lane_configuration?.toLowerCase() !== 'secondary'
  );

  const candidatePool = microStretches.length > 0 ? microStretches : subChainages;

  const f = Math.min(fromKm, toKm);
  const t = Math.max(fromKm, toKm);

  // Find sub-chainage with maximum overlap with the given range
  let bestMatch: SubChainageStretch | null = null;
  let maxOverlap = -1;

  for (const s of candidatePool) {
    if (s.delete_status === 'DELETED' || s.delete_status === 'SOFT_DELETE') continue;

    const sFrom = Number(s.from_km) || 0;
    const sTo = Number(s.to_km) || 0;

    const overlapStart = Math.max(f, sFrom);
    const overlapEnd = Math.min(t, sTo);
    const overlap = overlapEnd - overlapStart;

    if (overlap > maxOverlap && overlap >= 0) {
      maxOverlap = overlap;
      bestMatch = s;
    }
  }

  // If no direct range overlap, pick the closest sub-chainage
  if (!bestMatch) {
    bestMatch = candidatePool.find((s) => {
      const sFrom = Number(s.from_km) || 0;
      const sTo = Number(s.to_km) || 0;
      return f >= sFrom && f <= sTo;
    }) || candidatePool[0] || null;
  }

  if (bestMatch) {
    const { carriagewayWidth, centerlineWidth, totalWidth } = getLaneWidthFromConfig(
      bestMatch.lane_configuration,
      bestMatch.carriageway_width
    );

    return {
      matchedStretch: bestMatch,
      laneConfig: bestMatch.lane_configuration || '2-Lane',
      totalCarriagewayWidthMeters: carriagewayWidth,
      centerlineWidthMeters: centerlineWidth,
      totalWidthMeters: totalWidth,
      importantTown: bestMatch.important_town || null,
      pcuCount: bestMatch.pcu_count !== undefined && bestMatch.pcu_count !== null ? Number(bestMatch.pcu_count) : null,
    };
  }

  return {
    matchedStretch: null,
    laneConfig: null,
    totalCarriagewayWidthMeters: 7.0,
    centerlineWidthMeters: 3.5,
    totalWidthMeters: 3.5,
  };
}

/**
 * Checks whether the specified road width fits within the physical carriageway capacity
 * for ALL underlying Level 2 Micro-Lane sub-stretches covered by [fromKm, toKm].
 * Lateral width is checked against the maximum allowed centerline offset (carriageway / 2).
 */
export function checkSpanWidthCapacity(
  fromKm: number,
  toKm: number,
  roadWidthToM: number,
  subChainages: SubChainageStretch[]
): SpanCapacityCheckResult {
  if (
    !subChainages ||
    subChainages.length === 0 ||
    isNaN(fromKm) ||
    isNaN(toKm) ||
    isNaN(roadWidthToM) ||
    roadWidthToM <= 0
  ) {
    return { valid: true, overlappingCount: 0, bottlenecks: [] };
  }

  const f = Math.min(fromKm, toKm);
  const t = Math.max(fromKm, toKm);

  const microStretches = subChainages.filter(
    (s) =>
      s.delete_status !== 'DELETED' &&
      s.delete_status !== 'SOFT_DELETE' &&
      s.breakdown_type !== 'MACRO_PCU' &&
      s.lane_configuration?.toLowerCase() !== 'primary' &&
      s.lane_configuration?.toLowerCase() !== 'secondary'
  );

  const candidatePool = microStretches.length > 0 ? microStretches : subChainages;
  const bottlenecks: SpanCapacityCheckResult['bottlenecks'] = [];
  let overlappingCount = 0;

  for (const s of candidatePool) {
    if (s.delete_status === 'DELETED' || s.delete_status === 'SOFT_DELETE') continue;

    const sFrom = Number(s.from_km) || 0;
    const sTo = Number(s.to_km) || 0;

    const overlapStart = Math.max(f, sFrom);
    const overlapEnd = Math.min(t, sTo);

    if (overlapEnd > overlapStart) {
      overlappingCount++;
      const { carriagewayWidth, centerlineWidth } = getLaneWidthFromConfig(s.lane_configuration, s.carriageway_width);

      if (roadWidthToM > centerlineWidth) {
        bottlenecks.push({
          subStretch: s,
          maxAllowedCenterlineWidth: centerlineWidth,
          maxAllowedCarriagewayWidth: carriagewayWidth,
          overlapFromKm: overlapStart,
          overlapToKm: overlapEnd,
          laneConfig: s.lane_configuration || '2-Lane',
        });
      }
    }
  }

  return {
    valid: bottlenecks.length === 0,
    overlappingCount,
    bottlenecks,
  };
}

export interface OverlappingLaneSubSection {
  fromKm: number;
  toKm: number;
  lengthKm: number;
  laneConfig: string;
  carriagewayWidthMeters: number;
  centerlineWidthMeters: number;
  importantTown?: string | null;
  subStretch: SubChainageStretch;
}

export interface SpanLaneAnalysis {
  hasMatches: boolean;
  isUniform: boolean;
  totalSubSections: number;
  subSections: OverlappingLaneSubSection[];
  minCenterlineWidthMeters: number;
  minCarriagewayWidthMeters: number;
  maxCenterlineWidthMeters: number;
  maxCarriagewayWidthMeters: number;
  bottleneckConfig: string;
  primaryConfig: string;
  summaryLabel: string;
}

/**
 * Analyzes all Level 2 Micro-Lane sub-stretches covered by [fromKm, toKm].
 * Detects whether the span has a uniform lane configuration or spans multiple different lane types.
 * Provides the safe minimum bottleneck width as well as discrete sub-sections for auto-splitting.
 */
export function analyzeSpanLaneSubSections(
  fromKm: number,
  toKm: number,
  subChainages: SubChainageStretch[]
): SpanLaneAnalysis {
  const defaultRes: SpanLaneAnalysis = {
    hasMatches: false,
    isUniform: true,
    totalSubSections: 0,
    subSections: [],
    minCenterlineWidthMeters: 3.5,
    minCarriagewayWidthMeters: 7.0,
    maxCenterlineWidthMeters: 3.5,
    maxCarriagewayWidthMeters: 7.0,
    bottleneckConfig: '2-Lane',
    primaryConfig: '2-Lane',
    summaryLabel: '2-Lane',
  };

  if (!subChainages || subChainages.length === 0 || isNaN(fromKm) || isNaN(toKm) || (fromKm === 0 && toKm === 0)) {
    return defaultRes;
  }

  const f = Math.min(fromKm, toKm);
  const t = Math.max(fromKm, toKm);

  const microStretches = subChainages.filter(
    (s) =>
      s.delete_status !== 'DELETED' &&
      s.delete_status !== 'SOFT_DELETE' &&
      s.breakdown_type !== 'MACRO_PCU' &&
      s.lane_configuration?.toLowerCase() !== 'primary' &&
      s.lane_configuration?.toLowerCase() !== 'secondary'
  );

  const candidatePool = microStretches.length > 0 ? microStretches : subChainages;
  const rawSlices: OverlappingLaneSubSection[] = [];

  for (const s of candidatePool) {
    if (s.delete_status === 'DELETED' || s.delete_status === 'SOFT_DELETE') continue;

    const sFrom = Number(s.from_km) || 0;
    const sTo = Number(s.to_km) || 0;

    const overlapStart = Math.max(f, sFrom);
    const overlapEnd = Math.min(t, sTo);

    if (overlapEnd > overlapStart) {
      const { carriagewayWidth, centerlineWidth } = getLaneWidthFromConfig(s.lane_configuration, s.carriageway_width);
      rawSlices.push({
        fromKm: Math.round(overlapStart * 1000) / 1000,
        toKm: Math.round(overlapEnd * 1000) / 1000,
        lengthKm: Math.round((overlapEnd - overlapStart) * 1000) / 1000,
        laneConfig: s.lane_configuration || '2-Lane',
        carriagewayWidthMeters: carriagewayWidth,
        centerlineWidthMeters: centerlineWidth,
        importantTown: s.important_town || null,
        subStretch: s,
      });
    }
  }

  // Sort slices by starting chainage
  rawSlices.sort((a, b) => a.fromKm - b.fromKm);

  // Merge contiguous slices that have identical laneConfig & centerlineWidth
  const mergedSlices: OverlappingLaneSubSection[] = [];
  for (const slice of rawSlices) {
    if (mergedSlices.length === 0) {
      mergedSlices.push({ ...slice });
    } else {
      const prev = mergedSlices[mergedSlices.length - 1];
      if (
        Math.abs(prev.toKm - slice.fromKm) < 0.005 &&
        prev.centerlineWidthMeters === slice.centerlineWidthMeters &&
        prev.laneConfig === slice.laneConfig
      ) {
        prev.toKm = slice.toKm;
        prev.lengthKm = Math.round((prev.toKm - prev.fromKm) * 1000) / 1000;
      } else {
        mergedSlices.push({ ...slice });
      }
    }
  }

  if (mergedSlices.length === 0) {
    return defaultRes;
  }

  let minCenterline = Infinity;
  let minCarriageway = Infinity;
  let maxCenterline = -Infinity;
  let maxCarriageway = -Infinity;
  let bottleneckConfig = mergedSlices[0].laneConfig;
  let longestSliceLength = -1;
  let primaryConfig = mergedSlices[0].laneConfig;

  const distinctConfigs = new Set<string>();

  for (const slice of mergedSlices) {
    distinctConfigs.add(slice.laneConfig);
    if (slice.centerlineWidthMeters < minCenterline) {
      minCenterline = slice.centerlineWidthMeters;
      minCarriageway = slice.carriagewayWidthMeters;
      bottleneckConfig = slice.laneConfig;
    }
    if (slice.centerlineWidthMeters > maxCenterline) {
      maxCenterline = slice.centerlineWidthMeters;
      maxCarriageway = slice.carriagewayWidthMeters;
    }
    if (slice.lengthKm > longestSliceLength) {
      longestSliceLength = slice.lengthKm;
      primaryConfig = slice.laneConfig;
    }
  }

  const isUniform = distinctConfigs.size === 1;

  return {
    hasMatches: true,
    isUniform,
    totalSubSections: mergedSlices.length,
    subSections: mergedSlices,
    minCenterlineWidthMeters: minCenterline === Infinity ? 3.5 : minCenterline,
    minCarriagewayWidthMeters: minCarriageway === Infinity ? 7.0 : minCarriageway,
    maxCenterlineWidthMeters: maxCenterline === -Infinity ? 3.5 : maxCenterline,
    maxCarriagewayWidthMeters: maxCarriageway === -Infinity ? 7.0 : maxCarriageway,
    bottleneckConfig,
    primaryConfig,
    summaryLabel: Array.from(distinctConfigs).join(' + '),
  };
}
