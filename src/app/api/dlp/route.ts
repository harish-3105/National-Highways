import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DLPContractItem } from '@/app/dlp/page';

export const dynamic = 'force-dynamic';

const SAMPLE_DLP_CONTRACTS: DLPContractItem[] = [
  {
    id: 'dlp-1',
    highway_code: 'NH-181',
    stretch_name: 'Coimbatore - Mettupalayam Stretch',
    from_km: 0,
    to_km: 35.4,
    length_km: 35.4,
    contractor_name: 'L&T Transportation Infrastructure Ltd',
    contract_mode: 'EPC',
    work_description: 'Strengthening and 4-laning with paved shoulders',
    doc_date: '2023-04-15',
    dlp_expiry_date: '2026-09-15',
    days_remaining: 39,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'dlp-2',
    highway_code: 'NH-181',
    stretch_name: 'Mettupalayam - Coonoor Pass',
    from_km: 35.4,
    to_km: 70.0,
    length_km: 34.6,
    contractor_name: 'GVR Infra Projects Ltd',
    contract_mode: 'STMC',
    work_description: 'Hill slope stabilization & retaining wall renewal',
    doc_date: '2024-01-10',
    dlp_expiry_date: '2027-01-10',
    days_remaining: 156,
    status: 'ACTIVE',
  },
  {
    id: 'dlp-3',
    highway_code: 'NH-44',
    stretch_name: 'Hosur - Dharmapuri Section',
    from_km: 0,
    to_km: 84.5,
    length_km: 84.5,
    contractor_name: 'KNR Constructions Ltd',
    contract_mode: 'PBMC',
    work_description: 'Flexible pavement resurfacing & toll plaza maintenance',
    doc_date: '2022-08-01',
    dlp_expiry_date: '2026-08-01',
    days_remaining: -6,
    status: 'EXPIRED',
  },
  {
    id: 'dlp-4',
    highway_code: 'NH-44',
    stretch_name: 'Dharmapuri - Salem Corridor',
    from_km: 84.5,
    to_km: 148.0,
    length_km: 63.5,
    contractor_name: 'IRB Infrastructure Developers',
    contract_mode: 'EPC',
    work_description: 'Rigid pavement construction & flyover junction renewal',
    doc_date: '2023-11-20',
    dlp_expiry_date: '2026-10-21',
    days_remaining: 75,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'dlp-5',
    highway_code: 'NH-48',
    stretch_name: 'Chennai - Kanchipuram Express Corridor',
    from_km: 0,
    to_km: 68.0,
    length_km: 68.0,
    contractor_name: 'GMR Highways Ltd',
    contract_mode: 'EPC',
    work_description: '6-Laning expansion and stormwater drain integration',
    doc_date: '2024-03-01',
    dlp_expiry_date: '2027-03-01',
    days_remaining: 206,
    status: 'ACTIVE',
  },
  {
    id: 'dlp-6',
    highway_code: 'NH-38',
    stretch_name: 'Tiruvannamalai - Villupuram Stretch',
    from_km: 62.0,
    to_km: 120.0,
    length_km: 58.0,
    contractor_name: 'Welspun Enterprises Ltd',
    contract_mode: 'Annual Plan',
    work_description: 'Periodic overlay & safety signage replacement',
    doc_date: '2023-09-10',
    dlp_expiry_date: '2026-08-29',
    days_remaining: 22,
    status: 'EXPIRING_SOON',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const highwayCode = searchParams.get('highway_code');

    try {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase.from('dlp_contracts').select('*').order('dlp_expiry_date', { ascending: true });
        if (highwayCode) query = query.eq('highway_code', highwayCode);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const today = new Date();

          const formattedContracts: DLPContractItem[] = data.map((item: any) => {
            const expiry = item.dlp_expiry_date ? new Date(item.dlp_expiry_date) : today;
            const diffTime = expiry.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const status = daysRemaining < 0 ? 'EXPIRED' : daysRemaining <= 90 ? 'EXPIRING_SOON' : 'ACTIVE';

            return {
              id: item.id,
              highway_code: item.highway_code,
              stretch_name: item.stretch_name || `Stretch ${item.highway_code}`,
              from_km: Number(item.from_km || 0),
              to_km: Number(item.to_km || 0),
              length_km: Number(item.length_km || 0),
              contractor_name: item.contractor_name || 'Assigned Contractor',
              contract_mode: item.contract_mode || 'EPC',
              work_description: item.work_description || '',
              doc_date: item.doc_date || '',
              dlp_expiry_date: item.dlp_expiry_date || '',
              days_remaining: daysRemaining,
              status: status as any,
            };
          });

          return NextResponse.json({ success: true, contracts: formattedContracts });
        }
      }
    } catch {
      // Supabase disconnected/unconfigured fallback
    }

    return NextResponse.json({ success: true, contracts: SAMPLE_DLP_CONTRACTS });
  } catch (err: unknown) {
    return NextResponse.json({ success: true, contracts: SAMPLE_DLP_CONTRACTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    if (supabase) {
      const { data, error } = await supabase.from('dlp_contracts').insert([body]).select();
      if (!error && data && data[0]) {
        return NextResponse.json({ success: true, contract: data[0] });
      }
    }

    return NextResponse.json({ success: true, contract: { ...body, id: `dlp-${Date.now()}` } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
