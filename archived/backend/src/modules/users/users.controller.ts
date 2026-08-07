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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from '../../common/dto/user.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '../../common/types';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @CurrentUser() user: JwtPayload,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ApiResponse> {
    try {
      const users = await this.usersService.getAccessibleUsers(
        user,
        includeInactive === 'true',
      );
      return ApiResponse.success(users);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get('tree')
  async getUserTree(@CurrentUser() user: JwtPayload): Promise<ApiResponse> {
    try {
      const tree = await this.usersService.getUserHierarchy(user);
      return ApiResponse.success(tree);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Get(':id')
  async getUserById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      const userData = await this.usersService.getUserById(user, id);
      return ApiResponse.success(userData);
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIVISION)
  async createUser(
    @CurrentUser() user: JwtPayload,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse> {
    try {
      const newUser = await this.usersService.createUser(user, createUserDto);
      return ApiResponse.success(newUser, 'User created successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DIVISION)
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse> {
    try {
      const updatedUser = await this.usersService.updateUser(user, id, updateUserDto);
      return ApiResponse.success(updatedUser, 'User updated successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      await this.usersService.deleteUser(user, id);
      return ApiResponse.success(null, 'User deleted successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.DIVISION)
  async deactivateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      await this.usersService.toggleUserStatus(user, id, false);
      return ApiResponse.success(null, 'User deactivated successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.DIVISION)
  async activateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      await this.usersService.toggleUserStatus(user, id, true);
      return ApiResponse.success(null, 'User activated successfully');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }
}
