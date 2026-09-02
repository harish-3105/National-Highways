import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit/logger';

export async function POST() {
  try {
    const user = await getSession();
    if (user) {
      await logAudit({
        actor: user,
        module: 'SYSTEM',
        action: 'UPDATE',
        entityId: user.id,
        entityTitle: `User Logout: ${user.fullName}`,
        changesSummary: 'Staff member logged out',
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('Error logging out:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
