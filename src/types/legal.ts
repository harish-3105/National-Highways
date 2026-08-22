// Comprehensive TypeScript definitions for Legal Cases & Court Proceedings Management System

export type CaseClassificationType = 'Normal Case' | 'Appeal Case';
export type YesNoType = 'Yes' | 'No';
export type GPOpinionType = 'Pending' | 'Not Recommended' | 'Recommended' | 'Not Required';
export type ComplianceStatusType = 'Complied' | 'Pending';

export type CircleType = 'Chennai' | 'Madurai' | 'Salem' | 'Coimbatore' | 'Tirunelveli' | 'Villupuram' | string;
export type CategoryType = 'Filed Against Department' | 'Filed By Department' | string;
export type CasePertainsToType = 'GOTN' | 'MoRTH' | 'Both' | 'NHAI' | string;
export type NatureOfCaseType = 'Work' | 'Tender' | 'Land Acquisition' | 'Encroachment' | 'Arbitration' | 'Service Matter' | 'Other' | string;

// Section A: Appeal Case Information (Only when Case Type = 'Appeal Case')
export interface AppealCaseInformation {
  appealLevel: string; // e.g. Single Bench to Division Bench, District Court to High Court, High Court to Supreme Court
  appealCaseType: string; // e.g. WA, CMA, AS, SLP, Review Petition
  appealCaseNumber: string; // e.g. WA 123/2024
  appealYear: string; // 4-digit Year (e.g. 2024)
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

  // B.1. Case Information
  caseType: string; // Dropdown: WP, WA, CMA, OS, AS, CRP, Contempt, etc.
  circle: CircleType; // Dropdown: Chennai, Salem, Madurai, etc.
  division: string; // Dropdown: Cascading division
  caseNumber: string; // Text field (e.g. WP 1234/2023)
  caseYear: string; // 4-digit Year string (e.g. 2023)
  category: CategoryType; // Dropdown: Filed Against Department | Filed By Department
  nameOfCourt: string; // Dropdown: High Court of Madras, Madurai Bench, District Court, etc.
  petitionerNames: string; // Text field (Name of Petitioner(s))
  respondentNames: string; // Text field (Name of Respondent(s))
  casePertainsTo: CasePertainsToType; // Dropdown: GOTN | MoRTH | Both | NHAI
  natureOfCase: NatureOfCaseType; // Dropdown: Work | Tender | Land Acquisition | Encroachment | Other
  specifyNatureOfCase?: string; // Optional custom description
  briefOfPrayer: string; // Textarea (Brief summary of prayer/pleadings)
  financialImplication?: string; // Text field (e.g. ₹ 4.5 Cr, Compensation amount)
  presentStage: string; // Dropdown: Notice / Admission, Counter Affidavit Pending, Arguments, Disposed, etc.
  currentStatus: string; // Dropdown: Pending | Disposed | Stay Granted | Interim Order

  // B.2. Counter Affidavit (CA) Information
  caRequired: YesNoType; // Dropdown: Yes | No
  caFiled: YesNoType; // Dropdown: Yes | No
  caDueDate?: string; // Date field (YYYY-MM-DD)
  caFiledDate?: string; // Date field (YYYY-MM-DD, Conditional: CA Filed = Yes)

  // B.3. Hearing & Orders
  lastHearingDate?: string; // Date field (YYYY-MM-DD, Optional)
  nextHearingDate?: string; // Date field (YYYY-MM-DD, Optional)
  nextListingPurpose?: string; // Text field (Optional)
  interimOrderDirection?: string; // Text field (Details of interim order/stay)
  interimOrderDate?: string; // Date field (YYYY-MM-DD)
  latestOrderFinalOrder?: string; // Text field (Details of latest/final order)
  latestOrderDate?: string; // Date field (YYYY-MM-DD)

  // B.4. Compliance (General / Interim)
  complianceRequired: YesNoType; // Dropdown: Yes | No
  complianceAction?: string; // Text field
  compliancePeriod?: string; // Text field (e.g. 8 weeks, 3 months)
  complianceEndDate?: string; // Date field (YYYY-MM-DD, Optional)
  actionTakenDetailsForCompliance?: string; // Text field
  complianceStatus?: ComplianceStatusType; // Dropdown: Complied | Pending
  remarks?: string; // Text field (Optional)

  // B.5. Final Result
  finalResult: YesNoType; // Dropdown: Yes | No (Concluded / Disposed?)
  finalResultOrder?: string; // Text field
  finalOrderDate?: string; // Date field (YYYY-MM-DD)
  adverseToDepartment: YesNoType; // Dropdown: Yes | No
  gpOpinion: GPOpinionType; // Dropdown: Pending | Not Recommended | Recommended | Not Required

  // B.6. Appeal
  appealFiled: YesNoType; // Dropdown: Yes | No
  appealFiledDate?: string; // Date field (YYYY-MM-DD, Conditional: Appeal Filed = Yes)
  linkedAppealCaseId?: string; // ID of the linked appeal case if generated

  // B.7. Final-Order Compliance
  finalOrderComplianceActionGiven?: string; // Text field: Compliance Action Given in Final Order
  finalOrderComplianceAction?: YesNoType; // Dropdown: Yes | No
  finalOrderCompliancePeriod?: string; // Text field: e.g. 12 weeks
  finalOrderComplianceEndDate?: string; // Date field (YYYY-MM-DD, Optional)
  finalOrderComplianceActionTaken?: string; // Text field: Details of compliance action taken
  finalOrderComplianceStatus?: ComplianceStatusType; // Dropdown: Complied | Pending
  finalOrderRemarks?: string; // Text field (Optional)

  // System & Audit Metadata
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
