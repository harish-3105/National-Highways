// Comprehensive TypeScript definitions for Module 1 & Module 2 Legal & Lawyer Portal

export type CircleType = 'Chennai' | 'Madurai' | 'Salem' | string;

export type CategoryType = 'Filed Against Department' | 'Filed By Department';

export type CasePertainsToType = 'GOTN' | 'MoRTH' | 'Both';

export type NatureOfCaseType = 'Work' | 'Tender' | 'Land Acquisition' | 'Encroachment' | 'Other';

export type ConvertedCategoryType = 'Appealed by Department' | 'Appealed by Other Party';

export type PetitionType = 'Review Petition' | 'Contempt Petition' | 'Execution Petition' | 'Special Leave Petition (SLP)' | 'Other';

export interface CounterAffidavitData {
  dateOfFiling: string;
  details: string;
  lastHearingDate: string;
  nextHearingDate: string;
}

export interface PostHearingData {
  actionBeforeNextHearing?: string;
  interimOrFinalOrder?: string;
  orderDate?: string;
  compliancePeriod?: string;
  endDateForCompliance?: string;
  statusOfActionTakenForCompliance?: string;
  eligibilityForAppeal?: 'Yes' | 'No';
  actionTakenForAppeal?: string;
}

export interface ConvertedCaseProceedingsData {
  enabled: boolean;
  category: ConvertedCategoryType;
  typeOfPetition: PetitionType;
  specifyPetitionType?: string;
  caseNumber: string;
  caseYear: string;
  state: 'Tamil Nadu';
  district: string;
  courtComplex: string;
  petitionerName: string;
  respondentName: string;
  briefOfPrayer: string;
  impugnedCaseNumber?: string;
  orderIssued?: string;
  orderDate?: string;
  caseDetailsPresentStatus: string;
  counterAffidavitFiled: 'Yes' | 'No';
  counterAffidavitData?: CounterAffidavitData;
  postHearingData?: PostHearingData;
  actionToTakeForCounterAffidavit?: string;
}

export interface CaseEntryFormData {
  id?: string;
  // Section 1 - Administrative Details
  circle: CircleType;
  division: string;

  // Section 2 - Case Information
  caseNumber: string;
  caseYear: string; // 4 digit string
  category: CategoryType;
  nameOfCourt: string;
  nameOfRespondent: string;
  casePertainsTo: CasePertainsToType;
  natureOfCase: NatureOfCaseType;
  specifyNatureOfCase?: string;
  briefOfPrayer: string;
  caseDetailsPresentStatus: string;

  // Counter Affidavit Filed toggle
  counterAffidavitFiled: 'Yes' | 'No';

  // If Counter Affidavit Filed = YES
  counterAffidavitData?: CounterAffidavitData;
  postHearingData?: PostHearingData;

  // If Counter Affidavit Filed = NO
  actionToTakeForCounterAffidavit?: string;

  // Module 2 - Converted Case Proceedings (Collapsible)
  convertedCase?: ConvertedCaseProceedingsData;

  // Metadata
  lawyerId?: string;
  lawyerName?: string;
  status?: 'PENDING' | 'ONGOING' | 'DISPOSED' | 'STAYED';
  createdAt?: string;
  updatedAt?: string;
}
