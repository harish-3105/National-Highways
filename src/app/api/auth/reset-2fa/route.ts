import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { generateTotpSecret } from '@/lib/auth/totp';
import { logAudit } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  try {
    const actor = await getSession();
    if (!actor || !hasPermission(actor, 'users:reset_2fa')) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "users:reset_2fa" permission to reset 2FA.' },
        { status: 403 }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'Target userId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch target user profile
    const { data: targetUser, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('id, phone_number, full_name, role_id, roles ( position )')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Hierarchy boundary check: Cannot reset 2FA of someone higher or equal unless Super Admin
    const targetPos = (targetUser.roles as any)?.position || 0;
    if (!actor.isSuperAdmin && targetPos >= actor.position) {
      return NextResponse.json(
        { error: 'Cannot reset 2FA for a staff member holding an equal or higher rank.' },
        { status: 403 }
      );
    }

    // Generate new fresh Base32 secret
    const newSecret = generateTotpSecret();

    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update({
        totp_secret: newSecret,
        totp_enabled: false,
        totp_verified_at: null,
      })
      .eq('id', userId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log tamper-proof audit trail
    await logAudit({
      actor,
      module: 'STAFF',
      action: 'UPDATE',
      entityId: targetUser.id,
      entityTitle: `Reset 2FA: ${targetUser.full_name}`,
      changesSummary: `Reset Authenticator 2FA secret for ${targetUser.full_name} (${targetUser.phone_number})`,
    });

    return NextResponse.json({
      success: true,
      message: `2FA successfully reset for ${targetUser.full_name}. They will be prompted to scan a new QR code on next login.`,
    });
  } catch (err: any) {
    console.error('Error resetting 2FA:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
