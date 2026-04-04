import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AppleOAuthGuard } from './guards/apple-oauth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { RequestUser } from './strategies/jwt.strategy';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Email / Password ──────────────────────────────────────────────────────

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không đúng' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  // ── Token ─────────────────────────────────────────────────────────────────

  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi refresh token lấy token pair mới' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  refresh(
    @CurrentUser() user: { id: string; refreshToken: string },
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(user.id, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Đăng xuất (revoke refresh token)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ schema: { example: { message: 'Đăng xuất thành công' } } })
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id, dto.refreshToken);
    return { message: 'Đăng xuất thành công' };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @ApiExcludeEndpoint()
  googleAuth(): void {
    // Passport redirect — handled by GoogleOAuthGuard
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @ApiExcludeEndpoint()
  googleCallback(@Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.handleOAuthLogin(req.user as User);
  }

  // ── Apple OAuth ───────────────────────────────────────────────────────────

  @Get('apple')
  @Public()
  @UseGuards(AppleOAuthGuard)
  @ApiExcludeEndpoint()
  appleAuth(): void {
    // Passport redirect — handled by AppleOAuthGuard
  }

  @Post('apple/callback')
  @Public()
  @UseGuards(AppleOAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  appleCallback(@Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.handleOAuthLogin(req.user as User);
  }
}
