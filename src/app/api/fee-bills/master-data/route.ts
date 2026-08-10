import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_MASTER_DATA } from '@/lib/feeBillMasterData';
import { FeeBillMasterDataConfig } from '@/types/feeBill';

export const dynamic = 'force-dynamic';

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

// In-memory fallback
let serverMasterData: FeeBillMasterDataConfig = { ...DEFAULT_MASTER_DATA };

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('fee_bill_master_config')
        .select('config')
        .eq('id', 'default')
        .single();

      if (!error && data?.config) {
        serverMasterData = data.config as FeeBillMasterDataConfig;
        return NextResponse.json({ success: true, masterData: data.config });
      }
    }

    return NextResponse.json({ success: true, masterData: serverMasterData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg, masterData: serverMasterData }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body: FeeBillMasterDataConfig = await request.json();

    if (!body || !Array.isArray(body.circles) || !Array.isArray(body.divisions)) {
      return NextResponse.json({ success: false, message: 'Invalid master data structure' }, { status: 400 });
    }

    serverMasterData = body;

    if (supabase) {
      const { error } = await supabase
        .from('fee_bill_master_config')
        .upsert({
          id: 'default',
          config: body,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase master config error:', error);
      }
    }

    return NextResponse.json({ success: true, masterData: serverMasterData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
