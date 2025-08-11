import { Test, TestingModule } from '@nestjs/testing';
import { RewardDistributionService } from './reward-distribution.service';
import { RewardAccountRepository } from './reward-account.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { EncryptionService } from '../../shared/services';
import { RewardCategory, RewardStatus } from '@prisma/client';

describe('RewardDistributionService Integration', () => {
  let service: RewardDistributionService;
  let prisma: PrismaService;
  let repository: RewardAccountRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardDistributionService,
        RewardAccountRepository,
        PrismaService,
        EncryptionService,
      ],
    }).compile();

    service = module.get<RewardDistributionService>(RewardDistributionService);
    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<RewardAccountRepository>(RewardAccountRepository);

    // Clean up database before tests
    await prisma.rewardAccount.deleteMany();
    await prisma.admin.deleteMany();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prisma.rewardAccount.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.rewardAccount.deleteMany();
  });

  describe('Reward Account Management', () => {
    let adminId: number;

    beforeEach(async () => {
      // Create a test admin
      const admin = await prisma.admin.create({
        data: {
          username: 'testadmin',
          email: 'admin@test.com',
          passwordHash: 'hashedpassword',
        },
      });
      adminId = admin.id;
    });

    it('should create and retrieve a reward account', async () => {
      const createDto = {
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'user@example.com:password123',
        subscriptionDuration: '1 month',
        description: 'Netflix Premium Account',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      };

      const createdReward = await service.createRewardAccount(createDto);

      expect(createdReward.id).toBeDefined();
      expect(createdReward.serviceName).toBe(createDto.serviceName);
      expect(createdReward.accountType).toBe(createDto.accountType);
      expect(createdReward.category).toBe(createDto.category);
      expect(createdReward.status).toBe(RewardStatus.AVAILABLE);
      expect(createdReward.encryptedCredentials).toBeDefined();
      expect(createdReward.encryptedCredentials).not.toBe(createDto.credentials);

      // Retrieve the reward account
      const retrievedReward = await service.getRewardAccount(createdReward.id);
      expect(retrievedReward.id).toBe(createdReward.id);
      expect(retrievedReward.serviceName).toBe(createDto.serviceName);
    });

    it('should retrieve reward account with decrypted credentials', async () => {
      const createDto = {
        serviceName: 'Spotify',
        accountType: 'Premium',
        credentials: 'spotify@example.com:mypassword',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      };

      const createdReward = await service.createRewardAccount(createDto);
      const rewardWithCredentials = await service.getRewardAccountWithCredentials(createdReward.id);

      expect(rewardWithCredentials.decryptedCredentials).toBe(createDto.credentials);
    });

    it('should update a reward account', async () => {
      const createDto = {
        serviceName: 'YouTube',
        accountType: 'Premium',
        credentials: 'youtube@example.com:pass123',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      };

      const createdReward = await service.createRewardAccount(createDto);

      const updateDto = {
        serviceName: 'YouTube Premium',
        description: 'Updated YouTube Premium Account',
      };

      const updatedReward = await service.updateRewardAccount(createdReward.id, updateDto);

      expect(updatedReward.serviceName).toBe(updateDto.serviceName);
      expect(updatedReward.description).toBe(updateDto.description);
      expect(updatedReward.accountType).toBe(createDto.accountType); // Should remain unchanged
    });

    it('should get available reward accounts', async () => {
      // Create multiple reward accounts
      const accounts = [
        {
          serviceName: 'Netflix',
          accountType: 'Premium',
          credentials: 'netflix1@example.com:pass',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
        {
          serviceName: 'Spotify',
          accountType: 'Premium',
          credentials: 'spotify1@example.com:pass',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
        {
          serviceName: 'Amazon Gift Card',
          accountType: '$50',
          credentials: 'GIFTCARD123',
          category: RewardCategory.GIFT_CARD,
          createdBy: adminId,
        },
      ];

      for (const account of accounts) {
        await service.createRewardAccount(account);
      }

      // Get all available rewards
      const availableRewards = await service.getAvailableRewardAccounts();
      expect(availableRewards).toHaveLength(3);
      expect(availableRewards.every(reward => reward.status === RewardStatus.AVAILABLE)).toBe(true);

      // Get available rewards by category
      const streamingRewards = await service.getAvailableRewardAccounts(RewardCategory.STREAMING_SERVICE);
      expect(streamingRewards).toHaveLength(2);
      expect(streamingRewards.every(reward => reward.category === RewardCategory.STREAMING_SERVICE)).toBe(true);

      const giftCardRewards = await service.getAvailableRewardAccounts(RewardCategory.GIFT_CARD);
      expect(giftCardRewards).toHaveLength(1);
      expect(giftCardRewards[0].category).toBe(RewardCategory.GIFT_CARD);
    });

    it('should get reward inventory statistics', async () => {
      // Create rewards with different statuses
      const netflixReward = await service.createRewardAccount({
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'netflix@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      const spotifyReward = await service.createRewardAccount({
        serviceName: 'Spotify',
        accountType: 'Premium',
        credentials: 'spotify@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      // Deactivate one reward
      await service.deactivateRewardAccount(spotifyReward.id);

      const stats = await service.getRewardInventoryStats();

      expect(stats.total).toBe(2);
      expect(stats.available).toBe(1);
      expect(stats.assigned).toBe(0);
      expect(stats.expired).toBe(0);
      expect(stats.deactivated).toBe(1);
      expect(stats.byCategory[RewardCategory.STREAMING_SERVICE]).toBe(2);
    });

    it('should get reward distribution analytics', async () => {
      // Create some rewards
      await service.createRewardAccount({
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'netflix@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      await service.createRewardAccount({
        serviceName: 'Spotify',
        accountType: 'Premium',
        credentials: 'spotify@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      const analytics = await service.getRewardDistributionAnalytics();

      expect(analytics.inventory.total).toBe(2);
      expect(analytics.distributionRate).toBe(0); // No assigned rewards
      expect(analytics.availabilityRate).toBe(100); // All rewards available
      expect(analytics.categoryDistribution).toBeDefined();
    });

    it('should handle bulk creation of reward accounts', async () => {
      const accounts = [
        {
          serviceName: 'Netflix 1',
          accountType: 'Premium',
          credentials: 'netflix1@example.com:pass',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
        {
          serviceName: 'Netflix 2',
          accountType: 'Premium',
          credentials: 'netflix2@example.com:pass',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
        {
          serviceName: 'Spotify 1',
          accountType: 'Premium',
          credentials: 'spotify1@example.com:pass',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
      ];

      const result = await service.bulkCreateRewardAccounts(accounts);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);

      // Verify all accounts were created
      const allRewards = await service.getAvailableRewardAccounts();
      expect(allRewards).toHaveLength(3);
    });

    it('should get assignable rewards', async () => {
      // Create some rewards
      await service.createRewardAccount({
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'netflix@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      const assignableRewards = await service.getAssignableRewards();

      expect(assignableRewards).toHaveLength(1);
      expect(assignableRewards[0]).toHaveProperty('id');
      expect(assignableRewards[0]).toHaveProperty('serviceName');
      expect(assignableRewards[0]).toHaveProperty('accountType');
      expect(assignableRewards[0]).toHaveProperty('category');
      expect(assignableRewards[0]).not.toHaveProperty('encryptedCredentials');
    });

    it('should validate reward assignment', async () => {
      const reward = await service.createRewardAccount({
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'netflix@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      // Valid assignment
      const validResult = await service.validateRewardAssignment(reward.id, 1);
      expect(validResult.isValid).toBe(true);
      expect(validResult.rewardAccount).toBeDefined();

      // Invalid assignment - non-existent reward
      const invalidResult = await service.validateRewardAssignment(999, 1);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('not found');
    });

    it('should deactivate and reactivate reward accounts', async () => {
      const reward = await service.createRewardAccount({
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'netflix@example.com:pass',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      });

      // Deactivate
      const deactivatedReward = await service.deactivateRewardAccount(reward.id);
      expect(deactivatedReward.status).toBe(RewardStatus.DEACTIVATED);

      // Reactivate
      const reactivatedReward = await service.reactivateRewardAccount(reward.id);
      expect(reactivatedReward.status).toBe(RewardStatus.AVAILABLE);
    });
  });
});