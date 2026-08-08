import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DLPContractItem } from '@/app/dlp/page';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const highwayCode = searchParams.get('highway_code');

    const supabase = await createClient();
    if (supabase) {
      let query = supabase.from('dlp_contracts').select('*').order('dlp_expiry_date', { ascending: true });
      if (highwayCode) query = query.eq('highway_code', highwayCode);

      const { data, error } = await query;
      if (!error && data) {
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

    return NextResponse.json({ success: true, contracts: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg, contracts: [] }, { status: 500 });
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
