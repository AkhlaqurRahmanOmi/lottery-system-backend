import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminService } from '../admin/admin.service';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let adminService: AdminService;
  let jwtService: JwtService;

  const mockAdmin: Admin = {
    id: 1,
    username: 'testadmin',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
  };

  const mockAdminService = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testpassword';
      const result = await service.hashPassword(password);
      
      expect(result).toBeDefined();
      expect(result).not.toBe(password);
      expect(result.length).toBeGreaterThan(50);
    });

    it('should throw BadRequestException on bcrypt error', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => {
        throw new Error('Bcrypt error');
      });
      
      await expect(service.hashPassword('password')).rejects.toThrow(BadRequestException);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword';
      const hash = await bcrypt.hash(password, 12);
      
      const result = await service.comparePasswords(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword';
      const wrongPassword = 'wrongpassword';
      const hash = await bcrypt.hash(password, 12);
      
      const result = await service.comparePasswords(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false on bcrypt error', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => {
        throw new Error('Bcrypt error');
      });
      
      const result = await service.comparePasswords('password', 'hash');
      expect(result).toBe(false);
    });
  });

  describe('validateAdmin', () => {
    it('should return admin for valid credentials', async () => {
      const password = 'testpassword';
      const hashedPassword = await bcrypt.hash(password, 12);
      const adminWithHash = { ...mockAdmin, passwordHash: hashedPassword };
      
      mockAdminService.findByUsername.mockResolvedValue(adminWithHash);
      
      const result = await service.validateAdmin('testadmin', password);
      expect(result).toEqual(adminWithHash);
    });

    it('should return null for non-existent admin', async () => {
      mockAdminService.findByUsername.mockResolvedValue(null);
      
      const result = await service.validateAdmin('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException for inactive admin', async () => {
      const inactiveAdmin = { ...mockAdmin, isActive: false };
      mockAdminService.findByUsername.mockResolvedValue(inactiveAdmin);
      
      await expect(service.validateAdmin('testadmin', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should return null for invalid password', async () => {
      mockAdminService.findByUsername.mockResolvedValue(mockAdmin);
      
      const result = await service.validateAdmin('testadmin', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', async () => {
      const expectedToken = 'mock.jwt.token';
      mockJwtService.sign.mockReturnValue(expectedToken);
      
      const result = await service.generateAccessToken(mockAdmin);
      
      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockAdmin.id,
        username: mockAdmin.username,
        email: mockAdmin.email,
        role: mockAdmin.role,
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', async () => {
      const expectedToken = 'mock.refresh.token';
      mockJwtService.sign.mockReturnValue(expectedToken);
      
      const result = await service.generateRefreshToken(mockAdmin);
      
      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockAdmin.id,
          username: mockAdmin.username,
          tokenVersion: 1,
        },
        {
          secret: 'lottery-refresh-secret',
          expiresIn: '7d',
        }
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const password = 'testpassword';
      const hashedPassword = await bcrypt.hash(password, 12);
      const adminWithHash = { ...mockAdmin, passwordHash: hashedPassword };
      
      mockAdminService.findByUsername.mockResolvedValue(adminWithHash);
      mockAdminService.updateLastLogin.mockResolvedValue(adminWithHash);
      mockJwtService.sign.mockReturnValueOnce('access.token').mockReturnValueOnce('refresh.token');
      
      const result = await service.login('testadmin', password);
      
      expect(result).toHaveProperty('accessToken', 'access.token');
      expect(result).toHaveProperty('refreshToken', 'refresh.token');
      expect(result).toHaveProperty('admin');
      expect(result).toHaveProperty('expiresIn', 900);
      expect(mockAdminService.updateLastLogin).toHaveBeenCalledWith(mockAdmin.id);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAdminService.findByUsername.mockResolvedValue(null);
      
      await expect(service.login('invalid', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const mockPayload = { sub: 1, username: 'test', email: 'test@example.com', role: AdminRole.ADMIN };
      mockJwtService.verify.mockReturnValue(mockPayload);
      
      const result = await service.verifyAccessToken('valid.token');
      
      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await expect(service.verifyAccessToken('invalid.token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockRefreshPayload = { sub: 1, username: 'test', tokenVersion: 1 };
      mockJwtService.verify.mockReturnValue(mockRefreshPayload);
      mockAdminService.findById.mockResolvedValue(mockAdmin);
      mockJwtService.sign.mockReturnValueOnce('new.access.token').mockReturnValueOnce('new.refresh.token');
      
      const result = await service.refreshAccessToken('valid.refresh.token');
      
      expect(result).toHaveProperty('accessToken', 'new.access.token');
      expect(result).toHaveProperty('refreshToken', 'new.refresh.token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await expect(service.refreshAccessToken('invalid.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive admin', async () => {
      const mockRefreshPayload = { sub: 1, username: 'test', tokenVersion: 1 };
      mockJwtService.verify.mockReturnValue(mockRefreshPayload);
      mockAdminService.findById.mockResolvedValue({ ...mockAdmin, isActive: false });
      
      await expect(service.refreshAccessToken('valid.token')).rejects.toThrow(UnauthorizedException);
    });
  });
});