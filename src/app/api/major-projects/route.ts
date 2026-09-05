import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { logAudit, computeFieldDiffs } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export interface MajorProject {
  id: string;
  s_no: number;
  circle?: string | null;
  division: string;
  scheme: string;
  name_of_work: string;
  project_cost_cr: number;
  work_stage: 'IN_PROGRESS' | 'TENDER_STAGE' | 'COMPLETED';
  progress_percent?: number | null;
  probable_completion_date?: string | null;
  stage_remarks?: string | null;
  progress_remarks?: string | null;
  delete_status?: string | null;

  // Level 2 (27-Column Deep Technical & Financial Data)
  pmis_id?: string | null;
  old_new_nh?: string | null;
  length_km?: number | null;
  job_no?: string | null;
  sanction_date?: string | null;
  appointed_date?: string | null;
  scheduled_completion_date?: string | null;

  completed_length_prior_km?: number | null;
  completed_length_current_fy_km?: number | null;
  total_completed_length_km?: number | null;

  revised_cost_cr?: number | null;
  cost_increase_rce_cr?: number | null;
  expenditure_prior_cr?: number | null;
  expenditure_current_fy_cr?: number | null;
  cumm_financial_expenditure_cr?: number | null;

  likely_completion_date?: string | null;
  time_overrun_years?: number | null;
  eot_granted_till?: string | null;
  eot_proposal_agency?: string | null;
  cos_details?: string | null;

  de_name_phone?: string | null;
  contractor_name?: string | null;
  updated_division_date?: string | null;
  detailed_stage_status?: string | null;

  // 5 Contract & Milestone Fields (New 35-Column Layout)
  loa_date?: string | null;
  agreement_date?: string | null;
  contract_value_cr?: number | null;
  site_handover_date?: string | null;
  contract_cum_expenditure_cr?: number | null;

  // 5 Issues Fields (Section 4 Clearance Bottlenecks)
  issue_land?: string | null;
  issue_forest?: string | null;
  issue_utility?: string | null;
  issue_railways?: string | null;
  issue_others?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface MajorProjectSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  action_source: 'EXCEL_UPLOAD' | 'MANUAL_ADD' | 'MANUAL_EDIT' | 'INLINE_EDIT';
  user_identifier?: string | null;
  progress_percent?: number | null;
  financial_progress_percent?: number | null;
  cumm_financial_expenditure_cr?: number | null;
  contract_cum_expenditure_cr?: number | null;
  progress_remarks?: string | null;
  stage_remarks?: string | null;
  detailed_stage_status?: string | null;
  issue_land?: string | null;
  issue_forest?: string | null;
  issue_utility?: string | null;
  issue_railways?: string | null;
  issue_others?: string | null;
  full_snapshot: Partial<MajorProject>;
  created_at?: string;
}

// Frozen columns: Columns A to N & Column Z (Write-Once / Freeze-When-Filled for standard users)
export const FROZEN_PROJECT_COLUMNS = [
  's_no',
  'circle',
  'name_of_work',
  'pmis_id',
  'old_new_nh',
  'scheme',
  'length_km',
  'job_no',
  'sanction_date',
  'project_cost_cr',
  'loa_date',
  'agreement_date',
  'contract_value_cr',
  'site_handover_date',
  'appointed_date',
  'scheduled_completion_date',
] as const;

function getSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
  const supabaseKey = rawKey.replace(/^["']|["']$/g, '').trim();

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const circleParam = searchParams.get('circle')?.trim();
    const divisionParam = searchParams.get('division')?.trim();
    const stageParam = searchParams.get('stage')?.trim();
    const searchParam = searchParams.get('search')?.trim().toLowerCase();
    const rawIncludeDeleted = searchParams.get('includeDeleted') === 'true';
    const completionFilter = searchParams.get('completionFilter')?.trim(); // 'ACTIVE_ONLY', 'COMPLETED_ONLY', 'ALL'

    if (!supabase) {
      return NextResponse.json({
        success: true,
        projects: [],
        totalCount: 0,
      });
    }

    const session = await getSession();
    const authCheck = canPerformAction(session, 'works:view');
    if (!authCheck.allowed) {
      return NextResponse.json({ success: false, message: authCheck.reason || 'Unauthorized' }, { status: 403 });
    }

    const includeDeleted = rawIncludeDeleted && canPerformAction(session, 'system:view_archived').allowed;

    let query = supabase.from('major_projects_50cr').select('*').order('s_no', { ascending: true });

    if (!includeDeleted) {
      query = query.neq('delete_status', 'DELETED');
    }

    if (circleParam && circleParam !== 'ALL') {
      query = query.ilike('circle', circleParam);
    }

    if (divisionParam && divisionParam !== 'ALL') {
      query = query.ilike('division', divisionParam);
    }

    if (stageParam && stageParam !== 'ALL') {
      query = query.eq('work_stage', stageParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ongoing works from Supabase:', error);
      return NextResponse.json({
        success: true,
        projects: [],
        totalCount: 0,
      });
    }

    let filteredData = (data || []) as MajorProject[];

    // Completed Works Filtering (based on work_stage === 'COMPLETED')
    if (completionFilter === 'COMPLETED_ONLY') {
      filteredData = filteredData.filter((p) => p.work_stage === 'COMPLETED');
    } else if (completionFilter === 'ACTIVE_ONLY' || !completionFilter) {
      // Default: Auto-hide completed works from default active list
      filteredData = filteredData.filter((p) => p.work_stage !== 'COMPLETED');
    }

    if (searchParam) {
      filteredData = filteredData.filter(
        (p: MajorProject) =>
          (p.name_of_work || '').toLowerCase().includes(searchParam) ||
          (p.scheme || '').toLowerCase().includes(searchParam) ||
          (p.circle || '').toLowerCase().includes(searchParam) ||
          (p.division || '').toLowerCase().includes(searchParam) ||
          (p.pmis_id || '').toLowerCase().includes(searchParam) ||
          (p.job_no || '').toLowerCase().includes(searchParam) ||
          (p.contractor_name || '').toLowerCase().includes(searchParam) ||
          (p.de_name_phone || '').toLowerCase().includes(searchParam) ||
          (p.detailed_stage_status || '').toLowerCase().includes(searchParam) ||
          (p.stage_remarks || '').toLowerCase().includes(searchParam) ||
          (p.progress_remarks || '').toLowerCase().includes(searchParam) ||
          (p.issue_land || '').toLowerCase().includes(searchParam) ||
          (p.issue_forest || '').toLowerCase().includes(searchParam) ||
          (p.issue_utility || '').toLowerCase().includes(searchParam) ||
          (p.issue_railways || '').toLowerCase().includes(searchParam) ||
          (p.issue_others || '').toLowerCase().includes(searchParam)
      );
    }

    return NextResponse.json({
      success: true,
      projects: filteredData,
      totalCount: filteredData.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg, projects: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Database connection not available' }, { status: 500 });
    }

    const body = await request.json();
    const {
      id,
      s_no,
      circle,
      division,
      scheme,
      name_of_work,
      project_cost_cr,
      work_stage,
      progress_percent,
      probable_completion_date,
      stage_remarks,
      progress_remarks,
      delete_status,

      // Level 2 fields
      pmis_id,
      old_new_nh,
      length_km,
      job_no,
      sanction_date,
      appointed_date,
      scheduled_completion_date,

      completed_length_prior_km,
      completed_length_current_fy_km,
      total_completed_length_km,

      revised_cost_cr,
      cost_increase_rce_cr,
      expenditure_prior_cr,
      expenditure_current_fy_cr,
      cumm_financial_expenditure_cr,

      likely_completion_date,
      time_overrun_years,
      eot_granted_till,
      eot_proposal_agency,
      cos_details,

      de_name_phone,
      contractor_name,
      updated_division_date,
      detailed_stage_status,

      // 5 Contract & Milestone Fields
      loa_date,
      agreement_date,
      contract_value_cr,
      site_handover_date,
      contract_cum_expenditure_cr,

      // 5 Issues Fields
      issue_land,
      issue_forest,
      issue_utility,
      issue_railways,
      issue_others,

      // Admin & Audit
      isAdmin = false,
      actionSource = 'MANUAL_EDIT',
      userIdentifier = 'portal_user',
    } = body;

    // Progressive entry: only name_of_work is strictly required to draft/initialize
    if (!name_of_work || !String(name_of_work).trim()) {
      return NextResponse.json(
        { success: false, message: 'Name of Work is required to save project.' },
        { status: 400 }
      );
    }

    const session = await getSession();
    const isExisting = Boolean(id && !String(id).startsWith('proj-'));
    const requiredPerm = isExisting ? 'works:edit_progress' : 'works:create';

    const authCheck = canPerformAction(session, requiredPerm, {
      circle: circle || null,
      division: division || null,
    });

    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    const payload: Record<string, unknown> = {
      s_no: Number(s_no) || 1,
      circle: circle ? String(circle).trim() : null,
      division: division ? String(division).trim() : 'Salem',
      scheme: scheme ? String(scheme).trim() : 'CRIDP',
      name_of_work: String(name_of_work).trim(),
      project_cost_cr: Number(project_cost_cr) || 0,
      work_stage: (work_stage as any) || 'IN_PROGRESS',
      progress_percent:
        progress_percent !== undefined && progress_percent !== '' && progress_percent !== null
          ? Number(progress_percent)
          : null,
      probable_completion_date: probable_completion_date ? String(probable_completion_date).trim() : null,
      stage_remarks: stage_remarks ? String(stage_remarks).trim() : null,
      progress_remarks: progress_remarks ? String(progress_remarks).trim() : null,
      delete_status: delete_status || 'ACTIVE',

      // Level 2 (27-Column Deep Technical & Financial Data)
      pmis_id: pmis_id ? String(pmis_id).trim() : null,
      old_new_nh: old_new_nh ? String(old_new_nh).trim() : null,
      length_km:
        length_km !== undefined && length_km !== '' && length_km !== null ? Number(length_km) : null,
      job_no: job_no ? String(job_no).trim() : null,
      sanction_date: sanction_date ? String(sanction_date).trim() : null,
      appointed_date: appointed_date ? String(appointed_date).trim() : null,
      scheduled_completion_date: scheduled_completion_date
        ? String(scheduled_completion_date).trim()
        : null,

      completed_length_prior_km:
        completed_length_prior_km !== undefined &&
        completed_length_prior_km !== '' &&
        completed_length_prior_km !== null
          ? Number(completed_length_prior_km)
          : null,
      completed_length_current_fy_km:
        completed_length_current_fy_km !== undefined &&
        completed_length_current_fy_km !== '' &&
        completed_length_current_fy_km !== null
          ? Number(completed_length_current_fy_km)
          : null,
      total_completed_length_km:
        total_completed_length_km !== undefined &&
        total_completed_length_km !== '' &&
        total_completed_length_km !== null
          ? Number(total_completed_length_km)
          : null,

      revised_cost_cr:
        revised_cost_cr !== undefined && revised_cost_cr !== '' && revised_cost_cr !== null
          ? Number(revised_cost_cr)
          : null,
      cost_increase_rce_cr:
        cost_increase_rce_cr !== undefined && cost_increase_rce_cr !== '' && cost_increase_rce_cr !== null
          ? Number(cost_increase_rce_cr)
          : null,
      expenditure_prior_cr:
        expenditure_prior_cr !== undefined && expenditure_prior_cr !== '' && expenditure_prior_cr !== null
          ? Number(expenditure_prior_cr)
          : null,
      expenditure_current_fy_cr:
        expenditure_current_fy_cr !== undefined &&
        expenditure_current_fy_cr !== '' &&
        expenditure_current_fy_cr !== null
          ? Number(expenditure_current_fy_cr)
          : null,
      cumm_financial_expenditure_cr:
        cumm_financial_expenditure_cr !== undefined &&
        cumm_financial_expenditure_cr !== '' &&
        cumm_financial_expenditure_cr !== null
          ? Number(cumm_financial_expenditure_cr)
          : null,

      likely_completion_date: likely_completion_date ? String(likely_completion_date).trim() : null,
      time_overrun_years:
        time_overrun_years !== undefined && time_overrun_years !== '' && time_overrun_years !== null
          ? Number(time_overrun_years)
          : null,
      eot_granted_till: eot_granted_till ? String(eot_granted_till).trim() : null,
      eot_proposal_agency: eot_proposal_agency ? String(eot_proposal_agency).trim() : null,
      cos_details: cos_details ? String(cos_details).trim() : null,

      de_name_phone: de_name_phone ? String(de_name_phone).trim() : null,
      contractor_name: contractor_name ? String(contractor_name).trim() : null,
      updated_division_date: updated_division_date ? String(updated_division_date).trim() : null,
      detailed_stage_status: detailed_stage_status ? String(detailed_stage_status).trim() : null,

      // 5 Contract & Milestone Fields
      loa_date: loa_date ? String(loa_date).trim() : null,
      agreement_date: agreement_date ? String(agreement_date).trim() : null,
      contract_value_cr:
        contract_value_cr !== undefined && contract_value_cr !== '' && contract_value_cr !== null
          ? Number(contract_value_cr)
          : null,
      site_handover_date: site_handover_date ? String(site_handover_date).trim() : null,
      contract_cum_expenditure_cr:
        contract_cum_expenditure_cr !== undefined &&
        contract_cum_expenditure_cr !== '' &&
        contract_cum_expenditure_cr !== null
          ? Number(contract_cum_expenditure_cr)
          : null,

      // 5 Issues Fields
      issue_land: issue_land ? String(issue_land).trim() : null,
      issue_forest: issue_forest ? String(issue_forest).trim() : null,
      issue_utility: issue_utility ? String(issue_utility).trim() : null,
      issue_railways: issue_railways ? String(issue_railways).trim() : null,
      issue_others: issue_others ? String(issue_others).trim() : null,

      updated_at: new Date().toISOString(),
    };

    if (id && !id.startsWith('proj-')) {
      // 1. Fetch existing record to verify "Write-Once / Freeze-When-Filled" and monotonic rules
      const { data: existingRecords } = await supabase
        .from('major_projects_50cr')
        .select('*')
        .eq('id', id)
        .limit(1);

      const existing = existingRecords?.[0];

      if (existing) {
        // Enforce Monotonic Progress Increase (unless Admin / Creative Mode / Bypass Validation)
        const hasCreativeMode =
          session?.isSuperAdmin ||
          session?.permissions.includes('*:*') ||
          session?.permissions.includes('system:creative_mode') ||
          session?.permissions.includes('system:bypass_validation');

        if (!hasCreativeMode && payload.work_stage === 'IN_PROGRESS' && payload.progress_percent !== null) {
          const prevProg = existing.progress_percent !== null ? Number(existing.progress_percent) : 0;
          const newProg = Number(payload.progress_percent);
          if (newProg < prevProg) {
            return NextResponse.json(
              {
                success: false,
                message: `Monotonic constraint: Physical progress cannot decrease from previously recorded ${prevProg}% (received ${newProg}%).`,
              },
              { status: 400 }
            );
          }
        }

        // Enforce Write-Once / Freeze-When-Filled for standard users (A-N & Z) unless override perm
        const canOverrideFrozen =
          hasCreativeMode ||
          session?.permissions.includes('works:override_frozen');
        if (!canOverrideFrozen) {
          FROZEN_PROJECT_COLUMNS.forEach((col) => {
            const prevVal = existing[col];
            if (prevVal !== null && prevVal !== undefined && prevVal !== '') {
              payload[col] = prevVal; // Preserve existing frozen value
            }
          });
        }
      }

      // Update existing DB record
      const { data, error } = await supabase
        .from('major_projects_50cr')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

      const updatedProject = data?.[0];

      // 2. Automated Historical Snapshot Logging
      try {
        const cost = Number(updatedProject?.revised_cost_cr || updatedProject?.project_cost_cr || 0);
        const exp = Number(updatedProject?.cumm_financial_expenditure_cr || 0);
        const finPercent = cost > 0 ? Math.min(100, Math.round((exp / cost) * 100 * 10) / 10) : 0;

        await supabase.from('major_projects_snapshots').insert({
          project_id: updatedProject.id,
          action_source: actionSource || 'MANUAL_EDIT',
          user_identifier: session?.phoneNumber || userIdentifier || 'portal_user',
          progress_percent: updatedProject.progress_percent,
          financial_progress_percent: finPercent,
          cumm_financial_expenditure_cr: updatedProject.cumm_financial_expenditure_cr,
          contract_cum_expenditure_cr: updatedProject.contract_cum_expenditure_cr,
          progress_remarks: updatedProject.progress_remarks,
          stage_remarks: updatedProject.stage_remarks,
          detailed_stage_status: updatedProject.detailed_stage_status,
          issue_land: updatedProject.issue_land,
          issue_forest: updatedProject.issue_forest,
          issue_utility: updatedProject.issue_utility,
          issue_railways: updatedProject.issue_railways,
          issue_others: updatedProject.issue_others,
          full_snapshot: updatedProject,
        });
      } catch (snapshotErr) {
        console.error('Snapshot logging error:', snapshotErr);
      }

      // 3. Immutable Google Sheets-Style Audit Logging
      if (session && existing) {
        try {
          const isRestored = existing.delete_status === 'DELETED' && updatedProject.delete_status === 'ACTIVE';
          await logAudit({
            actor: session,
            module: 'ONGOING_WORKS',
            action: isRestored ? 'RESTORE' : 'UPDATE',
            entityId: updatedProject.id,
            entityTitle: updatedProject.name_of_work,
            changesSummary: isRestored
              ? `Restored archived project: ${updatedProject.name_of_work}`
              : `Updated project: ${updatedProject.name_of_work}`,
            oldState: existing,
            newState: updatedProject,
          });
        } catch (auditErr) {
          console.error('Audit logging error:', auditErr);
        }
      }

      return NextResponse.json({ success: true, project: updatedProject });
    }

    // Insert new record
    const insertPayload = {
      ...payload,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('major_projects_50cr').insert([insertPayload]).select();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const newProject = data?.[0];

    // Initial snapshot log on creation
    try {
      if (newProject) {
        const cost = Number(newProject.revised_cost_cr || newProject.project_cost_cr || 0);
        const exp = Number(newProject.cumm_financial_expenditure_cr || 0);
        const finPercent = cost > 0 ? Math.min(100, Math.round((exp / cost) * 100 * 10) / 10) : 0;

        await supabase.from('major_projects_snapshots').insert({
          project_id: newProject.id,
          action_source: 'MANUAL_ADD',
          user_identifier: session?.phoneNumber || userIdentifier || 'portal_user',
          progress_percent: newProject.progress_percent,
          financial_progress_percent: finPercent,
          cumm_financial_expenditure_cr: newProject.cumm_financial_expenditure_cr,
          contract_cum_expenditure_cr: newProject.contract_cum_expenditure_cr,
          progress_remarks: newProject.progress_remarks,
          stage_remarks: newProject.stage_remarks,
          detailed_stage_status: newProject.detailed_stage_status,
          issue_land: newProject.issue_land,
          issue_forest: newProject.issue_forest,
          issue_utility: newProject.issue_utility,
          issue_railways: newProject.issue_railways,
          issue_others: newProject.issue_others,
          full_snapshot: newProject,
        });

        // Audit log creation
        if (session) {
          await logAudit({
            actor: session,
            module: 'ONGOING_WORKS',
            action: 'CREATE',
            entityId: newProject.id,
            entityTitle: newProject.name_of_work,
            changesSummary: `Created new capital project: ${newProject.name_of_work}`,
            newState: newProject,
          });
        }
      }
    } catch (snapshotErr) {
      console.error('Initial snapshot logging error:', snapshotErr);
    }

    return NextResponse.json({ success: true, project: newProject });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export const PUT = POST;
export const PATCH = POST;

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Project ID is required' }, { status: 400 });
    }

    const session = await getSession();

    if (supabase) {
      const { data: existingRec } = await supabase
        .from('major_projects_50cr')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existingRec) {
        const authCheck = canPerformAction(session, 'works:delete', {
          circle: existingRec.circle,
          division: existingRec.division,
        });

        if (!authCheck.allowed) {
          return NextResponse.json(
            { success: false, message: authCheck.reason || 'Unauthorized operation.' },
            { status: 403 }
          );
        }

        if (hard) {
          const { error } = await supabase.from('major_projects_50cr').delete().eq('id', id);
          if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        } else {
          const { error } = await supabase
            .from('major_projects_50cr')
            .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }

        // Record Audit Log for deletion
        if (session) {
          await logAudit({
            actor: session,
            module: 'ONGOING_WORKS',
            action: 'DELETE',
            entityId: existingRec.id,
            entityTitle: existingRec.name_of_work,
            changesSummary: `Soft-deleted project from active roster: ${existingRec.name_of_work}`,
            oldState: existingRec,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Project removed successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
