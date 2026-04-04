import * as bcrypt from 'bcrypt';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Register / Login ──────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
    return this.issueTokenPair(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const valid = await this.usersService.validatePassword(
      dto.password,
      user.passwordHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    return this.issueTokenPair(user);
  }

  // ── Refresh / Logout ──────────────────────────────────────────────────────

  async refresh(
    userId: string,
    rawRefreshToken: string,
  ): Promise<AuthResponseDto> {
    const tokenRecord = await this.findValidRefreshToken(
      userId,
      rawRefreshToken,
    );

    // Revoke old token (rotation)
    tokenRecord.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenRecord);

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return this.issueTokenPair(user);
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenRecord = await this.findValidRefreshToken(
      userId,
      rawRefreshToken,
    );
    tokenRecord.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenRecord);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────

  async validateOAuthUser(
    provider: 'google' | 'apple',
    profile: { email: string; name: string; providerId: string },
  ): Promise<User> {
    const idField = provider === 'google' ? 'googleId' : 'appleId';

    // 1. Tìm theo providerId
    let user = await this.usersService.findByEmail(profile.email);

    if (user) {
      // Link provider nếu chưa liên kết
      if (!user[idField]) {
        user = await this.usersService.linkOAuthProvider(
          user.id,
          provider,
          profile.providerId,
        );
      }
    } else {
      // Tạo user mới từ OAuth
      user = await this.usersService.createOAuthUser({
        email: profile.email,
        name: profile.name,
        [`${provider}Id`]: profile.providerId,
      });
    }

    return user;
  }

  async handleOAuthLogin(user: User): Promise<AuthResponseDto> {
    return this.issueTokenPair(user);
  }

  // ── Token helpers ─────────────────────────────────────────────────────────

  private async issueTokenPair(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: (this.configService.get<string>('jwt.expiresIn') ??
        '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ??
        '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async storeRefreshToken(
    userId: string,
    rawToken: string,
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const record = this.refreshTokenRepository.create({
      tokenHash,
      userId,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshTokenRepository.save(record);
  }

  private async findValidRefreshToken(
    userId: string,
    rawToken: string,
  ): Promise<RefreshToken> {
    const now = new Date();

    const candidates = await this.refreshTokenRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
      },
    });

    // Filter out expired
    const active = candidates.filter((t) => t.expiresAt > now);

    for (const candidate of active) {
      const match = await bcrypt.compare(rawToken, candidate.tokenHash);
      if (match) return candidate;
    }

    throw new UnauthorizedException(
      'Refresh token không hợp lệ hoặc đã hết hạn',
    );
  }

  /** Cleanup cron: remove expired tokens (call từ scheduler nếu cần) */
  async purgeExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
