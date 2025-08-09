import type { AdminRole } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AdminProfile {
  id: number;
  username: string;
  email: string;
  role: AdminRole;
  lastLogin: Date | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
  expiresIn: number;
}

export interface RefreshTokenPayload {
  sub: number;
  username: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}