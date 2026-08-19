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
    } = body;

    if (!name_of_work || !division || !scheme) {
      return NextResponse.json(
        { success: false, message: 'Division, Scheme, and Name of Work are required.' },
        { status: 400 }
      );
    }

    const payload = {
      s_no: Number(s_no) || 1,
      division: division.trim(),
      scheme: scheme.trim(),
      name_of_work: name_of_work.trim(),
      project_cost_cr: Number(project_cost_cr) || 0,
      work_stage: work_stage === 'TENDER_STAGE' ? 'TENDER_STAGE' : 'IN_PROGRESS',
      progress_percent: work_stage === 'TENDER_STAGE' ? null : (progress_percent !== undefined && progress_percent !== '' ? Number(progress_percent) : null),
      probable_completion_date: work_stage === 'TENDER_STAGE' ? null : (probable_completion_date?.trim() || null),
      stage_remarks: stage_remarks?.trim() || null,
      delete_status: delete_status || 'ACTIVE',
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
