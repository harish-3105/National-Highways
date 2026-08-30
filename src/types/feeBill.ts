// TypeScript definitions for Legal & Lawyer Fee Bill Data Entry, Workflow & Analysis Module

export type CircleType = string;
export type CasePertainsToType = 'GOTN' | 'MoRTH' | 'BOTH';
export type PaymentStatusType = 'Settled' | 'Pending' | 'Not Settled';
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
  receiptDate?: string; // Date of receipt of fee bill in concerned office (YYYY-MM-DD)

  // 2. Circle and Division
  circle: CircleType;
  division: string;

  // 3. Lawyer / Law Officer Information
  lawyerName: string;
  lawyerDesignation: string;

  // 4. Case Information
  caseDetails: string; // Unified open text field (e.g. WP 1234/2023)
  casePertainsTo: CasePertainsToType;

  // 5. Fee Bill Amount Details
  appearanceAmount: number;
  appearanceDate: string;
  conferenceAmount: number;
  conferenceDate: string;
  verifyingAmount: number;
  verifyingDate: string;
  assistanceAmount: number; // Auto-calculated: (1/3)*(Appearance)
  assistanceDate: string;

  // 6. Total Fee Amount
  totalFeeAmount: number; // Auto-calculated: Appearance + Conference + Verifying + Assistance

  // 7. Assistant Information
  assistantName: string;
  assistantDesignation: string;

  // 8. Payment Status
  paymentStatus: PaymentStatusType;

  // 9. If Payment Status = SETTLED (Main Lawyer Disbursement)
  settledAmount?: number;
  itCess?: number;
  amountDeposited?: number; // amountDeposited = settledAmount - itCess
  utrRbiReference?: string;
  paymentDate?: string;

  // 9b. Assistant Payment & Settlement Record (Separate Payment for Assistant)
  assistantSettledAmount?: number;
  assistantItCess?: number;
  assistantAmountDeposited?: number; // assistantAmountDeposited = assistantSettledAmount - assistantItCess
  assistantUtrRbiReference?: string;
  assistantPaymentDate?: string;
  assistantPaymentStatus?: PaymentStatusType;

  // 10. G.O. Workflow
  goStatus?: GOStatusType;
  statusOfObtainingGo?: string; // e.g., 'G.O. Obtained', 'Proposal Under Process', 'Submitted to Government'
  goNumber?: string;
  goDate?: string;
  goReferenceLetterNo?: string;
  goReferenceLetterDate?: string;
  paymentSanction?: YesNoType;
  proposalSubmitted?: YesNoType;

  // 11. Payment Proposal Workflow
  statusOfPaymentProposal?: string; // e.g., 'Payment Sanction', 'Proposal Under Process', 'Pending with DE'
  proceedingLetterNo?: string;
  proceedingLetterDate?: string;
  sanctionedAmount?: number;
  isSanctioned?: YesNoType; // 'Yes' | 'No'

  // Proposal / Direct Movement Details (Legacy support)
  proposalMovement?: ProposalMovementStatus;
  directMovement?: DirectMovementStatus;
  letterNumber?: string;
  letterDate?: string;

  // 12. System Computed Pendency
  currentPendency: string; // e.g., 'Settled', 'Payment Sanctioned', 'G.O. Obtained', 'Pending with DE'

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
    oldVal: unknown;
    newVal: unknown;
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
  assistantDesignations?: string[];
  caseTypes: string[];
  casePertainsTo: string[];
  paymentStatuses: string[];
  statusOfObtainingGoOptions?: string[];
  statusOfPaymentProposalOptions?: string[];
  goStatusOptions?: string[];
  yesNoOptions?: string[];
}

export interface FeeBillFilterCriteria {
  searchTerm: string;
  feeBillNumber: string;
  circle: string;
  division: string;
  lawyerName: string;
  caseDetails?: string;
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
