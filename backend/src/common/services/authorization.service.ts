import { UserRole, JwtPayload } from '../types';
import { Pool } from 'pg';

export class AuthorizationService {
  /**
   * Central authorization logic for hierarchical access control
   */
  static async canAccessResource(
    user: JwtPayload,
    resourceOwnerId: number,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    pool: Pool,
  ): Promise<boolean> {
    // ADMIN has full access to everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // DELETE is admin-only
    if (action === 'DELETE') {
      return false;
    }

    // For CREATE, user can create under themselves or their children
    if (action === 'CREATE') {
      return true; // Will be validated by division/subdivision assignment
    }

    // For READ and UPDATE, check ownership and hierarchy
    if (resourceOwnerId === user.userId) {
      return true;
    }

    // Check if resourceOwner is a descendant of current user
    const isDescendant = await this.isDescendant(pool, user.userId, resourceOwnerId);
    return isDescendant;
  }

  /**
   * Check if targetUserId is a descendant of ancestorUserId in the hierarchy
   */
  static async isDescendant(
    pool: Pool,
    ancestorUserId: number,
    targetUserId: number,
  ): Promise<boolean> {
    const query = `
      WITH RECURSIVE hierarchy AS (
        SELECT id, parent_id
        FROM users
        WHERE id = $1
        
        UNION ALL
        
        SELECT u.id, u.parent_id
        FROM users u
        INNER JOIN hierarchy h ON u.parent_id = h.id
      )
      SELECT EXISTS(SELECT 1 FROM hierarchy WHERE id = $2) AS is_descendant
    `;

    const result = await pool.query(query, [ancestorUserId, targetUserId]);
    return result.rows[0]?.is_descendant || false;
  }

  /**
   * Get all user IDs accessible to the current user (self + descendants)
   */
  static async getAccessibleUserIds(
    pool: Pool,
    userId: number,
    role: UserRole,
  ): Promise<number[]> {
    if (role === UserRole.ADMIN) {
      const result = await pool.query('SELECT id FROM users');
      return result.rows.map((row) => row.id);
    }

    const query = `
      WITH RECURSIVE hierarchy AS (
        SELECT id
        FROM users
        WHERE id = $1
        
        UNION ALL
        
        SELECT u.id
        FROM users u
        INNER JOIN hierarchy h ON u.parent_id = h.id
      )
      SELECT id FROM hierarchy
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map((row) => row.id);
  }

  /**
   * Validate if a user can assign a resource to a specific division/subdivision
   */
  static async canAssignTo(
    user: JwtPayload,
    divisionId: number | null,
    subDivisionId: number | null,
    pool: Pool,
  ): Promise<boolean> {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const accessibleIds = await this.getAccessibleUserIds(pool, user.userId, user.role);

    if (divisionId && !accessibleIds.includes(divisionId)) {
      return false;
    }

    if (subDivisionId && !accessibleIds.includes(subDivisionId)) {
      return false;
    }

    return true;
  }
}
