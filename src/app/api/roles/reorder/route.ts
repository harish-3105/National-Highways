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

    const roleMap = new Map(allRoles.map((r) => [r.id, r]));

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

    // Assign descending positions between 9000 and 10
    const totalCustom = customRolesToReorder.length;
    for (let i = 0; i < totalCustom; i++) {
      const id = customRolesToReorder[i];
      // Highest custom role gets (totalCustom - i) * 10
      const newPos = (totalCustom - i) * 10;
      
      // Ensure it doesn't exceed actor's position if not super admin
      const clampedPos = actor.isSuperAdmin ? newPos : Math.min(newPos, actor.position - (i + 1));

      await supabase
        .from('roles')
        .update({ position: clampedPos, updated_at: new Date().toISOString() })
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
