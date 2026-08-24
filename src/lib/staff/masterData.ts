import { StaffMasterItem, StaffMember } from "@/components/staff/StaffTypes";

/**
 * Derives dynamic divisions list based on selected circle
 * using the relational parent_category and parent_value from master items.
 */
export function getCascadingDivisions(
  circle: string,
  rawMasterItems: StaffMasterItem[],
  fallbackDivisions: string[] = [],
  observedStaff?: StaffMember[]
): string[] {
  if (!circle) return fallbackDivisions;

  // 1. Check parent_value from relational database master items
  const matchedFromMaster = rawMasterItems
    .filter(
      (item) =>
        item.category === "division" &&
        item.parent_category === "circle" &&
        item.parent_value === circle
    )
    .map((item) => item.value);

  // 2. Check from active staff records if any
  const matchedFromStaff = observedStaff
    ? observedStaff
        .filter((s) => s.circle === circle && s.division)
        .map((s) => s.division as string)
    : [];

  const combined = Array.from(new Set([...matchedFromMaster, ...matchedFromStaff])).sort();
  return combined.length > 0 ? combined : fallbackDivisions;
}

/**
 * Derives dynamic sub-divisions list based on selected division
 * using the relational parent_category and parent_value from master items.
 */
export function getCascadingSubDivisions(
  division: string,
  rawMasterItems: StaffMasterItem[],
  fallbackSubDivisions: string[] = [],
  observedStaff?: StaffMember[]
): string[] {
  if (!division) return fallbackSubDivisions;

  // 1. Check parent_value from relational database master items
  const matchedFromMaster = rawMasterItems
    .filter(
      (item) =>
        item.category === "sub_division" &&
        item.parent_category === "division" &&
        item.parent_value === division
    )
    .map((item) => item.value);

  // 2. Check from active staff records if any
  const matchedFromStaff = observedStaff
    ? observedStaff
        .filter((s) => s.division === division && s.sub_division)
        .map((s) => s.sub_division as string)
    : [];

  const combined = Array.from(new Set([...matchedFromMaster, ...matchedFromStaff])).sort();
  return combined.length > 0 ? combined : fallbackSubDivisions;
}

/**
 * Derives dynamic sections list based on selected sub-division
 * using the relational parent_category and parent_value from master items.
 */
export function getCascadingSections(
  subDivision: string,
  rawMasterItems: StaffMasterItem[],
  fallbackSections: string[] = [],
  observedStaff?: StaffMember[]
): string[] {
  if (!subDivision) return fallbackSections;

  const matchedFromMaster = rawMasterItems
    .filter(
      (item) =>
        item.category === "section" &&
        item.parent_category === "sub_division" &&
        item.parent_value === subDivision
    )
    .map((item) => item.value);

  const matchedFromStaff = observedStaff
    ? observedStaff
        .filter((s) => s.sub_division === subDivision && s.section)
        .map((s) => s.section as string)
    : [];

  const combined = Array.from(new Set([...matchedFromMaster, ...matchedFromStaff])).sort();
  return combined.length > 0 ? combined : fallbackSections;
}

/**
 * Derives dynamic sub-sections list based on selected section
 * using the relational parent_category and parent_value from master items.
 */
export function getCascadingSubSections(
  section: string,
  rawMasterItems: StaffMasterItem[],
  fallbackSubSections: string[] = [],
  observedStaff?: StaffMember[]
): string[] {
  if (!section) return fallbackSubSections;

  const matchedFromMaster = rawMasterItems
    .filter(
      (item) =>
        item.category === "sub_section" &&
        item.parent_category === "section" &&
        item.parent_value === section
    )
    .map((item) => item.value);

  const matchedFromStaff = observedStaff
    ? observedStaff
        .filter((s) => s.section === section && s.sub_section)
        .map((s) => s.sub_section as string)
    : [];

  const combined = Array.from(new Set([...matchedFromMaster, ...matchedFromStaff])).sort();
  return combined.length > 0 ? combined : fallbackSubSections;
}
