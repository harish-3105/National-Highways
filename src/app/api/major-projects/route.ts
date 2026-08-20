import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export interface MajorProject {
  id: string;
  s_no: number;
  division: string;
  scheme: string;
  name_of_work: string;
  project_cost_cr: number;
  work_stage: 'IN_PROGRESS' | 'TENDER_STAGE';
  progress_percent?: number | null;
  probable_completion_date?: string | null;
  stage_remarks?: string | null;
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

  // 5 Issues Fields
  issue_land?: string | null;
  issue_forest?: string | null;
  issue_utility?: string | null;
  issue_railways?: string | null;
  issue_others?: string | null;

  created_at?: string;
  updated_at?: string;
}

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
    const divisionParam = searchParams.get('division')?.trim();
    const stageParam = searchParams.get('stage')?.trim();
    const searchParam = searchParams.get('search')?.trim().toLowerCase();
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (!supabase) {
      return NextResponse.json({
        success: true,
        projects: [],
        totalCount: 0,
      });
    }

    let query = supabase.from('major_projects_50cr').select('*').order('s_no', { ascending: true });

    if (!includeDeleted) {
      query = query.neq('delete_status', 'DELETED');
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

    let filteredData = data || [];
    if (searchParam) {
      filteredData = filteredData.filter(
        (p: MajorProject) =>
          (p.name_of_work || '').toLowerCase().includes(searchParam) ||
          (p.scheme || '').toLowerCase().includes(searchParam) ||
          (p.division || '').toLowerCase().includes(searchParam) ||
          (p.pmis_id || '').toLowerCase().includes(searchParam) ||
          (p.job_no || '').toLowerCase().includes(searchParam) ||
          (p.contractor_name || '').toLowerCase().includes(searchParam) ||
          (p.de_name_phone || '').toLowerCase().includes(searchParam) ||
          (p.detailed_stage_status || '').toLowerCase().includes(searchParam) ||
          (p.stage_remarks || '').toLowerCase().includes(searchParam)
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
      division,
      scheme,
      name_of_work,
      project_cost_cr,
      work_stage,
      progress_percent,
      probable_completion_date,
      stage_remarks,
      delete_status,

      // Level 2 (27-Column fields)
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

      issue_land,
      issue_forest,
      issue_utility,
      issue_railways,
      issue_others,
    } = body;

    if (!name_of_work || !division || !scheme) {
      return NextResponse.json(
        { success: false, message: 'Division, Scheme, and Name of Work are required.' },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      s_no: Number(s_no) || 1,
      division: division.trim(),
      scheme: scheme.trim(),
      name_of_work: name_of_work.trim(),
      project_cost_cr: Number(project_cost_cr) || 0,
      work_stage: work_stage === 'TENDER_STAGE' ? 'TENDER_STAGE' : 'IN_PROGRESS',
      progress_percent:
        work_stage === 'TENDER_STAGE'
          ? null
          : progress_percent !== undefined && progress_percent !== '' && progress_percent !== null
          ? Number(progress_percent)
          : null,
      probable_completion_date:
        work_stage === 'TENDER_STAGE' ? null : probable_completion_date?.trim() || null,
      stage_remarks: stage_remarks?.trim() || null,
      delete_status: delete_status || 'ACTIVE',

      // Level 2 fields
      pmis_id: pmis_id ? String(pmis_id).trim() : null,
      old_new_nh: old_new_nh ? String(old_new_nh).trim() : null,
      length_km: length_km !== undefined && length_km !== '' && length_km !== null ? Number(length_km) : null,
      job_no: job_no ? String(job_no).trim() : null,
      sanction_date: sanction_date ? String(sanction_date).trim() : null,
      appointed_date: appointed_date ? String(appointed_date).trim() : null,
      scheduled_completion_date: scheduled_completion_date ? String(scheduled_completion_date).trim() : null,

      completed_length_prior_km:
        completed_length_prior_km !== undefined && completed_length_prior_km !== '' && completed_length_prior_km !== null
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

      issue_land: issue_land ? String(issue_land).trim() : null,
      issue_forest: issue_forest ? String(issue_forest).trim() : null,
      issue_utility: issue_utility ? String(issue_utility).trim() : null,
      issue_railways: issue_railways ? String(issue_railways).trim() : null,
      issue_others: issue_others ? String(issue_others).trim() : null,

      updated_at: new Date().toISOString(),
    };

    if (id && !id.startsWith('proj-')) {
      // Update existing DB record
      const { data, error } = await supabase
        .from('major_projects_50cr')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      return NextResponse.json({ success: true, project: data?.[0] });
    }

    // Insert new record
    const insertPayload = {
      ...payload,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('major_projects_50cr').insert([insertPayload]).select();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, project: data?.[0] });
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

    if (supabase) {
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
    }

    return NextResponse.json({ success: true, message: 'Project removed successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
