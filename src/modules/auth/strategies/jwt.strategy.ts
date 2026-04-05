import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from 'src/modules/users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'jwt-secret',
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
