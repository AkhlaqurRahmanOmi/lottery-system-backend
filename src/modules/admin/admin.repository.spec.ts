import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { AdminRole } from '@prisma/client';

describe('AdminRepository', () => {
  let repository: AdminRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    admin: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    coupon: {
      count: jest.fn(),
    },
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
    lastLogin: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AdminRepository>(AdminRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return admin when found', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);

      const result = await repository.findById(1);

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.admin.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when admin not found', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return admin when found by username', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);

      const result = await repository.findByUsername('testadmin');

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.admin.findUnique).toHaveBeenCalledWith({
        where: { username: 'testadmin' },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return admin when found by email', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('create', () => {
    it('should create admin successfully', async () => {
      const createData = {
        username: 'newadmin',
        email: 'new@example.com',
        passwordHash: 'hashedpassword',
        role: AdminRole.ADMIN,
      };

      mockPrismaService.admin.count.mockResolvedValue(0);
      mockPrismaService.admin.create.mockResolvedValue({ ...mockAdmin, ...createData });

      const result = await repository.create(createData);

      expect(result).toEqual({ ...mockAdmin, ...createData });
      expect(mockPrismaService.admin.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it('should throw ConflictException when username or email already exists', async () => {
      const createData = {
        username: 'existingadmin',
        email: 'existing@example.com',
        passwordHash: 'hashedpassword',
        role: AdminRole.ADMIN,
      };

      mockPrismaService.admin.count.mockResolvedValue(1);

      await expect(repository.create(createData)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update admin successfully', async () => {
      const updateData = { email: 'updated@example.com' };
      const updatedAdmin = { ...mockAdmin, ...updateData };

      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.admin.count.mockResolvedValue(0);
      mockPrismaService.admin.update.mockResolvedValue(updatedAdmin);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedAdmin);
      expect(mockPrismaService.admin.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ...updateData, updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      await expect(repository.update(999, { email: 'test@example.com' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete admin successfully', async () => {
      mockPrismaService.admin.delete.mockResolvedValue(mockAdmin);

      const result = await repository.delete(1);

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.admin.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockPrismaService.admin.delete.mockRejectedValue({ code: 'P2025' });

      await expect(repository.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('canDelete', () => {
    it('should return true when admin has no coupons', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(0);

      const result = await repository.canDelete(1);

      expect(result).toBe(true);
      expect(mockPrismaService.coupon.count).toHaveBeenCalledWith({
        where: { createdBy: 1 },
      });
    });

    it('should return false when admin has coupons', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(5);

      const result = await repository.canDelete(1);

      expect(result).toBe(false);
    });
  });

  describe('findWithFilters', () => {
    it('should return paginated results with filters', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
        search: 'test',
        role: AdminRole.ADMIN,
        isActive: true,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      const mockAdmins = [mockAdmin];
      const mockTotal = 1;

      mockPrismaService.admin.findMany.mockResolvedValue(mockAdmins);
      mockPrismaService.admin.count.mockResolvedValue(mockTotal);

      const result = await repository.findWithFilters(queryDto);

      expect(result).toEqual({
        data: mockAdmins.map(admin => ({
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
          lastLogin: admin.lastLogin,
        })),
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });
});