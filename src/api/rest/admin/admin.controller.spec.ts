import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../../../modules/admin/admin.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { AdminRole } from '@prisma/client';
import { ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;
  let responseBuilder: ResponseBuilderService;

  const mockAdminService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByIdOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    reactivate: jest.fn(),
    getStatistics: jest.fn(),
    search: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    resetPasswordWithToken: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockResponseBuilder = {
    buildSuccessResponse: jest.fn(),
    buildErrorResponse: jest.fn(),
    generateHATEOASLinks: jest.fn(),
  };

  const mockRequest = {
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: AdminRole.SUPER_ADMIN,
    },
    traceId: 'test-trace-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
    responseBuilder = module.get<ResponseBuilderService>(ResponseBuilderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createAdminDto = {
      username: 'newadmin',
      email: 'newadmin@example.com',
      password: 'SecurePassword123!',
      role: AdminRole.ADMIN,
    };

    const mockAdminResponse = {
      id: 2,
      username: 'newadmin',
      email: 'newadmin@example.com',
      role: AdminRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    it('should create admin successfully', async () => {
      mockAdminService.create.mockResolvedValue(mockAdminResponse);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockAdminResponse,
      });

      const result = await controller.create(createAdminDto, mockRequest as any);

      expect(mockAdminService.create).toHaveBeenCalledWith(createAdminDto, mockRequest.user.id);
      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      const regularAdminRequest = {
        ...mockRequest,
        user: { ...mockRequest.user, role: AdminRole.ADMIN },
      };

      await expect(
        controller.create(createAdminDto, regularAdminRequest as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    const mockPaginatedResponse = {
      data: [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: AdminRole.SUPER_ADMIN,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
        },
      ],
      meta: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should return paginated admin list', async () => {
      mockAdminService.findAll.mockResolvedValue(mockPaginatedResponse);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockPaginatedResponse,
      });

      const queryDto = { page: 1, limit: 10 };
      const result = await controller.findAll(queryDto, mockRequest as any);

      expect(mockAdminService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result.success).toBe(true);
    });
  });

  describe('findOne', () => {
    const mockAdmin = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
      passwordHash: 'hashed-password',
    };

    it('should return admin by id', async () => {
      mockAdminService.findByIdOrThrow.mockResolvedValue(mockAdmin);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockAdmin,
      });

      const result = await controller.findOne(1, mockRequest as any);

      expect(mockAdminService.findByIdOrThrow).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if admin not found', async () => {
      mockAdminService.findByIdOrThrow.mockRejectedValue(new NotFoundException('Admin not found'));
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        error: { message: 'Admin not found' },
      });

      await expect(controller.findOne(999, mockRequest as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateAdminDto = {
      username: 'updatedadmin',
      email: 'updated@example.com',
    };

    const mockUpdatedAdmin = {
      id: 1,
      username: 'updatedadmin',
      email: 'updated@example.com',
      role: AdminRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    it('should update admin successfully', async () => {
      mockAdminService.update.mockResolvedValue(mockUpdatedAdmin);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockUpdatedAdmin,
      });

      const result = await controller.update(1, updateAdminDto, mockRequest as any);

      expect(mockAdminService.update).toHaveBeenCalledWith(1, updateAdminDto, mockRequest.user.id);
      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException if regular admin tries to update other admin', async () => {
      const regularAdminRequest = {
        ...mockRequest,
        user: { ...mockRequest.user, id: 2, role: AdminRole.ADMIN },
      };

      await expect(
        controller.update(1, updateAdminDto, regularAdminRequest as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete admin successfully', async () => {
      mockAdminService.delete.mockResolvedValue(undefined);

      await controller.remove(2, mockRequest as any);

      expect(mockAdminService.delete).toHaveBeenCalledWith(2, mockRequest.user.id);
    });

    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      const regularAdminRequest = {
        ...mockRequest,
        user: { ...mockRequest.user, role: AdminRole.ADMIN },
      };

      await expect(
        controller.remove(2, regularAdminRequest as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if trying to delete own account', async () => {
      await expect(
        controller.remove(1, mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    const mockStatistics = {
      total: 10,
      active: 8,
      inactive: 2,
      superAdmins: 2,
      regularAdmins: 6,
    };

    it('should return admin statistics', async () => {
      mockAdminService.getStatistics.mockResolvedValue(mockStatistics);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockStatistics,
      });

      const result = await controller.getStatistics(mockRequest as any);

      expect(mockAdminService.getStatistics).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('search', () => {
    const mockSearchResults = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      },
    ];

    it('should return search results', async () => {
      mockAdminService.search.mockResolvedValue(mockSearchResults);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockSearchResults,
      });

      const result = await controller.search('admin', 10, mockRequest as any);

      expect(mockAdminService.search).toHaveBeenCalledWith('admin', 10);
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if query is empty', async () => {
      await expect(
        controller.search('', 10, mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    it('should return user profile', async () => {
      mockAdminService.getProfile.mockResolvedValue(mockProfile);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockProfile,
      });

      const result = await controller.getProfile(mockRequest as any);

      expect(mockAdminService.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result.success).toBe(true);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };

    it('should change password successfully', async () => {
      mockAdminService.changePassword.mockResolvedValue(undefined);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: { message: 'Password changed successfully' },
      });

      const result = await controller.changePassword(changePasswordDto, mockRequest as any);

      expect(mockAdminService.changePassword).toHaveBeenCalledWith(
        mockRequest.user.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
      expect(result.success).toBe(true);
    });
  });
});