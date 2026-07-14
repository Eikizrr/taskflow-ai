import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type AuthUser = { userId: string; organizationId: string; role: string };
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'development-secret-change-me',
    });
  }
  validate(payload: {
    sub: string;
    organizationId: string;
    role: string;
  }): AuthUser {
    return {
      userId: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}
