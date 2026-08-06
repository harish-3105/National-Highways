import { Pool } from 'pg';

export interface AuditLogData {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async log(data: AuditLogData): Promise<void> {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const values = [
      data.userId,
      data.action,
      data.entityType,
      data.entityId || null,
      data.oldValues ? JSON.stringify(data.oldValues) : null,
      data.newValues ? JSON.stringify(data.newValues) : null,
      data.ipAddress || null,
      data.userAgent || null,
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  async getAuditLogs(filters: {
    userId?: number;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = `
      SELECT 
        al.*,
        u.username,
        u.name as user_name,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      query += ` AND al.user_id = $${paramIndex++}`;
      values.push(filters.userId);
    }

    if (filters.entityType) {
      query += ` AND al.entity_type = $${paramIndex++}`;
      values.push(filters.entityType);
    }

    if (filters.action) {
      query += ` AND al.action = $${paramIndex++}`;
      values.push(filters.action);
    }

    if (filters.startDate) {
      query += ` AND al.created_at >= $${paramIndex++}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND al.created_at <= $${paramIndex++}`;
      values.push(filters.endDate);
    }

    query += ` ORDER BY al.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      values.push(filters.offset);
    }

    const result = await this.pool.query(query, values);
    return result.rows;
  }
}
