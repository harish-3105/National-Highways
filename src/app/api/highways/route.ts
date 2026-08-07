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

export async function GET(request: Request) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const rawKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
    const supabaseKey = rawKey.replace(/^["']|["']$/g, '').trim();

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Server Config Error: Missing Supabase credentials.',
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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const configFilter = searchParams.get('config')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'length_desc';

    // 1. Fetch all master highway corridors
    let query = supabase.from('highways').select('*');

    const { data: rawHighways, error: highwaysError } = await query;

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

    const allCorridors: HighwayCorridor[] = rawHighways || [];

    // 2. Fetch DLP contracts to count DLP coverage per highway
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

    // 3. Calculate Global KPI Aggregates (before user search filtering)
    const totalCorridors = enrichedCorridors.length;
    const totalLengthKm = Math.round(
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

    // 4. Apply User Filters & Search
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

    if (configFilter && configFilter !== 'ALL') {
      filtered = filtered.filter(
        (c) => c.configuration.toLowerCase() === configFilter.toLowerCase()
      );
    }

    // 5. Apply Sorting
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
