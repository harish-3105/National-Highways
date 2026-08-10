// TypeScript definitions for Legal & Lawyer Fee Bill Data Entry, Workflow & Analysis Module

export type CircleType = string;
export type CasePertainsToType = 'GOTN' | 'MoRTH' | 'BOTH';
export type PaymentStatusType = 'Settled' | 'Not Settled';
export type GOStatusType = 'Yes' | 'No' | 'Not Required';
export type YesNoType = 'Yes' | 'No';

export interface ProposalMovementStatus {
  deToCe: boolean;
  seToCe: boolean;
  seToRorMorth: boolean;
}

export interface DirectMovementStatus {
  deToCe: boolean;
  seToCe: boolean;
}

export interface FeeBillRecord {
  id: number | string;
  // 1. Basic Fee Bill Information
  feeBillNumber: string;
  feeBillDate: string; // YYYY-MM-DD

  // 2. Circle and Division
  circle: CircleType;
  division: string;

  // 3. Lawyer / Law Officer Information
  lawyerName: string;
  lawyerDesignation: string;

  // 4. Case Information
  caseType: string;
  caseNumber: string;
  caseYear: string; // 4-digit string
  casePertainsTo: CasePertainsToType;

  // 5. Fee Bill Amount Details
  appearanceAmount: number;
  appearanceDate: string;
  conferenceAmount: number;
  conferenceDate: string;
  verifyingAmount: number;
  verifyingDate: string;
  assistanceAmount: number; // Auto-calculated: (1/3)*(Appearance + Conference + Verifying)
  assistanceDate: string;

  // 6. Total Fee Amount
  totalFeeAmount: number; // Auto-calculated: Appearance + Conference + Verifying + Assistance

  // 7. Assistant Information
  assistantName: string;
  assistantDesignation: string;

  // 8. Payment Status
  paymentStatus: PaymentStatusType;

  // 9. If Payment Status = SETTLED
  settledAmount?: number;
  itCess?: number;
  utrRbiReference?: string;
  paymentDate?: string;

  // 10. If Payment Status = NOT SETTLED -> G.O. Workflow
  goStatus?: GOStatusType;
  goNumber?: string;
  goDate?: string;
  paymentSanction?: YesNoType;
  proposalSubmitted?: YesNoType;

  // Proposal / Direct Movement Details
  proposalMovement?: ProposalMovementStatus;
  directMovement?: DirectMovementStatus;
  letterNumber?: string;
  letterDate?: string;

  // 11. System Computed Pendency
  currentPendency: string; // e.g., 'Settled', 'Pending with DE', 'Proposal Sent (DE to SE)', 'Pending at SE', 'Pending at CE', 'Pending at MoRTH', 'Sanction Pending'

  // Audit & Soft Delete
  delete_status?: string;
  isDeleted?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  auditLogs?: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  role: string;
  action: string; // 'Created' | 'Updated' | 'Soft Deleted' | 'Restored' | 'Status Changed'
  changes: {
    field: string;
    oldVal: any;
    newVal: any;
  }[];
}

export interface MasterCircleItem {
  id: string;
  name: string;
  active: boolean;
}

export interface MasterDivisionItem {
  id: string;
  circleName: string;
  name: string;
  active: boolean;
}

export interface FeeBillMasterDataConfig {
  circles: MasterCircleItem[];
  divisions: MasterDivisionItem[];
  lawyerDesignations: string[];
  caseTypes: string[];
}

export interface FeeBillFilterCriteria {
  searchTerm: string;
  feeBillNumber: string;
  circle: string;
  division: string;
  lawyerName: string;
  caseType: string;
  caseYear: string;
  casePertainsTo: string;
  paymentStatus: string;
  goStatus: string;
  paymentSanction: string;
  proposalSubmitted: string;
  pendencyStatus: string;
  feeBillDateFrom: string;
  feeBillDateTo: string;
  paymentDateFrom: string;
  paymentDateTo: string;
}
