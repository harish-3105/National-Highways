import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DlpCorridor, DlpWorkStretch, DlpWorkCategory } from '@/types/dlp';
import { detectLaneWidthForChainage, checkSpanWidthCapacity } from '@/lib/dlp/laneDetection';
import { addYearsToDateString, normalizeDateForDb, parseDateString } from '@/lib/formatters';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

function getExpiredScheme(originalCategory: DlpWorkCategory, existingScheme?: string | null, workName?: string | null): string {
  if (existingScheme && existingScheme.trim() !== '' && existingScheme !== 'Proposed Special Repairs' && existingScheme !== 'Maintenance Gap / No Active Work') {
    return existingScheme.trim();
  }
  if (originalCategory === 'PBMC') return 'PBMC';
  if (originalCategory === 'STMC') return 'STMC';
  // Both standard DLP and completed Construction stretches expire into 'Annual Work'
  return 'Annual Work';
}

function computeStretchLiveStatus(stretch: DlpWorkStretch): DlpWorkStretch {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysRemaining: number | undefined = undefined;
  let computedStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'COMPLETED' = 'ACTIVE';

  // 1. If Construction is 100% complete or has completion date, it graduates to DLP
  let currentCategory = stretch.category;
  let commencementDate = stretch.commencement_date;
  let dlpTillDate = stretch.dlp_till_date;

  if (currentCategory === 'CONSTRUCTION') {
    const isCompleted = Number(stretch.physical_progress_pct || 0) >= 100 || Boolean(stretch.actual_completion_date);
    if (isCompleted) {
      currentCategory = 'DLP';
      commencementDate = stretch.actual_completion_date || stretch.commencement_date;
      if (!dlpTillDate && commencementDate) {
        dlpTillDate = addYearsToDateString(commencementDate, stretch.dlp_period_years ?? 5);
      }
    } else {
      return {
        ...stretch,
        category: 'CONSTRUCTION',
        computed_status: 'ACTIVE',
      };
    }
  }

  // 2. For warranties (DLP, STMC, PBMC): Check DLP expiry against today
  if (dlpTillDate) {
    const expiry = parseDateString(dlpTillDate);
    if (expiry) {
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        computedStatus = 'EXPIRED';
        // Lifecycle rule: Expired warranty transitions into NO_DLP with previous work type as scheme
        return {
          ...stretch,
          category: 'NO_DLP',
          commencement_date: commencementDate,
          dlp_till_date: dlpTillDate,
          dlp_ended_on_date: stretch.dlp_ended_on_date || dlpTillDate,
          scheme: getExpiredScheme(currentCategory, stretch.scheme, stretch.work_name),
          days_remaining: daysRemaining,
          computed_status: 'EXPIRED',
        };
      } else if (daysRemaining <= 90) {
        computedStatus = 'EXPIRING_SOON';
      } else {
        computedStatus = 'ACTIVE';
      }
    }
  } else if (currentCategory === 'NO_DLP') {
    computedStatus = 'EXPIRED';
    if (!stretch.scheme || stretch.scheme === 'Proposed Special Repairs' || stretch.scheme === 'Maintenance Gap / No Active Work') {
      stretch.scheme = 'Annual Work';
    }
    if (stretch.dlp_ended_on_date) {
      const ended = parseDateString(stretch.dlp_ended_on_date);
      if (ended) {
        ended.setHours(0, 0, 0, 0);
        const diffTime = ended.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
  }

  return {
    ...stretch,
    category: currentCategory,
    commencement_date: commencementDate,
    dlp_till_date: dlpTillDate,
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

    // Enforce Row-Level PBAC Data Siloing if user lacks statewide view permission
    const session = await getSession();
    if (session && !session.isSuperAdmin) {
      const canViewStatewide =
        session.permissions.includes('jurisdiction:view_statewide') ||
        session.permissions.includes('*:*') ||
        session.jurisdictionScope === 'STATEWIDE';

      if (!canViewStatewide) {
        if (session.jurisdictionScope === 'DIVISION' && session.division) {
          query = query.ilike('division_name', `%${session.division}%`);
        }
      }
    }

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

    const session = await getSession();
    const authCheck = canPerformAction(session, 'dlp:create', { division: division_name });
    if (!authCheck.allowed) {
      return NextResponse.json({ success: false, error: authCheck.reason || 'Unauthorized operation.' }, { status: 403 });
    }

    const numFrom = Number(from_km || 0);
    const numTo = Number(to_km || 0);
    const numLength = Number(total_length_km || Math.abs(numTo - numFrom));

    // Prevent duplicate corridor entries for the same road code & division in DLP
    const { data: existingCorridor } = await supabase
      .from('dlp_corridors')
      .select('id, highway_code, division_name')
      .neq('status', 'DELETED')
      .ilike('highway_code', highway_code.trim())
      .ilike('division_name', division_name.trim())
      .maybeSingle();

    if (existingCorridor) {
      return NextResponse.json(
        {
          success: false,
          error: `A DLP entry for corridor '${highway_code}' in '${division_name}' division already exists. Please edit the existing entry instead of creating a duplicate.`,
        },
        { status: 409 }
      );
    }

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
        let commencementDate = normalizeDateForDb(s.commencement_date);
        let dlpTillDate = normalizeDateForDb(s.dlp_till_date);
        let progressPct = s.physical_progress_pct !== null && s.physical_progress_pct !== undefined && String(s.physical_progress_pct).trim() !== '' ? Number(s.physical_progress_pct) : null;
        let completionDate = normalizeDateForDb(s.actual_completion_date);
        let periodYears = s.dlp_period_years !== null && s.dlp_period_years !== undefined && String(s.dlp_period_years).trim() !== '' ? Number(s.dlp_period_years) : null;
        let scheme = s.scheme || null;
        let dlpEndedOn = normalizeDateForDb(s.dlp_ended_on_date);

        // Lifecycle & Date calculation logic:
        // 1. Under Construction with completion date and period years
        if (category === 'CONSTRUCTION') {
          if (completionDate && periodYears && !dlpTillDate) {
            dlpTillDate = addYearsToDateString(completionDate, periodYears);
          }
          // Auto-graduate to DLP if 100% or if completed
          if (progressPct !== null && progressPct >= 100 && completionDate) {
            category = 'DLP';
            commencementDate = completionDate;
            if (periodYears && !dlpTillDate) {
              dlpTillDate = addYearsToDateString(completionDate, periodYears);
            }
          }
        }

        // 2. Under DLP: if dlpTillDate is missing but commencementDate & periodYears are present
        if (category === 'DLP' && !dlpTillDate && commencementDate && periodYears) {
          dlpTillDate = addYearsToDateString(commencementDate, periodYears);
        }

        // 3. Expired warranty transition: If DLP (or STMC/PBMC) has passed its dlpTillDate, transition to NO_DLP
        if (category === 'DLP' || category === 'STMC' || category === 'PBMC') {
          if (dlpTillDate) {
            const exp = parseDateString(dlpTillDate);
            if (exp) {
              exp.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (exp.getTime() <= today.getTime()) {
                const prevCat = category;
                category = 'NO_DLP';
                if (!dlpEndedOn) dlpEndedOn = dlpTillDate;
                scheme = getExpiredScheme(prevCat, scheme, s.work_name);
              }
            }
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

    // Log Audit Event
    if (session) {
      await logAudit({
        actor: session,
        module: 'DLP',
        action: 'CREATE',
        entityId: corridorData.id,
        entityTitle: `DLP Corridor ${highway_code} (Km ${numFrom}–${numTo})`,
        changesSummary: `Created DLP maintenance package for ${highway_code} in ${division_name} with ${insertedStretches.length} work stretches`,
        newState: { ...corridorData, work_stretches: insertedStretches },
      });
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

    const session = await getSession();

    // Fetch existing state for diff and permission check
    const { data: existingCorridor } = await supabase
      .from('dlp_corridors')
      .select('*, dlp_work_stretches(*)')
      .eq('id', id)
      .maybeSingle();

    if (existingCorridor) {
      const authCheck = canPerformAction(session, 'dlp:edit', { division: existingCorridor.division_name });
      if (!authCheck.allowed) {
        return NextResponse.json({ success: false, error: authCheck.reason || 'Unauthorized operation.' }, { status: 403 });
      }
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
      // Delete removed stretches
      await supabase.from('dlp_work_stretches').delete().eq('corridor_id', id);

      if (work_stretches.length > 0) {
        // Prefetch Level 2 Sub-Chainages to auto-resolve lane widths when not provided
        const plainNum = (highway_code || updatedCorridor.highway_code).replace(/^NH-?/i, '');
        const searchCodes = Array.from(new Set([highway_code, updatedCorridor.highway_code, `NH-${plainNum}`, plainNum]));
        const { data: subChainagesData } = await supabase
          .from('highway_sub_chainages')
          .select('*')
          .in('highway_code', searchCodes)
          .neq('delete_status', 'DELETED')
          .neq('delete_status', 'SOFT_DELETE');

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
          let commencementDate = normalizeDateForDb(s.commencement_date);
          let dlpTillDate = normalizeDateForDb(s.dlp_till_date);
          let progressPct = s.physical_progress_pct !== null && s.physical_progress_pct !== undefined && String(s.physical_progress_pct).trim() !== '' ? Number(s.physical_progress_pct) : null;
          let completionDate = normalizeDateForDb(s.actual_completion_date);
          let periodYears = s.dlp_period_years !== null && s.dlp_period_years !== undefined && String(s.dlp_period_years).trim() !== '' ? Number(s.dlp_period_years) : null;
          let scheme = s.scheme || null;
          let dlpEndedOn = normalizeDateForDb(s.dlp_ended_on_date);

          // Lifecycle & Date calculation logic:
          // 1. Under Construction with completion date and period years
          if (category === 'CONSTRUCTION') {
            if (completionDate && periodYears && !dlpTillDate) {
              dlpTillDate = addYearsToDateString(completionDate, periodYears);
            }
            // Auto-graduate to DLP if 100% or if completed
            if (progressPct !== null && progressPct >= 100 && completionDate) {
              category = 'DLP';
              commencementDate = completionDate;
              if (periodYears && !dlpTillDate) {
                dlpTillDate = addYearsToDateString(completionDate, periodYears);
              }
            }
          }

          // 2. Under DLP: if dlpTillDate is missing but commencementDate & periodYears are present
          if (category === 'DLP' && !dlpTillDate && commencementDate && periodYears) {
            dlpTillDate = addYearsToDateString(commencementDate, periodYears);
          }

          // 3. Expired warranty transition: If DLP (or STMC/PBMC) has passed its dlpTillDate, transition to NO_DLP
          if (category === 'DLP' || category === 'STMC' || category === 'PBMC') {
            if (dlpTillDate) {
              const exp = parseDateString(dlpTillDate);
              if (exp) {
                exp.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (exp.getTime() <= today.getTime()) {
                  const prevCat = category;
                  category = 'NO_DLP';
                  if (!dlpEndedOn) dlpEndedOn = dlpTillDate;
                  scheme = getExpiredScheme(prevCat, scheme, s.work_name);
                }
              }
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

    // Log Audit Event
    if (session && existingCorridor) {
      await logAudit({
        actor: session,
        module: 'DLP',
        action: 'UPDATE',
        entityId: id,
        entityTitle: `DLP Corridor ${updatedCorridor.highway_code}`,
        changesSummary: `Updated DLP maintenance package and ${syncedStretches.length} work stretches for ${updatedCorridor.highway_code}`,
        oldState: existingCorridor,
        newState: { ...updatedCorridor, work_stretches: syncedStretches },
      });
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

    const session = await getSession();

    // Fetch existing state for diff and permission check
    const { data: existingCorridor } = await supabase
      .from('dlp_corridors')
      .select('*, dlp_work_stretches(*)')
      .eq('id', id)
      .maybeSingle();

    if (existingCorridor) {
      const authCheck = canPerformAction(session, 'dlp:delete', { division: existingCorridor.division_name });
      if (!authCheck.allowed) {
        return NextResponse.json({ success: false, error: authCheck.reason || 'Unauthorized operation.' }, { status: 403 });
      }
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

    // Log Audit Event
    if (session && existingCorridor) {
      await logAudit({
        actor: session,
        module: 'DLP',
        action: 'DELETE',
        entityId: id,
        entityTitle: `DLP Corridor ${existingCorridor.highway_code}`,
        changesSummary: `Soft-deleted DLP maintenance corridor for ${existingCorridor.highway_code} in ${existingCorridor.division_name}`,
        oldState: existingCorridor,
      });
    }

    return NextResponse.json({ success: true, message: `Corridor ${id} soft-deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
