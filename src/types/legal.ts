// Comprehensive TypeScript definitions for Legal Cases & Court Proceedings Management System

export type CaseClassificationType = 'Normal Case' | 'Appeal Case';
export type YesNoType = 'Yes' | 'No' | string;
export type GPOpinionType = 'Opinion Pending' | 'Recommended for Appeal' | 'Not Recommended for Appeal' | 'Not Required' | string;
export type ComplianceStatusType = 'Complied' | 'Pending' | string;

export type CircleType = string;
export type CasePertainsToType = 'GOTN' | 'MoRTH' | 'Both' | 'NHAI' | string;
export type NatureOfCaseType = string;

// Section A: Appeal Case Information (Only when Case Type = 'Appeal Case')
export interface AppealCaseInformation {
  appealCaseDetails: string; // Unified open text field (e.g. WA 123/2024)
  appellateCourt: string; // e.g. High Court of Madras (Division Bench, Chennai)
  appealFilingDate: string; // Date field YYYY-MM-DD
  limitationDueDate: string; // Date field YYYY-MM-DD
  delayInFilingAppeal: YesNoType; // Auto-calculated Yes/No (Appeal Filing Date > Limitation / Due Date)
  delayPeriodDays: number; // Auto-calculated number of days
  condonationOfDelay: string; // Dropdown: Pending, Allowed, Dismissed, Not Applicable
}

// Master Legal Case Data Model
export interface LegalCaseData {
  id?: string;

  // 0. Top Level Case Classification
  caseClassification: CaseClassificationType; // 'Normal Case' | 'Appeal Case'

  // A. Appeal Case Information (Present only if caseClassification === 'Appeal Case')
  appealInfo?: AppealCaseInformation;

  // B.1. Case Information (Stage 1: Registry)
  caseDetails: string; // Unified open text field (e.g. WP 1234/2023)
  circle: CircleType; // Dropdown: Chennai, Salem, Madurai, etc.
  division: string; // Dropdown: Cascading division
  appealCaseDetails?: string; // Dedicated column for appeal cases
  category?: string; // Optional legacy column
  nameOfCourt: string; // Dropdown: High Court of Madras, Madurai Bench, District Court, etc.
  petitionerNames: string; // Text field (Name of Petitioner(s))
  respondentNames: string; // Text field (Name of Respondent(s))
  casePertainsTo: CasePertainsToType; // Dropdown: GOTN | MoRTH | Both | NHAI
  natureOfCase: NatureOfCaseType; // Dropdown
  specifyNatureOfCase?: string; // Custom description when natureOfCase = 'Others'
  briefOfPrayer: string; // Textarea (Brief summary of prayer/pleadings)

  // B.1.5. Base / Original Case Information (Stage 2 for Appeal Cases)
  baseCircle?: CircleType; // Dropdown: Chennai, Salem, Madurai, etc.
  baseDivision?: string; // Dropdown: Cascading division
  baseCourtName?: string; // Dropdown / Text: Original Court Name
  baseCaseDetails?: string; // Unified open text field (e.g. WP 1234/2023)
  basePetitionerNames?: string; // Text field: Original Petitioner(s)
  baseRespondentNames?: string; // Text field: Original Respondent(s)
  baseCasePertainsTo?: CasePertainsToType; // Dropdown: GOTN | MoRTH | Both | NHAI
  baseNatureOfCase?: NatureOfCaseType; // Dropdown
  baseBriefOfPrayer?: string; // Textarea: Original Prayer
  linkedBaseCaseId?: string; // Foreign key / ID of the linked original case in legal_cases

  // B.2. Counter Affidavit (CA) & Financial Implication
  caRequired: YesNoType; // Dropdown: Yes | No | Not Required
  caFiled: YesNoType; // Dropdown: Yes | No | Under Preparation
  caDueDate?: string; // Date field (YYYY-MM-DD)
  caFiledDate?: string; // Date field (YYYY-MM-DD)
  financialImplication?: string | number; // Numeric currency input (in ₹)

  // B.3. Hearing Schedule & Present Status (Stage 3)
  presentStage: string; // Dropdown: Notice / Admission, Arguments, Disposed, etc.
  currentStatus: string; // Dropdown: Pending | Disposed | Stay Granted | Interim Order
  lastHearingDate?: string; // Date field (YYYY-MM-DD)
  nextHearingDate?: string; // Date field (YYYY-MM-DD)
  nextListingPurpose?: string; // Text field

  // B.4. Interim Orders & Compliance (Stage 4)
  interimOrderDirection?: string; // Text field
  interimOrderDate?: string; // Date field (YYYY-MM-DD)
  complianceRequired: YesNoType; // Dropdown: Yes | No | Not Applicable
  complianceAction?: string; // Text field
  compliancePeriod?: string; // Text field (e.g. 8 weeks, 3 months)
  complianceEndDate?: string; // Date field (YYYY-MM-DD)
  actionTakenDetailsForCompliance?: string; // Text field
  complianceStatus?: ComplianceStatusType; // Dropdown: Complied | Pending
  remarks?: string; // Text field

  // B.5. Disposal & Appeal Track (Stage 5)
  finalResult: YesNoType; // Dropdown: Yes | No (Concluded / Disposed?)
  finalResultOrder?: string; // Text field (Final Order details)
  finalOrderDate?: string; // Date field (YYYY-MM-DD)
  adverseToDepartment: YesNoType; // Dropdown: Yes | No | Neutral
  gpOpinion: GPOpinionType; // Dropdown: Opinion Pending | Recommended for Appeal | Not Recommended for Appeal | Not Required
  appealFiled: YesNoType; // Dropdown: Yes | No | Under Proposal
  appealFiledDate?: string; // Date field (YYYY-MM-DD)
  linkedAppealCaseId?: string; // ID of the linked appeal case if generated
  finalOrderRemarks?: string; // Text field (Final Judgment Summary & Remarks)

  // System & Audit Metadata
  latestOrderFinalOrder?: string;
  latestOrderDate?: string;
  finalOrderComplianceActionGiven?: string;
  finalOrderComplianceAction?: YesNoType;
  finalOrderCompliancePeriod?: string;
  finalOrderComplianceEndDate?: string;
  finalOrderComplianceActionTaken?: string;
  finalOrderComplianceStatus?: ComplianceStatusType;
  lawyerId?: string;
  lawyerName?: string;
  delete_status?: string;
  isDeleted?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// Backward-compatible alias for existing components
export type CaseEntryFormData = LegalCaseData;
