import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { canMutateRole, hasPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/logger';

// GET /api/roles - List all roles in ordered hierarchy with permissions
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all roles ordered by position DESC
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('position', { ascending: false });

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    // Fetch all role_permissions
    const { data: rolePerms, error: permsError } = await supabase
      .from('role_permissions')
      .select('*');

    if (permsError) {
      return NextResponse.json({ error: permsError.message }, { status: 500 });
    }

    // Fetch all permissions master catalog
    const { data: allPerms, error: catalogError } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true });

    if (catalogError) {
      return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    // Fetch user counts per role
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('role_id');

    const userCountMap: Record<string, number> = {};
    (userProfiles || []).forEach((u) => {
      userCountMap[u.role_id] = (userCountMap[u.role_id] || 0) + 1;
    });

    // Map permissions into each role
    const permsByRole: Record<string, string[]> = {};
    (rolePerms || []).forEach((rp) => {
      if (!permsByRole[rp.role_id]) permsByRole[rp.role_id] = [];
      permsByRole[rp.role_id].push(rp.permission_code);
    });

    const enrichedRoles = (roles || []).map((role) => ({
      ...role,
      permissions: role.name === 'Super Admin' ? ['*:*'] : permsByRole[role.id] || [],
      memberCount: userCountMap[role.id] || 0,
    }));

    return NextResponse.json({
      roles: enrichedRoles,
      permissionsCatalog: allPerms || [],
    });
  } catch (err: any) {
    console.error('Error fetching roles:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/roles - Create a new custom role in the hierarchy
export async function POST(req: NextRequest) {
  try {
    const actor = await getSession();
    if (!actor || !hasPermission(actor, 'roles:manage')) {
      return NextResponse.json(
        { error: 'Unauthorized: You require the "roles:manage" permission.' },
        { status: 403 }
      );
    }

    const { name, description, default_scope, permissions } = await req.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch all existing custom roles to dynamically assign next sequential position (1 to N)
    const { data: existingRoles, error: rolesFetchError } = await supabase
      .from('roles')
      .select('id, position, is_system_role')
      .eq('is_system_role', false)
      .order('position', { ascending: true });

    if (rolesFetchError) {
      return NextResponse.json({ error: rolesFetchError.message }, { status: 500 });
    }

    const customRoles = existingRoles || [];
    // The new role position is dynamically indexed as (count + 1)
    const targetPosition = customRoles.length + 1;

    // Enforce Discord Invariants (Ensure targetPosition is strictly below creator's rank)
    const validation = canMutateRole(actor, targetPosition, permissions);
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Insert Role
    const { data: newRole, error: insertError } = await supabase
      .from('roles')
      .insert([
        {
          name: name.trim(),
          description: description || null,
          default_scope: default_scope || 'DIVISION',
          position: targetPosition,
          is_system_role: false,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Insert Role Permissions
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const junctionRows = permissions.map((code: string) => ({
        role_id: newRole.id,
        permission_code: code,
      }));

      await supabase.from('role_permissions').insert(junctionRows);
    }

    // Log tamper-proof audit
    await logAudit({
      actor,
      module: 'ROLES',
      action: 'CREATE',
      entityId: newRole.id,
      entityTitle: `Role Created: ${newRole.name}`,
      newState: { ...newRole, permissions },
      changesSummary: `Created custom role "${newRole.name}" at rank position ${newRole.position}`,
    });

    return NextResponse.json({
      success: true,
      role: {
        ...newRole,
        permissions: permissions || [],
      },
    });
  } catch (err: any) {
    console.error('Error creating role:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
