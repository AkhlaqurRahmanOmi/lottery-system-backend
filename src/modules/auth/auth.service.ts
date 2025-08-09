import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import {
  JwtPayload,
  AuthTokens,
  AuthResponse,
  RefreshTokenPayload,
  AdminProfile
} from './interfaces/auth.interface';
import type { Admin } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'lottery-refresh-secret';
  private readonly refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  constructor(
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
  ) { }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new BadRequestException('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   */
  async comparePasswords(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate admin credentials
   */
  async validateAdmin(username: string, password: string): Promise<Admin | null> {
    try {
      const admin = await this.adminService.findByUsername(username);

      if (!admin) {
        return null;
      }

      if (!admin.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const isPasswordValid = await this.comparePasswords(password, admin.passwordHash);

      if (!isPasswordValid) {
        return null;
      }

      return admin;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Generate JWT access token
   */
  async generateAccessToken(admin: Admin): Promise<string> {
    const payload: JwtPayload = {
      sub: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate JWT refresh token
   */
  async generateRefreshToken(admin: Admin): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: admin.id,
      username: admin.username,
      tokenVersion: 1, // Can be used for token invalidation
    };

    return this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokens(admin: Admin): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(admin),
      this.generateRefreshToken(admin),
    ]);

    // Extract expiration time from JWT (default 15 minutes = 900 seconds)
    const expiresIn = 900;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Login admin and return tokens with profile
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    const admin = await this.validateAdmin(username, password);

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.adminService.updateLastLogin(admin.id);

    const tokens = await this.generateTokens(admin);

    const adminProfile: AdminProfile = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      lastLogin: new Date(),
    };

    return {
      ...tokens,
      admin: adminProfile,
    };
  }

  /**
   * Verify JWT access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify JWT refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.refreshTokenSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const admin = await this.adminService.findById(payload.sub);

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    return this.generateTokens(admin);
  }

  /**
   * Validate admin by ID (used by JWT strategy)
   */
  async validateAdminById(adminId: number): Promise<Admin | null> {
    try {
      const admin = await this.adminService.findById(adminId);

      if (!admin || !admin.isActive) {
        return null;
      }

      return admin;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout admin (in a real implementation, you might want to blacklist the token)
   */
  async logout(adminId: number): Promise<void> {
    // In a production system, you might want to:
    // 1. Add the token to a blacklist
    // 2. Update a token version in the database
    // 3. Clear any cached sessions

    // For now, we'll just log the logout action
    console.log(`Admin ${adminId} logged out at ${new Date().toISOString()}`);
  }
}