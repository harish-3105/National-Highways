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
      config.lawyerDesignations.push(r.name);
    } else if (cat === 'assistantDesignations') {
      config.assistantDesignations?.push(r.name);
    } else if (cat === 'caseTypes') {
      config.caseTypes.push(r.name);
    } else if (cat === 'casePertainsTo') {
      config.casePertainsTo.push(r.name);
    } else if (cat === 'paymentStatuses') {
      config.paymentStatuses.push(r.name);
    } else if (cat === 'statusOfObtainingGo' || cat === 'statusOfObtainingGoOptions') {
      config.statusOfObtainingGoOptions?.push(r.name);
    } else if (cat === 'statusOfPaymentProposal' || cat === 'statusOfPaymentProposalOptions') {
      config.statusOfPaymentProposalOptions?.push(r.name);
    } else if (cat === 'goStatusOptions' || cat === 'goStatus') {
      config.goStatusOptions?.push(r.name);
    } else if (cat === 'yesNoOptions') {
      config.yesNoOptions?.push(r.name);
    }
  });

  // Ensure default fallback if arrays are empty
  if (config.circles.length === 0) config.circles = [...DEFAULT_MASTER_DATA.circles];
  if (config.divisions.length === 0) config.divisions = [...DEFAULT_MASTER_DATA.divisions];
  if (config.lawyerDesignations.length === 0) config.lawyerDesignations = [...DEFAULT_MASTER_DATA.lawyerDesignations];
  if (!config.assistantDesignations || config.assistantDesignations.length === 0) {
    config.assistantDesignations = [...(DEFAULT_MASTER_DATA.assistantDesignations || [])];
  }
  if (config.caseTypes.length === 0) config.caseTypes = [...DEFAULT_MASTER_DATA.caseTypes];
  if (config.casePertainsTo.length === 0) config.casePertainsTo = [...DEFAULT_MASTER_DATA.casePertainsTo];
  if (config.paymentStatuses.length === 0) config.paymentStatuses = [...DEFAULT_MASTER_DATA.paymentStatuses];
  if (!config.statusOfObtainingGoOptions || config.statusOfObtainingGoOptions.length === 0) {
    config.statusOfObtainingGoOptions = [...(DEFAULT_MASTER_DATA.statusOfObtainingGoOptions || [])];
  }
  if (!config.statusOfPaymentProposalOptions || config.statusOfPaymentProposalOptions.length === 0) {
    config.statusOfPaymentProposalOptions = [...(DEFAULT_MASTER_DATA.statusOfPaymentProposalOptions || [])];
  }
  if (!config.goStatusOptions || config.goStatusOptions.length === 0) {
    config.goStatusOptions = [...(DEFAULT_MASTER_DATA.goStatusOptions || [])];
  }
  if (!config.yesNoOptions || config.yesNoOptions.length === 0) {
    config.yesNoOptions = [...(DEFAULT_MASTER_DATA.yesNoOptions || [])];
  }

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

      if (!rowsError && rows && rows.length > 0) {
        const assembled = assembleConfigFromRows(rows as MasterItemRow[]);
        serverMasterData = assembled;
        return NextResponse.json({ success: true, masterData: assembled });
      }

      // 2. If table exists but is empty, check legacy single blob table or seed defaults
      const { data: legacyData, error: legacyError } = await supabase
        .from('fee_bill_master_config')
        .select('config')
        .eq('id', 'default')
        .single();

      const sourceConfig: FeeBillMasterDataConfig = (!legacyError && legacyData?.config)
        ? (legacyData.config as FeeBillMasterDataConfig)
        : DEFAULT_MASTER_DATA;

      // Seed rows into fee_bill_master_items table
      if (!rowsError) {
        const seedRows = flattenConfigToRows(sourceConfig);
        await supabase.from('fee_bill_master_items').insert(seedRows);
      }

      serverMasterData = sourceConfig;
      return NextResponse.json({ success: true, masterData: sourceConfig });
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
    const body = await request.json();

    // Granular Single-Row Actions
    if (body && typeof body === 'object' && 'action' in body) {
      const { action, category, item } = body;

      if (action === 'reset') {
        serverMasterData = { ...DEFAULT_MASTER_DATA };
        if (supabase) {
          await supabase.from('fee_bill_master_items').delete().neq('id', 'placeholder');
          const seedRows = flattenConfigToRows(DEFAULT_MASTER_DATA);
          await supabase.from('fee_bill_master_items').insert(seedRows);
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
          if (item.id) {
            await supabase.from('fee_bill_master_items').delete().eq('id', item.id);
          } else if (item.name) {
            await supabase
              .from('fee_bill_master_items')
              .delete()
              .eq('category', category)
              .eq('name', item.name);
          }
        }
      }

      // Re-fetch assembled config
      if (supabase) {
        const { data: rows } = await supabase
          .from('fee_bill_master_items')
          .select('*')
          .order('created_at', { ascending: true });

        if (rows && rows.length > 0) {
          serverMasterData = assembleConfigFromRows(rows as MasterItemRow[]);
        }
      }

      return NextResponse.json({ success: true, masterData: serverMasterData });
    }

    // Full Config Sync (Backward-Compatible)
    const configBody = body as FeeBillMasterDataConfig;
    if (!configBody || !Array.isArray(configBody.circles) || !Array.isArray(configBody.divisions)) {
      return NextResponse.json({ success: false, message: 'Invalid master data structure' }, { status: 400 });
    }

    serverMasterData = configBody;

    if (supabase) {
      // 1. Sync discrete rows in fee_bill_master_items
      const flattened = flattenConfigToRows(configBody);
      await supabase.from('fee_bill_master_items').delete().neq('id', 'placeholder');
      await supabase.from('fee_bill_master_items').insert(flattened);

      // 2. Backup to legacy fee_bill_master_config blob as safety replica
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
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
