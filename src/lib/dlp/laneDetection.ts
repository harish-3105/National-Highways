import { SubChainageStretch } from '@/app/api/sub-chainages/route';

export interface DetectedLaneInfo {
  matchedStretch: SubChainageStretch | null;
  laneConfig: string | null;
  totalWidthMeters: number;
  importantTown?: string | null;
  pcuCount?: number | null;
}

export interface SpanCapacityCheckResult {
  valid: boolean;
  overlappingCount: number;
  bottlenecks: Array<{
    subStretch: SubChainageStretch;
    maxAllowedWidth: number;
    overlapFromKm: number;
    overlapToKm: number;
    laneConfig: string;
  }>;
}

/**
 * Extracts full carriageway/lane width from lane configuration or explicit carriageway string.
 */
export function getLaneWidthFromConfig(
  laneConfig?: string | null,
  carriagewayWidth?: string | null
): { totalWidth: number } {
  // 1. If explicit numeric carriageway width is stored (e.g. "7.0", "10.0m", "14.0")
  if (carriagewayWidth) {
    const parsed = parseFloat(carriagewayWidth.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      return { totalWidth: parsed };
    }
  }

  // 2. Derive standard full width from lane configuration name
  const norm = (laneConfig || '').toLowerCase();

  if (norm.includes('6l') || norm.includes('6-lane')) {
    return { totalWidth: 20.0 };
  }
  if (norm.includes('4l') || norm.includes('4-lane')) {
    return { totalWidth: 14.0 };
  }
  if (norm.includes('2l+ps') || norm.includes('paved')) {
    return { totalWidth: 10.0 };
  }
  if (norm.includes('2l') || norm.includes('2-lane')) {
    return { totalWidth: 7.0 };
  }
  if (norm.includes('< 2') || norm.includes('single') || norm.includes('intermediate') || norm.includes('1-lane')) {
    return { totalWidth: 3.75 };
  }

  // Standard 2-Lane default fallback
  return { totalWidth: 7.0 };
}

/**
 * Detects the Level 2 Micro-Lane sub-chainage stretch and its full physical lane width for a given chainage span.
 * Strictly uses MICRO_LANE breakdown data (ignoring MACRO_PCU traffic tiers).
 */
export function detectLaneWidthForChainage(
  fromKm: number,
  toKm: number,
  subChainages: SubChainageStretch[]
): DetectedLaneInfo {
  if (!subChainages || subChainages.length === 0) {
    return {
      matchedStretch: null,
      laneConfig: null,
      totalWidthMeters: 7.0,
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
    const { totalWidth } = getLaneWidthFromConfig(
      bestMatch.lane_configuration,
      bestMatch.carriageway_width
    );

    return {
      matchedStretch: bestMatch,
      laneConfig: bestMatch.lane_configuration || '2-Lane',
      totalWidthMeters: totalWidth,
      importantTown: bestMatch.important_town || null,
      pcuCount: bestMatch.pcu_count !== undefined && bestMatch.pcu_count !== null ? Number(bestMatch.pcu_count) : null,
    };
  }

  return {
    matchedStretch: null,
    laneConfig: null,
    totalWidthMeters: 7.0,
  };
}

/**
 * Checks whether the specified road width fits within the physical carriageway capacity
 * for ALL underlying Level 2 Micro-Lane sub-stretches covered by [fromKm, toKm].
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
      const { totalWidth } = getLaneWidthFromConfig(s.lane_configuration, s.carriageway_width);

      if (roadWidthToM > totalWidth) {
        bottlenecks.push({
          subStretch: s,
          maxAllowedWidth: totalWidth,
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
