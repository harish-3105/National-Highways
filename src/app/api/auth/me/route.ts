import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const supabase = await createClient();

    // 1. Verify that user account is still active in database
    const { data: dbUser } = await supabase
      .from('user_profiles')
      .select('is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (dbUser && dbUser.is_active === false) {
      // Account was deactivated by administrator -> wipe cookie immediately
      await clearSessionCookie();
      return NextResponse.json(
        { user: null, error: 'Your staff account has been deactivated. Please contact your administrator.' },
        { status: 401 }
      );
    }

    // 2. Refresh dynamic lockdown status from database
    const { data: settings } = await supabase
      .from('system_settings')
      .select('is_lockdown_active')
      .eq('id', 'global_config')
      .maybeSingle();

    const isLockdownActive = settings?.is_lockdown_active || false;
    user.isLockdownActive = isLockdownActive;
    user.isActive = dbUser ? dbUser.is_active : true;

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Error fetching session:', err);
    return NextResponse.json({ user: null, error: err.message }, { status: 500 });
  }
}
