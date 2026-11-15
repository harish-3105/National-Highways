import { NextResponse } from 'next/server';
import { createMockSupabaseClient } from '@/lib/mock/mockSupabase';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  return createMockSupabaseClient();
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Database connection not available' }, { status: 500 });
    }

    const session = await getSession();
    const authCheck = canPerformAction(session, 'works:view');
    if (!authCheck.allowed) {
      return NextResponse.json({ success: false, message: authCheck.reason || 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId query parameter is required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('major_projects_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('snapshot_date', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshots: data || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
