import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../../common/dto/user.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const result = await this.authService.login(loginDto);
      return ApiResponse.success(result, 'Login successful');
    } catch (error) {
      return ApiResponse.error(error.message);
    }
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body('token') token: string): Promise<ApiResponse> {
    try {
      const result = await this.authService.validateToken(token);
      return ApiResponse.success(result, 'Token is valid');
    } catch (error) {
      return ApiResponse.error('Invalid token');
    }
  }
}
