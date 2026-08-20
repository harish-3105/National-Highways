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
  paymentStatuses: ['Settled', 'Not Settled'],
};

export const SAMPLE_FEE_BILLS: FeeBillRecord[] = [];

// Helper function to calculate assistance fee
export function calculateAssistanceAmount(
  appearance: number,
  conference: number,
  verifying: number
): number {
  const app = Number(appearance) || 0;
  const conf = Number(conference) || 0;
  const ver = Number(verifying) || 0;
  if (app < 0 || conf < 0 || ver < 0) return 0;
  return Math.round(((app + conf + ver) / 3) * 100) / 100;
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
  if (bill.paymentStatus === 'Settled') {
    return 'Settled';
  }

  // Not Settled
  if (bill.goStatus === 'Yes') {
    if (bill.proposalSubmitted === 'No') {
      return 'Pending with DE';
    }
    if (bill.proposalSubmitted === 'Yes') {
      const pm = bill.proposalMovement;
      if (pm?.seToRorMorth) {
        return 'Pending at MoRTH';
      }
      if (pm?.seToCe) {
        return 'Pending at CE';
      }
      if (pm?.deToCe) {
        return 'Pending at SE';
      }
      return 'Proposal Sent (DE to SE)';
    }
    return 'Pending with DE';
  }

  if (bill.goStatus === 'No') {
    const dm = bill.directMovement;
    if (dm?.seToCe) {
      return 'Pending at CE';
    }
    if (dm?.deToCe) {
      return 'Proposal Sent (DE to SE)';
    }
    return 'Pending with DE';
  }

  if (bill.goStatus === 'Not Required') {
    if (bill.proposalSubmitted === 'Yes') {
      const pm = bill.proposalMovement;
      if (pm?.seToRorMorth) return 'Pending at MoRTH';
      if (pm?.seToCe) return 'Pending at CE';
      if (pm?.deToCe) return 'Pending at SE';
      return 'Proposal Sent (DE to SE)';
    }
    if (bill.paymentSanction === 'Yes') {
      return 'Sanction Pending';
    }
    return 'Pending with DE';
  }

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
