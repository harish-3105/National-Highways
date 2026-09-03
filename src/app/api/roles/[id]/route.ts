import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { canMutateRole, hasPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/logger';

// PUT /api/roles/[id] - Update a role and its permission matrix
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await getSession();

    if (!actor || !hasPermission(actor, 'roles:manage')) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "roles:manage" permission.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch existing role
    const { data: existingRole, error: fetchErr } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.is_system_role && !actor.isSuperAdmin) {
      return NextResponse.json(
        { error: 'System baseline roles (Super Admin and Viewer) cannot be modified.' },
        { status: 403 }
      );
    }

    const { name, description, default_scope, permissions } = await req.json();

    // Discord Invariant Check
    const validation = canMutateRole(actor, existingRole.position, permissions);
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Fetch existing permissions for diffing
    const { data: oldPerms } = await supabase
      .from('role_permissions')
      .select('permission_code')
      .eq('role_id', id);

    const oldPermList = (oldPerms || []).map((p) => p.permission_code);

    // Update Role Metadata
    const updatePayload: Record<string, any> = {};
    if (name && !existingRole.is_system_role) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description;
    if (default_scope) updatePayload.default_scope = default_scope;
    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedRole, error: updateErr } = await supabase
      .from('roles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Update Permissions Matrix if provided and not Super Admin
    if (permissions && Array.isArray(permissions) && !existingRole.is_system_role) {
      await supabase.from('role_permissions').delete().eq('role_id', id);

      if (permissions.length > 0) {
        const rows = permissions.map((code: string) => ({
          role_id: id,
          permission_code: code,
        }));
        await supabase.from('role_permissions').insert(rows);
      }
    }

    // Log Tamper-Proof Audit
    await logAudit({
      actor,
      module: 'ROLES',
      action: 'UPDATE',
      entityId: id,
      entityTitle: `Role Updated: ${updatedRole.name}`,
      oldState: { ...existingRole, permissions: oldPermList },
      newState: { ...updatedRole, permissions: permissions || oldPermList },
      changesSummary: `Updated permissions and configurations for role "${updatedRole.name}"`,
    });

    return NextResponse.json({
      success: true,
      role: {
        ...updatedRole,
        permissions: permissions || oldPermList,
      },
    });
  } catch (err: any) {
    console.error('Error updating role:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete a custom role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await getSession();

    if (!actor || !hasPermission(actor, 'roles:manage')) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "roles:manage" permission.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch existing role
    const { data: existingRole, error: fetchErr } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'System baseline roles (Super Admin and Viewer) cannot be deleted.' },
        { status: 400 }
      );
    }

    // Discord Invariant Check
    const validation = canMutateRole(actor, existingRole.position);
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Find Viewer fallback role
    const { data: viewerRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Viewer')
      .single();

    if (viewerRole) {
      // Reassign users with this role to Viewer
      await supabase
        .from('user_profiles')
        .update({ role_id: viewerRole.id })
        .eq('role_id', id);
    }

    // Delete role
    const { error: deleteErr } = await supabase.from('roles').delete().eq('id', id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Normalize remaining custom roles sequentially from 1 to N
    const { data: remainingCustomRoles } = await supabase
      .from('roles')
      .select('id, position')
      .eq('is_system_role', false)
      .order('position', { ascending: true });

    if (remainingCustomRoles && remainingCustomRoles.length > 0) {
      for (let i = 0; i < remainingCustomRoles.length; i++) {
        await supabase
          .from('roles')
          .update({ position: -(i + 100) })
          .eq('id', remainingCustomRoles[i].id);
      }
      for (let i = 0; i < remainingCustomRoles.length; i++) {
        await supabase
          .from('roles')
          .update({ position: i + 1, updated_at: new Date().toISOString() })
          .eq('id', remainingCustomRoles[i].id);
      }
    }

    // Log Tamper-Proof Audit
    await logAudit({
      actor,
      module: 'ROLES',
      action: 'DELETE',
      entityId: id,
      entityTitle: `Role Deleted: ${existingRole.name}`,
      oldState: existingRole,
      changesSummary: `Deleted custom role "${existingRole.name}" (assigned users reassigned to Viewer)`,
    });

    return NextResponse.json({
      success: true,
      message: `Role "${existingRole.name}" deleted successfully.`,
    });
  } catch (err: any) {
    console.error('Error deleting role:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
