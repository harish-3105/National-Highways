import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export interface HighwayCorridor {
  id: string;
  road_code: string;
  road_name: string;
  old_nh_no?: string | null;
  new_nh_no?: string | null;
  from_location: string | null;
  to_location: string | null;
  from_chainage: string | null;
  to_chainage: string | null;
  length_km: number;
  length_less_than_2l?: number;
  length_2l?: number;
  length_2l_ps?: number;
  length_4l?: number;
  length_6l?: number;
  configuration: string;
  division_name?: string | null;
  status: string;
  start_latitude?: number | null;
  start_longitude?: number | null;
  end_latitude?: number | null;
  end_longitude?: number | null;
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
    laneLengthsKm: {
      lessThan2l: number;
      lane2l: number;
      lane2lPs: number;
      lane4l: number;
      lane6l: number;
    };
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
    const session = await getSession();
    const rawIncludeDeleted = searchParams.get('includeDeleted') === 'true';
    const includeDeleted = rawIncludeDeleted && canPerformAction(session, 'system:view_archived').allowed;

    let allCorridors: HighwayCorridor[] = [];

    if (supabase) {
      let query = supabase.from('highways').select('*').order('created_at', { ascending: false });
      if (!includeDeleted) {
        query = query.neq('status', 'DELETED');
      }
      const { data: rawHighways } = await query;

      if (rawHighways) {
        allCorridors = rawHighways;

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

        const { data: subChainagesData } = await supabase
          .from('highway_sub_chainages')
          .select('highway_code, division_name')
          .not('division_name', 'is', null);
        const subDivisionMap = new Map<string, string>();
        if (subChainagesData) {
          subChainagesData.forEach((s: { highway_code: string; division_name: string }) => {
            const code = s.highway_code?.toUpperCase();
            if (code && s.division_name && !subDivisionMap.has(code)) {
              subDivisionMap.set(code, s.division_name);
            }
          });
        }

        allCorridors = allCorridors.map((c) => ({
          ...c,
          division_name: c.division_name || subDivisionMap.get(c.road_code?.toUpperCase()) || null,
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
    const laneLengthsKm = {
      lessThan2l: 0,
      lane2l: 0,
      lane2lPs: 0,
      lane4l: 0,
      lane6l: 0,
    };
    let corridorsWithDlp = 0;

    allCorridors.forEach((c) => {
      const cfg = c.configuration?.trim() || 'Unspecified';
      laneDistribution[cfg] = (laneDistribution[cfg] || 0) + 1;

      laneLengthsKm.lessThan2l += Number(c.length_less_than_2l) || 0;
      laneLengthsKm.lane2l += Number(c.length_2l) || 0;
      laneLengthsKm.lane2lPs += Number(c.length_2l_ps) || 0;
      laneLengthsKm.lane4l += Number(c.length_4l) || 0;
      laneLengthsKm.lane6l += Number(c.length_6l) || 0;

      if ((c.dlp_count || 0) > 0) {
        corridorsWithDlp++;
      }
    });

    laneLengthsKm.lessThan2l = Math.round(laneLengthsKm.lessThan2l * 1000) / 1000;
    laneLengthsKm.lane2l = Math.round(laneLengthsKm.lane2l * 1000) / 1000;
    laneLengthsKm.lane2lPs = Math.round(laneLengthsKm.lane2lPs * 1000) / 1000;
    laneLengthsKm.lane4l = Math.round(laneLengthsKm.lane4l * 1000) / 1000;
    laneLengthsKm.lane6l = Math.round(laneLengthsKm.lane6l * 1000) / 1000;

    // Filtering & Sorting
    let filtered = allCorridors;
    if (search) {
      filtered = filtered.filter(
        (c) =>
          (c.road_code && c.road_code.toLowerCase().includes(search)) ||
          (c.road_name && c.road_name.toLowerCase().includes(search)) ||
          (c.old_nh_no && c.old_nh_no.toLowerCase().includes(search)) ||
          (c.new_nh_no && c.new_nh_no.toLowerCase().includes(search)) ||
          (c.from_location && c.from_location.toLowerCase().includes(search)) ||
          (c.to_location && c.to_location.toLowerCase().includes(search))
      );
    }

    if (configFilter && configFilter !== 'ALL') {
      if (configFilter === '4-Lane') {
        filtered = filtered.filter(
          (c) =>
            c.configuration === '4-Lane' ||
            c.configuration === '4-Lane (Paved Shoulder)' ||
            (Number(c.length_4l) || 0) > 0
        );
      } else if (configFilter === '6-Lane') {
        filtered = filtered.filter(
          (c) =>
            c.configuration === '6-Lane' ||
            c.configuration === '6-Lane+' ||
            (Number(c.length_6l) || 0) > 0
        );
      } else if (configFilter === '2-Lane (Paved Shoulder)') {
        filtered = filtered.filter(
          (c) =>
            c.configuration === '2-Lane (Paved Shoulder)' ||
            (Number(c.length_2l_ps) || 0) > 0
        );
      } else if (configFilter === '2-Lane') {
        filtered = filtered.filter(
          (c) =>
            c.configuration === '2-Lane' ||
            (Number(c.length_2l) || 0) > 0
        );
      } else {
        filtered = filtered.filter((c) => c.configuration === configFilter);
      }
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
        laneLengthsKm,
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
          laneLengthsKm: { lessThan2l: 0, lane2l: 0, lane2lPs: 0, lane4l: 0, lane6l: 0 },
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

    const session = await getSession();
    const body = await request.json();
    const isRestore = body.action === 'restore';
    const isEdit = Boolean(body.id);
    const requiredPerm = isRestore ? 'highways:restore' : isEdit ? 'highways:edit' : 'highways:create';

    let authCheck = canPerformAction(session, requiredPerm);
    if (!authCheck.allowed && isRestore) {
      authCheck = canPerformAction(session, 'highways:edit');
    }

    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    const {
      id,
      road_code,
      road_name,
      old_nh_no,
      new_nh_no,
      from_location,
      to_location,
      from_chainage,
      to_chainage,
      length_km,
      length_less_than_2l,
      length_2l,
      length_2l_ps,
      length_4l,
      length_6l,
      configuration,
    } = body;

    // UPDATE / EDIT MODE
    if (id) {
      const { data: oldHighway } = await supabase.from('highways').select('*').eq('id', id).maybeSingle();

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (road_code) updatePayload.road_code = road_code.trim().toUpperCase();
      if (road_name) updatePayload.road_name = road_name.trim();
      if (old_nh_no !== undefined) updatePayload.old_nh_no = old_nh_no?.trim() || null;
      if (new_nh_no !== undefined) updatePayload.new_nh_no = new_nh_no?.trim() || null;
      if (from_location !== undefined) updatePayload.from_location = from_location?.trim() || null;
      if (to_location !== undefined) updatePayload.to_location = to_location?.trim() || null;
      if (from_chainage !== undefined) updatePayload.from_chainage = from_chainage?.trim() || null;
      if (to_chainage !== undefined) updatePayload.to_chainage = to_chainage?.trim() || null;
      if (length_km !== undefined) updatePayload.length_km = Number(length_km) || 0;
      if (length_less_than_2l !== undefined) updatePayload.length_less_than_2l = Number(length_less_than_2l) || 0;
      if (length_2l !== undefined) updatePayload.length_2l = Number(length_2l) || 0;
      if (length_2l_ps !== undefined) updatePayload.length_2l_ps = Number(length_2l_ps) || 0;
      if (length_4l !== undefined) updatePayload.length_4l = Number(length_4l) || 0;
      if (length_6l !== undefined) updatePayload.length_6l = Number(length_6l) || 0;
      if (configuration) updatePayload.configuration = configuration;
      if (body.status) updatePayload.status = body.status;
      if (body.action === 'restore') updatePayload.status = 'ACTIVE';

      const { data, error } = await supabase.from('highways').update(updatePayload).eq('id', id).select();
      if (!error && data && data[0]) {
        const updated = data[0];
        const isRestored = body.action === 'restore' || (oldHighway?.status === 'DELETED' && updated.status === 'ACTIVE');
        // Log Tamper-Proof Audit
        if (session) {
          await logAudit({
            actor: session,
            module: 'HIGHWAYS',
            action: isRestored ? 'RESTORE' : 'UPDATE',
            entityId: id,
            entityTitle: `Highway Corridor: ${updated.road_code} (${updated.road_name})`,
            changesSummary: isRestored
              ? `Restored archived highway corridor ${updated.road_code}`
              : `Updated highway corridor metadata for ${updated.road_code}`,
            oldState: oldHighway,
            newState: updated,
          });
        }

        return NextResponse.json({ success: true, corridor: updated });
      }
      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: false, message: 'Corridor record not found for update' }, { status: 404 });
    }

    // CREATE / INSERT MODE
    if (!road_code || !road_name) {
      return NextResponse.json({ success: false, message: 'Road code and road name are required for new highways' }, { status: 400 });
    }

    const insertPayload = {
      road_code: road_code.trim().toUpperCase(),
      road_name: road_name.trim(),
      old_nh_no: old_nh_no?.trim() || null,
      new_nh_no: new_nh_no?.trim() || null,
      from_location: from_location?.trim() || null,
      to_location: to_location?.trim() || null,
      from_chainage: from_chainage?.trim() || null,
      to_chainage: to_chainage?.trim() || null,
      length_km: Number(length_km) || 0,
      length_less_than_2l: Number(length_less_than_2l) || 0,
      length_2l: Number(length_2l) || 0,
      length_2l_ps: Number(length_2l_ps) || 0,
      length_4l: Number(length_4l) || 0,
      length_6l: Number(length_6l) || 0,
      configuration: configuration?.trim() || 'Unspecified',
      status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('highways').insert([insertPayload]).select();
    if (!error && data && data[0]) {
      const created = data[0];
      // Log Tamper-Proof Audit
      if (session) {
        await logAudit({
          actor: session,
          module: 'HIGHWAYS',
          action: 'CREATE',
          entityId: created.id,
          entityTitle: `Highway Corridor: ${created.road_code} (${created.road_name})`,
          changesSummary: `Registered new highway corridor ${created.road_code} (${created.length_km} Km)`,
          newState: created,
        });
      }

      return NextResponse.json({ success: true, corridor: created });
    }
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, corridor: { ...insertPayload, id: `hw-${Date.now()}` } });
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

    if (!id) {
      return NextResponse.json({ success: false, message: 'Highway ID is required' }, { status: 400 });
    }

    const session = await getSession();
    const authCheck = canPerformAction(session, 'highways:delete');
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    if (supabase) {
      const { data: existingHw } = await supabase.from('highways').select('*').eq('id', id).maybeSingle();

      const { error } = await supabase
        .from('highways')
        .update({ status: 'DELETED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }

      // Log Tamper-Proof Audit
      if (session && existingHw) {
        await logAudit({
          actor: session,
          module: 'HIGHWAYS',
          action: 'DELETE',
          entityId: id,
          entityTitle: `Highway Corridor: ${existingHw.road_code}`,
          changesSummary: `Soft-deleted highway corridor ${existingHw.road_code}`,
          oldState: existingHw,
        });
      }
    }

    return NextResponse.json({ success: true, message: `Highway ${id} deleted successfully` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
