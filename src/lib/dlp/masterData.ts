// Master data for DLP Module (Circles and Divisions)

export const DLP_CIRCLE_OPTIONS = ['Chennai', 'Salem', 'Madurai', 'Trichy'] as const;

export const DLP_CIRCLE_DIVISION_MAP: Record<string, string[]> = {
  Chennai: ['Vellore', 'Villupuram', 'Chennai', 'Kanchipuram'],
  Salem: ['Salem', 'Coimbatore', 'Gobichettipalayam'],
  Madurai: ['Madurai', 'Tirunelveli'],
  Trichy: ['Trichy', 'Thanjavur'],
};

export const ALL_DLP_DIVISIONS = [
  'Vellore',
  'Villupuram',
  'Madurai',
  'Trichy',
  'Salem',
  'Coimbatore',
  'Gobichettipalayam',
  'Chennai',
  'Kanchipuram',
  'Tirunelveli',
];

export function getCircleForDivision(divisionName: string): string | null {
  for (const [circle, divisions] of Object.entries(DLP_CIRCLE_DIVISION_MAP)) {
    if (divisions.some((d) => d.toLowerCase() === divisionName.toLowerCase())) {
      return circle;
    }
  }
  return null;
}
