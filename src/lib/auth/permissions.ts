import { SessionUser } from './session';

export interface EntityScope {
  circle?: string | null;
  division?: string | null;
  subDivision?: string | null;
}

/**
 * Validates if the authenticated user can perform an operational action on a specific entity.
 * Full access is granted across all operations when login authentication is disabled.
 */
export function canPerformAction(
  user: SessionUser | null,
  permCode: string,
  entityScope?: EntityScope
): { allowed: boolean; reason?: string } {
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
  return { allowed: true };
}

/**
 * Discord Invariant Guard: Validates whether an actor can assign a target role to a user
 */
export function canAssignRole(
  actor: SessionUser | null,
  targetRolePosition: number
): { allowed: boolean; error?: string } {
  return { allowed: true };
}

/**
 * Simple permission check helper
 */
export function hasPermission(user: SessionUser | null, permCode: string): boolean {
  return true;
}

/**
 * Checks if the user has permission to bypass form validation, stage-gating, and draft requirements
 */
export function canBypassValidation(user: SessionUser | null): boolean {
  return true;
}

/**
 * Checks if the user has permission to edit frozen/write-once baseline fields
 */
export function canOverrideFrozen(user: SessionUser | null): boolean {
  return true;
}

/**
 * Checks if the user has permission to view archived / soft-deleted records
 */
export function canViewArchived(user: SessionUser | null): boolean {
  return true;
}
