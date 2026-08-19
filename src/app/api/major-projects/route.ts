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

export const INITIAL_50CR_PROJECTS: Omit<MajorProject, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    s_no: 1,
    division: 'Vellore',
    scheme: 'Annual Plan 2026-27',
    name_of_work: 'Construction of 4 Lane Access Controlled Bypass to Tiruvannamalai Town from km 75/150 to km 88/030 of NH-38 (Design Length 22.710 km) in the state of Tamil Nadu.',
    project_cost_cr: 1128.55,
    work_stage: 'TENDER_STAGE',
    progress_percent: null,
    probable_completion_date: null,
    stage_remarks: 'Tender invited by MoRTH HQ on 30.07.2026. Bid due date: 15.09.2026.',
    delete_status: 'ACTIVE',
  },
  {
    s_no: 2,
    division: 'Madurai',
    scheme: 'Annual Plan 2020-21',
    name_of_work: 'Construction of ROB at Km 75/8 of NH 49 Extn. (Madurai - Cochin road) in lieu of LC 68 and Railway Km 72/6-7 in between Aundipatti and Theni Railway Stations Under SethuBharatham Project (Theni)',
    project_cost_cr: 129.86,
    work_stage: 'IN_PROGRESS',
    progress_percent: 70,
    probable_completion_date: '31.03.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 3,
    division: 'Vellore',
    scheme: 'Annual Plan 2020-21',
    name_of_work: 'Construction of ROB and their Approaches at Km 81/800 (Near Kannamangalam) in Lieu of Existing LC No. 109A/3T at Railway Km 130/23-25 of NH-234 (Mangalore – Villupuram Road) including Land Acquisition',
    project_cost_cr: 118.98,
    work_stage: 'IN_PROGRESS',
    progress_percent: 75,
    probable_completion_date: '20.02.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 4,
    division: 'Vellore',
    scheme: 'Annual Plan 2020-21',
    name_of_work: 'Construction of ROB and their approaches at Km 103/4 near Ettivadi in Lieu of existing level crossing No. 86 of NH-234 (Mangalore –Villupuram road) including Land Acquisition',
    project_cost_cr: 69.29,
    work_stage: 'IN_PROGRESS',
    progress_percent: 56,
    probable_completion_date: '12.09.2026',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 5,
    division: 'Madurai',
    scheme: 'Annual Plan 2021-22',
    name_of_work: 'Construction of Bypass to Madurai - Achampathu - Viratipathu in Km 6/850 -10/382 of NH 49 Extn. (New NH 85) including LA & Shifting of Utilities',
    project_cost_cr: 260.07,
    work_stage: 'IN_PROGRESS',
    progress_percent: 94,
    probable_completion_date: '23.08.2026',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 6,
    division: 'Coimbatore',
    scheme: 'Annual Plan 2021-22',
    name_of_work: 'Construction of Fly Over including Junction Improvements at Km 348/6 - 349/8 of NH 67 (Km 15/6 - 16/8 of New NH 181) (Nagapattinam – Gudalur – Mysore Road) at Saibaba Colony Junction in Coimbatore City on Engineering, Procurement and Construction (EPC) Basis Contract in the state of Tamilnadu',
    project_cost_cr: 71.05,
    work_stage: 'IN_PROGRESS',
    progress_percent: 95,
    probable_completion_date: '19.08.2026',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 7,
    division: 'Tirunelveli',
    scheme: 'Annual Plan 2022-23',
    name_of_work: 'Construction of ROB and their approaches at Km 99/4 (LC Gate No.503 /Spl-A-3/E) of NH-744 (old No.208) Kollam- Thirumangalam road in the state of Tamilnadu including land acquisition on Engineering, Procurement & Construction (EPC) Mode.',
    project_cost_cr: 53.02,
    work_stage: 'IN_PROGRESS',
    progress_percent: 89,
    probable_completion_date: '31.03.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 8,
    division: 'Vellore',
    scheme: 'Annual Plan 2024-25',
    name_of_work: 'Construction of 4 Lane Bypass to Vellore Town starting from Km 47.400 of NH-75 & ending at km 12.650 of NH-38 (Length 20.492 km) in the state of Tamil Nadu',
    project_cost_cr: 752.94,
    work_stage: 'TENDER_STAGE',
    progress_percent: null,
    probable_completion_date: null,
    stage_remarks: 'Estimate submitted to RO, MoRTH, Chennai on 22.06.2026. Estimate submitted to Ministry, New Delhi & under scrutiny.',
    delete_status: 'ACTIVE',
  },
  {
    s_no: 9,
    division: 'Gobi',
    scheme: 'Annual Plan 2024-25',
    name_of_work: 'Widening of existing 2 lane paved shoulder to 4 Lane paved shoulder in km 268/40 to km 271/30 & km 273/00 to km 273/80 and widening end to end & Improvements from Km 271/3 to 273/0 of NH-948 (Coimbatore - Sathyamangalam Road) (length 5.40 Km) including permanent rectification of three black spots (IDs- TN-02-238, TN-02-239 & TN-03-260) under AP-2024-25 in the State of Tamil Nadu',
    project_cost_cr: 52.21,
    work_stage: 'IN_PROGRESS',
    progress_percent: 56,
    probable_completion_date: '23.01.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 10,
    division: 'Vellore',
    scheme: 'Annual Plan 2024-25',
    name_of_work: 'Construction of Four Lane Bypass to Vettavalam Town from Ch.0/0 to Ch.4/465 (Starting at km 104/850 and ending at km 109/190 of Nh-38 Mangalore - Villupuram Road) under AP 2024-25 in the State of Tamil Nadu',
    project_cost_cr: 50.68,
    work_stage: 'IN_PROGRESS',
    progress_percent: 32,
    probable_completion_date: '24.10.2026',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 11,
    division: 'Vellore',
    scheme: 'Annual Plan 2024-25',
    name_of_work: 'Strengthening from Km 22/000 to 78/000 of NH-38 (Length 54.223 Km) (Mangalore - Villupuram Road) on EPC mode in Tamil Nadu on EPC Basis Contract under Annual Plan 2024-25 in Tamil Nadu.',
    project_cost_cr: 71.03,
    work_stage: 'IN_PROGRESS',
    progress_percent: 93,
    probable_completion_date: '31.08.2026',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 12,
    division: 'Gobi',
    scheme: 'Annual Plan 2024-25',
    name_of_work: 'Widening to 2L+PS in Km 15/600-38/800 (except Km 28/2-28/6 & Km 33/100-33/200) and improvements in Km 17/300-21/300, Km 22/200-26/0, Km 26/600-28/0, Km28/60-30/8, Km 31/700-33/100, Km 33/200-35/200, Km 36/200-38/800 of NH-381A (Length 22.70Km) (Vellakoil-Sankagiri Road) under AP-2024-25 in the State of Tamil Nadu.',
    project_cost_cr: 63.60,
    work_stage: 'IN_PROGRESS',
    progress_percent: 60,
    probable_completion_date: '23.01.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 13,
    division: 'Coimbatore',
    scheme: 'Annual Plan 2024-25',
    name_of_work: 'Improvements to eliminate the Blackspot at Ganapathy Moor Market Junction (TN-02-623) at Km 312/0 to Km 315/4 of NH 948 (Length 3.4 Km) (Bangalore – Sathyamangalam – Coimbatore Road) under AP-2024-25 in the State of Tamil Nadu.',
    project_cost_cr: 51.02,
    work_stage: 'IN_PROGRESS',
    progress_percent: 11,
    probable_completion_date: '26.11.2026',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 14,
    division: 'Gobi',
    scheme: 'Annual Plan 2025-26',
    name_of_work: 'Strengthening from Km 63/2 - 71/700 & Km 95/0 - 101/4 including CD works & Protective works & Balance work of widening two lane with paved shoulders from km 81/4- 95/0 (Km 414/4 -428/0 of NH 67) (Job no NH-67(New NH-181)- TN-2019-20 - 907) including strengthening, CD works, protective works & Construction of pedestrian subway on NH 181 (Coimbatore – Ooty Gundelpet road) in the state of Tamilnadu',
    project_cost_cr: 84.99,
    work_stage: 'TENDER_STAGE',
    progress_percent: null,
    probable_completion_date: null,
    stage_remarks: 'CoT Proposal sent to DG(H) dated 30.06.2026',
    delete_status: 'ACTIVE',
  },
  {
    s_no: 15,
    division: 'Madurai',
    scheme: 'CRIF 2025-26',
    name_of_work: 'Formation of Vaigai River North Bank Road Kuruvikaran Salai to Anna Nagar',
    project_cost_cr: 62.88,
    work_stage: 'IN_PROGRESS',
    progress_percent: 14,
    probable_completion_date: '19.08.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 16,
    division: 'Chennai',
    scheme: 'CRIF 2025-26',
    name_of_work: 'Strengthening from Km 30/4 - 36/6, 38/7 - 47/0 of Marmalong Bridge - Irumbuliyur - Vandalur - Mudichur - Oragadam - Walajabad Road (SH 48)',
    project_cost_cr: 62.00,
    work_stage: 'IN_PROGRESS',
    progress_percent: 5,
    probable_completion_date: '03.03.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 17,
    division: 'Vellore',
    scheme: 'CRIF 2025-26',
    name_of_work: 'Widening from Two Lane to Four Lane and Strengthening of Polur Chengam Road SH-133',
    project_cost_cr: 82.02,
    work_stage: 'IN_PROGRESS',
    progress_percent: 10,
    probable_completion_date: '11.09.2027',
    stage_remarks: null,
    delete_status: 'ACTIVE',
  },
  {
    s_no: 18,
    division: 'Coimbatore',
    scheme: 'Annual Plan 2025-26',
    name_of_work: 'Construction of Fly over from Km 3/0 – 5/4 of NH 181 at Singanallur junction in Coimbatore City, including permanent rectification of black spot in Vasantha Mill Junction (TN 02-247) and Uzhavar santhai junction (TN 02-575) on EPC mode in the state of Tamil Nadu',
    project_cost_cr: 170.89,
    work_stage: 'TENDER_STAGE',
    progress_percent: null,
    probable_completion_date: null,
    stage_remarks: 'LOA issued on 10.07.2026.',
    delete_status: 'ACTIVE',
  },
];

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
      // Return memory fallback if database client not ready
      let list = INITIAL_50CR_PROJECTS.map((p, idx) => ({ ...p, id: `proj-${idx + 1}` }));
      if (divisionParam && divisionParam !== 'ALL') {
        list = list.filter((p) => p.division.toLowerCase() === divisionParam.toLowerCase());
      }
      if (stageParam && stageParam !== 'ALL') {
        list = list.filter((p) => p.work_stage === stageParam);
      }
      if (searchParam) {
        list = list.filter(
          (p) =>
            p.name_of_work.toLowerCase().includes(searchParam) ||
            p.scheme.toLowerCase().includes(searchParam) ||
            p.division.toLowerCase().includes(searchParam)
        );
      }
      return NextResponse.json({
        success: true,
        projects: list,
        totalCount: list.length,
      });
    }

    // Check if table has data; if 0 rows, auto-seed with ground-truth PPT data
    const { count, error: countErr } = await supabase
      .from('major_projects_50cr')
      .select('*', { count: 'exact', head: true });

    if (!countErr && (count === 0 || count === null)) {
      try {
        await supabase.from('major_projects_50cr').insert(INITIAL_50CR_PROJECTS);
      } catch (seedErr) {
        console.warn('Auto-seed major_projects_50cr note:', seedErr);
      }
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
      // If table doesn't exist yet, return initial seed data
      return NextResponse.json({
        success: true,
        projects: INITIAL_50CR_PROJECTS.map((p, idx) => ({ ...p, id: `proj-${idx + 1}` })),
        totalCount: INITIAL_50CR_PROJECTS.length,
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
