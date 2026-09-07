import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { EMPTY_MASTER_DATA } from '@/lib/feeBillMasterData';
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

// In-memory runtime cache
let serverMasterData: FeeBillMasterDataConfig = { ...EMPTY_MASTER_DATA };

interface MasterItemRow {
  id: string;
  category: string;
  name: string;
  parent_value: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

function assembleConfigFromRows(rows: MasterItemRow[]): FeeBillMasterDataConfig {
  const config: FeeBillMasterDataConfig = {
    circles: [],
    divisions: [],
    lawyerDesignations: [],
    assistantDesignations: [],
    caseTypes: [],
    casePertainsTo: [],
    paymentStatuses: [],
    statusOfObtainingGoOptions: [],
    statusOfPaymentProposalOptions: [],
    goStatusOptions: [],
    yesNoOptions: [],
  };

  rows.forEach((r) => {
    if (!r.name) return;
    const cat = r.category;
    if (cat === 'circles') {
      config.circles.push({ id: r.id, name: r.name, active: r.active });
    } else if (cat === 'divisions') {
      config.divisions.push({
        id: r.id,
        circleName: r.parent_value || '',
        name: r.name,
        active: r.active,
      });
    } else if (cat === 'lawyerDesignations') {
      if (!r.name || r.active === false) return;
      config.lawyerDesignations.push(r.name);
    } else if (cat === 'assistantDesignations') {
      if (!r.name || r.active === false) return;
      config.assistantDesignations?.push(r.name);
    } else if (cat === 'caseTypes') {
      if (!r.name || r.active === false) return;
      config.caseTypes.push(r.name);
    } else if (cat === 'casePertainsTo') {
      if (!r.name || r.active === false) return;
      config.casePertainsTo.push(r.name);
    } else if (cat === 'paymentStatuses') {
      if (!r.name || r.active === false) return;
      config.paymentStatuses.push(r.name);
    } else if (cat === 'statusOfObtainingGo' || cat === 'statusOfObtainingGoOptions') {
      if (!r.name || r.active === false) return;
      config.statusOfObtainingGoOptions?.push(r.name);
    } else if (cat === 'statusOfPaymentProposal' || cat === 'statusOfPaymentProposalOptions') {
      if (!r.name || r.active === false) return;
      config.statusOfPaymentProposalOptions?.push(r.name);
    } else if (cat === 'goStatusOptions' || cat === 'goStatus') {
      if (!r.name || r.active === false) return;
      config.goStatusOptions?.push(r.name);
    } else if (cat === 'yesNoOptions') {
      if (!r.name || r.active === false) return;
      config.yesNoOptions?.push(r.name);
    }
  });

  return config;
}

// Convert FeeBillMasterDataConfig object into discrete rows
function flattenConfigToRows(config: FeeBillMasterDataConfig): Array<{ category: string; name: string; parent_value: string | null; active: boolean }> {
  const rows: Array<{ category: string; name: string; parent_value: string | null; active: boolean }> = [];

  config.circles.forEach((c) => {
    rows.push({ category: 'circles', name: c.name, parent_value: null, active: c.active ?? true });
  });

  config.divisions.forEach((d) => {
    rows.push({ category: 'divisions', name: d.name, parent_value: d.circleName, active: d.active ?? true });
  });

  config.lawyerDesignations.forEach((item) => {
    rows.push({ category: 'lawyerDesignations', name: item, parent_value: null, active: true });
  });

  (config.assistantDesignations || []).forEach((item) => {
    rows.push({ category: 'assistantDesignations', name: item, parent_value: null, active: true });
  });

  config.caseTypes.forEach((item) => {
    rows.push({ category: 'caseTypes', name: item, parent_value: null, active: true });
  });

  config.casePertainsTo.forEach((item) => {
    rows.push({ category: 'casePertainsTo', name: item, parent_value: null, active: true });
  });

  config.paymentStatuses.forEach((item) => {
    rows.push({ category: 'paymentStatuses', name: item, parent_value: null, active: true });
  });

  (config.statusOfObtainingGoOptions || []).forEach((item) => {
    rows.push({ category: 'statusOfObtainingGo', name: item, parent_value: null, active: true });
  });

  (config.statusOfPaymentProposalOptions || []).forEach((item) => {
    rows.push({ category: 'statusOfPaymentProposal', name: item, parent_value: null, active: true });
  });

  (config.goStatusOptions || []).forEach((item) => {
    rows.push({ category: 'goStatusOptions', name: item, parent_value: null, active: true });
  });

  (config.yesNoOptions || []).forEach((item) => {
    rows.push({ category: 'yesNoOptions', name: item, parent_value: null, active: true });
  });

  return rows;
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (supabase) {
      // 1. Try normalized fee_bill_master_items table first
      const { data: rows, error: rowsError } = await supabase
        .from('fee_bill_master_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (!rowsError && rows) {
        const assembled = assembleConfigFromRows(rows as MasterItemRow[]);
        serverMasterData = assembled;
        return NextResponse.json({ success: true, masterData: assembled });
      }

      // 2. If table doesn't exist or query failed, check legacy single blob table
      const { data: legacyData, error: legacyError } = await supabase
        .from('fee_bill_master_config')
        .select('config')
        .eq('id', 'default')
        .single();

      if (!legacyError && legacyData?.config) {
        const sourceConfig = legacyData.config as FeeBillMasterDataConfig;
        serverMasterData = sourceConfig;
        return NextResponse.json({ success: true, masterData: sourceConfig });
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
    const session = await getSession();
    let authCheck = canPerformAction(session, 'fee_bills:master_data_manage');
    if (!authCheck.allowed) {
      authCheck = canPerformAction(session, 'master_data:manage');
    }
    if (!authCheck.allowed) {
      return NextResponse.json({ success: false, message: authCheck.reason || 'Unauthorized operation.' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();

    // Granular Single-Row Actions
    if (body && typeof body === 'object' && 'action' in body) {
      const { action, category, item } = body;

      if (action === 'reset') {
        serverMasterData = { ...EMPTY_MASTER_DATA };
        if (supabase) {
          await supabase.from('fee_bill_master_items').delete().neq('id', 'placeholder');
        }
        return NextResponse.json({ success: true, masterData: serverMasterData });
      }

      if (action === 'add' && category && item?.name) {
        if (supabase) {
          await supabase.from('fee_bill_master_items').insert({
            category,
            name: item.name.trim(),
            parent_value: item.parentValue || null,
            active: item.active ?? true,
          });
        }
      }

      if (action === 'update' && category && item) {
        if (supabase) {
          if (item.id) {
            await supabase
              .from('fee_bill_master_items')
              .update({
                name: item.name.trim(),
                parent_value: item.parentValue || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);
          } else if (item.oldName) {
            await supabase
              .from('fee_bill_master_items')
              .update({
                name: item.name.trim(),
                parent_value: item.parentValue || null,
                updated_at: new Date().toISOString(),
              })
              .eq('category', category)
              .eq('name', item.oldName);
          }
        }
      }

      if (action === 'delete' && category && item) {
        if (supabase) {
          const nowIso = new Date().toISOString();
          if (item.id) {
            await supabase
              .from('fee_bill_master_items')
              .update({ active: false, updated_at: nowIso })
              .eq('id', item.id);
          } else if (item.name) {
            await supabase
              .from('fee_bill_master_items')
              .update({ active: false, updated_at: nowIso })
              .eq('category', category)
              .eq('name', item.name);
          }
        }
      }

      // Re-fetch assembled config strictly from DB
      if (supabase) {
        const { data: rows } = await supabase
          .from('fee_bill_master_items')
          .select('*')
          .order('created_at', { ascending: true });

        if (rows) {
          serverMasterData = assembleConfigFromRows(rows as MasterItemRow[]);
        }
      }

      return NextResponse.json({ success: true, masterData: serverMasterData });
    }

    // Full Config Sync
    const configBody = body as FeeBillMasterDataConfig;
    if (!configBody || !Array.isArray(configBody.circles) || !Array.isArray(configBody.divisions)) {
      return NextResponse.json({ success: false, message: 'Invalid master data structure' }, { status: 400 });
    }

    serverMasterData = configBody;

    if (supabase) {
      // 1. Sync discrete rows in fee_bill_master_items
      const flattened = flattenConfigToRows(configBody);
      await supabase.from('fee_bill_master_items').delete().neq('id', 'placeholder');
      if (flattened.length > 0) {
        await supabase.from('fee_bill_master_items').insert(flattened);
      }

      // 2. Backup to fee_bill_master_config blob
      await supabase
        .from('fee_bill_master_config')
        .upsert({
          id: 'default',
          config: configBody,
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: true, masterData: serverMasterData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg, masterData: serverMasterData }, { status: 500 });
  }
}
