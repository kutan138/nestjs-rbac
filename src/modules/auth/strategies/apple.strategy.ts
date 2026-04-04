import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import AppleStrategy, { AuthenticateOptions } from 'passport-apple';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleOAuthStrategy extends PassportStrategy(
  AppleStrategy,
  'apple',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID') ?? '',
      teamID: configService.get<string>('APPLE_TEAM_ID') ?? '',
      keyID: configService.get<string>('APPLE_KEY_ID') ?? '',
      privateKeyLocation:
        configService.get<string>('APPLE_PRIVATE_KEY_PATH') ?? '',
      callbackURL:
        configService.get<string>('APPLE_CALLBACK_URL') ??
        'http://localhost:3000/auth/apple/callback',
      passReqToCallback: false,
    } as AuthenticateOptions);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: { sub: string; email?: string },
    profile: { name?: { firstName?: string; lastName?: string } },
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const email = idToken.email ?? '';
    const firstName = profile?.name?.firstName ?? '';
    const lastName = profile?.name?.lastName ?? '';
    const name =
      [firstName, lastName].filter(Boolean).join(' ') || 'Apple User';

    const user = await this.authService.validateOAuthUser('apple', {
      email,
      name,
      providerId: idToken.sub,
    });

    done(null, user);
  }
}
