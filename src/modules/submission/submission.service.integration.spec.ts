import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';
import { CouponValidationService } from '../coupon/coupon-validation.service';
import { RewardDistributionService } from '../reward/reward-distribution.service';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { CouponRepository } from '../coupon/coupon.repository';
import { CouponGeneratorService } from '../coupon/coupon-generator.service';
import { RewardAccountRepository } from '../reward/reward-account.repository';
import { EncryptionService } from '../../shared/services/encryption.service';
import { CouponStatus, RewardStatus, RewardCategory } from '@prisma/client';

describe('SubmissionService Integration', () => {
  let service: SubmissionService;
  let prisma: PrismaService;
  let submissionRepository: SubmissionRepository;
  let couponRepository: CouponRepository;
  let rewardAccountRepository: RewardAccountRepository;

  let testAdmin: any;
  let testCoupon: any;
  let testReward: any;
  let testRewardAccount: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        SubmissionRepository,
        CouponValidationService,
        CouponRepository,
        CouponGeneratorService,
        RewardDistributionService,
        RewardAccountRepository,
        EncryptionService,
        PrismaService,
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    prisma = module.get<PrismaService>(PrismaService);
    submissionRepository = module.get<SubmissionRepository>(SubmissionRepository);
    couponRepository = module.get<CouponRepository>(CouponRepository);
    rewardAccountRepository = module.get<RewardAccountRepository>(RewardAccountRepository);

    // Clean up any existing test data
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Create test data for each test
    await setupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function setupTestData() {
    // Create test admin
    testAdmin = await prisma.admin.create({
      data: {
        username: 'testadmin',
        email: 'admin@test.com',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    // Create test reward (for selection)
    testReward = await prisma.reward.create({
      data: {
        name: 'Test Reward',
        description: 'A test reward',
        isActive: true,
        displayOrder: 1,
      },
    });

    // Create test coupon
    testCoupon = await prisma.coupon.create({
      data: {
        couponCode: 'TEST123456',
        batchId: 'BATCH001',
        codeLength: 10,
        status: CouponStatus.ACTIVE,
        createdBy: testAdmin.id,
      },
    });

    // Create test reward account
    testRewardAccount = await prisma.rewardAccount.create({
      data: {
        serviceName: 'Netflix',
        accountType: 'Premium',
        encryptedCredentials: 'encrypted_credentials',
        category: RewardCategory.STREAMING_SERVICE,
        status: RewardStatus.AVAILABLE,
        createdBy: testAdmin.id,
      },
    });
  }

  async function cleanupTestData() {
    // Delete in reverse order of dependencies
    await prisma.submission.deleteMany({});
    await prisma.rewardAccount.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.reward.deleteMany({});
    await prisma.admin.deleteMany({});
  }

  describe('processUserSubmission', () => {
    it('should process valid user submission successfully', async () => {
      // Arrange
      const submissionData = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
        productExperience: 'Great product, very satisfied with the quality.',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };

      // Act
      const result = await service.processUserSubmission(submissionData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('+1234567890');
      expect(result.couponId).toBe(testCoupon.id);

      // Verify coupon was marked as redeemed
      const updatedCoupon = await couponRepository.findById(testCoupon.id);
      expect(updatedCoupon?.status).toBe(CouponStatus.REDEEMED);
      expect(updatedCoupon?.redeemedAt).toBeDefined();

      // Verify submission was created in database
      const submission = await submissionRepository.findById(result.id);
      expect(submission).toBeDefined();
      expect(submission?.name).toBe('John Doe');
    });

    it('should throw ConflictException for already redeemed coupon', async () => {
      // Arrange
      const submissionData = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      };

      // First submission should succeed
      await service.processUserSubmission(submissionData);

      // Act & Assert - Second submission should fail
      await expect(service.processUserSubmission({
        ...submissionData,
        name: 'Jane Doe',
        email: 'jane@example.com',
      })).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid coupon', async () => {
      // Arrange
      const submissionData = {
        couponCode: 'INVALID123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      };

      // Act & Assert
      await expect(service.processUserSubmission(submissionData))
        .rejects.toThrow(BadRequestException);
    });

    it('should validate and sanitize input data', async () => {
      // Arrange
      const submissionData = {
        couponCode: 'TEST123456',
        name: '  John<script>alert("xss")</script>Doe  ',
        email: '  JOHN@EXAMPLE.COM  ', // Should be lowercased
        phone: '+1-234-567-8900',
        address: '123 Main St<img src=x onerror=alert(1)>',
        productExperience: 'Great product with javascript:void(0) link',
      };

      // Act
      const result = await service.processUserSubmission(submissionData);

      // Assert
      expect(result.name).toBe('JohnDoe'); // XSS removed and trimmed
      expect(result.email).toBe('john@example.com'); // Lowercased and trimmed
      expect(result.address).toBe('123 Main St'); // XSS removed
      expect(result.productExperience).toBe('Great product with  link'); // javascript: removed
    });

    it('should throw BadRequestException for invalid email format', async () => {
      // Arrange
      const submissionData = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'invalid-email-format',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      };

      // Act & Assert
      await expect(service.processUserSubmission(submissionData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid phone format', async () => {
      // Arrange
      const submissionData = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123', // Too short
        address: '123 Main St',
        productExperience: 'Great product',
      };

      // Act & Assert
      await expect(service.processUserSubmission(submissionData))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle expired coupon', async () => {
      // Arrange
      const expiredCoupon = await prisma.coupon.create({
        data: {
          couponCode: 'EXPIRED123',
          codeLength: 10,
          status: CouponStatus.ACTIVE,
          createdBy: testAdmin.id,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        },
      });

      const submissionData = {
        couponCode: 'EXPIRED123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      };

      // Act & Assert
      await expect(service.processUserSubmission(submissionData))
        .rejects.toThrow(BadRequestException);

      // Verify coupon was auto-expired
      const updatedCoupon = await couponRepository.findById(expiredCoupon.id);
      expect(updatedCoupon?.status).toBe(CouponStatus.EXPIRED);
    });
  });

  describe('validateCouponCode', () => {
    it('should validate active coupon successfully', async () => {
      // Act
      const result = await service.validateCouponCode('TEST123456');

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for non-existent coupon', async () => {
      // Act
      const result = await service.validateCouponCode('NONEXISTENT');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for redeemed coupon', async () => {
      // Arrange - First redeem the coupon
      await service.processUserSubmission({
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      });

      // Act
      const result = await service.validateCouponCode('TEST123456');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already been redeemed');
    });
  });

  describe('assignRewardToSubmission', () => {
    let testSubmission: any;

    beforeEach(async () => {
      // Create a test submission
      testSubmission = await service.processUserSubmission({
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      });
    });

    it('should assign reward to submission successfully', async () => {
      // Arrange
      const assignmentData = {
        submissionId: testSubmission.id,
        rewardAccountId: testRewardAccount.id,
        notes: 'Test assignment',
      };

      // Act
      const result = await service.assignRewardToSubmission(assignmentData, testAdmin.id);

      // Assert
      expect(result.assignedRewardId).toBe(testRewardAccount.id);
      expect(result.rewardAssignedBy).toBe(testAdmin.id);
      expect(result.rewardAssignedAt).toBeDefined();

      // Verify reward account status was updated
      const updatedRewardAccount = await rewardAccountRepository.findById(testRewardAccount.id);
      expect(updatedRewardAccount?.status).toBe(RewardStatus.ASSIGNED);
      expect(updatedRewardAccount?.assignedToUserId).toBe(testSubmission.id);
    });

    it('should throw BadRequestException for unavailable reward account', async () => {
      // Arrange - Mark reward account as assigned
      await prisma.rewardAccount.update({
        where: { id: testRewardAccount.id },
        data: { status: RewardStatus.ASSIGNED },
      });

      const assignmentData = {
        submissionId: testSubmission.id,
        rewardAccountId: testRewardAccount.id,
        notes: 'Test assignment',
      };

      // Act & Assert
      await expect(service.assignRewardToSubmission(assignmentData, testAdmin.id))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmissionStatistics', () => {
    it('should return accurate statistics', async () => {
      // Arrange - Create multiple submissions
      const submissions = [];
      for (let i = 0; i < 3; i++) {
        const coupon = await prisma.coupon.create({
          data: {
            couponCode: `TEST${i}`,
            codeLength: 10,
            status: CouponStatus.ACTIVE,
            createdBy: testAdmin.id,
          },
        });

        const submission = await service.processUserSubmission({
          couponCode: `TEST${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          phone: `+123456789${i}`,
          address: `${i} Main St`,
          productExperience: 'Great product',
        });

        submissions.push(submission);
      }

      // Assign reward to one submission
      await service.assignRewardToSubmission({
        submissionId: submissions[0].id,
        rewardAccountId: testRewardAccount.id,
      }, testAdmin.id);

      // Act
      const stats = await service.getSubmissionStatistics();

      // Assert
      expect(stats.total).toBe(3);
      expect(stats.withAssignedRewards).toBe(1);
      expect(stats.withoutAssignedRewards).toBe(2);
      expect(stats.rewardAssignmentRate).toBeCloseTo(33.33, 1);
    });
  });

  describe('getSubmissionAnalytics', () => {
    it('should return detailed analytics with date grouping', async () => {
      // Arrange - Create submissions on different dates
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Create submissions for today
      for (let i = 0; i < 2; i++) {
        const coupon = await prisma.coupon.create({
          data: {
            couponCode: `TODAY${i}`,
            codeLength: 10,
            status: CouponStatus.ACTIVE,
            createdBy: testAdmin.id,
          },
        });

        await service.processUserSubmission({
          couponCode: `TODAY${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          phone: `+123456789${i}`,
          address: `${i} Main St`,
          productExperience: 'Great product',
        });
      }

      // Act
      const analytics = await service.getSubmissionAnalytics();

      // Assert
      expect(analytics.totalSubmissions).toBeGreaterThanOrEqual(2);
      expect(analytics.submissionsByDate).toBeDefined();
      expect(analytics.submissionsByDate.length).toBeGreaterThan(0);
      expect(analytics.topRewardSelections).toBeDefined();
    });
  });

  describe('searchSubmissionsByEmail', () => {
    it('should find submissions by email pattern', async () => {
      // Arrange
      await service.processUserSubmission({
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      });

      // Act
      const results = await service.searchSubmissionsByEmail('john.doe');

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('john.doe@example.com');
    });
  });
});