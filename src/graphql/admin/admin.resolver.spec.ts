import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';
import { AdminService } from '../../modules/admin/admin.service';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import {
  CreateAdminGraphQLDto,
  UpdateAdminGraphQLDto,
  AdminQueryGraphQLDto,
  AdminProfileUpdateGraphQLDto,
  PasswordResetGraphQLDto,
  ChangePasswordGraphQLDto
} from './dto';

describe('AdminResolver', () => {
  let resolver: AdminResolver;
  let adminService: jest.Mocked<AdminService>;

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

  const mockSuperAdmin: Admin = {
    id: 2,
    username: 'superadmin',
    email: 'super@example.com',
    passwordHash: 'hashedpassword',
    role: AdminRole.SUPER_ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
  };

  const mockAdminResponse = {
    id: mockAdmin.id,
    username: mockAdmin.username,
    email: mockAdmin.email,
    role: mockAdmin.role,
    isActive: mockAdmin.isActive,
    createdAt: mockAdmin.createdAt,
    updatedAt: mockAdmin.updatedAt,
    lastLogin: mockAdmin.lastLogin,
  };

  const mockAdminService = {
    findByIdOrThrow: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    getStatistics: jest.fn(),
    getProfile: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    resetPassword: jest.fn(),
    softDelete: jest.fn(),
    reactivate: jest.fn(),
    delete: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminResolver,
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    resolver = module.get<AdminResolver>(AdminResolver);
    adminService = module.get(AdminService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('admin', () => {
    it('should return admin by ID for super admin', async () => {
      adminService.findByIdOrThrow.mockResolvedValue(mockAdmin);

      const result = await resolver.admin(1, mockSuperAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.findByIdOrThrow).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when admin not found', async () => {
      adminService.findByIdOrThrow.mockRejectedValue(new NotFoundException('Admin not found'));

      await expect(resolver.admin(999, mockSuperAdmin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('admins', () => {
    it('should return paginated admin list for super admin', async () => {
      const mockPaginatedResponse = {
        data: [mockAdminResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      adminService.findAll.mockResolvedValue(mockPaginatedResponse);

      const query: AdminQueryGraphQLDto = { page: 1, limit: 10 };
      const result = await resolver.admins(query, mockSuperAdmin);

      expect(result).toEqual(mockPaginatedResponse);
      expect(adminService.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle empty query', async () => {
      const mockPaginatedResponse = {
        data: [mockAdminResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      adminService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.admins(undefined, mockSuperAdmin);

      expect(result).toEqual(mockPaginatedResponse);
      expect(adminService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('searchAdmins', () => {
    it('should return search results for super admin', async () => {
      adminService.search.mockResolvedValue([mockAdminResponse]);

      const result = await resolver.searchAdmins('test', 10, mockSuperAdmin);

      expect(result).toEqual([mockAdminResponse]);
      expect(adminService.search).toHaveBeenCalledWith('test', 10);
    });
  });

  describe('adminStatistics', () => {
    it('should return admin statistics for super admin', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        inactive: 2,
        superAdmins: 2,
        regularAdmins: 6,
      };

      adminService.getStatistics.mockResolvedValue(mockStats);

      const result = await resolver.adminStatistics(mockSuperAdmin);

      expect(result).toEqual(mockStats);
      expect(adminService.getStatistics).toHaveBeenCalled();
    });
  });

  describe('myProfile', () => {
    it('should return current admin profile', async () => {
      adminService.getProfile.mockResolvedValue(mockAdminResponse);

      const result = await resolver.myProfile(mockAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.getProfile).toHaveBeenCalledWith(mockAdmin.id);
    });
  });

  describe('createAdmin', () => {
    it('should create new admin for super admin', async () => {
      const createDto: CreateAdminGraphQLDto = {
        username: 'newadmin',
        email: 'new@example.com',
        password: 'Password123!',
        role: AdminRole.ADMIN,
      };

      adminService.findByUsername.mockResolvedValue(null);
      adminService.findByEmail.mockResolvedValue(null);
      adminService.create.mockResolvedValue(mockAdminResponse);

      const result = await resolver.createAdmin(createDto, mockSuperAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.findByUsername).toHaveBeenCalledWith(createDto.username);
      expect(adminService.findByEmail).toHaveBeenCalledWith(createDto.email);
      expect(adminService.create).toHaveBeenCalledWith(createDto, mockSuperAdmin.id);
    });

    it('should throw ConflictException when username exists', async () => {
      const createDto: CreateAdminGraphQLDto = {
        username: 'existingadmin',
        email: 'new@example.com',
        password: 'Password123!',
        role: AdminRole.ADMIN,
      };

      adminService.findByUsername.mockResolvedValue(mockAdmin);
      adminService.findByEmail.mockResolvedValue(null);

      await expect(resolver.createAdmin(createDto, mockSuperAdmin)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when email exists', async () => {
      const createDto: CreateAdminGraphQLDto = {
        username: 'newadmin',
        email: 'existing@example.com',
        password: 'Password123!',
        role: AdminRole.ADMIN,
      };

      adminService.findByUsername.mockResolvedValue(null);
      adminService.findByEmail.mockResolvedValue(mockAdmin);

      await expect(resolver.createAdmin(createDto, mockSuperAdmin)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateAdmin', () => {
    it('should allow super admin to update any admin', async () => {
      const updateDto: UpdateAdminGraphQLDto = {
        username: 'updatedadmin',
        role: AdminRole.SUPER_ADMIN,
      };

      adminService.findByUsername.mockResolvedValue(null);
      adminService.findByEmail.mockResolvedValue(null);
      adminService.update.mockResolvedValue(mockAdminResponse);

      const result = await resolver.updateAdmin(1, updateDto, mockSuperAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.update).toHaveBeenCalledWith(1, updateDto, mockSuperAdmin.id);
    });

    it('should allow admin to update their own profile (basic fields)', async () => {
      const updateDto: UpdateAdminGraphQLDto = {
        username: 'updatedadmin',
      };

      adminService.findByUsername.mockResolvedValue(null);
      adminService.findByEmail.mockResolvedValue(null);
      adminService.update.mockResolvedValue(mockAdminResponse);

      const result = await resolver.updateAdmin(mockAdmin.id, updateDto, mockAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.update).toHaveBeenCalledWith(mockAdmin.id, updateDto, mockAdmin.id);
    });

    it('should prevent regular admin from updating other admins', async () => {
      const updateDto: UpdateAdminGraphQLDto = {
        username: 'updatedadmin',
      };

      await expect(resolver.updateAdmin(2, updateDto, mockAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('should prevent regular admin from changing roles', async () => {
      const updateDto: UpdateAdminGraphQLDto = {
        role: AdminRole.SUPER_ADMIN,
      };

      await expect(resolver.updateAdmin(mockAdmin.id, updateDto, mockAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('should prevent admin from changing their own active status', async () => {
      const updateDto: UpdateAdminGraphQLDto = {
        isActive: false,
      };

      await expect(resolver.updateAdmin(mockAdmin.id, updateDto, mockAdmin)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMyProfile', () => {
    it('should update current admin profile', async () => {
      const updateDto: AdminProfileUpdateGraphQLDto = {
        username: 'updatedadmin',
        email: 'updated@example.com',
      };

      adminService.findByUsername.mockResolvedValue(null);
      adminService.findByEmail.mockResolvedValue(null);
      adminService.updateProfile.mockResolvedValue(mockAdminResponse);

      const result = await resolver.updateMyProfile(updateDto, mockAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.updateProfile).toHaveBeenCalledWith(mockAdmin.id, updateDto);
    });

    it('should throw ConflictException when username is taken', async () => {
      const updateDto: AdminProfileUpdateGraphQLDto = {
        username: 'existingadmin',
      };

      const otherAdmin = { ...mockAdmin, id: 999 };
      adminService.findByUsername.mockResolvedValue(otherAdmin);

      await expect(resolver.updateMyProfile(updateDto, mockAdmin)).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('should change admin password', async () => {
      const changePasswordDto: ChangePasswordGraphQLDto = {
        currentPassword: 'oldpassword',
        newPassword: 'NewPassword123!',
      };

      adminService.changePassword.mockResolvedValue(undefined);

      const result = await resolver.changePassword(changePasswordDto, mockAdmin);

      expect(result).toBe(true);
      expect(adminService.changePassword).toHaveBeenCalledWith(
        mockAdmin.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
    });

    it('should throw BadRequestException when current password is wrong', async () => {
      const changePasswordDto: ChangePasswordGraphQLDto = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123!',
      };

      adminService.changePassword.mockRejectedValue(new BadRequestException('Current password is incorrect'));

      await expect(resolver.changePassword(changePasswordDto, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetAdminPassword', () => {
    it('should reset admin password for super admin', async () => {
      const resetDto: PasswordResetGraphQLDto = {
        adminId: 1,
        newPassword: 'NewPassword123!',
      };

      adminService.resetPassword.mockResolvedValue(undefined);

      const result = await resolver.resetAdminPassword(resetDto, mockSuperAdmin);

      expect(result).toBe(true);
      expect(adminService.resetPassword).toHaveBeenCalledWith(
        resetDto.adminId,
        resetDto.newPassword,
        mockSuperAdmin.id
      );
    });

    it('should prevent self password reset through this endpoint', async () => {
      const resetDto: PasswordResetGraphQLDto = {
        adminId: mockSuperAdmin.id,
        newPassword: 'NewPassword123!',
      };

      await expect(resolver.resetAdminPassword(resetDto, mockSuperAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivateAdmin', () => {
    it('should deactivate admin for super admin', async () => {
      adminService.softDelete.mockResolvedValue(mockAdminResponse);

      const result = await resolver.deactivateAdmin(1, mockSuperAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.softDelete).toHaveBeenCalledWith(1, mockSuperAdmin.id);
    });

    it('should prevent self-deactivation', async () => {
      await expect(resolver.deactivateAdmin(mockSuperAdmin.id, mockSuperAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reactivateAdmin', () => {
    it('should reactivate admin for super admin', async () => {
      adminService.reactivate.mockResolvedValue(mockAdminResponse);

      const result = await resolver.reactivateAdmin(1, mockSuperAdmin);

      expect(result).toEqual(mockAdminResponse);
      expect(adminService.reactivate).toHaveBeenCalledWith(1, mockSuperAdmin.id);
    });
  });

  describe('deleteAdmin', () => {
    it('should delete admin for super admin', async () => {
      adminService.delete.mockResolvedValue(undefined);

      const result = await resolver.deleteAdmin(1, mockSuperAdmin);

      expect(result).toBe(true);
      expect(adminService.delete).toHaveBeenCalledWith(1, mockSuperAdmin.id);
    });

    it('should prevent self-deletion', async () => {
      await expect(resolver.deleteAdmin(mockSuperAdmin.id, mockSuperAdmin)).rejects.toThrow(BadRequestException);
    });

    it('should handle ConflictException when admin cannot be deleted', async () => {
      adminService.delete.mockRejectedValue(new ConflictException('Cannot delete admin who has created coupons'));

      await expect(resolver.deleteAdmin(1, mockSuperAdmin)).rejects.toThrow(ConflictException);
    });
  });
});