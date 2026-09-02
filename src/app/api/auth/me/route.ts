import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Refresh dynamic lockdown status from database
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from('system_settings')
      .select('is_lockdown_active')
      .eq('id', 'global_config')
      .maybeSingle();

    const isLockdownActive = settings?.is_lockdown_active || false;
    user.isLockdownActive = isLockdownActive;

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Error fetching session:', err);
    return NextResponse.json({ user: null, error: err.message }, { status: 500 });
  }
}
