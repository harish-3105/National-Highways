export enum UserRole {
  ADMIN = 'ADMIN',
  DIVISION = 'DIVISION',
  SUB_DIVISION = 'SUB_DIVISION',
}

export enum HighwayStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  CLOSED = 'CLOSED',
}

export enum RoadConfiguration {
  TWO_LANE = 'TWO_LANE',
  TWO_LANE_PAVED_SHOULDER = 'TWO_LANE_PAVED_SHOULDER',
  FOUR_LANE = 'FOUR_LANE',
  FOUR_LANE_PAVED_SHOULDER = 'FOUR_LANE_PAVED_SHOULDER',
  SIX_LANE = 'SIX_LANE',
  SIX_LANE_PAVED_SHOULDER = 'SIX_LANE_PAVED_SHOULDER',
  EIGHT_LANE = 'EIGHT_LANE',
}

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: UserRole
  parentId: number | null
  officeName: string
  officeCode: string
}

export interface Highway {
  id: number
  roadName: string
  roadCode: string
  fromLocation: string
  toLocation: string
  fromChainage: string
  toChainage: string
  configuration: RoadConfiguration
  startLatitude: number
  startLongitude: number
  endLatitude: number
  endLongitude: number
  lengthKm: number
  status: HighwayStatus
  geometry: {
    type: string
    coordinates: number[][]
  }
  divisionId?: number
  divisionName?: string
  subDivisionId?: number
  subDivisionName?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  parentHighwayId?: number
  sectionNumber?: number
  isParent?: boolean
  sections?: Highway[]
}

// ---------------- Sample Data Module Extensions ----------------

export interface DLPContract {
  id: number
  highwayId: number
  highwayCode: string
  stretchName: string
  fromKm: number
  toKm: number
  lengthKm: number
  contractorName: string
  contractMode: 'EPC' | 'STMC' | 'PBMC' | 'Annual Plan'
  workDescription: string
  docDate: string // YYYY-MM-DD
  dlpExpiryDate: string // YYYY-MM-DD
  daysRemaining: number
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'COMPLETED'
  divisionId?: number
  divisionName?: string
  subDivisionId?: number
  subDivisionName?: string
}

export interface HighwayChainage {
  id: number
  highwayId: number
  highwayCode: string
  chainageKm: number
  townName?: string
  trafficPcu?: number
  rowWidth?: string
  carriagewaySpec?: string
  remarks?: string
  activeWorkDesc?: string
}

export interface AccidentBlackspot {
  id: number
  highwayId: number
  highwayCode: string
  chainageKm: number
  locationName: string
  latitude: number
  longitude: number
  severity: 'FATAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  accidentsCount: number
  fatalitiesCount: number
  injuriesCount: number
  accidentDate: string
  timeOfDay: 'DAYTIME' | 'NIGHTTIME'
  weatherCondition: 'CLEAR' | 'MONSOON' | 'FOG'
  divisionId?: number
  divisionName?: string
  subDivisionId?: number
  subDivisionName?: string
}

export interface Lawyer {
  id: number
  name: string
  barCouncilNo: string
  email: string
  phone: string
  specialization: string
  officeAddress?: string
  assignedSubDivisionId?: number
  assignedSubDivisionName?: string
  activeCaseCount?: number
}

export interface LegalCase {
  id: number
  caseNumber: string
  title: string
  courtName: string // Supreme Court, High Court, NGT, Arbitral Tribunal, District Court
  caseType: string // Land Acquisition, Arbitration, Environmental, Contractor Claim, Public Interest
  status: 'PENDING' | 'ONGOING' | 'DISPOSED' | 'STAYED'
  petitioner: string
  respondent: string
  lawyerId?: number
  lawyerName?: string
  divisionId?: number
  divisionName?: string
  subDivisionId?: number
  subDivisionName?: string
  nextHearingDate?: string
  summary?: string
  createdAt?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: any[]
}
