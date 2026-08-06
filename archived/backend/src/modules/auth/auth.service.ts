import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from '../../common/dto/user.dto';
import { JwtPayload, UserRole } from '../../common/types';
import { AuditService } from '../../common/services/audit.service';
import { createDbPool } from '../../common/database/database.provider';

@Injectable()
export class AuthService {
  private pool: Pool;
  private auditService: AuditService;

  constructor() {
    this.pool = createDbPool();
    this.auditService = new AuditService(this.pool);
  }

  async login(loginDto: LoginDto): Promise<{
    token: string;
    user: {
      id: number;
      username: string;
      name: string;
      email: string;
      role: UserRole;
      parentId: number | null;
      officeName: string;
      officeCode: string;
    };
  }> {
    const { username, password } = loginDto;

    try {
      const result = await this.pool.query(
        `SELECT id, username, password_hash, name, email, role, parent_id, 
                office_name, office_code, is_active
         FROM users 
         WHERE username = $1`,
        [username],
      );

      if (result.rows.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new UnauthorizedException('User account is deactivated');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        parentId: user.parent_id,
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRATION || '24h' },
      );

      await this.auditService.log({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          parentId: user.parent_id,
          officeName: user.office_name,
          officeCode: user.office_code,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key',
      ) as JwtPayload;

      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

