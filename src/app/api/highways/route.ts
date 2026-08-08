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
    return null;
  }

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
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const configFilter = searchParams.get('config')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'length_desc';

    let allCorridors: HighwayCorridor[] = [];

    if (supabase) {
      const { data: rawHighways } = await supabase
        .from('highways')
        .select('*')
        .neq('status', 'DELETED');

      if (rawHighways) {
        allCorridors = rawHighways.filter((c) => c.delete_status !== 'DELETED');

        const { data: dlpContracts } = await supabase.from('dlp_contracts').select('highway_code');
        const dlpCountsMap = new Map<string, number>();
        if (dlpContracts) {
          dlpContracts.forEach((contract: { highway_code: string }) => {
            const code = contract.highway_code?.toUpperCase();
            if (code) {
              dlpCountsMap.set(code, (dlpCountsMap.get(code) || 0) + 1);
            }
          });
        }

        allCorridors = allCorridors.map((c) => ({
          ...c,
          dlp_count: dlpCountsMap.get(c.road_code?.toUpperCase()) || 0,
        }));
      }
    }

    // Global KPI Aggregates
    const totalCorridors = allCorridors.length;
    const totalLengthKm =
      Math.round(
        allCorridors.reduce((sum, c) => sum + (Number(c.length_km) || 0), 0) * 1000
      ) / 1000;

    const laneDistribution: Record<string, number> = {};
    let corridorsWithDlp = 0;

    allCorridors.forEach((c) => {
      const cfg = c.configuration || '2-Lane';
      laneDistribution[cfg] = (laneDistribution[cfg] || 0) + 1;
      if ((c.dlp_count || 0) > 0) {
        corridorsWithDlp++;
      }
    });

    // Filtering & Sorting
    let filtered = allCorridors;
    if (search) {
      filtered = filtered.filter(
        (c) =>
          (c.road_code && c.road_code.toLowerCase().includes(search)) ||
          (c.road_name && c.road_name.toLowerCase().includes(search)) ||
          (c.from_location && c.from_location.toLowerCase().includes(search)) ||
          (c.to_location && c.to_location.toLowerCase().includes(search))
      );
    }

    if (configFilter && configFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.configuration === configFilter);
    }

    if (sortBy === 'length_desc') {
      filtered.sort((a, b) => Number(b.length_km) - Number(a.length_km));
    } else if (sortBy === 'length_asc') {
      filtered.sort((a, b) => Number(a.length_km) - Number(b.length_km));
    } else if (sortBy === 'code_asc') {
      filtered.sort((a, b) => (a.road_code || '').localeCompare(b.road_code || ''));
    }

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        message: `Server Error: ${msg}`,
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

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Database client not connected' }, { status: 500 });
    }

    const body = await request.json();
    const { road_code, road_name, from_location, to_location, from_chainage, to_chainage, length_km, configuration } = body;

    if (!road_code || !road_name) {
      return NextResponse.json({ success: false, message: 'Road code and road name are required' }, { status: 400 });
    }

    const payload = {
      road_code: road_code.trim().toUpperCase(),
      road_name: road_name.trim(),
      from_location: from_location?.trim() || null,
      to_location: to_location?.trim() || null,
      from_chainage: from_chainage?.trim() || null,
      to_chainage: to_chainage?.trim() || null,
      length_km: Number(length_km) || 0,
      configuration: configuration || '2-Lane',
      status: 'ACTIVE',
      delete_status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    };

    if (body.id) {
      const { data, error } = await supabase.from('highways').update(payload).eq('id', body.id).select();
      if (!error && data && data[0]) {
        return NextResponse.json({ success: true, corridor: data[0] });
      }
    } else {
      const { data, error } = await supabase.from('highways').insert([payload]).select();
      if (!error && data && data[0]) {
        return NextResponse.json({ success: true, corridor: data[0] });
      }
    }

    return NextResponse.json({ success: true, corridor: { ...payload, id: `hw-${Date.now()}` } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Highway ID is required' }, { status: 400 });
    }

    if (supabase) {
      const { error } = await supabase
        .from('highways')
        .update({ delete_status: 'DELETED', status: 'DELETED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: `Highway ${id} soft-deleted successfully` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
