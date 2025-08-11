import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmissionRepository } from './submission.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { CreateSubmissionDto, AssignRewardToSubmissionDto } from './dto';

describe('SubmissionRepository', () => {
  let repository: SubmissionRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    submission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reward: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    rewardAccount: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockSubmission = {
    id: 1,
    couponId: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    productExperience: 'Great product',
    selectedRewardId: 1,
    submittedAt: new Date('2024-01-01'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    additionalData: null,
    assignedRewardId: null,
    rewardAssignedAt: null,
    rewardAssignedBy: null,
  };

  const mockCoupon = {
    id: 1,
    couponCode: 'TEST123456',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    expiresAt: null,
  };

  const mockReward = {
    id: 1,
    name: 'Test Reward',
    description: 'Test reward description',
    isActive: true,
  };

  const mockRewardAccount = {
    id: 1,
    serviceName: 'Netflix',
    accountType: 'Premium',
    status: 'AVAILABLE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<SubmissionRepository>(SubmissionRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find submission by ID', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await repository.findById(1);

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.submission.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRelations', () => {
    it('should find submission with relations', async () => {
      const mockSubmissionWithRelations = {
        ...mockSubmission,
        coupon: mockCoupon,
        selectedReward: mockReward,
        assignedReward: null,
        rewardAssignedByAdmin: null,
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmissionWithRelations);

      const result = await repository.findByIdWithRelations(1);

      expect(result).toEqual(mockSubmissionWithRelations);
      expect(mockPrismaService.submission.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({
          coupon: expect.any(Object),
          selectedReward: expect.any(Object),
          assignedReward: expect.any(Object),
          rewardAssignedByAdmin: expect.any(Object),
        }),
      });
    });
  });

  describe('findByCouponId', () => {
    it('should find submission by coupon ID', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await repository.findByCouponId(1);

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.submission.findUnique).toHaveBeenCalledWith({
        where: { couponId: 1 },
      });
    });
  });

  describe('existsByCouponId', () => {
    it('should return true if submission exists for coupon', async () => {
      mockPrismaService.submission.count.mockResolvedValue(1);

      const result = await repository.existsByCouponId(1);

      expect(result).toBe(true);
      expect(mockPrismaService.submission.count).toHaveBeenCalledWith({
        where: { couponId: 1 },
      });
    });

    it('should return false if submission does not exist for coupon', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0);

      const result = await repository.existsByCouponId(1);

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    const createSubmissionDto: CreateSubmissionDto = {
      couponId: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      productExperience: 'Great product',
      selectedRewardId: 1,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should create submission successfully', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0); // No existing submission
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.reward.findUnique.mockResolvedValue(mockReward);
      
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          submission: {
            create: jest.fn().mockResolvedValue(mockSubmission),
          },
          coupon: {
            update: jest.fn().mockResolvedValue(mockCoupon),
          },
        };
        return callback(mockTx);
      });
      
      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await repository.create(createSubmissionDto);

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if coupon already redeemed', async () => {
      mockPrismaService.submission.count.mockResolvedValue(1); // Existing submission

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if coupon not found', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0);
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if coupon not active', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0);
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...mockCoupon,
        status: 'EXPIRED',
      });

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reward not found', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0);
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.reward.findUnique.mockResolvedValue(null);

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reward not active', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0);
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.reward.findUnique.mockResolvedValue({
        ...mockReward,
        isActive: false,
      });

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    it('should update submission successfully', async () => {
      const updatedSubmission = { ...mockSubmission, ...updateData };
      
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.update.mockResolvedValue(updatedSubmission);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedSubmission);
      expect(mockPrismaService.submission.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining(updateData),
      });
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(repository.update(999, updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete submission and reset coupon status', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          submission: {
            delete: jest.fn().mockResolvedValue(mockSubmission),
          },
          coupon: {
            update: jest.fn().mockResolvedValue(mockCoupon),
          },
        };
        return callback(mockTx);
      });
      
      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await repository.delete(1);

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(repository.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignReward', () => {
    const assignmentData: AssignRewardToSubmissionDto = {
      submissionId: 1,
      rewardAccountId: 1,
      notes: 'Test assignment',
    };

    it('should assign reward successfully', async () => {
      const updatedSubmission = {
        ...mockSubmission,
        assignedRewardId: 1,
        rewardAssignedAt: new Date(),
        rewardAssignedBy: 1,
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);
      
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          submission: {
            update: jest.fn().mockResolvedValue(updatedSubmission),
          },
          rewardAccount: {
            update: jest.fn().mockResolvedValue(mockRewardAccount),
          },
        };
        return callback(mockTx);
      });
      
      mockPrismaService.$transaction.mockImplementation(mockTransaction);

      const result = await repository.assignReward(assignmentData, 1);

      expect(result).toEqual(updatedSubmission);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(repository.assignReward(assignmentData, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if reward account not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(repository.assignReward(assignmentData, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reward account not available', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        ...mockRewardAccount,
        status: 'ASSIGNED',
      });

      await expect(repository.assignReward(assignmentData, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    it('should return submission statistics', async () => {
      // Mock the first call for total count in getStatistics
      mockPrismaService.submission.count
        .mockResolvedValueOnce(100) // total in getStatistics
        .mockResolvedValueOnce(60)  // with assigned rewards in getStatistics
        .mockResolvedValueOnce(100); // total in getRewardSelectionStatistics

      mockPrismaService.submission.groupBy.mockResolvedValue([
        { selectedRewardId: 1, _count: { selectedRewardId: 40 } },
        { selectedRewardId: 2, _count: { selectedRewardId: 35 } },
        { selectedRewardId: 3, _count: { selectedRewardId: 25 } },
      ]);

      mockPrismaService.reward.findMany.mockResolvedValue([
        { id: 1, name: 'Reward 1' },
        { id: 2, name: 'Reward 2' },
        { id: 3, name: 'Reward 3' },
      ]);

      const result = await repository.getStatistics();

      expect(result).toEqual({
        total: 100,
        withAssignedRewards: 60,
        withoutAssignedRewards: 40,
        rewardAssignmentRate: 60,
        rewardSelectionStats: [
          { rewardId: 1, rewardName: 'Reward 1', selectionCount: 40, selectionPercentage: 40 },
          { rewardId: 2, rewardName: 'Reward 2', selectionCount: 35, selectionPercentage: 35 },
          { rewardId: 3, rewardName: 'Reward 3', selectionCount: 25, selectionPercentage: 25 },
        ],
      });
    });
  });

  describe('canDelete', () => {
    it('should return true if submission can be deleted', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await repository.canDelete(1);

      expect(result).toBe(true);
    });

    it('should return false if submission has assigned reward', async () => {
      const submissionWithReward = {
        ...mockSubmission,
        assignedRewardId: 1,
      };
      
      mockPrismaService.submission.findUnique.mockResolvedValue(submissionWithReward);

      const result = await repository.canDelete(1);

      expect(result).toBe(false);
    });

    it('should return false if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      const result = await repository.canDelete(999);

      expect(result).toBe(false);
    });
  });

  describe('findWithFilters', () => {
    it('should find submissions with filters and pagination', async () => {
      const mockSubmissions = [mockSubmission];
      const mockSubmissionsWithRelations = [{
        ...mockSubmission,
        coupon: mockCoupon,
        selectedReward: mockReward,
        assignedReward: null,
        rewardAssignedByAdmin: null,
      }];

      mockPrismaService.submission.findMany.mockResolvedValue(mockSubmissionsWithRelations);
      mockPrismaService.submission.count.mockResolvedValue(1);

      const queryDto = {
        page: 1,
        limit: 10,
        search: 'john',
        sortBy: 'submittedAt',
        sortOrder: 'desc' as const,
      };

      const result = await repository.findWithFilters(queryDto);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockSubmission.id,
            name: mockSubmission.name,
            email: mockSubmission.email,
          }),
        ]),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
            { phone: { contains: 'john', mode: 'insensitive' } },
          ]),
        }),
        orderBy: { submittedAt: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
    });
  });
});