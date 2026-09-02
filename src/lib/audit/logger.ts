import { createClient } from '@/lib/supabase/server';
import { SessionUser } from '@/lib/auth/session';

export interface FieldChange {
  field: string;
  label: string;
  old_value: any;
  new_value: any;
}

export interface LogAuditParams {
  actor?: SessionUser | null;
  module:
    | 'ONGOING_WORKS'
    | 'DLP'
    | 'LEGAL'
    | 'FEE_BILLS'
    | 'HIGHWAYS'
    | 'STAFF'
    | 'ROLES'
    | 'SYSTEM';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOCKDOWN_TOGGLE' | 'ASSIGN_ROLE';
  entityId: string;
  entityTitle?: string;
  oldState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  customDiff?: FieldChange[];
  changesSummary?: string;
  ipAddress?: string;
}

// Map common database columns to friendly labels
const FIELD_LABEL_DICTIONARY: Record<string, string> = {
  name_of_work: 'Name of Work',
  road_code: 'Road Code / NH No.',
  old_nh_no: 'Old NH No.',
  scheme_name: 'Scheme Name',
  length_km: 'Length (Km)',
  job_no: 'Job No.',
  sanctioned_date: 'Sanctioned Date',
  sanctioned_cost_cr: 'Sanctioned TPC (₹ Cr)',
  revised_cost_cr: 'Revised Cost / RCE (₹ Cr)',
  cost_increase_rce_cr: 'Cost Increase in RCE (₹ Cr)',
  exp_prior_fy_cr: 'Expenditure Upto Prior FY (₹ Cr)',
  exp_current_fy_cr: 'Expenditure in Current FY (₹ Cr)',
  cum_financial_exp_cr: 'Cumulative Financial Expenditure (₹ Cr)',
  financial_progress_percent: 'Financial Progress (%)',
  appointed_date: 'Appointed Date',
  target_date: 'Scheduled Completion Date',
  likely_completion_date: 'Likely Completion Date',
  completed_length_prior_fy: 'Length Completed Prior FY (Km)',
  completed_length_current_fy: 'Length Completed Current FY (Km)',
  total_completed_length: 'Total Completed Length (Km)',
  physical_progress_percent: 'Physical Progress (%)',
  time_overrun_years: 'Time Overrun (Years)',
  eot_granted_till: 'EOT Granted Till',
  eot_proposal_agency: 'EOT Proposal Agency',
  change_of_scope_details: 'Change of Scope (COS) Details',
  divisional_engineer_details: 'Divisional Engineer Details',
  contractor_agency_name: 'Contractor / Agency Name',
  detailed_stage_status: 'Detailed Stage Status (Col 27)',
  circle_name: 'Circle Jurisdiction',
  division_name: 'Division Jurisdiction',
  loa_date: 'LOA Date',
  agreement_date: 'Agreement Date',
  contract_value_cr: 'Contract Value (₹ Cr)',
  site_handover_date: 'Site Handover Date',
  contract_cum_expenditure_cr: 'Contract Cumulative Expenditure (₹ Cr)',
  issue_land: 'Land Acquisition Status',
  issue_forest: 'Forest Clearance Status',
  issue_utility: 'Utility Shifting Status',
  issue_railways: 'Railways / GAD Status',
  issue_others: 'Other Bottlenecks Status',
  progress_remarks: 'Progress Remarks',
  status: 'Work Status',
  
  // Fee bills
  fee_bill_no: 'Fee Bill Voucher No.',
  fee_bill_date: 'Fee Bill Date',
  law_officer_name: 'Lead Advocate Name',
  assistant_name: 'Assistant Law Officer Name',
  settled_amount: 'Settled Amount (₹)',
  amount_deposited_account: 'Deposited in Bank (₹)',
  it_cess_amount: 'IT Cess Deducted (₹)',
  
  // DLP
  contractor_name: 'Contractor Name',
  dlp_till_date: 'DLP Warranty Expiry Date',
};

const IGNORED_DIFF_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'delete_status',
  'deleted_at',
  'deleted_by',
  'totp_secret',
  'password_hash',
]);

/**
 * Automatically computes field-by-field diffs between previous state and updated state
 */
export function computeFieldDiffs(
  oldState?: Record<string, any> | null,
  newState?: Record<string, any> | null
): FieldChange[] {
  if (!oldState || !newState) return [];
  const diffs: FieldChange[] = [];

  const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

  for (const key of allKeys) {
    if (IGNORED_DIFF_FIELDS.has(key)) continue;

    const oldVal = oldState[key];
    const newVal = newState[key];

    // Check if values differ (handling primitives, dates, numbers, strings)
    const oldNormalized = normalizeValueForDiff(oldVal);
    const newNormalized = normalizeValueForDiff(newVal);

    if (oldNormalized !== newNormalized) {
      const label =
        FIELD_LABEL_DICTIONARY[key] ||
        key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      diffs.push({
        field: key,
        label,
        old_value: oldVal ?? null,
        new_value: newVal ?? null,
      });
    }
  }

  return diffs;
}

function normalizeValueForDiff(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') return Number(val).toFixed(4);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val).trim();
}

/**
 * Logs a tamper-proof audit trail event to public.audit_logs
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = await createClient();

    // Determine field-level diffs
    let fieldChanges: FieldChange[] = params.customDiff || [];
    if (fieldChanges.length === 0 && params.oldState && params.newState) {
      fieldChanges = computeFieldDiffs(params.oldState, params.newState);
    }

    // Build changes summary if not explicitly provided
    let summary = params.changesSummary;
    if (!summary) {
      if (params.action === 'CREATE') {
        summary = `Created new record`;
      } else if (params.action === 'DELETE') {
        summary = `Soft-deleted record`;
      } else if (params.action === 'RESTORE') {
        summary = `Restored archived record`;
      } else if (fieldChanges.length > 0) {
        const labels = fieldChanges.slice(0, 3).map((f) => f.label);
        summary = `Updated ${labels.join(', ')}${fieldChanges.length > 3 ? ` (+${fieldChanges.length - 3} more)` : ''}`;
      } else {
        summary = `Modified record`;
      }
    }

    const payload = {
      user_id: params.actor?.id || null,
      user_phone: params.actor?.phoneNumber || 'SYSTEM',
      user_name: params.actor?.fullName || (params.actor ? 'Staff Member' : 'Automated System'),
      user_role: params.actor?.roleName || (params.actor?.isSuperAdmin ? 'Super Admin' : 'System'),
      user_jurisdiction:
        params.actor?.jurisdictionScope === 'STATEWIDE'
          ? 'Statewide'
          : params.actor?.division || params.actor?.circle || 'Statewide',
      module: params.module,
      action: params.action,
      entity_id: params.entityId,
      entity_title: params.entityTitle || null,
      changes_summary: summary,
      field_changes: fieldChanges,
      snapshot_before: params.oldState || null,
      snapshot_after: params.newState || null,
      ip_address: params.ipAddress || null,
    };

    await supabase.from('audit_logs').insert([payload]);
  } catch (err) {
    console.error('Failed to log audit event:', err);
    // Silent fail on logging so main business mutation doesn't block, but logged to stderr
  }
}
