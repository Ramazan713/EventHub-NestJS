
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(congigService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: congigService.getOrThrow("JWT_SECRET"),
    });
  }

  async validate(payload: ActiveUserData): Promise<ActiveUserData> {
    return payload
  }
}
