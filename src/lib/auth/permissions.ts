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
    const isReadOnlyAction = permCode.endsWith(':view') || permCode.endsWith(':export');
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

  // Geographic Jurisdiction Scoping (PBAC)
  if (user.jurisdictionScope === 'STATEWIDE') {
    return { allowed: true };
  }

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
          error: `Anti-escalation rule: You cannot grant the permission "${perm}" because you do not personally possess it.`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Discord Invariant Guard: Validates whether an actor can assign a role to a member
 */
export function canAssignRole(
  actor: SessionUser | null,
  targetMemberHighestPosition: number,
  roleToAssignPosition: number
): { allowed: boolean; error?: string } {
  if (!actor) return { allowed: false, error: 'Authentication required.' };
  if (actor.isSuperAdmin) return { allowed: true };

  // 1. Must possess roles:assign permission
  if (!actor.permissions.includes('roles:assign') && !actor.permissions.includes('*:*')) {
    return { allowed: false, error: 'You lack the "roles:assign" permission.' };
  }

  // 2. Cannot modify a member who is at or above self
  if (targetMemberHighestPosition >= actor.position) {
    return {
      allowed: false,
      error: `Hierarchy boundary: You cannot modify roles for a staff member who holds a rank (${targetMemberHighestPosition}) at or above your own (${actor.position}).`,
    };
  }

  // 3. Cannot assign a role at or above self
  if (roleToAssignPosition >= actor.position) {
    return {
      allowed: false,
      error: `Hierarchy boundary: You cannot assign a role of rank ${roleToAssignPosition} (your highest rank is ${actor.position}).`,
    };
  }

  return { allowed: true };
}

/**
 * Helper to check if a specific permission is present in a user's permission list
 */
export function hasPermission(user: SessionUser | null, permCode: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(permCode) || user.permissions.includes('*:*');
}
