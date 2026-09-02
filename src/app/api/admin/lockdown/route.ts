import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/logger';

// GET /api/admin/lockdown - Check current emergency lockdown status
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'global_config')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      isLockdownActive: settings?.is_lockdown_active || false,
      lockdownReason: settings?.lockdown_reason || null,
      lockedAt: settings?.locked_at || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/lockdown - Toggle emergency lockdown
export async function POST(req: NextRequest) {
  try {
    const actor = await getSession();
    if (!actor || !hasPermission(actor, 'system:lockdown_toggle')) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "system:lockdown_toggle" permission.' },
        { status: 403 }
      );
    }

    const { active, reason } = await req.json();
    const supabase = await createClient();

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('system_settings')
      .upsert({
        id: 'global_config',
        is_lockdown_active: Boolean(active),
        lockdown_reason: reason || (active ? 'Emergency statewide read-only freeze activated by Administrator' : null),
        locked_by: actor.id,
        locked_at: active ? now : null,
        updated_at: now,
      });

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log Tamper-Proof Audit
    await logAudit({
      actor,
      module: 'SYSTEM',
      action: 'LOCKDOWN_TOGGLE',
      entityId: 'global_config',
      entityTitle: 'Master Emergency Lockdown Switch',
      changesSummary: active
        ? `ACTIVATED statewide emergency read-only freeze (${reason || 'No reason specified'})`
        : `DEACTIVATED statewide emergency freeze. Normal write permissions restored.`,
    });

    return NextResponse.json({
      success: true,
      isLockdownActive: Boolean(active),
      message: active
        ? 'Emergency read-only lockdown is now ACTIVE statewide.'
        : 'Emergency lockdown DEACTIVATED. Normal write operations restored.',
    });
  } catch (err: any) {
    console.error('Error toggling lockdown:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
