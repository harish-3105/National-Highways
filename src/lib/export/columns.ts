/**
 * Unified Column Definitions and Schemas for All 6 Modules
 * Single Source of Truth for Server-Side Export & Symmetrical Import
 */

export interface ExportColumnDef {
  key: string;
  header: string;
  category: 'core' | 'technical' | 'financial' | 'dates' | 'status' | 'remarks' | 'issues';
  dataType: 'string' | 'number' | 'currency' | 'date' | 'percent' | 'integer';
  align: 'left' | 'center' | 'right';
  defaultSelected: boolean;
  width?: number;
}

// -----------------------------------------------------------------------------
// MODULE 1A: CORRIDORS (LEVEL 1 MASTER HIGHWAY CATALOG)
// -----------------------------------------------------------------------------
export const HIGHWAYS_L1_COLUMNS: ExportColumnDef[] = [
  { key: 'road_code', header: 'Road Code', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 14 },
  { key: 'road_name', header: 'Corridor Section Title', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 45 },
  { key: 'old_nh_no', header: 'Old NH No.', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 14 },
  { key: 'new_nh_no', header: 'New NH No.', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 14 },
  { key: 'from_location', header: 'Start Location', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'to_location', header: 'End Location', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'from_chainage', header: 'Start Chainage (Km)', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'to_chainage', header: 'End Chainage (Km)', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'length_km', header: 'Total Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 18 },
  { key: 'configuration', header: 'Primary Configuration', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'length_less_than_2l', header: '<2-Lane Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 18 },
  { key: 'length_2l', header: '2-Lane Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 18 },
  { key: 'length_2l_ps', header: '2L+PS Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 18 },
  { key: 'length_4l', header: '4-Lane Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 18 },
  { key: 'length_6l', header: '6-Lane Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 18 },
  { key: 'division_name', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'dlp_count', header: 'Active DLP Warranty Count', category: 'status', dataType: 'integer', align: 'right', defaultSelected: true, width: 22 },
  { key: 'status', header: 'Status', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 14 },
];

// -----------------------------------------------------------------------------
// MODULE 1B: CORRIDORS (LEVEL 2 MACRO TRAFFIC CENSUS & PCU RANGES)
// -----------------------------------------------------------------------------
export const HIGHWAYS_L2_MACRO_COLUMNS: ExportColumnDef[] = [
  { key: 'highway_code', header: 'Road Code', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 14 },
  { key: 'division_name', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'stretch_name', header: 'Stretch Name / Section', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 40 },
  { key: 'from_km', header: 'From Km', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 14 },
  { key: 'to_km', header: 'To Km', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 14 },
  { key: 'length_km', header: 'Stretch Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 18 },
  { key: 'lane_configuration', header: 'Current Lane Status', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 20 },
  { key: 'pcu_count', header: 'Actual Traffic Count (PCU)', category: 'technical', dataType: 'integer', align: 'right', defaultSelected: true, width: 24 },
  { key: 'important_town', header: 'Important Town / Landmark', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'dpr_status', header: 'Status of DPR / Widening Proposal', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: true, width: 45 },
];

// -----------------------------------------------------------------------------
// MODULE 1C: CORRIDORS (LEVEL 2 MICRO GRANULAR LANE GEOMETRY)
// -----------------------------------------------------------------------------
export const HIGHWAYS_L2_MICRO_COLUMNS: ExportColumnDef[] = [
  { key: 'highway_code', header: 'Road Code', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 14 },
  { key: 'division_name', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'from_km', header: 'From Km', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 14 },
  { key: 'to_km', header: 'To Km', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 14 },
  { key: 'length_km', header: 'Segment Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 18 },
  { key: 'lane_configuration', header: 'Lane Configuration', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 20 },
  { key: 'row_width', header: 'ROW Width (m)', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'carriageway_width', header: 'Carriageway Width (m)', category: 'technical', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'important_town', header: 'Town / Landmark / Crossing', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'remarks', header: 'Remarks', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
];

// -----------------------------------------------------------------------------
// MODULE 2: DLP & MAINTENANCE CONTRACTS (/dlp)
// -----------------------------------------------------------------------------
export const DLP_COLUMNS: ExportColumnDef[] = [
  { key: 'highway_code', header: 'NH No. / Road Code', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 16 },
  { key: 'division_name', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'category', header: 'Category (DLP/STMC/PBMC/Construction/No DLP)', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 24 },
  { key: 'work_name', header: 'Name of Work / Contract Title', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 45 },
  { key: 'contractor_name', header: 'Contractor / Agency', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'chainage_from_km', header: 'Chainage From (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 18 },
  { key: 'chainage_to_km', header: 'Chainage To (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 18 },
  { key: 'length_km', header: 'Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 16 },
  { key: 'commencement_date', header: 'Commencement Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 18 },
  { key: 'dlp_till_date', header: 'DLP / Contract End Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 22 },
  { key: 'dlp_period_years', header: 'DLP Period (Years)', category: 'technical', dataType: 'integer', align: 'right', defaultSelected: false, width: 18 },
  { key: 'physical_progress_pct', header: 'Physical Progress (%)', category: 'technical', dataType: 'percent', align: 'right', defaultSelected: false, width: 20 },
  { key: 'actual_completion_date', header: 'Actual Completion Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 22 },
  { key: 'scheme', header: 'Scheme / Project Type', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'computed_status', header: 'Warranty Status', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'days_remaining', header: 'Days Remaining', category: 'status', dataType: 'integer', align: 'right', defaultSelected: true, width: 16 },
  { key: 'remarks', header: 'Remarks / Special Notes', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 40 },
];

// -----------------------------------------------------------------------------
// MODULE 3: ONGOING WORKS / MAJOR PROJECTS (35-COLUMN SPECIFICATION)
// -----------------------------------------------------------------------------
export const ONGOING_WORKS_COLUMNS: ExportColumnDef[] = [
  { key: 's_no', header: 'Sl. No.', category: 'core', dataType: 'integer', align: 'center', defaultSelected: true, width: 10 },
  { key: 'name_of_work', header: 'Name of the Project', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 50 },
  { key: 'pmis_id', header: 'PMIS / OCMS / PMG Id', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 20 },
  { key: 'old_new_nh', header: 'Old NH / New No.', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'scheme', header: 'Annual Plan (FY) / Scheme', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'circle', header: 'Circle', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 18 },
  { key: 'division', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 18 },
  { key: 'length_km', header: 'Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 16 },
  { key: 'job_no', header: 'Job No.', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 24 },
  { key: 'sanction_date', header: 'Date of Sanction / Revision', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 22 },
  { key: 'project_cost_cr', header: 'TPC (Rs. in Crore)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: true, width: 20 },
  { key: 'loa_date', header: 'Date of LOA', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 16 },
  { key: 'agreement_date', header: 'Date of Agreement', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 18 },
  { key: 'contract_value_cr', header: 'Contract Value (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: true, width: 20 },
  { key: 'site_handover_date', header: 'Date of Handing Over of Site', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 24 },
  { key: 'appointed_date', header: 'Date of Start / Appointed Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 24 },
  { key: 'completed_length_prior_km', header: 'Completed Length Prior FY (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 24 },
  { key: 'completed_length_current_fy_km', header: 'Completed Length Current FY (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 26 },
  { key: 'total_completed_length_km', header: 'Total Completed Length (Km)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: true, width: 22 },
  { key: 'progress_percent', header: 'Cumulative Physical Progress (%)', category: 'technical', dataType: 'percent', align: 'right', defaultSelected: true, width: 24 },
  { key: 'revised_cost_cr', header: 'Revised Cost / Anticipated (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 24 },
  { key: 'cost_increase_rce_cr', header: 'Cost Increase due to RCE (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 24 },
  { key: 'expenditure_prior_cr', header: 'Expenditure Prior FY (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 22 },
  { key: 'expenditure_current_fy_cr', header: 'Expenditure Current FY (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 22 },
  { key: 'cumm_financial_expenditure_cr', header: 'Cumulative Financial Exp. (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: true, width: 24 },
  { key: 'contract_cum_expenditure_cr', header: 'Contract Cumulative Exp. (Cr.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 24 },
  { key: 'scheduled_completion_date', header: 'Scheduled Date of Completion', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 24 },
  { key: 'likely_completion_date', header: 'Likely / Actual Completion Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 24 },
  { key: 'time_overrun_years', header: 'Time Overrun (Years)', category: 'technical', dataType: 'number', align: 'right', defaultSelected: false, width: 20 },
  { key: 'eot_granted_till', header: 'EOT Granted Till', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 18 },
  { key: 'eot_proposal_agency', header: 'EOT Proposal with Agency', category: 'status', dataType: 'string', align: 'left', defaultSelected: false, width: 24 },
  { key: 'cos_details', header: 'Change of Scope (COS)', category: 'technical', dataType: 'string', align: 'left', defaultSelected: false, width: 24 },
  { key: 'de_name_phone', header: 'Divisional Engineer Name / Phone', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 28 },
  { key: 'contractor_name', header: 'Contractor Name', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'work_stage', header: 'Work Stage', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'detailed_stage_status', header: 'Detailed Stage Status', category: 'status', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'issue_land', header: 'Land Acquisition Issue', category: 'issues', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
  { key: 'issue_forest', header: 'Forest Clearance Issue', category: 'issues', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
  { key: 'issue_utility', header: 'Utility Shifting Issue', category: 'issues', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
  { key: 'issue_railways', header: 'Railway / GAD Issue', category: 'issues', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
  { key: 'issue_others', header: 'Other Bottlenecks', category: 'issues', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
  { key: 'progress_remarks', header: 'Progress Remarks', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 40 },
  { key: 'stage_remarks', header: 'Stage Remarks', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 40 },
];

// -----------------------------------------------------------------------------
// MODULE 4: LEGAL CASES (/legal)
// -----------------------------------------------------------------------------
export const LEGAL_CASES_COLUMNS: ExportColumnDef[] = [
  { key: 'caseClassification', header: 'Case Classification', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 20 },
  { key: 'caseDetails', header: 'Case Number / Details', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 28 },
  { key: 'circle', header: 'Circle', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 18 },
  { key: 'division', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 18 },
  { key: 'category', header: 'Category', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'nameOfCourt', header: 'Name of Court', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 28 },
  { key: 'petitionerNames', header: 'Petitioner Name(s)', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'respondentNames', header: 'Respondent Name(s)', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'natureOfCase', header: 'Nature of Case', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'casePertainsTo', header: 'Case Pertains To', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'briefOfPrayer', header: 'Brief of Prayer', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: true, width: 45 },
  { key: 'currentStatus', header: 'Current Status (Pending/Disposed)', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 20 },
  { key: 'presentStage', header: 'Present Stage', category: 'status', dataType: 'string', align: 'left', defaultSelected: true, width: 22 },
  { key: 'caRequired', header: 'Counter Affidavit Required', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'caFiled', header: 'Counter Affidavit Filed', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'caDueDate', header: 'CA Due Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 16 },
  { key: 'caFiledDate', header: 'CA Filed Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 16 },
  { key: 'lastHearingDate', header: 'Last Hearing Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 18 },
  { key: 'nextHearingDate', header: 'Next Hearing Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 18 },
  { key: 'nextListingPurpose', header: 'Next Listing Purpose', category: 'status', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'interimOrderDirection', header: 'Interim Order / Direction', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 35 },
  { key: 'interimOrderDate', header: 'Interim Order Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 18 },
  { key: 'complianceRequired', header: 'Compliance Required', category: 'status', dataType: 'string', align: 'center', defaultSelected: false, width: 20 },
  { key: 'complianceStatus', header: 'Compliance Status', category: 'status', dataType: 'string', align: 'center', defaultSelected: false, width: 18 },
  { key: 'finalResult', header: 'Final Result (Disposed)', category: 'status', dataType: 'string', align: 'center', defaultSelected: false, width: 20 },
  { key: 'finalOrderDate', header: 'Final Order Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 18 },
  { key: 'adverseToDepartment', header: 'Adverse to Department', category: 'status', dataType: 'string', align: 'center', defaultSelected: false, width: 22 },
  { key: 'gpOpinion', header: 'GP Opinion', category: 'status', dataType: 'string', align: 'left', defaultSelected: false, width: 18 },
  { key: 'appealFiled', header: 'Appeal Filed', category: 'status', dataType: 'string', align: 'center', defaultSelected: false, width: 16 },
  { key: 'appealCaseDetails', header: 'Appeal Case Details', category: 'core', dataType: 'string', align: 'left', defaultSelected: false, width: 25 },
  { key: 'appellateCourt', header: 'Appellate Court', category: 'core', dataType: 'string', align: 'left', defaultSelected: false, width: 25 },
  { key: 'remarks', header: 'General Remarks', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 40 },
];

// -----------------------------------------------------------------------------
// MODULE 5: FEE BILLS PORTAL (/fee-bills)
// -----------------------------------------------------------------------------
export const FEE_BILLS_COLUMNS: ExportColumnDef[] = [
  { key: 'feeBillNumber', header: 'Fee Bill Number', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 20 },
  { key: 'feeBillDate', header: 'Fee Bill Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 16 },
  { key: 'receiptDate', header: 'Date of Receipt in Office', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 22 },
  { key: 'circle', header: 'Circle', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 18 },
  { key: 'division', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 18 },
  { key: 'lawyerName', header: 'Senior Advocate / Lawyer Name', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 28 },
  { key: 'lawyerDesignation', header: 'Advocate Designation', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 22 },
  { key: 'caseDetails', header: 'Case Details / WP No.', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
  { key: 'casePertainsTo', header: 'Case Pertains To', category: 'core', dataType: 'string', align: 'center', defaultSelected: false, width: 18 },
  { key: 'appearanceAmount', header: 'Appearance Fee (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: true, width: 20 },
  { key: 'conferenceAmount', header: 'Conference Fee (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 20 },
  { key: 'verifyingAmount', header: 'Drafting/Verifying Fee (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 22 },
  { key: 'assistanceAmount', header: 'Assistance Fee (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 20 },
  { key: 'totalFeeAmount', header: 'Total Claimed Fee (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: true, width: 22 },
  { key: 'assistantName', header: 'Junior / Assistant Name', category: 'core', dataType: 'string', align: 'left', defaultSelected: false, width: 24 },
  { key: 'paymentStatus', header: 'Payment Status', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 18 },
  { key: 'settledAmount', header: 'Settled Net Amount (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: true, width: 22 },
  { key: 'itCess', header: 'IT Cess Deducted (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 20 },
  { key: 'amountDeposited', header: 'Amount Deposited (Rs.)', category: 'financial', dataType: 'currency', align: 'right', defaultSelected: false, width: 20 },
  { key: 'utrRbiReference', header: 'UTR / ECS Ref No.', category: 'financial', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'paymentDate', header: 'Payment Disbursal Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: true, width: 22 },
  { key: 'goStatus', header: 'Government Order (GO) Status', category: 'status', dataType: 'string', align: 'center', defaultSelected: true, width: 24 },
  { key: 'goNumber', header: 'GO Number', category: 'status', dataType: 'string', align: 'center', defaultSelected: false, width: 18 },
  { key: 'goDate', header: 'GO Date', category: 'dates', dataType: 'date', align: 'center', defaultSelected: false, width: 16 },
  { key: 'currentPendency', header: 'Current Pendency Stage', category: 'status', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'remarks', header: 'Remarks / Processing Notes', category: 'remarks', dataType: 'string', align: 'left', defaultSelected: false, width: 40 },
];

// -----------------------------------------------------------------------------
// MODULE 6: STAFF PORTAL DIRECTORY (/staff)
// -----------------------------------------------------------------------------
export const STAFF_COLUMNS: ExportColumnDef[] = [
  { key: 'office', header: 'Office / Headquarter', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 25 },
  { key: 'circle', header: 'Circle', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'division', header: 'Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'sub_division', header: 'Sub-Division', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 22 },
  { key: 'section', header: 'Section', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 20 },
  { key: 'sub_section', header: 'Sub-Section', category: 'core', dataType: 'string', align: 'left', defaultSelected: false, width: 20 },
  { key: 'designation', header: 'Designation / Post', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 28 },
  { key: 'name', header: 'Staff Officer Name', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 28 },
  { key: 'contact_no', header: 'Official Contact Phone', category: 'core', dataType: 'string', align: 'center', defaultSelected: true, width: 22 },
  { key: 'emailid', header: 'Official Email ID', category: 'core', dataType: 'string', align: 'left', defaultSelected: true, width: 30 },
];
