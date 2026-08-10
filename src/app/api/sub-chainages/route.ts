import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export interface SubChainageStretch {
  id: string;
  highway_code: string;
  breakdown_type?: 'MICRO_LANE' | 'MACRO_PCU' | string | null;
  division_name?: string | null;
  stretch_name?: string | null;
  from_km: number;
  to_km: number;
  length_km: number;
  lane_configuration: string;
  pcu_count: number;
  dpr_status?: string | null;
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
    const code = searchParams.get('code')?.trim().toUpperCase() || searchParams.get('highwayCode')?.trim().toUpperCase() || '';
    const typeParam = searchParams.get('type')?.trim().toUpperCase(); // 'MACRO_PCU' | 'MICRO_LANE'
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'highway_code query parameter is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ success: true, subChainages: [] });
    }

    const plainNum = code.replace(/^NH-?/i, '');
    const searchCodes = Array.from(new Set([code, `NH-${plainNum}`, plainNum]));

    let query = supabase
      .from('highway_sub_chainages')
      .select('*')
      .in('highway_code', searchCodes)
      .order('from_km', { ascending: true });

    if (typeParam) {
      query = query.eq('breakdown_type', typeParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error in GET /api/sub-chainages:', error);
      return NextResponse.json({ success: false, message: error.message, subChainages: [] }, { status: 500 });
    }

    let filteredData = (data || []).filter(
      (item: any) =>
        includeDeleted ||
        !item.delete_status ||
        (item.delete_status !== 'DELETED' && item.delete_status !== 'SOFT_DELETE')
    );

    // If typeParam specified and schema didn't filter DB side, double check in memory
    if (typeParam) {
      const typeFiltered = filteredData.filter((item: any) => !item.breakdown_type || item.breakdown_type === typeParam);
      if (typeFiltered.length > 0) {
        filteredData = typeFiltered;
      }
    }

    return NextResponse.json({
      success: true,
      subChainages: filteredData,
      totalCount: filteredData.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg, subChainages: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Database client not connected' }, { status: 500 });
    }

    const body = await request.json();
    const {
      id,
      highway_code,
      breakdown_type,
      division_name,
      stretch_name,
      from_km,
      to_km,
      length_km,
      lane_configuration,
      pcu_count,
      dpr_status,
      delete_status,
    } = body;

    if (!highway_code) {
      return NextResponse.json({ success: false, message: 'Highway code is required' }, { status: 400 });
    }

    const parsedFrom = Number(from_km) || 0;
    const parsedTo = Number(to_km) || 0;
    const parsedLen = Number(length_km) || Math.max(0, parsedTo - parsedFrom);

    const payload: Record<string, unknown> = {
      breakdown_type: breakdown_type || 'MICRO_LANE',
      division_name: division_name?.trim() || null,
      stretch_name: stretch_name?.trim() || null,
      from_km: parsedFrom,
      to_km: parsedTo,
      length_km: parsedLen,
      lane_configuration: lane_configuration || '2-Lane',
      pcu_count: Number(pcu_count) || 0,
      dpr_status: dpr_status?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      // UPDATE
      let { data, error } = await supabase
        .from('highway_sub_chainages')
        .update({ ...payload, delete_status: delete_status || 'ACTIVE' })
        .eq('id', id)
        .select();

      if (error && error.message?.includes('delete_status')) {
        const { data: dataFallback, error: errorFallback } = await supabase
          .from('highway_sub_chainages')
          .update(payload)
          .eq('id', id)
          .select();
        data = dataFallback;
        error = errorFallback;
      }

      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      return NextResponse.json({ success: true, subChainage: data?.[0] });
    }

    // INSERT
    const insertPayload = {
      ...payload,
      highway_code: highway_code.trim().toUpperCase(),
      delete_status: delete_status || 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    let { data, error } = await supabase.from('highway_sub_chainages').insert([insertPayload]).select();

    if (error && (error.message?.includes('delete_status') || error.message?.includes('breakdown_type'))) {
      const { delete_status: _ds, breakdown_type: _bt, ...insertFallback }: any = insertPayload;
      const { data: dataFallback, error: errorFallback } = await supabase
        .from('highway_sub_chainages')
        .insert([insertFallback])
        .select();
      data = dataFallback;
      error = errorFallback;
    }

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, subChainage: data?.[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export const PATCH = POST;
export const PUT = POST;

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Sub-chainage ID is required' }, { status: 400 });
    }

    if (supabase) {
      if (hard) {
        // Hard Delete
        const { error } = await supabase.from('highway_sub_chainages').delete().eq('id', id);
        if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      } else {
        // Soft Delete: update delete_status to 'DELETED'
        const { error } = await supabase
          .from('highway_sub_chainages')
          .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          const { error: hardErr } = await supabase.from('highway_sub_chainages').delete().eq('id', id);
          if (hardErr) return NextResponse.json({ success: false, message: hardErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Sub-chainage stretch soft-deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
