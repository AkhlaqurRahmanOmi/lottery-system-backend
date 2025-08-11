import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmissionRepository } from './submission.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { CreateSubmissionDto, AssignRewardToSubmissionDto } from './dto';

describe('SubmissionRepository Integration', () => {
  let repository: SubmissionRepository;
  let prismaService: PrismaService;
  let testAdminId: number;
  let testCouponId: number;
  let testRewardId: number;
  let testRewardAccountId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionRepository,
        PrismaService,
      ],
    }).compile();

    repository = module.get<SubmissionRepository>(SubmissionRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await prismaService.$disconnect();
  });

  beforeEach(async () => {
    // Clean up submissions before each test
    await prismaService.submission.deleteMany({
      where: {
        coupon: {
          createdBy: testAdminId,
        },
      },
    });

    // Reset coupon status
    await prismaService.coupon.updateMany({
      where: {
        createdBy: testAdminId,
      },
      data: {
        status: 'ACTIVE',
        redeemedAt: null,
        redeemedBy: null,
      },
    });

    // Reset reward account status
    await prismaService.rewardAccount.updateMany({
      where: {
        createdBy: testAdminId,
      },
      data: {
        status: 'AVAILABLE',
        assignedToUserId: null,
        assignedAt: null,
      },
    });
  });

  async function setupTestData() {
    // Create test admin
    const admin = await prismaService.admin.create({
      data: {
        username: 'testadmin_submission',
        email: 'testadmin_submission@example.com',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
      },
    });
    testAdminId = admin.id;

    // Create test coupon
    const coupon = await prismaService.coupon.create({
      data: {
        couponCode: 'TESTSUBMISSION123',
        codeLength: 10,
        status: 'ACTIVE',
        createdBy: testAdminId,
      },
    });
    testCouponId = coupon.id;

    // Create test reward
    const reward = await prismaService.reward.create({
      data: {
        name: 'Test Reward for Submission',
        description: 'Test reward description',
        isActive: true,
      },
    });
    testRewardId = reward.id;

    // Create test reward account
    const rewardAccount = await prismaService.rewardAccount.create({
      data: {
        serviceName: 'Netflix',
        accountType: 'Premium',
        encryptedCredentials: 'encrypted_credentials',
        category: 'STREAMING_SERVICE',
        status: 'AVAILABLE',
        createdBy: testAdminId,
      },
    });
    testRewardAccountId = rewardAccount.id;
  }

  async function cleanupTestData() {
    // Delete in correct order due to foreign key constraints
    await prismaService.submission.deleteMany({
      where: {
        coupon: {
          createdBy: testAdminId,
        },
      },
    });

    await prismaService.coupon.deleteMany({
      where: {
        createdBy: testAdminId,
      },
    });

    await prismaService.rewardAccount.deleteMany({
      where: {
        createdBy: testAdminId,
      },
    });

    await prismaService.reward.deleteMany({
      where: {
        id: testRewardId,
      },
    });

    await prismaService.admin.deleteMany({
      where: {
        id: testAdminId,
      },
    });
  }

  describe('create', () => {
    it('should create submission and mark coupon as redeemed', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await repository.create(createSubmissionDto);

      expect(result).toMatchObject({
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      // Verify coupon was marked as redeemed
      const updatedCoupon = await prismaService.coupon.findUnique({
        where: { id: testCouponId },
      });

      expect(updatedCoupon?.status).toBe('REDEEMED');
      expect(updatedCoupon?.redeemedAt).toBeDefined();
      expect(updatedCoupon?.redeemedBy).toBe(result.id);
    });

    it('should throw ConflictException when trying to redeem already redeemed coupon', async () => {
      // First submission
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      await repository.create(createSubmissionDto);

      // Second submission with same coupon should fail
      const secondSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
        address: '456 Oak Ave',
        productExperience: 'Another experience',
        selectedRewardId: testRewardId,
      };

      await expect(repository.create(secondSubmissionDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: 99999,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent reward', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: 99999,
      };

      await expect(repository.create(createSubmissionDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById and findByIdWithRelations', () => {
    let submissionId: number;

    beforeEach(async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      const submission = await repository.create(createSubmissionDto);
      submissionId = submission.id;
    });

    it('should find submission by ID', async () => {
      const result = await repository.findById(submissionId);

      expect(result).toMatchObject({
        id: submissionId,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should find submission with relations', async () => {
      const result = await repository.findByIdWithRelations(submissionId);

      expect(result).toMatchObject({
        id: submissionId,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result.coupon).toMatchObject({
        id: testCouponId,
        couponCode: 'TESTSUBMISSION123',
        status: 'REDEEMED',
      });

      expect(result.selectedReward).toMatchObject({
        id: testRewardId,
        name: 'Test Reward for Submission',
        isActive: true,
      });
    });
  });

  describe('assignReward', () => {
    let submissionId: number;

    beforeEach(async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      const submission = await repository.create(createSubmissionDto);
      submissionId = submission.id;
    });

    it('should assign reward to submission', async () => {
      const assignmentData: AssignRewardToSubmissionDto = {
        submissionId,
        rewardAccountId: testRewardAccountId,
        notes: 'Test assignment',
      };

      const result = await repository.assignReward(assignmentData, testAdminId);

      expect(result.assignedRewardId).toBe(testRewardAccountId);
      expect(result.rewardAssignedAt).toBeDefined();
      expect(result.rewardAssignedBy).toBe(testAdminId);

      // Verify reward account was marked as assigned
      const updatedRewardAccount = await prismaService.rewardAccount.findUnique({
        where: { id: testRewardAccountId },
      });

      expect(updatedRewardAccount?.status).toBe('ASSIGNED');
      expect(updatedRewardAccount?.assignedToUserId).toBe(submissionId);
      expect(updatedRewardAccount?.assignedAt).toBeDefined();
    });

    it('should throw BadRequestException when reward account is not available', async () => {
      // Mark reward account as assigned
      await prismaService.rewardAccount.update({
        where: { id: testRewardAccountId },
        data: { status: 'ASSIGNED' },
      });

      const assignmentData: AssignRewardToSubmissionDto = {
        submissionId,
        rewardAccountId: testRewardAccountId,
        notes: 'Test assignment',
      };

      await expect(repository.assignReward(assignmentData, testAdminId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeRewardAssignment', () => {
    let submissionId: number;

    beforeEach(async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      const submission = await repository.create(createSubmissionDto);
      submissionId = submission.id;

      // Assign reward first
      const assignmentData: AssignRewardToSubmissionDto = {
        submissionId,
        rewardAccountId: testRewardAccountId,
        notes: 'Test assignment',
      };

      await repository.assignReward(assignmentData, testAdminId);
    });

    it('should remove reward assignment', async () => {
      const result = await repository.removeRewardAssignment(submissionId);

      expect(result.assignedRewardId).toBeNull();
      expect(result.rewardAssignedAt).toBeNull();
      expect(result.rewardAssignedBy).toBeNull();

      // Verify reward account was marked as available
      const updatedRewardAccount = await prismaService.rewardAccount.findUnique({
        where: { id: testRewardAccountId },
      });

      expect(updatedRewardAccount?.status).toBe('AVAILABLE');
      expect(updatedRewardAccount?.assignedToUserId).toBeNull();
      expect(updatedRewardAccount?.assignedAt).toBeNull();
    });
  });

  describe('delete', () => {
    let submissionId: number;

    beforeEach(async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      const submission = await repository.create(createSubmissionDto);
      submissionId = submission.id;
    });

    it('should delete submission and reset coupon status', async () => {
      const result = await repository.delete(submissionId);

      expect(result.id).toBe(submissionId);

      // Verify submission was deleted
      const deletedSubmission = await repository.findById(submissionId);
      expect(deletedSubmission).toBeNull();

      // Verify coupon status was reset
      const updatedCoupon = await prismaService.coupon.findUnique({
        where: { id: testCouponId },
      });

      expect(updatedCoupon?.status).toBe('ACTIVE');
      expect(updatedCoupon?.redeemedAt).toBeNull();
      expect(updatedCoupon?.redeemedBy).toBeNull();
    });
  });

  describe('findWithFilters', () => {
    beforeEach(async () => {
      // Create multiple submissions for testing
      const submissions = [
        {
          couponId: testCouponId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Main St',
          productExperience: 'Great product experience',
          selectedRewardId: testRewardId,
        },
      ];

      // Create additional test data if needed
      for (const submissionData of submissions) {
        await repository.create(submissionData);
      }
    });

    it('should find submissions with pagination', async () => {
      const result = await repository.findWithFilters({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should find submissions with search filter', async () => {
      const result = await repository.findWithFilters({
        search: 'john',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('John Doe');
    });

    it('should find submissions with email filter', async () => {
      const result = await repository.findWithFilters({
        email: 'john@example.com',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('john@example.com');
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        couponId: testCouponId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product experience',
        selectedRewardId: testRewardId,
      };

      await repository.create(createSubmissionDto);
    });

    it('should return submission statistics', async () => {
      const result = await repository.getStatistics();

      expect(result).toMatchObject({
        total: 1,
        withAssignedRewards: 0,
        withoutAssignedRewards: 1,
        rewardAssignmentRate: 0,
      });

      expect(result.rewardSelectionStats).toHaveLength(1);
      expect(result.rewardSelectionStats[0]).toMatchObject({
        rewardId: testRewardId,
        rewardName: 'Test Reward for Submission',
        selectionCount: 1,
        selectionPercentage: 100,
      });
    });
  });
});