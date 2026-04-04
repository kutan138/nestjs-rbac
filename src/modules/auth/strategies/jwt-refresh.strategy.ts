import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.refreshSecret') ?? 'jwt-refresh-secret',
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: JwtPayload,
  ): { id: string; refreshToken: string } {
    const refreshToken = (req.body as { refreshToken: string }).refreshToken;
    return { id: payload.sub, refreshToken };
  }
}
