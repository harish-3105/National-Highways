import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DlpCorridor, DlpWorkStretch } from '@/types/dlp';
import { detectLaneWidthForChainage, checkSpanWidthCapacity } from '@/lib/dlp/laneDetection';

export const dynamic = 'force-dynamic';

function computeStretchLiveStatus(stretch: DlpWorkStretch): DlpWorkStretch {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysRemaining: number | undefined = undefined;
  let computedStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'COMPLETED' = 'ACTIVE';

  if (stretch.category === 'CONSTRUCTION') {
    if (Number(stretch.physical_progress_pct || 0) >= 100) {
      computedStatus = 'COMPLETED';
    } else {
      computedStatus = 'ACTIVE';
    }
  } else if (stretch.dlp_till_date) {
    const expiry = new Date(stretch.dlp_till_date);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      computedStatus = 'EXPIRED';
    } else if (daysRemaining <= 90) {
      computedStatus = 'EXPIRING_SOON';
    } else {
      computedStatus = 'ACTIVE';
    }
  } else if (stretch.category === 'NO_DLP') {
    computedStatus = 'EXPIRED';
  }

  return {
    ...stretch,
    days_remaining: daysRemaining,
    computed_status: computedStatus,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const highwayCode = searchParams.get('highway_code');
    const division = searchParams.get('division');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    let query = supabase
      .from('dlp_corridors')
      .select('*, dlp_work_stretches(*)')
      .order('created_at', { ascending: false });

    if (highwayCode) query = query.eq('highway_code', highwayCode);
    if (division) query = query.ilike('division_name', `%${division}%`);

    if (includeDeleted) {
      // Return all statuses
    } else if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    } else {
      query = query.neq('status', 'DELETED');
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let corridors: DlpCorridor[] = (data || []).map((corridor: any) => {
      const stretches: DlpWorkStretch[] = (corridor.dlp_work_stretches || [])
        .filter((s: any) => includeDeleted || s.status !== 'DELETED')
        .map((s: any) => computeStretchLiveStatus({
          id: s.id,
          corridor_id: s.corridor_id,
          category: s.category,
          chainage_from_km: Number(s.chainage_from_km || 0),
          chainage_to_km: Number(s.chainage_to_km || 0),
          length_km: Number(s.length_km || 0),
          road_width_from_m: Number(s.road_width_from_m || 0),
          road_width_to_m: Number(s.road_width_to_m || 3.5),
          contractor_name: s.contractor_name || null,
          work_name: s.work_name || null,
          commencement_date: s.commencement_date || null,
          dlp_till_date: s.dlp_till_date || null,
          physical_progress_pct: s.physical_progress_pct !== null ? Number(s.physical_progress_pct) : null,
          actual_completion_date: s.actual_completion_date || null,
          dlp_period_years: s.dlp_period_years !== null ? Number(s.dlp_period_years) : null,
          scheme: s.scheme || null,
          dlp_ended_on_date: s.dlp_ended_on_date || null,
          remarks: s.remarks || null,
          status: s.status || 'ACTIVE',
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));

      return {
        id: corridor.id,
        division_name: corridor.division_name,
        highway_code: corridor.highway_code,
        from_km: Number(corridor.from_km || 0),
        to_km: Number(corridor.to_km || 0),
        total_length_km: Number(corridor.total_length_km || 0),
        remarks: corridor.remarks || null,
        status: corridor.status || 'ACTIVE',
        created_at: corridor.created_at,
        updated_at: corridor.updated_at,
        work_stretches: stretches,
      };
    });

    if (search) {
      const term = search.toLowerCase();
      corridors = corridors.filter((c) => {
        const matchesCorridor =
          c.highway_code.toLowerCase().includes(term) ||
          c.division_name.toLowerCase().includes(term) ||
          (c.remarks && c.remarks.toLowerCase().includes(term));

        const matchesStretch = c.work_stretches?.some(
          (s) =>
            (s.work_name && s.work_name.toLowerCase().includes(term)) ||
            (s.contractor_name && s.contractor_name.toLowerCase().includes(term)) ||
            (s.scheme && s.scheme.toLowerCase().includes(term)) ||
            (s.remarks && s.remarks.toLowerCase().includes(term))
        );

        return matchesCorridor || matchesStretch;
      });
    }

    return NextResponse.json({ success: true, corridors });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const {
      division_name,
      highway_code,
      from_km,
      to_km,
      total_length_km,
      remarks,
      work_stretches = [],
    } = body;

    if (!division_name || !highway_code) {
      return NextResponse.json(
        { success: false, error: 'Division name and Highway code are required' },
        { status: 400 }
      );
    }

    const numFrom = Number(from_km || 0);
    const numTo = Number(to_km || 0);
    const numLength = Number(total_length_km || Math.abs(numTo - numFrom));

    // 1. Insert Parent Corridor
    const { data: corridorData, error: corridorError } = await supabase
      .from('dlp_corridors')
      .insert([
        {
          division_name,
          highway_code,
          from_km: numFrom,
          to_km: numTo,
          total_length_km: numLength,
          remarks: remarks || null,
          status: 'ACTIVE',
        },
      ])
      .select()
      .single();

    if (corridorError || !corridorData) {
      return NextResponse.json({ success: false, error: corridorError?.message || 'Failed to create corridor' }, { status: 500 });
    }

    const corridorId = corridorData.id;

    // 2. Insert Granular Work Stretches if any
    let insertedStretches: DlpWorkStretch[] = [];
    if (Array.isArray(work_stretches) && work_stretches.length > 0) {
      // Prefetch Level 2 Sub-Chainages to auto-resolve lane widths when not provided
      const plainNum = highway_code.replace(/^NH-?/i, '');
      const searchCodes = Array.from(new Set([highway_code, `NH-${plainNum}`, plainNum]));
      const { data: subChainagesData } = await supabase
        .from('highway_sub_chainages')
        .select('*')
        .in('highway_code', searchCodes)
        .neq('delete_status', 'DELETED')
        .neq('delete_status', 'SOFT_DELETE');

      // Validate width capacity across all stretches before DB insert
      for (let i = 0; i < work_stretches.length; i++) {
        const s = work_stretches[i];
        const sFrom = Number(s.chainage_from_km || 0);
        const sTo = Number(s.chainage_to_km || 0);
        const wTo = s.road_width_to_m !== undefined && s.road_width_to_m !== null && s.road_width_to_m !== '' && Number(s.road_width_to_m) > 0
          ? Number(s.road_width_to_m)
          : detectLaneWidthForChainage(sFrom, sTo, subChainagesData || []).totalWidthMeters;

        if (subChainagesData && subChainagesData.length > 0) {
          const capacity = checkSpanWidthCapacity(sFrom, sTo, wTo, subChainagesData);
          if (!capacity.valid) {
            const b = capacity.bottlenecks[0];
            return NextResponse.json({
              success: false,
              error: `Work stretch #${i + 1} (Km ${sFrom}–${sTo}) width (${wTo}m centerline) exceeds physical road capacity on Km ${b.overlapFromKm.toFixed(3)}–${b.overlapToKm.toFixed(3)} (${b.laneConfig}: max ${b.maxAllowedCenterlineWidth}m centerline = ${b.maxAllowedCarriagewayWidth}m total). Please adjust width or split into separate entries.`,
            }, { status: 400 });
          }
        }
      }

      const stretchesToInsert = work_stretches.map((s: any) => {
        const sFrom = Number(s.chainage_from_km || 0);
        const sTo = Number(s.chainage_to_km || 0);
        const sLen = Number(s.length_km || Math.abs(sTo - sFrom));
        const wFrom = Number(s.road_width_from_m ?? 0.0);
        
        let wTo: number;
        if (s.road_width_to_m !== undefined && s.road_width_to_m !== null && s.road_width_to_m !== '' && Number(s.road_width_to_m) > 0) {
          wTo = Number(s.road_width_to_m);
        } else {
          const detected = detectLaneWidthForChainage(sFrom, sTo, subChainagesData || []);
          wTo = detected.totalWidthMeters;
        }

        let category = s.category;
        let commencementDate = s.commencement_date || null;
        let dlpTillDate = s.dlp_till_date || null;
        let progressPct = s.physical_progress_pct !== null && s.physical_progress_pct !== undefined ? Number(s.physical_progress_pct) : null;
        let completionDate = s.actual_completion_date || null;
        let periodYears = s.dlp_period_years !== null && s.dlp_period_years !== undefined ? Number(s.dlp_period_years) : null;
        let scheme = s.scheme || null;
        let dlpEndedOn = s.dlp_ended_on_date || null;

        // Lifecycle rule: Construction reaching 100% with completion date auto-graduates to DLP
        if (category === 'CONSTRUCTION' && progressPct !== null && progressPct >= 100 && completionDate) {
          category = 'DLP';
          commencementDate = completionDate;
          if (periodYears && !dlpTillDate) {
            const comp = new Date(completionDate);
            comp.setFullYear(comp.getFullYear() + periodYears);
            dlpTillDate = comp.toISOString().split('T')[0];
          }
        }

        return {
          corridor_id: corridorId,
          category,
          chainage_from_km: sFrom,
          chainage_to_km: sTo,
          length_km: sLen,
          road_width_from_m: wFrom,
          road_width_to_m: wTo,
          contractor_name: s.contractor_name || null,
          work_name: s.work_name || null,
          commencement_date: commencementDate,
          dlp_till_date: dlpTillDate,
          physical_progress_pct: progressPct,
          actual_completion_date: completionDate,
          dlp_period_years: periodYears,
          scheme: scheme,
          dlp_ended_on_date: dlpEndedOn,
          remarks: s.remarks || null,
          status: 'ACTIVE',
        };
      });

      const { data: stretchData, error: stretchError } = await supabase
        .from('dlp_work_stretches')
        .insert(stretchesToInsert)
        .select();

      if (stretchError) {
        return NextResponse.json({ success: false, error: stretchError.message }, { status: 500 });
      }
      insertedStretches = (stretchData || []).map(computeStretchLiveStatus);
    }

    return NextResponse.json({
      success: true,
      corridor: {
        ...corridorData,
        work_stretches: insertedStretches,
      },
    }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, division_name, highway_code, from_km, to_km, total_length_km, remarks, status, work_stretches } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Corridor ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const numFrom = Number(from_km || 0);
    const numTo = Number(to_km || 0);
    const numLength = Number(total_length_km || Math.abs(numTo - numFrom));

    // 1. Update Corridor Record
    const { data: updatedCorridor, error: corridorError } = await supabase
      .from('dlp_corridors')
      .update({
        division_name,
        highway_code,
        from_km: numFrom,
        to_km: numTo,
        total_length_km: numLength,
        remarks: remarks || null,
        status: status || 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (corridorError || !updatedCorridor) {
      return NextResponse.json({ success: false, error: corridorError?.message || 'Failed to update corridor' }, { status: 500 });
    }

    // 2. Sync Work Stretches if provided
    let syncedStretches: DlpWorkStretch[] = [];
    if (Array.isArray(work_stretches)) {
      // Prefetch Level 2 Sub-Chainages to auto-resolve lane widths when not provided
      const plainNum = (highway_code || '').replace(/^NH-?/i, '');
      const searchCodes = Array.from(new Set([highway_code, `NH-${plainNum}`, plainNum]));
      const { data: subChainagesData } = await supabase
        .from('highway_sub_chainages')
        .select('*')
        .in('highway_code', searchCodes)
        .neq('delete_status', 'DELETED')
        .neq('delete_status', 'SOFT_DELETE');

      if (work_stretches.length > 0) {
        // Validate width capacity across all stretches before DB update
        for (let i = 0; i < work_stretches.length; i++) {
          const s = work_stretches[i];
          const sFrom = Number(s.chainage_from_km || 0);
          const sTo = Number(s.chainage_to_km || 0);
          const wTo = s.road_width_to_m !== undefined && s.road_width_to_m !== null && s.road_width_to_m !== '' && Number(s.road_width_to_m) > 0
            ? Number(s.road_width_to_m)
            : detectLaneWidthForChainage(sFrom, sTo, subChainagesData || []).totalWidthMeters;

          if (subChainagesData && subChainagesData.length > 0) {
            const capacity = checkSpanWidthCapacity(sFrom, sTo, wTo, subChainagesData);
            if (!capacity.valid) {
              const b = capacity.bottlenecks[0];
              return NextResponse.json({
                success: false,
                error: `Work stretch #${i + 1} (Km ${sFrom}–${sTo}) width (${wTo}m centerline) exceeds physical road capacity on Km ${b.overlapFromKm.toFixed(3)}–${b.overlapToKm.toFixed(3)} (${b.laneConfig}: max ${b.maxAllowedCenterlineWidth}m centerline = ${b.maxAllowedCarriagewayWidth}m total). Please adjust width or split into separate entries.`,
              }, { status: 400 });
            }
          }
        }

        // Delete removed stretches
        await supabase.from('dlp_work_stretches').delete().eq('corridor_id', id);

        const stretchesToInsert = work_stretches.map((s: any) => {
          const sFrom = Number(s.chainage_from_km || 0);
          const sTo = Number(s.chainage_to_km || 0);
          const sLen = Number(s.length_km || Math.abs(sTo - sFrom));
          const wFrom = Number(s.road_width_from_m ?? 0.0);
          
          let wTo: number;
          if (s.road_width_to_m !== undefined && s.road_width_to_m !== null && s.road_width_to_m !== '' && Number(s.road_width_to_m) > 0) {
            wTo = Number(s.road_width_to_m);
          } else {
            const detected = detectLaneWidthForChainage(sFrom, sTo, subChainagesData || []);
            wTo = detected.totalWidthMeters;
          }

          let category = s.category;
          let commencementDate = s.commencement_date || null;
          let dlpTillDate = s.dlp_till_date || null;
          let progressPct = s.physical_progress_pct !== null && s.physical_progress_pct !== undefined ? Number(s.physical_progress_pct) : null;
          let completionDate = s.actual_completion_date || null;
          let periodYears = s.dlp_period_years !== null && s.dlp_period_years !== undefined ? Number(s.dlp_period_years) : null;
          let scheme = s.scheme || null;
          let dlpEndedOn = s.dlp_ended_on_date || null;

          if (category === 'CONSTRUCTION' && progressPct !== null && progressPct >= 100 && completionDate) {
            category = 'DLP';
            commencementDate = completionDate;
            if (periodYears && !dlpTillDate) {
              const comp = new Date(completionDate);
              comp.setFullYear(comp.getFullYear() + periodYears);
              dlpTillDate = comp.toISOString().split('T')[0];
            }
          }

          return {
            corridor_id: id,
            category,
            chainage_from_km: sFrom,
            chainage_to_km: sTo,
            length_km: sLen,
            road_width_from_m: wFrom,
            road_width_to_m: wTo,
            contractor_name: s.contractor_name || null,
            work_name: s.work_name || null,
            commencement_date: commencementDate,
            dlp_till_date: dlpTillDate,
            physical_progress_pct: progressPct,
            actual_completion_date: completionDate,
            dlp_period_years: periodYears,
            scheme: scheme,
            dlp_ended_on_date: dlpEndedOn,
            remarks: s.remarks || null,
            status: s.status || 'ACTIVE',
          };
        });

        const { data: stretchData, error: stretchError } = await supabase
          .from('dlp_work_stretches')
          .insert(stretchesToInsert)
          .select();

        if (stretchError) {
          return NextResponse.json({ success: false, error: stretchError.message }, { status: 500 });
        }
        syncedStretches = (stretchData || []).map(computeStretchLiveStatus);
      }
    }

    return NextResponse.json({
      success: true,
      corridor: {
        ...updatedCorridor,
        work_stretches: syncedStretches,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Corridor ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    // Soft-delete corridor and all its stretches
    const { error: corridorErr } = await supabase
      .from('dlp_corridors')
      .update({ status: 'DELETED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (corridorErr) {
      return NextResponse.json({ success: false, error: corridorErr.message }, { status: 500 });
    }

    await supabase
      .from('dlp_work_stretches')
      .update({ status: 'DELETED', updated_at: new Date().toISOString() })
      .eq('corridor_id', id);

    return NextResponse.json({ success: true, message: `Corridor ${id} soft-deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
