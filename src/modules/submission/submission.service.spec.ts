import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';
import { CouponValidationService } from '../coupon/coupon-validation.service';
import { RewardDistributionService } from '../reward/reward-distribution.service';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { CouponStatus, GenerationMethod } from '@prisma/client';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let submissionRepository: jest.Mocked<SubmissionRepository>;
  let couponValidationService: jest.Mocked<CouponValidationService>;
  let rewardDistributionService: jest.Mocked<RewardDistributionService>;
  let prismaService: any;

  const mockSubmission = {
    id: 1,
    couponId: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    productExperience: 'Great product',
    selectedRewardId: 1,
    submittedAt: new Date(),
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
    batchId: 'BATCH001',
    codeLength: 10,
    status: CouponStatus.ACTIVE,
    createdBy: 1,
    createdAt: new Date(),
    expiresAt: undefined,
    redeemedAt: undefined,
    redeemedBy: undefined,
    generationMethod: GenerationMethod.SINGLE,
    metadata: undefined,
  };

  beforeEach(async () => {
    const mockSubmissionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findByCouponId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findWithFilters: jest.fn(),
      assignReward: jest.fn(),
      removeRewardAssignment: jest.fn(),
      getStatistics: jest.fn(),
      findMany: jest.fn(),
      findByDateRange: jest.fn(),
      searchByEmail: jest.fn(),
      findWithoutAssignedRewards: jest.fn(),
      getRecentSubmissions: jest.fn(),
    };

    const mockCouponValidationService = {
      validateCouponForRedemption: jest.fn(),
    };

    const mockRewardDistributionService = {
      validateRewardAssignment: jest.fn(),
    };

    const mockPrismaService = {
      reward: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: SubmissionRepository,
          useValue: mockSubmissionRepository,
        },
        {
          provide: CouponValidationService,
          useValue: mockCouponValidationService,
        },
        {
          provide: RewardDistributionService,
          useValue: mockRewardDistributionService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    submissionRepository = module.get(SubmissionRepository);
    couponValidationService = module.get(CouponValidationService);
    rewardDistributionService = module.get(RewardDistributionService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processUserSubmission', () => {
    const validSubmissionData = {
      couponCode: 'TEST123456',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      productExperience: 'Great product',
    };

    it('should process valid user submission successfully', async () => {
      // Arrange
      const mockDefaultReward = { id: 1, name: 'Default Submission Reward' };
      
      couponValidationService.validateCouponForRedemption.mockResolvedValue({
        isValid: true,
        coupon: mockCoupon,
      });
      submissionRepository.findByCouponId.mockResolvedValue(null);
      submissionRepository.create.mockResolvedValue(mockSubmission);
      prismaService.reward.findFirst.mockResolvedValue(mockDefaultReward);

      // Act
      const result = await service.processUserSubmission(validSubmissionData);

      // Assert
      expect(couponValidationService.validateCouponForRedemption).toHaveBeenCalledWith('TEST123456');
      expect(submissionRepository.findByCouponId).toHaveBeenCalledWith(1);
      expect(prismaService.reward.findFirst).toHaveBeenCalledWith({
        where: { name: 'Default Submission Reward' },
      });
      expect(submissionRepository.create).toHaveBeenCalledWith({
        couponId: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
        selectedRewardId: 1,
        ipAddress: undefined,
        userAgent: undefined,
        additionalData: undefined,
      });
      expect(result).toEqual({
        id: 1,
        couponId: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
        selectedRewardId: 1,
        submittedAt: mockSubmission.submittedAt.toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        additionalData: null,
        assignedRewardId: undefined,
        rewardAssignedAt: undefined,
        rewardAssignedBy: undefined,
      });
    });

    it('should throw BadRequestException for invalid coupon', async () => {
      // Arrange
      couponValidationService.validateCouponForRedemption.mockResolvedValue({
        isValid: false,
        error: 'Coupon not found',
      });

      // Act & Assert
      await expect(service.processUserSubmission(validSubmissionData))
        .rejects.toThrow(BadRequestException);
      expect(couponValidationService.validateCouponForRedemption).toHaveBeenCalledWith('TEST123456');
    });

    it('should throw ConflictException if coupon already redeemed', async () => {
      // Arrange
      couponValidationService.validateCouponForRedemption.mockResolvedValue({
        isValid: true,
        coupon: mockCoupon,
      });
      submissionRepository.findByCouponId.mockResolvedValue(mockSubmission);

      // Act & Assert
      await expect(service.processUserSubmission(validSubmissionData))
        .rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for missing required fields', async () => {
      // Arrange
      const invalidData = {
        ...validSubmissionData,
        name: '',
        email: '',
      };

      // Act & Assert
      await expect(service.processUserSubmission(invalidData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid email format', async () => {
      // Arrange
      const invalidData = {
        ...validSubmissionData,
        email: 'invalid-email',
      };

      // Act & Assert
      await expect(service.processUserSubmission(invalidData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid phone format', async () => {
      // Arrange
      const invalidData = {
        ...validSubmissionData,
        phone: '123', // Too short
      };

      // Act & Assert
      await expect(service.processUserSubmission(invalidData))
        .rejects.toThrow(BadRequestException);
    });

    it('should sanitize input data', async () => {
      // Arrange
      const dataWithXSS = {
        ...validSubmissionData,
        name: 'John<script>alert("xss")</script>Doe',
        address: '123 Main St<img src=x onerror=alert(1)>',
      };

      const mockDefaultReward = { id: 1, name: 'Default Submission Reward' };

      couponValidationService.validateCouponForRedemption.mockResolvedValue({
        isValid: true,
        coupon: mockCoupon,
      });
      submissionRepository.findByCouponId.mockResolvedValue(null);
      submissionRepository.create.mockResolvedValue(mockSubmission);
      prismaService.reward.findFirst.mockResolvedValue(mockDefaultReward);

      // Act
      await service.processUserSubmission(dataWithXSS);

      // Assert
      expect(submissionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Johnalert("xss")Doe', // Script tags removed, content remains
          address: '123 Main St', // XSS attempt removed
        })
      );
    });
  });

  describe('validateCouponCode', () => {
    it('should return valid result for valid coupon', async () => {
      // Arrange
      couponValidationService.validateCouponForRedemption.mockResolvedValue({
        isValid: true,
        coupon: mockCoupon,
      });

      // Act
      const result = await service.validateCouponCode('TEST123456');

      // Assert
      expect(result).toEqual({
        isValid: true,
        error: undefined,
      });
    });

    it('should return invalid result for invalid coupon', async () => {
      // Arrange
      couponValidationService.validateCouponForRedemption.mockResolvedValue({
        isValid: false,
        error: 'Coupon not found',
      });

      // Act
      const result = await service.validateCouponCode('INVALID123');

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Coupon not found',
      });
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      couponValidationService.validateCouponForRedemption.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await service.validateCouponCode('TEST123456');

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Validation error occurred',
      });
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission with relations', async () => {
      // Arrange
      const submissionWithRelations = {
        ...mockSubmission,
        coupon: mockCoupon,
        selectedReward: { id: 1, name: 'Test Reward' },
      };
      submissionRepository.findByIdWithRelations.mockResolvedValue(submissionWithRelations);

      // Act
      const result = await service.getSubmissionById(1);

      // Assert
      expect(result).toEqual(submissionWithRelations);
      expect(submissionRepository.findByIdWithRelations).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if submission not found', async () => {
      // Arrange
      submissionRepository.findByIdWithRelations.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getSubmissionById(999))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRewardToSubmission', () => {
    const assignmentData = {
      submissionId: 1,
      rewardAccountId: 1,
      notes: 'Test assignment',
    };

    it('should assign reward successfully', async () => {
      // Arrange
      rewardDistributionService.validateRewardAssignment.mockResolvedValue({
        isValid: true,
        rewardAccount: {
          id: 1,
          serviceName: 'Netflix',
          accountType: 'Premium',
          encryptedCredentials: 'encrypted',
          subscriptionDuration: '1 month',
          description: 'Test account',
          category: 'STREAMING_SERVICE',
          status: 'AVAILABLE',
          assignedToUserId: null,
          assignedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 1,
        },
      });
      submissionRepository.assignReward.mockResolvedValue({
        ...mockSubmission,
        assignedRewardId: 1,
        rewardAssignedAt: new Date(),
        rewardAssignedBy: 1,
      });

      // Act
      const result = await service.assignRewardToSubmission(assignmentData, 1);

      // Assert
      expect(rewardDistributionService.validateRewardAssignment).toHaveBeenCalledWith(1, 1);
      expect(submissionRepository.assignReward).toHaveBeenCalledWith(assignmentData, 1);
      expect(result.assignedRewardId).toBe(1);
    });

    it('should throw BadRequestException if validation fails', async () => {
      // Arrange
      rewardDistributionService.validateRewardAssignment.mockResolvedValue({
        isValid: false,
        error: 'Reward not available',
      });

      // Act & Assert
      await expect(service.assignRewardToSubmission(assignmentData, 1))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmissionStatistics', () => {
    it('should return submission statistics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        withAssignedRewards: 75,
        withoutAssignedRewards: 25,
        rewardAssignmentRate: 75.0,
        rewardSelectionStats: [],
      };
      submissionRepository.getStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await service.getSubmissionStatistics();

      // Assert
      expect(result).toEqual(mockStats);
      expect(submissionRepository.getStatistics).toHaveBeenCalled();
    });
  });

  describe('getSubmissionAnalytics', () => {
    it('should return detailed analytics', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        withAssignedRewards: 75,
        withoutAssignedRewards: 25,
        rewardAssignmentRate: 75.0,
        rewardSelectionStats: [
          {
            rewardId: 1,
            rewardName: 'Test Reward',
            selectionCount: 50,
            selectionPercentage: 50.0,
          },
        ],
      };
      const mockSubmissions = [
        { ...mockSubmission, submittedAt: new Date('2024-01-01') },
        { ...mockSubmission, submittedAt: new Date('2024-01-01') },
        { ...mockSubmission, submittedAt: new Date('2024-01-02') },
      ];

      submissionRepository.getStatistics.mockResolvedValue(mockStats);
      submissionRepository.findMany.mockResolvedValue(mockSubmissions);

      // Act
      const result = await service.getSubmissionAnalytics();

      // Assert
      expect(result).toEqual({
        totalSubmissions: 100,
        submissionsWithRewards: 75,
        submissionsWithoutRewards: 25,
        rewardAssignmentRate: 75.0,
        submissionsByDate: [
          { date: '2024-01-01', count: 2 },
          { date: '2024-01-02', count: 1 },
        ],
        topRewardSelections: [
          {
            rewardId: 1,
            rewardName: 'Test Reward',
            count: 50,
            percentage: 50.0,
          },
        ],
      });
    });
  });

  describe('searchSubmissionsByEmail', () => {
    it('should search submissions by email', async () => {
      // Arrange
      submissionRepository.searchByEmail.mockResolvedValue([mockSubmission]);

      // Act
      const result = await service.searchSubmissionsByEmail('john@example.com');

      // Assert
      expect(result).toHaveLength(1);
      expect(submissionRepository.searchByEmail).toHaveBeenCalledWith('john@example.com', 10);
    });
  });

  describe('getSubmissionsWithoutRewards', () => {
    it('should return submissions without assigned rewards', async () => {
      // Arrange
      submissionRepository.findWithoutAssignedRewards.mockResolvedValue([mockSubmission]);

      // Act
      const result = await service.getSubmissionsWithoutRewards();

      // Assert
      expect(result).toHaveLength(1);
      expect(submissionRepository.findWithoutAssignedRewards).toHaveBeenCalled();
    });
  });

  describe('removeRewardAssignment', () => {
    it('should remove reward assignment successfully', async () => {
      // Arrange
      submissionRepository.removeRewardAssignment.mockResolvedValue(mockSubmission);

      // Act
      const result = await service.removeRewardAssignment(1);

      // Assert
      expect(result).toBeDefined();
      expect(submissionRepository.removeRewardAssignment).toHaveBeenCalledWith(1);
    });
  });

  describe('updateSubmission', () => {
    it('should update submission successfully', async () => {
      // Arrange
      const updateData = { name: 'Jane Doe' };
      const updatedSubmission = { ...mockSubmission, name: 'Jane Doe' };
      submissionRepository.update.mockResolvedValue(updatedSubmission);

      // Act
      const result = await service.updateSubmission(1, updateData);

      // Assert
      expect(result.name).toBe('Jane Doe');
      expect(submissionRepository.update).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission successfully', async () => {
      // Arrange
      submissionRepository.delete.mockResolvedValue(mockSubmission);

      // Act
      await service.deleteSubmission(1);

      // Assert
      expect(submissionRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});