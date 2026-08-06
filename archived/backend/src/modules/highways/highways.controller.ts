import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HighwaysService } from './highways.service';
import { CreateHighwayDto, UpdateHighwayDto, HighwayQueryDto } from '../../common/dto/highway.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '../../common/types';

@Controller('highways')
@UseGuards(RolesGuard)
export class HighwaysController {
  constructor(private readonly highwaysService: HighwaysService) {}

  @Get()
  async getAllHighways(
    @CurrentUser() user: JwtPayload,
    @Query() queryDto: HighwayQueryDto,
  ): Promise<ApiResponse> {
    try {
      const highways = await this.highwaysService.getAccessibleHighways(user, queryDto);
      return ApiResponse.success(highways);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('geojson')
  async getHighwaysGeoJSON(
    @CurrentUser() user: JwtPayload,
    @Query() queryDto: HighwayQueryDto,
  ): Promise<ApiResponse> {
    try {
      const geojson = await this.highwaysService.getHighwaysGeoJSON(user, queryDto);
      return ApiResponse.success(geojson);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id/sections')
  async getHighwayWithSections(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      const highway = await this.highwaysService.getHighwayWithSections(user, id);
      return ApiResponse.success(highway);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async getHighwayById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      const highway = await this.highwaysService.getHighwayById(user, id);
      return ApiResponse.success(highway);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIVISION, UserRole.SUB_DIVISION)
  async createHighway(
    @CurrentUser() user: JwtPayload,
    @Body() createHighwayDto: CreateHighwayDto,
  ): Promise<ApiResponse> {
    try {
      const highway = await this.highwaysService.createHighway(user, createHighwayDto);
      return ApiResponse.success(highway, 'Highway created successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Post('bulk-upload')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'), false);
      }
    },
  }))
  async bulkUploadHighways(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    try {
      if (!file) {
        return ApiResponse.error('No file uploaded');
      }

      const result = await this.highwaysService.bulkUploadHighways(user, file.buffer);
      return ApiResponse.success(result, result.message);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Post(':id/bulk-sections')
  @Roles(UserRole.ADMIN, UserRole.DIVISION, UserRole.SUB_DIVISION)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'), false);
      }
    },
  }))
  async bulkUploadSections(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) parentHighwayId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse> {
    try {
      if (!file) {
        return ApiResponse.error('No file uploaded');
      }

      const result = await this.highwaysService.bulkUploadSections(user, parentHighwayId, file.buffer);
      return ApiResponse.success(result, result.message);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DIVISION, UserRole.SUB_DIVISION)
  async updateHighway(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHighwayDto: UpdateHighwayDto,
  ): Promise<ApiResponse> {
    try {
      const highway = await this.highwaysService.updateHighway(user, id, updateHighwayDto);
      return ApiResponse.success(highway, 'Highway updated successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteHighway(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      await this.highwaysService.deleteHighway(user, id);
      return ApiResponse.success(null, 'Highway deleted successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('nearby/:id')
  async getNearbyHighways(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('distance') distance: number = 10,
  ): Promise<ApiResponse> {
    try {
      const highways = await this.highwaysService.getNearbyHighways(user, id, distance);
      return ApiResponse.success(highways);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}
