import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AdminService', () => {
  let service: AdminService;
  let repository: AdminRepository;

  const mockAdmin = {
    id: 1,
    username: 'testadmin',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
  };

  const mockRepository = {
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    updateLastLogin: jest.fn(),
    findWithFilters: jest.fn(),
    search: jest.fn(),
    count: jest.fn(),
    getActiveCount: jest.fn(),
    canDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: AdminRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    repository = module.get<AdminRepository>(AdminRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return admin when found', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);

      const result = await service.findById(1);

      expect(result).toEqual(mockAdmin);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when admin not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should return admin when found', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);

      const result = await service.findByIdOrThrow(1);

      expect(result).toEqual(mockAdmin);
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findByIdOrThrow(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create admin successfully', async () => {
      const createDto = {
        username: 'newadmin',
        email: 'new@example.com',
        password: 'password123',
        role: AdminRole.ADMIN,
      };

      const hashedPassword = 'hashedpassword123';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockRepository.create.mockResolvedValue({ ...mockAdmin, ...createDto, passwordHash: hashedPassword });

      const result = await service.create(createDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockRepository.create).toHaveBeenCalledWith({
        username: 'newadmin',
        email: 'new@example.com',
        role: AdminRole.ADMIN,
        passwordHash: hashedPassword,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.username).toBe('newadmin');
    });
  });

  describe('update', () => {
    it('should update admin successfully', async () => {
      const updateDto = {
        email: 'updated@example.com',
        password: 'newpassword123',
      };

      const hashedPassword = 'hashednewpassword';
      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockRepository.update.mockResolvedValue({ ...mockAdmin, email: updateDto.email, passwordHash: hashedPassword });

      const result = await service.update(1, updateDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        email: 'updated@example.com',
        passwordHash: hashedPassword,
      });
      expect(result.email).toBe('updated@example.com');
    });

    it('should update admin without password change', async () => {
      const updateDto = {
        email: 'updated@example.com',
      };

      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockRepository.update.mockResolvedValue({ ...mockAdmin, email: updateDto.email });

      const result = await service.update(1, updateDto);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        email: 'updated@example.com',
      });
      expect(result.email).toBe('updated@example.com');
    });
  });

  describe('softDelete', () => {
    it('should deactivate admin successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockRepository.softDelete.mockResolvedValue({ ...mockAdmin, isActive: false });

      const result = await service.softDelete(1);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result.isActive).toBe(false);
    });

    it('should throw BadRequestException when admin is already inactive', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockAdmin, isActive: false });

      await expect(service.softDelete(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete admin successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockRepository.canDelete.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue(mockAdmin);

      await service.delete(1);

      expect(mockRepository.canDelete).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw ConflictException when admin cannot be deleted', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockRepository.canDelete.mockResolvedValue(false);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateCredentials', () => {
    it('should return admin when credentials are valid', async () => {
      mockRepository.findByUsername.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateCredentials('testadmin', 'password123');

      expect(result).toEqual(mockAdmin);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should return null when admin not found', async () => {
      mockRepository.findByUsername.mockResolvedValue(null);

      const result = await service.validateCredentials('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when admin is inactive', async () => {
      mockRepository.findByUsername.mockResolvedValue({ ...mockAdmin, isActive: false });

      const result = await service.validateCredentials('testadmin', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockRepository.findByUsername.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateCredentials('testadmin', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('newhashpassword' as never);
      mockRepository.update.mockResolvedValue(mockAdmin);

      await service.changePassword(1, 'currentpassword', 'newpassword123');

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('currentpassword', 'hashedpassword');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockRepository.update).toHaveBeenCalledWith(1, { passwordHash: 'newhashpassword' });
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.changePassword(1, 'wrongpassword', 'newpassword123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    it('should return admin statistics', async () => {
      mockRepository.count.mockResolvedValueOnce(10); // total
      mockRepository.getActiveCount.mockResolvedValue(8); // active
      mockRepository.count.mockResolvedValueOnce(3); // super admins

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        superAdmins: 3,
        regularAdmins: 5,
      });
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token successfully', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockAdmin);

      const token = await service.generatePasswordResetToken('test@example.com');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 (hex)
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      await expect(service.generatePasswordResetToken('notfound@example.com'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when admin is inactive', async () => {
      mockRepository.findByEmail.mockResolvedValue({ ...mockAdmin, isActive: false });

      await expect(service.generatePasswordResetToken('test@example.com'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-token';
      const newPassword = 'newpassword123';
      const hashedPassword = 'hashednewpassword';

      // Generate a token first
      mockRepository.findByEmail.mockResolvedValue(mockAdmin);
      const generatedToken = await service.generatePasswordResetToken('test@example.com');

      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockRepository.update.mockResolvedValue({ ...mockAdmin, passwordHash: hashedPassword });

      await service.resetPasswordWithToken(generatedToken, newPassword);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockRepository.update).toHaveBeenCalledWith(mockAdmin.id, { passwordHash: hashedPassword });
    });

    it('should throw BadRequestException for invalid token', async () => {
      await expect(service.resetPasswordWithToken('invalid-token', 'newpassword123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile without password change', async () => {
      const profileData = {
        username: 'updatedusername',
        email: 'updated@example.com',
      };

      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockRepository.update.mockResolvedValue({ ...mockAdmin, ...profileData });

      const result = await service.updateProfile(1, profileData);

      expect(mockRepository.update).toHaveBeenCalledWith(1, profileData);
      expect(result.username).toBe('updatedusername');
      expect(result.email).toBe('updated@example.com');
    });

    it('should update profile with password change', async () => {
      const profileData = {
        username: 'updatedusername',
        currentPassword: 'currentpassword',
        newPassword: 'newpassword123',
      };

      const hashedPassword = 'hashednewpassword';

      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockRepository.update.mockResolvedValue({ ...mockAdmin, username: profileData.username, passwordHash: hashedPassword });

      const result = await service.updateProfile(1, profileData);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('currentpassword', mockAdmin.passwordHash);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        username: 'updatedusername',
        passwordHash: hashedPassword,
      });
      expect(result.username).toBe('updatedusername');
    });

    it('should throw BadRequestException when current password is required but not provided', async () => {
      const profileData = {
        newPassword: 'newpassword123',
      };

      mockRepository.findById.mockResolvedValue(mockAdmin);

      await expect(service.updateProfile(1, profileData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      const profileData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      mockRepository.findById.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.updateProfile(1, profileData))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return admin profile', async () => {
      mockRepository.findById.mockResolvedValue(mockAdmin);

      const result = await service.getProfile(1);

      expect(result).toEqual({
        id: mockAdmin.id,
        username: mockAdmin.username,
        email: mockAdmin.email,
        role: mockAdmin.role,
        isActive: mockAdmin.isActive,
        createdAt: mockAdmin.createdAt,
        updatedAt: mockAdmin.updatedAt,
        lastLogin: mockAdmin.lastLogin,
      });
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile(1))
        .rejects.toThrow(NotFoundException);
    });
  });
});