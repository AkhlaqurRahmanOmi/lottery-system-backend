import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../modules/auth/auth.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { LoginDto } from '../../../modules/auth/dto/login.dto';
import { RefreshTokenDto } from '../../../modules/auth/dto/refresh-token.dto';
import { AdminRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    admin: {
      id: 1,
      username: 'testadmin',
      email: 'test@example.com',
      role: AdminRole.ADMIN,
      lastLogin: new Date('2024-01-01T00:00:00.000Z'),
    },
    expiresIn: 900,
  };

  const mockTokenResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 900,
  };

  const mockRequest = {
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
    traceId: 'test-trace-id',
    user: { id: 1, username: 'testadmin', email: 'test@example.com', role: 'ADMIN' },
  };

  const mockLinks = {
    self: 'http://localhost:3000/api/auth',
    related: {},
  };

  const mockSuccessResponse = {
    success: true as const,
    statusCode: HttpStatus.OK,
    message: 'Success',
    data: {},
    meta: {
      timestamp: '2024-01-01T00:00:00.000Z',
      traceId: 'test-trace-id',
      version: '1.0.0',
    },
    links: mockLinks,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      validateAdminById: jest.fn(),
    };

    const mockResponseBuilder = {
      buildSuccessResponse: jest.fn(),
      buildErrorResponse: jest.fn(),
      generateHATEOASLinks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    responseBuilder = module.get(ResponseBuilderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'testadmin',
        password: 'password123',
      };

      authService.login.mockResolvedValue(mockAuthResponse);
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue({
        ...mockSuccessResponse,
        data: {
          accessToken: mockAuthResponse.accessToken,
          refreshToken: mockAuthResponse.refreshToken,
          admin: {
            id: mockAuthResponse.admin.id,
            username: mockAuthResponse.admin.username,
            email: mockAuthResponse.admin.email,
            role: mockAuthResponse.admin.role,
            lastLogin: mockAuthResponse.admin.lastLogin,
          },
          expiresIn: mockAuthResponse.expiresIn,
        },
      });

      const result = await controller.login(loginDto, mockRequest as any);

      expect(authService.login).toHaveBeenCalledWith('testadmin', 'password123');
      expect(responseBuilder.generateHATEOASLinks).toHaveBeenCalledWith({
        baseUrl: 'http://localhost:3000/api/auth',
        action: 'login',
      });
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          accessToken: mockAuthResponse.accessToken,
          refreshToken: mockAuthResponse.refreshToken,
          admin: {
            id: mockAuthResponse.admin.id,
            username: mockAuthResponse.admin.username,
            email: mockAuthResponse.admin.email,
            role: mockAuthResponse.admin.role,
            lastLogin: mockAuthResponse.admin.lastLogin,
          },
          expiresIn: mockAuthResponse.expiresIn,
        },
        'Login successful',
        HttpStatus.OK,
        'test-trace-id',
        mockLinks,
      );
      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'testadmin',
        password: 'wrongpassword',
      };

      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
          hint: 'Please check your username and password',
        },
        meta: {
          timestamp: '2024-01-01T00:00:00.000Z',
          traceId: 'test-trace-id',
          version: '1.0.0',
        },
        links: {
          self: 'http://localhost:3000/api/auth/login',
          documentation: '/api/docs',
        },
      });

      await expect(controller.login(loginDto, mockRequest as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      authService.refreshAccessToken.mockResolvedValue(mockTokenResponse);
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue({
        ...mockSuccessResponse,
        data: {
          accessToken: mockTokenResponse.accessToken,
          expiresIn: mockTokenResponse.expiresIn,
        },
      });

      const result = await controller.refreshToken(refreshTokenDto, mockRequest as any);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          accessToken: mockTokenResponse.accessToken,
          expiresIn: mockTokenResponse.expiresIn,
        },
        'Token refreshed successfully',
        HttpStatus.OK,
        'test-trace-id',
        mockLinks,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      authService.logout.mockResolvedValue();
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue({
        ...mockSuccessResponse,
        data: { message: 'Successfully logged out' },
      });

      const result = await controller.logout(mockRequest as any);

      expect(authService.logout).toHaveBeenCalledWith(1);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        { message: 'Successfully logged out' },
        'Logout successful',
        HttpStatus.OK,
        'test-trace-id',
        mockLinks,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should get profile successfully', async () => {
      const mockAdmin = {
        id: 1,
        username: 'testadmin',
        email: 'test@example.com',
        role: AdminRole.ADMIN,
        lastLogin: new Date('2024-01-01T00:00:00.000Z'),
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.validateAdminById.mockResolvedValue(mockAdmin);
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue({
        ...mockSuccessResponse,
        data: {
          id: mockAdmin.id,
          username: mockAdmin.username,
          email: mockAdmin.email,
          role: mockAdmin.role,
          lastLogin: mockAdmin.lastLogin,
        },
      });

      const result = await controller.getProfile(mockRequest as any);

      expect(authService.validateAdminById).toHaveBeenCalledWith(1);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          id: mockAdmin.id,
          username: mockAdmin.username,
          email: mockAdmin.email,
          role: mockAdmin.role,
          lastLogin: mockAdmin.lastLogin,
        },
        'Profile retrieved successfully',
        HttpStatus.OK,
        'test-trace-id',
        mockLinks,
      );
      expect(result.success).toBe(true);
    });
  });
});