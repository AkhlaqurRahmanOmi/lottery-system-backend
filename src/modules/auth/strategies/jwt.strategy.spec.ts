import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/auth.interface';
import { AdminRole } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateAdminById: jest.fn(),
  };

  const mockAdmin = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const mockPayload: JwtPayload = {
      sub: 1,
      username: 'testadmin',
      email: 'test@example.com',
      role: AdminRole.ADMIN,
    };

    it('should return admin when validation is successful', async () => {
      mockAuthService.validateAdminById.mockResolvedValue(mockAdmin);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual(mockAdmin);
      expect(authService.validateAdminById).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException when admin is not found', async () => {
      mockAuthService.validateAdminById.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateAdminById).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException when admin is inactive', async () => {
      const inactiveAdmin = { ...mockAdmin, isActive: false };
      mockAuthService.validateAdminById.mockResolvedValue(inactiveAdmin);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle service errors gracefully', async () => {
      mockAuthService.validateAdminById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});