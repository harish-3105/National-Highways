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
};

export const SAMPLE_FEE_BILLS: FeeBillRecord[] = [
  {
    id: 'fb-101',
    feeBillNumber: 'FB-CHN-2024-001',
    feeBillDate: '2024-03-15',
    circle: 'Chennai',
    division: 'Chennai City Division',
    lawyerName: 'Thiru. R. Shunmugasundaram',
    lawyerDesignation: 'Senior Advocate',
    caseType: 'Writ Petition (WP)',
    caseNumber: 'WP 18452/2024',
    caseYear: '2024',
    casePertainsTo: 'GOTN',
    appearanceAmount: 15000,
    appearanceDate: '2024-03-10',
    conferenceAmount: 6000,
    conferenceDate: '2024-03-12',
    verifyingAmount: 3000,
    verifyingDate: '2024-03-14',
    assistanceAmount: 8000,
    assistanceDate: '2024-03-14',
    totalFeeAmount: 32000,
    assistantName: 'K. Vignesh',
    assistantDesignation: 'Junior Advocate',
    paymentStatus: 'Settled',
    settledAmount: 32000,
    itCess: 3200,
    utrRbiReference: 'RBI-UTR-2024041009823',
    paymentDate: '2024-04-10',
    currentPendency: 'Settled',
    delete_status: 'ACTIVE',
    isDeleted: false,
    createdBy: 'System Admin',
    createdAt: '2024-03-15T10:00:00Z',
    updatedBy: 'Finance Officer',
    updatedAt: '2024-04-10T14:30:00Z',
    auditLogs: [
      {
        id: 'log-1',
        timestamp: '2024-03-15T10:00:00Z',
        performedBy: 'System Admin',
        role: 'ADMIN',
        action: 'Created',
        changes: [{ field: 'Payment Status', oldVal: null, newVal: 'Not Settled' }],
      },
      {
        id: 'log-2',
        timestamp: '2024-04-10T14:30:00Z',
        performedBy: 'Finance Officer',
        role: 'OFFICER',
        action: 'Status Changed',
        changes: [
          { field: 'Payment Status', oldVal: 'Not Settled', newVal: 'Settled' },
          { field: 'Settled Amount', oldVal: 0, newVal: 32000 },
        ],
      },
    ],
  },
  {
    id: 'fb-102',
    feeBillNumber: 'FB-MDU-2024-045',
    feeBillDate: '2024-05-20',
    circle: 'Madurai',
    division: 'Madurai Division',
    lawyerName: 'Tmt. P. Veena Suresh',
    lawyerDesignation: 'Government Advocate',
    caseType: 'Writ Appeal (WA)',
    caseNumber: 'WA 942/2023',
    caseYear: '2023',
    casePertainsTo: 'MoRTH',
    appearanceAmount: 12000,
    appearanceDate: '2024-05-05',
    conferenceAmount: 4500,
    conferenceDate: '2024-05-10',
    verifyingAmount: 1500,
    verifyingDate: '2024-05-18',
    assistanceAmount: 6000,
    assistanceDate: '2024-05-18',
    totalFeeAmount: 24000,
    assistantName: 'S. Raman',
    assistantDesignation: 'Legal Assistant',
    paymentStatus: 'Not Settled',
    goStatus: 'Yes',
    goNumber: 'G.O. (Ms) No. 142/HW/2024',
    goDate: '2024-06-01',
    paymentSanction: 'Yes',
    proposalSubmitted: 'Yes',
    proposalMovement: {
      deToCe: true,
      seToCe: true,
      seToRorMorth: false,
    },
    letterNumber: 'Lr. No. 4902/Legal/2024',
    letterDate: '2024-06-15',
    currentPendency: 'Pending at CE',
    delete_status: 'ACTIVE',
    isDeleted: false,
    createdBy: 'Madurai DE User',
    createdAt: '2024-05-20T11:20:00Z',
    updatedBy: 'Madurai DE User',
    updatedAt: '2024-06-15T09:15:00Z',
    auditLogs: [],
  },
  {
    id: 'fb-103',
    feeBillNumber: 'FB-SLM-2024-012',
    feeBillDate: '2024-06-10',
    circle: 'Salem',
    division: 'Salem Division',
    lawyerName: 'Thiru. E.C. Ramesh',
    lawyerDesignation: 'Special Government Pleader',
    caseType: 'Land Acquisition Original Petition (LAOP)',
    caseNumber: 'LAOP 45/2022',
    caseYear: '2022',
    casePertainsTo: 'GOTN',
    appearanceAmount: 18000,
    appearanceDate: '2024-05-28',
    conferenceAmount: 7500,
    conferenceDate: '2024-06-02',
    verifyingAmount: 4500,
    verifyingDate: '2024-06-08',
    assistanceAmount: 10000,
    assistanceDate: '2024-06-08',
    totalFeeAmount: 40000,
    assistantName: 'M. Kavitha',
    assistantDesignation: 'Junior Counsel',
    paymentStatus: 'Settled',
    settledAmount: 40000,
    itCess: 4000,
    utrRbiReference: 'RBI-UTR-2024070211045',
    paymentDate: '2024-07-02',
    currentPendency: 'Settled',
    delete_status: 'ACTIVE',
    isDeleted: false,
    createdBy: 'Salem User',
    createdAt: '2024-06-10T09:40:00Z',
    updatedBy: 'Finance Officer',
    updatedAt: '2024-07-02T16:00:00Z',
    auditLogs: [],
  },
  {
    id: 'fb-104',
    feeBillNumber: 'FB-CBE-2024-088',
    feeBillDate: '2024-07-01',
    circle: 'Coimbatore',
    division: 'Coimbatore Urban Division',
    lawyerName: 'Thiru. K.V. Muthu Kumar',
    lawyerDesignation: 'Standing Counsel',
    caseType: 'Arbitration Case',
    caseNumber: 'ARB 108/2024',
    caseYear: '2024',
    casePertainsTo: 'BOTH',
    appearanceAmount: 25000,
    appearanceDate: '2024-06-20',
    conferenceAmount: 10000,
    conferenceDate: '2024-06-25',
    verifyingAmount: 5000,
    verifyingDate: '2024-06-29',
    assistanceAmount: 13333.33,
    assistanceDate: '2024-06-29',
    totalFeeAmount: 53333.33,
    assistantName: 'R. Karthik',
    assistantDesignation: 'Junior Advocate',
    paymentStatus: 'Not Settled',
    goStatus: 'Yes',
    goNumber: 'G.O. (Ms) No. 201/HW/2024',
    goDate: '2024-07-15',
    paymentSanction: 'No',
    proposalSubmitted: 'Yes',
    proposalMovement: {
      deToCe: true,
      seToCe: true,
      seToRorMorth: true,
    },
    letterNumber: 'Lr. No. 8102/Cbe/2024',
    letterDate: '2024-07-22',
    currentPendency: 'Pending at MoRTH',
    delete_status: 'ACTIVE',
    isDeleted: false,
    createdBy: 'Coimbatore User',
    createdAt: '2024-07-01T14:10:00Z',
    updatedBy: 'Coimbatore User',
    updatedAt: '2024-07-22T11:45:00Z',
    auditLogs: [],
  },
  {
    id: 'fb-105',
    feeBillNumber: 'FB-SLM-2024-099',
    feeBillDate: '2024-07-15',
    circle: 'Salem',
    division: 'Namakkal Division',
    lawyerName: 'Tmt. S. Anitha',
    lawyerDesignation: 'Government Pleader',
    caseType: 'Public Interest Litigation (PIL)',
    caseNumber: 'PIL 304/2023',
    caseYear: '2023',
    casePertainsTo: 'GOTN',
    appearanceAmount: 9000,
    appearanceDate: '2024-07-01',
    conferenceAmount: 3000,
    conferenceDate: '2024-07-05',
    verifyingAmount: 1500,
    verifyingDate: '2024-07-10',
    assistanceAmount: 4500,
    assistanceDate: '2024-07-10',
    totalFeeAmount: 18000,
    assistantName: 'S. Nithya',
    assistantDesignation: 'Legal Assistant',
    paymentStatus: 'Not Settled',
    goStatus: 'No',
    directMovement: {
      deToCe: true,
      seToCe: false,
    },
    letterNumber: 'Lr. No. 3021/Namakkal/2024',
    letterDate: '2024-07-18',
    paymentSanction: 'No',
    proposalSubmitted: 'Yes',
    currentPendency: 'Proposal Sent (DE to SE)',
    delete_status: 'ACTIVE',
    isDeleted: false,
    createdBy: 'Namakkal User',
    createdAt: '2024-07-15T11:00:00Z',
    updatedBy: 'Namakkal User',
    updatedAt: '2024-07-18T14:20:00Z',
    auditLogs: [],
  },
];

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
