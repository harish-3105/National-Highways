import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  try {
    const actor = await getSession();
    if (!actor || !hasPermission(actor, 'roles:manage')) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "roles:manage" permission.' },
        { status: 403 }
      );
    }

    const { orderedRoleIds } = await req.json();

    if (!Array.isArray(orderedRoleIds) || orderedRoleIds.length === 0) {
      return NextResponse.json({ error: 'orderedRoleIds array is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch all current roles
    const { data: allRoles, error: fetchErr } = await supabase
      .from('roles')
      .select('*')
      .order('position', { ascending: false });

    if (fetchErr || !allRoles) {
      return NextResponse.json({ error: fetchErr?.message || 'Failed to fetch roles' }, { status: 500 });
    }

    const roleMap = new Map<string, any>((allRoles as any[]).map((r: any) => [r.id, r]));

    // Discord Invariant Check: Non-admins cannot move roles at or above themselves
    if (!actor.isSuperAdmin) {
      for (const id of orderedRoleIds) {
        const role = roleMap.get(id);
        if (role && role.position >= actor.position) {
          return NextResponse.json(
            { error: `Hierarchy boundary: You cannot reorder the role "${role.name}" which is at or above your rank.` },
            { status: 403 }
          );
        }
      }
    }

    // Filter out Super Admin (locked top) and Viewer (locked bottom) from renumbering
    const customRolesToReorder = orderedRoleIds.filter((id) => {
      const r = roleMap.get(id);
      return r && !r.is_system_role;
    });

    const totalCustom = customRolesToReorder.length;

    // Step 1: Temporarily set positions to negative offsets to avoid unique key collisions during reorder
    for (let i = 0; i < totalCustom; i++) {
      const id = customRolesToReorder[i];
      await supabase
        .from('roles')
        .update({ position: -(i + 100) })
        .eq('id', id);
    }

    // Step 2: Assign clean sequential descending positions from totalCustom down to 1
    for (let i = 0; i < totalCustom; i++) {
      const id = customRolesToReorder[i];
      const finalPos = totalCustom - i; // Highest in UI list gets totalCustom, bottom gets 1

      await supabase
        .from('roles')
        .update({ position: finalPos, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Log Tamper-Proof Audit
    await logAudit({
      actor,
      module: 'ROLES',
      action: 'UPDATE',
      entityId: 'roles_reorder',
      entityTitle: 'Roles Hierarchy Reordered',
      changesSummary: `Reordered role hierarchy stack (${totalCustom} custom roles updated)`,
    });

    return NextResponse.json({
      success: true,
      message: 'Role hierarchy stack reordered successfully.',
    });
  } catch (err: any) {
    console.error('Error reordering roles:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
