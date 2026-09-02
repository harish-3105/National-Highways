import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const actor = await getSession();
    const searchParams = req.nextUrl.searchParams;

    const moduleFilter = searchParams.get('module');
    const entityId = searchParams.get('entityId');
    const userPhone = searchParams.get('userPhone');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // If searching global audit logs without a specific entityId, require system:audit_view perm
    if (!entityId && (!actor || !hasPermission(actor, 'system:audit_view'))) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "system:audit_view" permission to view statewide audit logs.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    let query = supabase.from('audit_logs').select('*', { count: 'exact' });

    if (moduleFilter) query = query.eq('module', moduleFilter);
    if (entityId) query = query.eq('entity_id', entityId);
    if (userPhone) query = query.ilike('user_phone', `%${userPhone}%`);
    if (action) query = query.eq('action', action);

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs || [],
      totalCount: count || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('Error querying audit logs:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
