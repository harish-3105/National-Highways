export const DEFAULT_OFFICES = [
  'Office of the Director General, Highways',
  'Office of the Chief Engineer (NH), Chennai',
  'Office of the Superintending Engineer (NH)',
  'Office of the Divisional Engineer (NH)',
  'Office of the Assistant Divisional Engineer (NH)',
  'Office of the Assistant Engineer (NH)',
  'Quality Control & Research Wing',
  'Planning, Designs & Investigation Wing',
];

export const DEFAULT_CIRCLES = [
  'Chennai',
  'Salem',
  'Madurai',
  'Coimbatore',
  'Tiruchirappalli',
  'Tirunelveli',
  'Villupuram',
];

export const CIRCLE_DIVISION_HIERARCHY: Record<string, string[]> = {
  Chennai: ['Chennai', 'Chengalpattu', 'Tiruvallur'],
  Salem: ['Salem', 'Namakkal', 'Dharmapuri', 'Krishnagiri'],
  Madurai: ['Madurai', 'Dindigul', 'Theni', 'Ramanathapuram', 'Sivagangai'],
  Coimbatore: ['Coimbatore', 'Tiruppur', 'Erode'],
  Tiruchirappalli: ['Tiruchirappalli', 'Thanjavur', 'Karur', 'Pudukkottai'],
  Tirunelveli: ['Tirunelveli', 'Thoothukudi', 'Nagercoil'],
  Villupuram: ['Villupuram', 'Cuddalore', 'Vellore'],
};

export const DIVISION_SUBDIVISION_HIERARCHY: Record<string, string[]> = {
  Chennai: ['Chennai South', 'Chennai North', 'Guindy', 'Tambaram', 'Poonamallee'],
  Chengalpattu: ['Chengalpattu', 'Madurantakam', 'Kancheepuram', 'Sriperumbudur'],
  Tiruvallur: ['Tiruvallur', 'Ponneri', 'Tiruttani', 'Gummidipoondi'],
  Salem: ['Salem', 'Omalur', 'Attur', 'Sankari', 'Mettur'],
  Namakkal: ['Namakkal', 'Rasipuram', 'Tiruchengode', 'Paramathi Velur'],
  Dharmapuri: ['Dharmapuri', 'Harur', 'Palacode', 'Pennagaram'],
  Krishnagiri: ['Krishnagiri', 'Hosur', 'Pochampalli', 'Uthangarai'],
  Madurai: ['Madurai North', 'Madurai South', 'Usilampatti', 'Melur', 'Thirumangalam'],
  Dindigul: ['Dindigul', 'Palani', 'Kodaikanal', 'Nilakkottai'],
  Theni: ['Theni', 'Periyakulam', 'Uthamapalayam', 'Bodinayakanur'],
  Ramanathapuram: ['Ramanathapuram', 'Paramakudi', 'Rameswaram', 'Tiruvadanai'],
  Sivagangai: ['Sivagangai', 'Karaikudi', 'Devakottai', 'Manamadurai'],
  Coimbatore: ['Coimbatore North', 'Coimbatore South', 'Pollachi', 'Mettupalayam', 'Sulur'],
  Tiruppur: ['Tiruppur', 'Dharapuram', 'Udumalpet', 'Kangeyam'],
  Erode: ['Erode', 'Gobichettipalayam', 'Perundurai', 'Bhavani', 'Sathyamangalam'],
  Tiruchirappalli: ['Tiruchirappalli', 'Musiri', 'Lalgudi', 'Manapparai'],
  Thanjavur: ['Thanjavur', 'Kumbakonam', 'Pattukkottai', 'Orathanadu'],
  Karur: ['Karur', 'Kulithalai', 'Aravakurichi'],
  Pudukkottai: ['Pudukkottai', 'Aranthangi', 'Illuppur'],
  Tirunelveli: ['Tirunelveli', 'Ambasamudram', 'Tenkasi', 'Sankarankoil'],
  Thoothukudi: ['Thoothukudi', 'Kovilpatti', 'Tiruchendur', 'Srivaikuntam'],
  Nagercoil: ['Nagercoil', 'Thuckalay', 'Kuzhithurai', 'Boothapandi'],
  Villupuram: ['Villupuram', 'Tindivanam', 'Kallakurichi', 'Gingee'],
  Cuddalore: ['Cuddalore', 'Chidambaram', 'Virudhachalam', 'Panruti'],
  Vellore: ['Vellore', 'Ranipet', 'Tirupattur', 'Arakkonam', 'Gudiyattam'],
};

