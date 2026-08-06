import { IsString, IsEmail, IsEnum, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../types';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  officeName?: string;

  @IsOptional()
  @IsString()
  officeCode?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  officeName?: string;

  @IsOptional()
  @IsString()
  officeCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
