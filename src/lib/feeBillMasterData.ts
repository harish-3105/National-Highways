import { FeeBillMasterDataConfig, FeeBillRecord } from '@/types/feeBill';

export const EMPTY_MASTER_DATA: FeeBillMasterDataConfig = {
  circles: [],
  divisions: [],
  lawyerDesignations: [],
  assistantDesignations: [],
  caseTypes: [],
  casePertainsTo: [],
  paymentStatuses: [],
  statusOfObtainingGoOptions: [],
  statusOfPaymentProposalOptions: [],
  goStatusOptions: [],
  yesNoOptions: [],
};

export const DEFAULT_MASTER_DATA: FeeBillMasterDataConfig = EMPTY_MASTER_DATA;

export const SAMPLE_FEE_BILLS: FeeBillRecord[] = [];

// Helper function to calculate assistance fee (1/3 of appearance fee only)
export function calculateAssistanceAmount(appearance: number): number {
  const app = Number(appearance) || 0;
  if (app < 0) return 0;
  return Math.round((app / 3) * 100) / 100;
}

// Helper function to calculate Lawyer-only fee (Excluding assistant fee)
export function calculateLawyerClaimAmount(
  appearance: number,
  conference: number,
  verifying: number
): number {
  const app = Number(appearance) || 0;
  const conf = Number(conference) || 0;
  const ver = Number(verifying) || 0;
  return Math.max(0, app) + Math.max(0, conf) + Math.max(0, ver);
}

// Helper function to calculate total claim amount
export function calculateTotalFeeAmount(
  appearance: number,
  conference: number,
  verifying: number,
  assistance: number
): number {
  const app = Number(appearance) || 0;
  const conf = Number(conference) || 0;
  const ver = Number(verifying) || 0;
  const asst = Number(assistance) || 0;
  return Math.max(0, app) + Math.max(0, conf) + Math.max(0, ver) + Math.max(0, asst);
}

// Helper function to format INR Currency
export function formatINR(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '₹0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

// Helper function to format Date (DD/MM/YYYY)
export function formatDateDMY(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) return clean;
    const d = new Date(clean);
    if (isNaN(d.getTime())) return clean;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Helper function to derive pendency stage
export function derivePendencyStage(bill: Partial<FeeBillRecord>): string {
  if (bill.paymentStatus === 'Settled') return 'Settled';
  if (bill.statusOfPaymentProposal) return bill.statusOfPaymentProposal;
  if (bill.isSanctioned === 'Yes' || bill.paymentSanction === 'Yes') return 'Payment Sanction';
  if (bill.goStatus === 'Yes' && bill.statusOfObtainingGo) return `G.O. - ${bill.statusOfObtainingGo}`;
  return 'Pending with DE';
}