export const DEFAULT_DESIGNATIONS = [
  'Director General (Highways)',
  'Chief Engineer (Highways)',
  'Superintending Engineer (Highways)',
  'Divisional Engineer (Highways)',
  'Assistant Divisional Engineer (Highways)',
  'Assistant Engineer (Highways)',
  'Junior Engineer (Highways)',
  'Head Draughting Officer',
  'Senior Draughting Officer',
  'Draughting Officer',
  'Administrative Officer',
  'Superintendent',
  'Assistant',
  'Junior Assistant',
  'Typist / Steno-Typist',
  'Office Assistant / Record Clerk',
];

export const DEFAULT_SECTIONS = [
  'Section I (Headquarters)',
  'Section II (Field Maintenance)',
  'Section III (Bridge & Structures)',
  'Section IV (Quality Assurance)',
  'Road Safety & Inspection Unit',
];

export const DEFAULT_SUB_SECTIONS = [
  'Sub-Section 1A (North Stretch)',
  'Sub-Section 1B (South Stretch)',
  'Sub-Section 2A (Bypass & Junctions)',
  'Sub-Section 2B (Structures & Culverts)',
];

/**
 * Derives dynamic divisions list based on selected circle
 */
export function getCascadingDivisions(
  circle: string,
  allMasterDivisions: string[],
  observedStaff?: Array<{ circle?: string | null; division?: string | null }>
): string[] {
  if (!circle) return allMasterDivisions;

  const hierarchyList = CIRCLE_DIVISION_HIERARCHY[circle] || [];
  const observedList = observedStaff
    ? observedStaff
        .filter((s) => s.circle === circle && s.division)
        .map((s) => s.division as string)
    : [];

  const matched = new Set([...hierarchyList, ...observedList]);
  const filtered = allMasterDivisions.filter((d) => matched.has(d));

  // If no intersection found but hierarchy exists, return hierarchy
  if (filtered.length === 0 && hierarchyList.length > 0) {
    return hierarchyList;
  }

  return filtered.length > 0 ? filtered : allMasterDivisions;
}

/**
 * Derives dynamic sub-divisions list based on selected division
 */
export function getCascadingSubDivisions(
  division: string,
  allMasterSubDivisions: string[],
  observedStaff?: Array<{ division?: string | null; sub_division?: string | null }>
): string[] {
  if (!division) return allMasterSubDivisions;

  const hierarchyList = DIVISION_SUBDIVISION_HIERARCHY[division] || [];
  const observedList = observedStaff
    ? observedStaff
        .filter((s) => s.division === division && s.sub_division)
        .map((s) => s.sub_division as string)
    : [];

  const matched = new Set([...hierarchyList, ...observedList]);
  const filtered = allMasterSubDivisions.filter((sd) => matched.has(sd));

  if (filtered.length === 0 && hierarchyList.length > 0) {
    return hierarchyList;
  }

  return filtered.length > 0 ? filtered : allMasterSubDivisions;
}

/**
 * Derives dynamic sections list based on selected sub-division
 */
export function getCascadingSections(
  subDivision: string,
  allMasterSections: string[],
  observedStaff?: Array<{ sub_division?: string | null; section?: string | null }>
): string[] {
  if (!subDivision) return allMasterSections;

  const observedList = observedStaff
    ? observedStaff
        .filter((s) => s.sub_division === subDivision && s.section)
        .map((s) => s.section as string)
    : [];

  if (observedList.length > 0) {
    const matched = new Set(observedList);
    const filtered = allMasterSections.filter((sec) => matched.has(sec));
    if (filtered.length > 0) return filtered;
  }

  return allMasterSections;
}

/**
 * Derives dynamic sub-sections list based on selected section
 */
export function getCascadingSubSections(
  section: string,
  allMasterSubSections: string[],
  observedStaff?: Array<{ section?: string | null; sub_section?: string | null }>
): string[] {
  if (!section) return allMasterSubSections;

  const observedList = observedStaff
    ? observedStaff
        .filter((s) => s.section === section && s.sub_section)
        .map((s) => s.sub_section as string)
    : [];

  if (observedList.length > 0) {
    const matched = new Set(observedList);
    const filtered = allMasterSubSections.filter((ss) => matched.has(ss));
    if (filtered.length > 0) return filtered;
  }

  return allMasterSubSections;
}
