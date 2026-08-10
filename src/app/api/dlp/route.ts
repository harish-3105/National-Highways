import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DLPContractItem } from '@/app/dlp/page';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const highwayCode = searchParams.get('highway_code');
    const division = searchParams.get('division');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');

    const supabase = await createClient();
    if (supabase) {
      let query = supabase.from('dlp_contracts').select('*').order('dlp_expiry_date', { ascending: true });

      if (highwayCode) query = query.eq('highway_code', highwayCode);
      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      } else {
        query = query.neq('status', 'DELETED');
      }

      const { data, error } = await query;
      if (!error && data) {
        const today = new Date();

        let formattedContracts: DLPContractItem[] = data.map((item: any) => {
          const expiry = item.dlp_expiry_date ? new Date(item.dlp_expiry_date) : today;
          const diffTime = expiry.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const currentStatus = item.status === 'DELETED'
            ? 'DELETED'
            : daysRemaining < 0
            ? 'EXPIRED'
            : daysRemaining <= 90
            ? 'EXPIRING_SOON'
            : 'ACTIVE';

          let extractedDivision = item.division_name || '';
          if (!extractedDivision && item.stretch_name) {
            const match = item.stretch_name.match(/^([^ -]+(?:\s+Division)?)/i);
            if (match) extractedDivision = match[1].replace(/\s+Division$/i, '').trim();
          }

          const details = item.contract_details || {};

          return {
            id: item.id,
            highway_code: item.highway_code,
            division_name: extractedDivision || 'General',
            stretch_name: item.stretch_name || `Stretch ${item.highway_code}`,
            from_km: Number(item.from_km || 0),
            to_km: Number(item.to_km || 0),
            length_km: Number(item.length_km || 0),

            // 100% Complete Excel Breakdown Sub-Columns
            dlp_contract_count: Number(item.dlp_contract_count ?? details.dlp_contract_count ?? 0),
            dlp_length_km: Number(item.dlp_length_km ?? details.dlp_length_km ?? 0),
            dlp_chainage: item.dlp_chainage || details.dlp_chainage || '',
            dlp_expiry_date: item.dlp_expiry_date || details.dlp_expiry_date || '',

            construction_project_count: Number(item.construction_project_count ?? details.construction_project_count ?? 0),
            construction_length_km: Number(item.construction_length_km ?? details.construction_length_km ?? 0),
            construction_chainage: item.construction_chainage || details.construction_chainage || '',

            stmc_contract_count: Number(item.stmc_contract_count ?? details.stmc_contract_count ?? 0),
            stmc_length_km: Number(item.stmc_length_km ?? details.stmc_length_km ?? 0),
            stmc_chainage: item.stmc_chainage || details.stmc_chainage || '',
            stmc_expiry_date: item.stmc_expiry_date || details.stmc_expiry_date || '',

            pbmc_project_count: Number(item.pbmc_project_count ?? details.pbmc_project_count ?? 0),
            pbmc_length_km: Number(item.pbmc_length_km ?? details.pbmc_length_km ?? 0),
            pbmc_chainage: item.pbmc_chainage || details.pbmc_chainage || '',
            pbmc_expiry_date: item.pbmc_expiry_date || details.pbmc_expiry_date || '',

            no_dlp_length_km: Number(item.no_dlp_length_km ?? details.no_dlp_length_km ?? 0),
            no_dlp_chainage: item.no_dlp_chainage || details.no_dlp_chainage || '',
            no_dlp_expiry_date: item.no_dlp_expiry_date || details.no_dlp_expiry_date || '',

            uncontracted_after_2027_km: Number(item.uncontracted_after_2027_km ?? details.uncontracted_after_2027_km ?? 0),

            // 1-to-N Child Sub-Contracts Array
            sub_contracts: (item.sub_contracts || details.sub_contracts || []).map((sub: any, idx: number) => ({
              id: sub.id || `sub-${idx}`,
              maintenance_type: sub.maintenance_type || sub.sub_contract_type || sub.type || 'DLP',
              sub_stretch_title: sub.sub_stretch_title || sub.sub_contract_title || sub.title || `Sub-Stretch ${idx + 1}`,
              from_km: Number(sub.from_km || 0),
              to_km: Number(sub.to_km || 0),
              length_km: Number(sub.length_km || 0),
              contractor_name: sub.contractor_name || '',
              expiry_date: sub.expiry_date || '',
              days_remaining: typeof sub.days_remaining === 'number' ? sub.days_remaining : (sub.expiry_date ? Math.ceil((new Date(sub.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : undefined),
              status: sub.status || 'ACTIVE',
              remarks: sub.remarks || '',
            })),

            contractor_name: item.contractor_name || 'Assigned Contractor',
            contract_mode: item.contract_mode || 'EPC',
            work_description: item.work_description || '',
            doc_date: item.doc_date || '',
            days_remaining: daysRemaining,
            status: currentStatus as any,
          };
        });

        if (statusFilter !== 'DELETED') {
          formattedContracts = formattedContracts.filter((c) => (c.status as string) !== 'DELETED');
        }

        if (division) {
          formattedContracts = formattedContracts.filter(
            (c) => c.division_name?.toLowerCase().includes(division.toLowerCase()) || c.stretch_name.toLowerCase().includes(division.toLowerCase())
          );
        }

        if (search) {
          const term = search.toLowerCase();
          formattedContracts = formattedContracts.filter(
            (c) =>
              c.highway_code.toLowerCase().includes(term) ||
              c.stretch_name.toLowerCase().includes(term) ||
              c.contractor_name.toLowerCase().includes(term) ||
              c.work_description.toLowerCase().includes(term) ||
              c.division_name?.toLowerCase().includes(term)
          );
        }

        return NextResponse.json({ success: true, contracts: formattedContracts });
      }
    }

    return NextResponse.json({ success: true, contracts: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg, message: msg, contracts: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const fromKm = Number(body.from_km || 0);
    const toKm = Number(body.to_km || 0);
    const lengthKm = Number(body.length_km || Math.abs(toKm - fromKm));

    const breakdown = {
      dlp_contract_count: Number(body.dlp_contract_count || 0),
      dlp_length_km: Number(body.dlp_length_km || 0),
      dlp_chainage: body.dlp_chainage || '',
      dlp_expiry_date: body.dlp_expiry_date || '',

      construction_project_count: Number(body.construction_project_count || 0),
      construction_length_km: Number(body.construction_length_km || 0),
      construction_chainage: body.construction_chainage || '',

      stmc_contract_count: Number(body.stmc_contract_count || 0),
      stmc_length_km: Number(body.stmc_length_km || 0),
      stmc_chainage: body.stmc_chainage || '',
      stmc_expiry_date: body.stmc_expiry_date || '',

      pbmc_project_count: Number(body.pbmc_project_count || 0),
      pbmc_length_km: Number(body.pbmc_length_km || 0),
      pbmc_chainage: body.pbmc_chainage || '',
      pbmc_expiry_date: body.pbmc_expiry_date || '',

      no_dlp_length_km: Number(body.no_dlp_length_km || 0),
      no_dlp_chainage: body.no_dlp_chainage || '',
      no_dlp_expiry_date: body.no_dlp_expiry_date || '',

      uncontracted_after_2027_km: Number(body.uncontracted_after_2027_km || 0),
      sub_contracts: body.sub_contracts || [],
    };

    const payload = {
      highway_code: body.highway_code,
      stretch_name: body.stretch_name || `${body.division_name || ''} Division - ${body.highway_code} (Km ${fromKm} to ${toKm})`,
      from_km: fromKm,
      to_km: toKm,
      length_km: lengthKm,
      contractor_name: body.contractor_name || `${body.division_name || ''} Division Contractor`,
      contract_mode: body.contract_mode || 'EPC',
      work_description: body.work_description || '',
      doc_date: body.doc_date || null,
      dlp_expiry_date: body.dlp_expiry_date || null,
      status: 'ACTIVE',
      division_name: body.division_name || '',
      dlp_contract_count: breakdown.dlp_contract_count,
      dlp_length_km: breakdown.dlp_length_km,
      construction_project_count: breakdown.construction_project_count,
      construction_length_km: breakdown.construction_length_km,
      stmc_contract_count: breakdown.stmc_contract_count,
      stmc_length_km: breakdown.stmc_length_km,
      stmc_expiry_date: breakdown.stmc_expiry_date || null,
      pbmc_project_count: breakdown.pbmc_project_count,
      pbmc_length_km: breakdown.pbmc_length_km,
      no_dlp_length_km: breakdown.no_dlp_length_km,
      uncontracted_after_2027_km: breakdown.uncontracted_after_2027_km,
      contract_details: breakdown,
    };

    if (supabase) {
      const { data, error } = await supabase.from('dlp_contracts').insert([payload]).select();
      if (!error && data && data[0]) {
        return NextResponse.json({ success: true, contract: data[0] });
      }
    }

    return NextResponse.json({ success: true, contract: { ...payload, ...breakdown, id: `dlp-${Date.now()}` } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg, message: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'DLP Contract ID is required', message: 'DLP Contract ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const fromKm = Number(body.from_km || 0);
    const toKm = Number(body.to_km || 0);
    const lengthKm = Number(body.length_km || Math.abs(toKm - fromKm));

    const breakdown = {
      dlp_contract_count: Number(body.dlp_contract_count || 0),
      dlp_length_km: Number(body.dlp_length_km || 0),
      dlp_chainage: body.dlp_chainage || '',
      dlp_expiry_date: body.dlp_expiry_date || '',

      construction_project_count: Number(body.construction_project_count || 0),
      construction_length_km: Number(body.construction_length_km || 0),
      construction_chainage: body.construction_chainage || '',

      stmc_contract_count: Number(body.stmc_contract_count || 0),
      stmc_length_km: Number(body.stmc_length_km || 0),
      stmc_chainage: body.stmc_chainage || '',
      stmc_expiry_date: body.stmc_expiry_date || '',

      pbmc_project_count: Number(body.pbmc_project_count || 0),
      pbmc_length_km: Number(body.pbmc_length_km || 0),
      pbmc_chainage: body.pbmc_chainage || '',
      pbmc_expiry_date: body.pbmc_expiry_date || '',

      no_dlp_length_km: Number(body.no_dlp_length_km || 0),
      no_dlp_chainage: body.no_dlp_chainage || '',
      no_dlp_expiry_date: body.no_dlp_expiry_date || '',

      uncontracted_after_2027_km: Number(body.uncontracted_after_2027_km || 0),
      sub_contracts: body.sub_contracts || [],
    };

    const payload = {
      highway_code: body.highway_code,
      stretch_name: body.stretch_name || `${body.division_name || ''} Division - ${body.highway_code} (Km ${fromKm} to ${toKm})`,
      from_km: fromKm,
      to_km: toKm,
      length_km: lengthKm,
      contractor_name: body.contractor_name,
      contract_mode: body.contract_mode,
      work_description: body.work_description,
      doc_date: body.doc_date || null,
      dlp_expiry_date: body.dlp_expiry_date || null,
      contract_details: breakdown,
    };

    if (supabase && !id.startsWith('dlp-')) {
      const { data, error } = await supabase.from('dlp_contracts').update(payload).eq('id', id).select();
      if (!error && data && data[0]) {
        return NextResponse.json({ success: true, contract: data[0] });
      }
    }

    return NextResponse.json({ success: true, contract: { ...body, ...payload, ...breakdown } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Contract ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (supabase && !id.startsWith('dlp-')) {
      const { error } = await supabase.from('dlp_contracts').update({ status: 'DELETED' }).eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: `Contract ${id} successfully soft-deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
