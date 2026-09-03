import { SessionUser } from './session';

export interface EntityScope {
  circle?: string | null;
  division?: string | null;
  subDivision?: string | null;
}

/**
 * Validates if the authenticated user can perform an operational action on a specific entity
 */
export function canPerformAction(
  user: SessionUser | null,
  permCode: string,
  entityScope?: EntityScope
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required. Please log in.' };
  }

  // Super Admin has full unrestricted access
  if (user.isSuperAdmin) {
    return { allowed: true };
  }

  // Emergency Lockdown Enforcement
  if (user.isLockdownActive) {
    const isReadOnlyAction = permCode.endsWith(':view') || permCode.endsWith(':export') || permCode.endsWith(':view_history');
    if (!isReadOnlyAction) {
      return {
        allowed: false,
        reason: 'System is currently under emergency read-only lockdown. Write operations are frozen.',
      };
    }
  }

  // Permission Check
  const hasPerm = user.permissions.includes(permCode) || user.permissions.includes('*:*');
  if (!hasPerm) {
    return {
      allowed: false,
      reason: `You do not have the required permission (${permCode}) to perform this action.`,
    };
  }

  // Super Admin / Statewide scope bypasses all jurisdiction boundary checks
  if (user.jurisdictionScope === 'STATEWIDE') {
    return { allowed: true };
  }

  const isReadOnly = permCode.endsWith(':view') || permCode.endsWith(':export') || permCode.endsWith(':view_history');

  // If read-only action, check if user has 'jurisdiction:view_statewide'
  if (isReadOnly && (user.permissions.includes('jurisdiction:view_statewide') || user.permissions.includes('*:*'))) {
    return { allowed: true };
  }

  // If write/mutation action, check if user has 'jurisdiction:edit_statewide'
  if (!isReadOnly && (user.permissions.includes('jurisdiction:edit_statewide') || user.permissions.includes('*:*'))) {
    return { allowed: true };
  }

  // Geographic Jurisdiction Boundary Enforcement (PBAC)
  if (user.jurisdictionScope === 'CIRCLE' && entityScope?.circle && user.circle) {
    if (entityScope.circle.trim().toLowerCase() !== user.circle.trim().toLowerCase()) {
      return {
        allowed: false,
        reason: `Jurisdiction boundary: You are assigned to ${user.circle} Circle, but this record belongs to ${entityScope.circle} Circle.`,
      };
    }
  }

  if (user.jurisdictionScope === 'DIVISION' && entityScope?.division && user.division) {
    if (entityScope.division.trim().toLowerCase() !== user.division.trim().toLowerCase()) {
      return {
        allowed: false,
        reason: `Jurisdiction boundary: You are assigned to ${user.division} Division, but this record belongs to ${entityScope.division} Division.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Discord Invariant Guard: Validates whether an actor can create, edit, or delete a role
 */
export function canMutateRole(
  actor: SessionUser | null,
  targetPosition: number,
  requestedPermissions?: string[]
): { allowed: boolean; error?: string } {
  if (!actor) return { allowed: false, error: 'Authentication required.' };
  if (actor.isSuperAdmin) return { allowed: true };

  // 1. Must possess roles:manage permission
  if (!actor.permissions.includes('roles:manage') && !actor.permissions.includes('*:*')) {
    return { allowed: false, error: 'You lack the "roles:manage" permission.' };
  }

  // 2. Cannot touch roles at or above own highest position (Discord Invariant)
  if (targetPosition >= actor.position) {
    return {
      allowed: false,
      error: `Hierarchy boundary: You cannot create or modify a role with rank position ${targetPosition} (your highest rank is ${actor.position}).`,
    };
  }

  // 3. Permission Subset Invariant: Cannot grant unowned permissions
  if (requestedPermissions && requestedPermissions.length > 0) {
    for (const perm of requestedPermissions) {
      if (!actor.permissions.includes(perm) && !actor.permissions.includes('*:*')) {
        return {
          allowed: false,
          error: `Anti-escalation security violation: You cannot grant the permission "${perm}" because you do not hold it yourself.`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Discord Invariant Guard: Validates whether an actor can assign a target role to a user
 */
export function canAssignRole(
  actor: SessionUser | null,
  targetRolePosition: number
): { allowed: boolean; error?: string } {
  if (!actor) return { allowed: false, error: 'Authentication required.' };
  if (actor.isSuperAdmin) return { allowed: true };

  if (!actor.permissions.includes('roles:assign') && !actor.permissions.includes('*:*')) {
    return { allowed: false, error: 'You lack the "roles:assign" permission.' };
  }

  if (targetRolePosition >= actor.position) {
    return {
      allowed: false,
      error: `Hierarchy boundary: You cannot assign a role with position ${targetRolePosition} (your rank is ${actor.position}).`,
    };
  }

  return { allowed: true };
}

/**
 * Simple permission check helper
 */
export function hasPermission(user: SessionUser | null, permCode: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(permCode) || user.permissions.includes('*:*');
}

/**
 * Checks if the user has permission to bypass form validation, stage-gating, and draft requirements
 */
export function canBypassValidation(user: SessionUser | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return (
    hasPermission(user, 'system:bypass_validation') ||
    hasPermission(user, 'system:creative_mode') ||
    user.permissions.includes('*:*')
  );
}

/**
 * Checks if the user has permission to edit frozen/write-once baseline fields
 */
export function canOverrideFrozen(user: SessionUser | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return (
    hasPermission(user, 'works:override_frozen') ||
    hasPermission(user, 'system:creative_mode') ||
    user.permissions.includes('*:*')
  );
}
