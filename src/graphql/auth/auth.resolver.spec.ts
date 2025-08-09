import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from '../../modules/auth/auth.service';
import { LoginDto, RefreshTokenDto } from '../../modules/auth/dto';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockAdmin: Admin = {
    id: 1,
    username: 'testadmin',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
  };

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    admin: {
      id: 1,
      username: 'testadmin',
      email: 'test@example.com',
      role: AdminRole.ADMIN,
      lastLogin: new Date(),
    },
    expiresIn: 900,
  };

  const mockTokenResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 900,
  };

  const mockAuthService = {
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginInput: LoginDto = {
      username: 'testadmin',
      password: 'password123',
    };

    it('should successfully login and return auth response', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await resolver.login(loginInput);

      expect(authService.login).toHaveBeenCalledWith('testadmin', 'password123');
      expect(result).toEqual({
        ...mockAuthResponse,
        admin: {
          ...mockAuthResponse.admin,
          lastLogin: mockAuthResponse.admin.lastLogin,
        },
      });
    });

    it('should handle null lastLogin by converting to undefined', async () => {
      const responseWithNullLastLogin = {
        ...mockAuthResponse,
        admin: {
          ...mockAuthResponse.admin,
          lastLogin: null,
        },
      };
      mockAuthService.login.mockResolvedValue(responseWithNullLastLogin);

      const result = await resolver.login(loginInput);

      expect(result.admin.lastLogin).toBeUndefined();
    });

    it('should throw BadRequestException when username is missing', async () => {
      const invalidInput = { ...loginInput, username: '' };

      await expect(resolver.login(invalidInput)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when password is missing', async () => {
      const invalidInput = { ...loginInput, password: '' };

      await expect(resolver.login(invalidInput)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when login fails', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(resolver.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle unexpected errors and throw UnauthorizedException', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Database error'));

      await expect(resolver.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenInput: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully refresh token', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue(mockTokenResponse);

      const result = await resolver.refreshToken(refreshTokenInput);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(result).toEqual({
        accessToken: mockTokenResponse.accessToken,
        expiresIn: mockTokenResponse.expiresIn,
      });
    });

    it('should throw BadRequestException when refresh token is missing', async () => {
      const invalidInput = { refreshToken: '' };

      await expect(resolver.refreshToken(invalidInput)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh fails', async () => {
      mockAuthService.refreshAccessToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(resolver.refreshToken(refreshTokenInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle unexpected errors and throw UnauthorizedException', async () => {
      mockAuthService.refreshAccessToken.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(resolver.refreshToken(refreshTokenInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await resolver.logout(mockAdmin);

      expect(authService.logout).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Successfully logged out',
      });
    });

    it('should throw UnauthorizedException when admin is invalid', async () => {
      const invalidAdmin = { ...mockAdmin, id: undefined } as any;

      await expect(resolver.logout(invalidAdmin)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when logout fails', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(resolver.logout(mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('me', () => {
    it('should return current admin profile', async () => {
      const result = await resolver.me(mockAdmin);

      expect(result).toEqual({
        id: mockAdmin.id,
        username: mockAdmin.username,
        email: mockAdmin.email,
        role: mockAdmin.role,
        lastLogin: mockAdmin.lastLogin,
      });
    });

    it('should handle null lastLogin by converting to undefined', async () => {
      const adminWithNullLastLogin = { ...mockAdmin, lastLogin: null };

      const result = await resolver.me(adminWithNullLastLogin);

      expect(result.lastLogin).toBeUndefined();
    });

    it('should throw UnauthorizedException when admin is invalid', async () => {
      const invalidAdmin = { ...mockAdmin, id: undefined } as any;

      await expect(resolver.me(invalidAdmin)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});