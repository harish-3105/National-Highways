import { IsString, IsEnum, IsOptional, IsInt, MinLength, MaxLength, IsObject, IsNumber } from 'class-validator';
import { HighwayStatus } from '../types';

export class CreateHighwayDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  roadName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  roadCode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fromLocation: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  toLocation: string;

  @IsOptional()
  @IsString()
  fromChainage?: string;

  @IsOptional()
  @IsString()
  toChainage?: string;

  @IsOptional()
  @IsString()
  configuration?: string;

  @IsOptional()
  @IsNumber()
  startLatitude?: number;

  @IsOptional()
  @IsNumber()
  startLongitude?: number;

  @IsOptional()
  @IsNumber()
  endLatitude?: number;

  @IsOptional()
  @IsNumber()
  endLongitude?: number;

  @IsOptional()
  @IsObject()
  geometry?: {
    type: string;
    coordinates: number[][];
  };

  @IsOptional()
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsInt()
  subDivisionId?: number;

  @IsOptional()
  @IsEnum(HighwayStatus)
  status?: HighwayStatus;

  @IsOptional()
  @IsInt()
  parentHighwayId?: number;

  @IsOptional()
  @IsInt()
  sectionNumber?: number;

  @IsOptional()
  isParent?: boolean;
}

export class UpdateHighwayDto {
  @IsOptional()
  @IsString()
  roadName?: string;

  @IsOptional()
  @IsString()
  roadCode?: string;

  @IsOptional()
  @IsString()
  fromLocation?: string;

  @IsOptional()
  @IsString()
  toLocation?: string;

  @IsOptional()
  @IsString()
  fromChainage?: string;

  @IsOptional()
  @IsString()
  toChainage?: string;

  @IsOptional()
  @IsString()
  configuration?: string;

  @IsOptional()
  @IsNumber()
  startLatitude?: number;

  @IsOptional()
  @IsNumber()
  startLongitude?: number;

  @IsOptional()
  @IsNumber()
  endLatitude?: number;

  @IsOptional()
  @IsNumber()
  endLongitude?: number;

  @IsOptional()
  @IsObject()
  geometry?: {
    type: string;
    coordinates: number[][];
  };

  @IsOptional()
  @IsEnum(HighwayStatus)
  status?: HighwayStatus;

  @IsOptional()
  @IsInt()
  parentHighwayId?: number;

  @IsOptional()
  @IsInt()
  sectionNumber?: number;

  @IsOptional()
  isParent?: boolean;

  @IsOptional()
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsInt()
  subDivisionId?: number;
}

export class HighwayQueryDto {
  @IsOptional()
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @IsInt()
  subDivisionId?: number;

  @IsOptional()
  @IsEnum(HighwayStatus)
  status?: HighwayStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface BulkUploadError {
  row: number;
  highway: string;
  error: string;
}

export class BulkUploadResultDto {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: BulkUploadError[];
  message: string;
}
