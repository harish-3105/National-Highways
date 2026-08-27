// Dynamic Master data utilities for DLP Module (Circles, Divisions, Schemes)
import { DlpMasterConfigItem } from '@/types/dlp';

/**
 * Builds a mapping of Circle -> Division names dynamically from master config records.
 */
export function buildCircleDivisionMap(items: DlpMasterConfigItem[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  const circles = items
    .filter((i) => i.category === 'circle' && i.status !== 'DELETED')
    .map((i) => i.value.trim());

  circles.forEach((circle) => {
    map[circle] = [];
  });

  items
    .filter((i) => i.category === 'division' && i.status !== 'DELETED')
    .forEach((item) => {
      const parentCircle = item.parent_value?.trim();
      if (parentCircle) {
        if (!map[parentCircle]) {
          map[parentCircle] = [];
        }
        if (!map[parentCircle].includes(item.value.trim())) {
          map[parentCircle].push(item.value.trim());
        }
      }
    });

  return map;
}

/**
 * Finds the administrative Circle associated with a given division name dynamically.
 */
export function getCircleForDivision(
  divisionName: string,
  circleDivisionMap?: Record<string, string[]> | null
): string | null {
  if (!divisionName || !circleDivisionMap) return null;

  for (const [circle, divisions] of Object.entries(circleDivisionMap)) {
    if (divisions.some((d) => d.toLowerCase() === divisionName.toLowerCase())) {
      return circle;
    }
  }
  return null;
}
