import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTotpCode } from '@/lib/auth/totp';
import { setSessionCookie, SessionUser } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and 6-digit authenticator code are required' },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    const cleanCode = code.trim().replace(/[\s-]/g, '');

    const supabase = await createClient();

    // 1. Fetch user profile with role info
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        phone_number,
        full_name,
        is_active,
        totp_secret,
        totp_enabled,
        jurisdiction_scope,
        circle,
        division,
        sub_division,
        role_id,
        roles (
          id,
          name,
          position,
          is_system_role
        )
      `)
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'This account has been deactivated.' }, { status: 403 });
    }

    // 2. Verify TOTP Code
    const isValid = verifyTotpCode(cleanCode, user.totp_secret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 6-digit code. Please check your Google or Microsoft Authenticator app and try again.' },
        { status: 401 }
      );
    }

    // 3. Update verification timestamp / enable TOTP
    const now = new Date().toISOString();
    await supabase
      .from('user_profiles')
      .update({
        totp_enabled: true,
        totp_verified_at: user.totp_enabled ? undefined : now,
        last_login_at: now,
      })
      .eq('id', user.id);

    // 4. Fetch Role Permissions
    const roleData = user.roles as any;
    const isSuperAdmin = roleData?.name === 'Super Admin' || roleData?.position === 999999;

    let permissions: string[] = [];
    if (isSuperAdmin) {
      permissions = ['*:*'];
    } else {
      const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('permission_code')
        .eq('role_id', user.role_id);

      permissions = (rolePerms || []).map((rp) => rp.permission_code);
    }

    // 5. Fetch Global Lockdown State
    const { data: settings } = await supabase
      .from('system_settings')
      .select('is_lockdown_active')
      .eq('id', 'global_config')
      .maybeSingle();

    const isLockdownActive = settings?.is_lockdown_active || false;

    // 6. Assemble Session User Payload
    const sessionUser: SessionUser = {
      id: user.id,
      phoneNumber: user.phone_number,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: roleData?.name || 'Viewer',
      position: roleData?.position || 0,
      isSuperAdmin,
      jurisdictionScope: user.jurisdiction_scope || 'DIVISION',
      circle: user.circle || null,
      division: user.division || null,
      subDivision: user.sub_division || null,
      permissions,
      isLockdownActive,
    };

    // 7. Set HTTP-Only Cookie
    await setSessionCookie(sessionUser);

    // 8. Log Login Audit Event
    await logAudit({
      actor: sessionUser,
      module: 'SYSTEM',
      action: 'UPDATE',
      entityId: user.id,
      entityTitle: `User Login: ${user.full_name}`,
      changesSummary: `Staff member logged in via Authenticator TOTP`,
    });

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (err: any) {
    console.error('Error verifying TOTP:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
