import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/auth.interface';
import type { Admin } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'lottery-system-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<Admin> {
    try {
      const admin = await this.authService.validateAdminById(payload.sub);
      
      if (!admin) {
        throw new UnauthorizedException('Admin not found or inactive');
      }

      if (!admin.isActive) {
        throw new UnauthorizedException('Admin account is deactivated');
      }

      return admin;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}