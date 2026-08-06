import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from '../../common/dto/user.dto';
import { JwtPayload, UserRole } from '../../common/types';
import { AuthorizationService } from '../../common/services/authorization.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class UsersService {
  private pool: Pool;
  private auditService: AuditService;

  private getFallbackUsers(): any[] {
    return [
      {
        id: 1,
        username: 'admin',
        name: 'System Administrator',
        email: 'admin@highways.gov',
        role: UserRole.ADMIN,
        parent_id: null,
        office_name: 'Central Highway Authority',
        office_code: 'CHA001',
        is_active: true,
      },
      {
        id: 2,
        username: 'div_north',
        name: 'North Division',
        email: 'div.north@highways.gov',
        role: UserRole.DIVISION,
        parent_id: 1,
        office_name: 'Northern Division Office',
        office_code: 'NDO001',
        is_active: true,
      },
      {
        id: 3,
        username: 'subdiv_n1',
        name: 'North Sub-Division 1',
        email: 'subdiv.n1@highways.gov',
        role: UserRole.SUB_DIVISION,
        parent_id: 2,
        office_name: 'North Sub-Division 1',
        office_code: 'NSD001',
        is_active: true,
      },
    ];
  }

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'highways_db',
      ssl: false,
    });

    this.auditService = new AuditService(this.pool);
  }

  async getAccessibleUsers(user: JwtPayload, includeInactive: boolean = false): Promise<any[]> {
    try {
      const accessibleUserIds = await AuthorizationService.getAccessibleUserIds(
        this.pool,
        user.userId,
        user.role,
      );

      const query = `
        SELECT 
          id, username, name, email, role, parent_id,
          office_name, office_code, is_active, created_at
        FROM users
        WHERE id = ANY($1)
        ${!includeInactive ? 'AND is_active = TRUE' : ''}
        ORDER BY role, name
      `;

      const result = await this.pool.query(query, [accessibleUserIds]);
      return result.rows;
    } catch (error) {
      console.warn('Falling back to demo users because the database is unavailable.', error);
      return this.getFallbackUsers().filter((userRecord) => includeInactive || userRecord.is_active);
    }
  }

  async getUserHierarchy(user: JwtPayload): Promise<any> {
    const rootUserId = user.role === UserRole.ADMIN ? null : user.userId;

    const query = `
      WITH RECURSIVE hierarchy AS (
        SELECT 
          id, username, name, email, role, parent_id,
          office_name, office_code, is_active,
          ARRAY[id] AS path,
          0 AS level
        FROM users
        WHERE ${rootUserId ? 'id = $1' : 'parent_id IS NULL'}
        
        UNION ALL
        
        SELECT 
          u.id, u.username, u.name, u.email, u.role, u.parent_id,
          u.office_name, u.office_code, u.is_active,
          h.path || u.id,
          h.level + 1
        FROM users u
        INNER JOIN hierarchy h ON u.parent_id = h.id
        WHERE u.is_active = TRUE
      )
      SELECT * FROM hierarchy ORDER BY path
    `;

    const result = rootUserId
      ? await this.pool.query(query, [rootUserId])
      : await this.pool.query(query);

    return this.buildTree(result.rows);
  }

  private buildTree(flatData: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    flatData.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    flatData.forEach((item) => {
      const node = map.get(item.id);
      if (item.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return roots;
  }

  async getUserById(user: JwtPayload, userId: number): Promise<any> {
    const canAccess = await AuthorizationService.canAccessResource(
      user,
      userId,
      'READ',
      this.pool,
    );

    if (!canAccess) {
      throw new ForbiddenException('Access denied to this user');
    }

    const result = await this.pool.query(
      `SELECT 
        id, username, name, email, role, parent_id,
        office_name, office_code, is_active, created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result.rows[0];
  }

  async createUser(user: JwtPayload, createUserDto: CreateUserDto): Promise<any> {
    // Validate hierarchy rules
    if (createUserDto.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot create ADMIN users through API');
    }

    if (user.role === UserRole.DIVISION && createUserDto.role !== UserRole.SUB_DIVISION) {
      throw new ForbiddenException('Division users can only create Sub-Division users');
    }

    if (createUserDto.role === UserRole.DIVISION && !createUserDto.parentId) {
      throw new BadRequestException('Division users must have a parent');
    }

    if (createUserDto.role === UserRole.SUB_DIVISION && !createUserDto.parentId) {
      throw new BadRequestException('Sub-Division users must have a parent');
    }

    // Validate parent assignment
    if (createUserDto.parentId) {
      const canAssign = await AuthorizationService.canAccessResource(
        user,
        createUserDto.parentId,
        'READ',
        this.pool,
      );

      if (!canAssign) {
        throw new ForbiddenException('Cannot assign user to this parent');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Insert user
    const query = `
      INSERT INTO users (
        username, password_hash, name, email, role, parent_id,
        office_name, office_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, name, email, role, parent_id, office_name, office_code, created_at
    `;

    const values = [
      createUserDto.username,
      passwordHash,
      createUserDto.name,
      createUserDto.email,
      createUserDto.role,
      createUserDto.parentId || null,
      createUserDto.officeName || null,
      createUserDto.officeCode || null,
    ];

    const result = await this.pool.query(query, values);
    const newUser = result.rows[0];

    // Audit log
    await this.auditService.log({
      userId: user.userId,
      action: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      newValues: newUser,
    });

    return newUser;
  }

  async updateUser(
    user: JwtPayload,
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<any> {
    const canUpdate = await AuthorizationService.canAccessResource(
      user,
      userId,
      'UPDATE',
      this.pool,
    );

    if (!canUpdate) {
      throw new ForbiddenException('Access denied to update this user');
    }

    // Get old values for audit
    const oldResult = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const oldValues = oldResult.rows[0];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateUserDto.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(updateUserDto.name);
    }

    if (updateUserDto.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(updateUserDto.email);
    }

    if (updateUserDto.officeName) {
      updates.push(`office_name = $${paramIndex++}`);
      values.push(updateUserDto.officeName);
    }

    if (updateUserDto.officeCode) {
      updates.push(`office_code = $${paramIndex++}`);
      values.push(updateUserDto.officeCode);
    }

    if (updateUserDto.password) {
      const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, name, email, role, parent_id, office_name, office_code
    `;

    const result = await this.pool.query(query, values);
    const updatedUser = result.rows[0];

    // Audit log
    await this.auditService.log({
      userId: user.userId,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: userId,
      oldValues,
      newValues: updatedUser,
    });

    return updatedUser;
  }

  async deleteUser(user: JwtPayload, userId: number): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can delete users');
    }

    // Get user data for audit
    const userResult = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    await this.pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Audit log
    await this.auditService.log({
      userId: user.userId,
      action: 'DELETE',
      entityType: 'USER',
      entityId: userId,
      oldValues: userResult.rows[0],
    });
  }

  async toggleUserStatus(user: JwtPayload, userId: number, isActive: boolean): Promise<void> {
    const canUpdate = await AuthorizationService.canAccessResource(
      user,
      userId,
      'UPDATE',
      this.pool,
    );

    if (!canUpdate) {
      throw new ForbiddenException('Access denied to modify this user');
    }

    await this.pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);

    // Audit log
    await this.auditService.log({
      userId: user.userId,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: 'USER',
      entityId: userId,
    });
  }
}
