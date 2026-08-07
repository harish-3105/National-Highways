import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export interface HighwayCorridor {
  id: string;
  road_code: string;
  road_name: string;
  from_location: string | null;
  to_location: string | null;
  from_chainage: string | null;
  to_chainage: string | null;
  length_km: number;
  configuration: string;
  status: string;
  delete_status?: string;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  created_at: string;
  updated_at: string;
  dlp_count?: number;
}

export interface HighwaysApiResponse {
  success: boolean;
  message?: string;
  corridors: HighwayCorridor[];
  aggregates: {
    totalCorridors: number;
    totalLengthKm: number;
    laneDistribution: Record<string, number>;
    corridorsWithDlp: number;
  };
}

function getSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
  const supabaseKey = rawKey.replace(/^["']|["']$/g, '').trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Server Config Error: Missing Supabase credentials.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

// ----------------------------------------------------------------------
// GET: Fetch Active Highways Catalog & Aggregates
// ----------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const configFilter = searchParams.get('config')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'length_desc';

    // Fetch master highway corridors, excluding soft-deleted records
    const { data: rawHighways, error: highwaysError } = await supabase
      .from('highways')
      .select('*')
      .neq('status', 'DELETED');

    if (highwaysError) {
      return NextResponse.json(
        {
          success: false,
          message: `Database error querying highways: ${highwaysError.message}`,
          corridors: [],
          aggregates: {
            totalCorridors: 0,
            totalLengthKm: 0,
            laneDistribution: {},
            corridorsWithDlp: 0,
          },
        },
        { status: 500 }
      );
    }

    const allCorridors: HighwayCorridor[] = (rawHighways || []).filter(
      (c) => c.delete_status !== 'DELETED'
    );

    // Fetch DLP contracts to map DLP coverage counts
    const { data: dlpContracts } = await supabase
      .from('dlp_contracts')
      .select('highway_code');

    const dlpCountsMap = new Map<string, number>();
    if (dlpContracts) {
      dlpContracts.forEach((contract: { highway_code: string }) => {
        const code = contract.highway_code?.toUpperCase();
        if (code) {
          dlpCountsMap.set(code, (dlpCountsMap.get(code) || 0) + 1);
        }
      });
    }

    // Attach dlp_count to each corridor
    const enrichedCorridors = allCorridors.map((c) => ({
      ...c,
      dlp_count: dlpCountsMap.get(c.road_code.toUpperCase()) || 0,
    }));

    // Global KPI Aggregates
    const totalCorridors = enrichedCorridors.length;
    const totalLengthKm =
      Math.round(
        enrichedCorridors.reduce((sum, c) => sum + (Number(c.length_km) || 0), 0) * 1000
      ) / 1000;

    const laneDistribution: Record<string, number> = {};
    let corridorsWithDlp = 0;

    enrichedCorridors.forEach((c) => {
      const cfg = c.configuration || '2-Lane';
      laneDistribution[cfg] = (laneDistribution[cfg] || 0) + 1;
      if ((c.dlp_count || 0) > 0) {
        corridorsWithDlp++;
      }
    });

    // Apply Search Filter
    let filtered = enrichedCorridors;
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.road_code.toLowerCase().includes(search) ||
          c.road_name.toLowerCase().includes(search) ||
          (c.from_location && c.from_location.toLowerCase().includes(search)) ||
          (c.to_location && c.to_location.toLowerCase().includes(search))
      );
    }

    // Apply Configuration Filter
    if (configFilter && configFilter !== 'ALL') {
      filtered = filtered.filter(
        (c) => c.configuration.toLowerCase() === configFilter.toLowerCase()
      );
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'length_desc') {
        return (Number(b.length_km) || 0) - (Number(a.length_km) || 0);
      }
      if (sortBy === 'length_asc') {
        return (Number(a.length_km) || 0) - (Number(b.length_km) || 0);
      }
      if (sortBy === 'road_code_asc') {
        return a.road_code.localeCompare(b.road_code, undefined, { numeric: true });
      }
      return 0;
    });

    return NextResponse.json({
      success: true,
      corridors: filtered,
      aggregates: {
        totalCorridors,
        totalLengthKm,
        laneDistribution,
        corridorsWithDlp,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Server Error: ${err.message}`,
        corridors: [],
        aggregates: {
          totalCorridors: 0,
          totalLengthKm: 0,
          laneDistribution: {},
          corridorsWithDlp: 0,
        },
      },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// POST: Add New Master Highway Corridor
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      road_code,
      road_name,
      from_location,
      to_location,
      from_chainage,
      to_chainage,
      length_km,
      configuration,
    } = body;

    // Parameter Validation
    if (!road_code || !road_code.trim()) {
      return NextResponse.json(
        { success: false, message: 'Road Code (e.g. NH-181) is required.' },
        { status: 400 }
      );
    }

    if (!road_name || !road_name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Road Name / Section Title is required.' },
        { status: 400 }
      );
    }

    const numericLength = parseFloat(length_km);
    if (isNaN(numericLength) || numericLength <= 0) {
      return NextResponse.json(
        { success: false, message: 'Length in km must be a valid positive number.' },
        { status: 400 }
      );
    }

    // Normalize road code to uppercase e.g. "nh-181" -> "NH-181"
    const formattedRoadCode = road_code.trim().toUpperCase().startsWith('NH-')
      ? road_code.trim().toUpperCase()
      : `NH-${road_code.trim().replace(/^NH-?/i, '').toUpperCase()}`;

    // Check collision on road_code
    const { data: existing } = await supabase
      .from('highways')
      .select('id, status')
      .eq('road_code', formattedRoadCode)
      .neq('status', 'DELETED')
      .maybeSingle();

    if (existing && (existing as any).status !== 'DELETED') {
      return NextResponse.json(
        {
          success: false,
          message: `Highway with Road Code "${formattedRoadCode}" already exists in the catalog.`,
        },
        { status: 409 }
      );
    }

    // Insert new corridor record into PostgreSQL with graceful delete_status fallback
    const basePayload = {
      road_code: formattedRoadCode,
      road_name: road_name.trim(),
      from_location: from_location?.trim() || null,
      to_location: to_location?.trim() || null,
      from_chainage: from_chainage?.trim() || '0',
      to_chainage: to_chainage?.trim() || String(numericLength),
      length_km: Math.round(numericLength * 1000) / 1000,
      configuration: configuration || '2-Lane',
      status: 'ACTIVE',
    };

    let insertedRecord = null;
    let insertErrMessage = '';

    // Attempt 1: Try insert with delete_status
    const { data: res1, error: err1 } = await supabase
      .from('highways')
      .insert([{ ...basePayload, delete_status: 'KEEP' }])
      .select();

    if (res1 && res1.length > 0) {
      insertedRecord = res1[0];
    } else if (err1 && err1.message?.includes('delete_status')) {
      // Attempt 2: Fallback without delete_status if column is not yet in Supabase schema cache
      const { data: res2, error: err2 } = await supabase
        .from('highways')
        .insert([basePayload])
        .select();

      if (res2 && res2.length > 0) {
        insertedRecord = res2[0];
      } else if (err2) {
        insertErrMessage = err2.message;
      }
    } else if (err1) {
      insertErrMessage = err1.message;
    }

    if (!insertedRecord) {
      return NextResponse.json(
        { success: false, message: `Database insert failed: ${insertErrMessage || 'Unknown error inserting highway.'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Highway ${formattedRoadCode} created successfully.`,
      corridor: insertedRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Server Error: ${err.message}` },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// PATCH: Edit Highway Corridor Details (road_code is read-only)
// ----------------------------------------------------------------------
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      id,
      road_name,
      from_location,
      to_location,
      from_chainage,
      to_chainage,
      length_km,
      configuration,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Corridor ID is required for edit.' },
        { status: 400 }
      );
    }

    if (!road_name || !road_name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Road Name cannot be empty.' },
        { status: 400 }
      );
    }

    const numericLength = parseFloat(length_km);
    if (isNaN(numericLength) || numericLength <= 0) {
      return NextResponse.json(
        { success: false, message: 'Length in km must be a positive number.' },
        { status: 400 }
      );
    }

    const updatePayload = {
      road_name: road_name.trim(),
      from_location: from_location?.trim() || null,
      to_location: to_location?.trim() || null,
      from_chainage: from_chainage?.trim() || '0',
      to_chainage: to_chainage?.trim() || String(numericLength),
      length_km: Math.round(numericLength * 1000) / 1000,
      configuration: configuration || '2-Lane',
      status: status || 'ACTIVE',
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from('highways')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: `Database update failed: ${updateError.message}. If RLS policy error, please execute migration 0003_fix_rls_update_policies.sql in Supabase SQL Editor.`,
        },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Database update returned 0 rows. Please ensure RLS UPDATE policy with "WITH CHECK (true)" is executed in Supabase SQL Editor (see migration 0003_fix_rls_update_policies.sql).`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Highway corridor updated successfully.`,
      corridor: updatedRows[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Server Error: ${err.message}` },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// DELETE: Soft-Delete Highway Corridor (Sets delete_status = 'DELETED')
// ----------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Corridor ID parameter is required for deletion.' },
        { status: 400 }
      );
    }

    // Execute soft delete data keepsake retention update
    const { data: deletedRows, error: deleteError } = await supabase
      .from('highways')
      .update({
        delete_status: 'DELETED',
        status: 'DELETED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (deleteError) {
      return NextResponse.json(
        { success: false, message: `Database soft-delete failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Database soft-delete returned 0 rows. Please execute migration 0003_fix_rls_update_policies.sql in Supabase SQL Editor.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Highway corridor soft-deleted and archived in database.`,
      corridor: deletedRows[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Server Error: ${err.message}` },
      { status: 500 }
    );
  }
}
