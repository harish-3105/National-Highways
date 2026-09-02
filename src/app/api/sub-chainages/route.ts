import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit/logger';

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
  important_town?: string | null;
  row_width?: string | null;
  carriageway_width?: string | null;
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

    let { data, error } = await query;

    // Fallback: If typeParam filter returns 0 rows (because breakdown_type column is NULL in DB), fetch all rows for code
    if ((!data || data.length === 0) && typeParam) {
      const { data: fallbackData } = await supabase
        .from('highway_sub_chainages')
        .select('*')
        .in('highway_code', searchCodes)
        .order('from_km', { ascending: true });

      if (fallbackData && fallbackData.length > 0) {
        data = fallbackData;
        error = null;
      }
    }

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

    // Filter in-memory by typeParam if DB has breakdown_type populated
    if (typeParam) {
      const typeFiltered = filteredData.filter((item: any) => item.breakdown_type === typeParam);
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

    const session = await getSession();
    const body = await request.json();
    const isEdit = Boolean(body.id);
    const requiredPerm = isEdit ? 'sub_chainages:edit' : 'sub_chainages:create';

    const authCheck = canPerformAction(session, requiredPerm);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

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
      important_town,
      row_width,
      carriageway_width,
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
      important_town: important_town?.trim() || null,
      row_width: row_width?.trim() || null,
      carriageway_width: carriageway_width?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { data: oldSub } = await supabase.from('highway_sub_chainages').select('*').eq('id', id).maybeSingle();

      // UPDATE
      let { data, error } = await supabase
        .from('highway_sub_chainages')
        .update({ ...payload, delete_status: delete_status || 'ACTIVE' })
        .eq('id', id)
        .select();

      if (error && (error.message?.includes('delete_status') || error.message?.includes('breakdown_type'))) {
        const { delete_status: _ds, breakdown_type: _bt, ...payloadFallback }: any = payload;
        const { data: dataFallback, error: errorFallback } = await supabase
          .from('highway_sub_chainages')
          .update(payloadFallback)
          .eq('id', id)
          .select();
        data = dataFallback;
        error = errorFallback;
      }

      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      const updated = data?.[0];

      // Log Tamper-Proof Audit
      if (session && updated) {
        await logAudit({
          actor: session,
          module: 'HIGHWAYS',
          action: 'UPDATE',
          entityId: id,
          entityTitle: `Sub-Chainage: ${updated.highway_code} (Km ${updated.from_km}–${updated.to_km})`,
          changesSummary: `Updated sub-chainage stretch for ${updated.highway_code}`,
          oldState: oldSub,
          newState: updated,
        });
      }

      return NextResponse.json({ success: true, subChainage: updated });
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
    const created = data?.[0];

    // Log Tamper-Proof Audit
    if (session && created) {
      await logAudit({
        actor: session,
        module: 'HIGHWAYS',
        action: 'CREATE',
        entityId: created.id,
        entityTitle: `Sub-Chainage: ${created.highway_code} (Km ${created.from_km}–${created.to_km})`,
        changesSummary: `Added new sub-chainage stretch for ${created.highway_code} (${created.lane_configuration})`,
        newState: created,
      });
    }

    return NextResponse.json({ success: true, subChainage: created });
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

    const session = await getSession();
    const authCheck = canPerformAction(session, 'sub_chainages:delete');
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    if (supabase) {
      const { data: existingSub } = await supabase.from('highway_sub_chainages').select('*').eq('id', id).maybeSingle();

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

      // Log Tamper-Proof Audit
      if (session && existingSub) {
        await logAudit({
          actor: session,
          module: 'HIGHWAYS',
          action: 'DELETE',
          entityId: id,
          entityTitle: `Sub-Chainage: ${existingSub.highway_code} (Km ${existingSub.from_km}–${existingSub.to_km})`,
          changesSummary: `Soft-deleted sub-chainage stretch for ${existingSub.highway_code}`,
          oldState: existingSub,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Sub-chainage stretch soft-deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
