import { FeeBillMasterDataConfig, FeeBillRecord } from '@/types/feeBill';

export const DEFAULT_MASTER_DATA: FeeBillMasterDataConfig = {
  circles: [
    { id: 'c1', name: 'Chennai', active: true },
    { id: 'c2', name: 'Madurai', active: true },
    { id: 'c3', name: 'Salem', active: true },
    { id: 'c4', name: 'Tiruchirappalli', active: true },
    { id: 'c5', name: 'Coimbatore', active: true },
  ],
  divisions: [
    // Chennai Circle
    { id: 'd1', circleName: 'Chennai', name: 'Chennai City Division', active: true },
    { id: 'd2', circleName: 'Chennai', name: 'Chengalpattu Division', active: true },
    { id: 'd3', circleName: 'Chennai', name: 'Tiruvallur Division', active: true },
    // Madurai Circle
    { id: 'd4', circleName: 'Madurai', name: 'Madurai Division', active: true },
    { id: 'd5', circleName: 'Madurai', name: 'Dindigul Division', active: true },
    { id: 'd6', circleName: 'Madurai', name: 'Theni Division', active: true },
    // Salem Circle
    { id: 'd7', circleName: 'Salem', name: 'Salem Division', active: true },
    { id: 'd8', circleName: 'Salem', name: 'Namakkal Division', active: true },
    { id: 'd9', circleName: 'Salem', name: 'Dharmapuri Division', active: true },
    // Tiruchirappalli Circle
    { id: 'd10', circleName: 'Tiruchirappalli', name: 'Trichy City Division', active: true },
    { id: 'd11', circleName: 'Tiruchirappalli', name: 'Thanjavur Division', active: true },
    // Coimbatore Circle
    { id: 'd12', circleName: 'Coimbatore', name: 'Coimbatore Urban Division', active: true },
    { id: 'd13', circleName: 'Coimbatore', name: 'Erode Division', active: true },
  ],
  lawyerDesignations: [
    'Senior Advocate',
    'Additional Advocate General',
    'Government Pleader',
    'Special Government Pleader',
    'Government Advocate',
    'Standing Counsel',
    'Junior Counsel',
  ],
  caseTypes: [
    'Writ Petition (WP)',
    'Writ Appeal (WA)',
    'Special Leave Petition (SLP)',
    'Land Acquisition Original Petition (LAOP)',
    'Arbitration Case',
    'Contractor Dispute',
    'Public Interest Litigation (PIL)',
    'Civil Miscellaneous Appeal (CMA)',
  ],
  casePertainsTo: ['GOTN', 'MoRTH', 'BOTH'],
  paymentStatuses: ['Not Settled', 'Settled'],
  statusOfObtainingGoOptions: [
    'Proposal Submitted to CE',
    'Proposal Submitted to Government',
    'Draft G.O. Under Scrutiny',
    'Clarification Sought',
    'G.O. Obtained',
  ],
  statusOfPaymentProposalOptions: [
    'Proposal Under Preparation',
    'Pending with DE',
    'Proposal Submitted to CE',
    'Sanction Order Awaited',
    'Payment Sanction',
  ],
  goStatusOptions: ['Yes', 'No', 'Not Required'],
  yesNoOptions: ['Yes', 'No'],
};

export const SAMPLE_FEE_BILLS: FeeBillRecord[] = [];

// Helper function to calculate assistance fee (1/3 of appearance fee only)
export function calculateAssistanceAmount(
  appearance: number,
  _conference?: number,
  _verifying?: number
): number {
  const app = Number(appearance) || 0;
  if (app < 0) return 0;
  return Math.round((app / 3) * 100) / 100;
}

// Helper function to calculate total fee
export function calculateTotalFeeAmount(
  appearance: number,
  conference: number,
  verifying: number,
  assistance: number
): number {
  const app = Number(appearance) || 0;
  const conf = Number(conference) || 0;
  const ver = Number(verifying) || 0;
  const ast = Number(assistance) || 0;
  return Math.round((app + conf + ver + ast) * 100) / 100;
}

// Helper function to derive automatic pendency stage
export function derivePendencyStage(bill: Partial<FeeBillRecord>): string {
  if (bill.paymentStatus === 'Settled' || (bill.settledAmount && bill.settledAmount > 0 && bill.utrRbiReference)) {
    return 'Settled';
  }

  if (bill.isSanctioned === 'Yes') {
    return 'Payment Sanctioned';
  }

  if (bill.statusOfPaymentProposal) {
    return bill.statusOfPaymentProposal;
  }

  if (bill.goStatus === 'Yes') {
    if (bill.statusOfObtainingGo === 'G.O. Obtained') {
      return 'G.O. Obtained';
    }
    if (bill.statusOfObtainingGo) {
      return bill.statusOfObtainingGo;
    }
    if (bill.goNumber) {
      return 'G.O. Obtained';
    }
  }

  // Legacy fallback support
  if (bill.proposalMovement?.seToRorMorth) return 'Pending at MoRTH';
  if (bill.proposalMovement?.seToCe || bill.directMovement?.seToCe) return 'Pending at CE';
  if (bill.proposalMovement?.deToCe || bill.directMovement?.deToCe) return 'Pending at SE';

  return 'Pending with DE';
}

// INR Currency Formatter helper
export function formatINR(val: number | string | undefined): string {
  const num = Number(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}
