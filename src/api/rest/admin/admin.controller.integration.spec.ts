import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AdminRestModule } from './admin.module';
import { AdminService } from '../../../modules/admin/admin.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { AdminRole } from '@prisma/client';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let adminService: AdminService;

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

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AdminRestModule],
    })
      .overrideProvider(AdminService)
      .useValue(mockAdminService)
      .overrideProvider(ResponseBuilderService)
      .useValue(mockResponseBuilder)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    // Mock request user for authentication
    app.use((req, res, next) => {
      req.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: AdminRole.SUPER_ADMIN,
      };
      req.traceId = 'test-trace-id';
      next();
    });

    await app.init();
    adminService = moduleFixture.get<AdminService>(AdminService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('/api/admin (POST)', () => {
    it('should create admin successfully', async () => {
      const createAdminDto = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'SecurePassword123!',
        role: AdminRole.ADMIN,
      };

      const mockResponse = {
        id: 2,
        username: 'newadmin',
        email: 'newadmin@example.com',
        role: AdminRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      };

      mockAdminService.create.mockResolvedValue(mockResponse);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockResponse,
        statusCode: 201,
      });

      const response = await request(app.getHttpServer())
        .post('/api/admin')
        .send(createAdminDto)
        .expect(201);

      expect(mockAdminService.create).toHaveBeenCalledWith(createAdminDto, 1);
      expect(response.body.success).toBe(true);
    });

    it('should return validation error for invalid data', async () => {
      const invalidDto = {
        username: 'ab', // too short
        email: 'invalid-email',
        password: '123', // too weak
        role: 'INVALID_ROLE',
      };

      await request(app.getHttpServer())
        .post('/api/admin')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/api/admin (GET)', () => {
    it('should return paginated admin list', async () => {
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
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockAdminService.findAll.mockResolvedValue(mockPaginatedResponse);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockPaginatedResponse,
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .get('/api/admin')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(mockAdminService.findAll).toHaveBeenCalledWith({
        page: "1", // Query parameters come as strings
        limit: "10",
      });
      expect(response.body.success).toBe(true);
    });
  });

  describe('/api/admin/:id (GET)', () => {
    it('should return admin by id', async () => {
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

      mockAdminService.findByIdOrThrow.mockResolvedValue(mockAdmin);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockAdmin,
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .get('/api/admin/1')
        .expect(200);

      expect(mockAdminService.findByIdOrThrow).toHaveBeenCalledWith(1);
      expect(response.body.success).toBe(true);
    });
  });

  describe('/api/admin/:id (PUT)', () => {
    it('should update admin successfully', async () => {
      const updateDto = {
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

      mockAdminService.update.mockResolvedValue(mockUpdatedAdmin);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockUpdatedAdmin,
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .put('/api/admin/1')
        .send(updateDto)
        .expect(200);

      expect(mockAdminService.update).toHaveBeenCalledWith(1, updateDto, 1);
      expect(response.body.success).toBe(true);
    });
  });

  describe('/api/admin/:id (DELETE)', () => {
    it('should delete admin successfully', async () => {
      mockAdminService.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/api/admin/2')
        .expect(204);

      expect(mockAdminService.delete).toHaveBeenCalledWith(2, 1);
    });
  });

  describe('/api/admin/statistics (GET)', () => {
    it('should return admin statistics', async () => {
      const mockStatistics = {
        total: 10,
        active: 8,
        inactive: 2,
        superAdmins: 2,
        regularAdmins: 6,
      };

      mockAdminService.getStatistics.mockResolvedValue(mockStatistics);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockStatistics,
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .get('/api/admin/statistics')
        .expect(200);

      expect(mockAdminService.getStatistics).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });

  describe('/api/admin/search (GET)', () => {
    it('should return search results', async () => {
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

      mockAdminService.search.mockResolvedValue(mockSearchResults);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockSearchResults,
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .get('/api/admin/search')
        .query({ q: 'admin', limit: 10 })
        .expect(200);

      expect(mockAdminService.search).toHaveBeenCalledWith('admin', 10);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for empty search query', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/search')
        .query({ q: '' })
        .expect(400);
    });
  });

  describe('/api/admin/profile (GET)', () => {
    it('should return user profile', async () => {
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

      mockAdminService.getProfile.mockResolvedValue(mockProfile);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: mockProfile,
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .get('/api/admin/profile')
        .expect(200);

      expect(mockAdminService.getProfile).toHaveBeenCalledWith(1);
      expect(response.body.success).toBe(true);
    });
  });

  describe('/api/admin/password/change (PUT)', () => {
    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      mockAdminService.changePassword.mockResolvedValue(undefined);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        data: { message: 'Password changed successfully' },
        statusCode: 200,
      });

      const response = await request(app.getHttpServer())
        .put('/api/admin/password/change')
        .send(changePasswordDto)
        .expect(200);

      expect(mockAdminService.changePassword).toHaveBeenCalledWith(
        1,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
      expect(response.body.success).toBe(true);
    });
  });
});