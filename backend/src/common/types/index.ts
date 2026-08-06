export enum UserRole {
  ADMIN = 'ADMIN',
  DIVISION = 'DIVISION',
  SUB_DIVISION = 'SUB_DIVISION',
}

export enum HighwayStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  CLOSED = 'CLOSED',
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
  parentId: number | null;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}
