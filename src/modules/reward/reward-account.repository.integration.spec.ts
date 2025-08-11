import { Test, TestingModule } from '@nestjs/testing';
import { RewardAccountRepository } from './reward-account.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { EncryptionService } from '../../shared/services';
import { RewardCategory, RewardStatus } from '@prisma/client';

describe('RewardAccountRepository Integration', () => {
  let repository: RewardAccountRepository;
  let prismaService: PrismaService;
  let encryptionService: EncryptionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardAccountRepository,
        PrismaService,
        EncryptionService,
      ],
    }).compile();

    repository = module.get<RewardAccountRepository>(RewardAccountRepository);
    prismaService = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);

    // Clean up any existing test data
    await prismaService.rewardAccount.deleteMany({
      where: {
        serviceName: {
          startsWith: 'Test',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.rewardAccount.deleteMany({
      where: {
        serviceName: {
          startsWith: 'Test',
        },
      },
    });
    await prismaService.$disconnect();
  });

  describe('CRUD Operations', () => {
    let createdAccountId: number;
    let adminId: number;

    beforeAll(async () => {
      // Create a test admin
      const admin = await prismaService.admin.create({
        data: {
          username: 'test-admin-reward',
          email: 'test-admin-reward@example.com',
          passwordHash: 'hashed-password',
        },
      });
      adminId = admin.id;
    });

    afterAll(async () => {
      // Clean up test admin
      await prismaService.admin.delete({
        where: { id: adminId },
      });
    });

    it('should create a reward account with encrypted credentials', async () => {
      const createData = {
        serviceName: 'Test Netflix',
        accountType: 'Premium',
        credentials: 'test-user@example.com:password123',
        subscriptionDuration: '12 months',
        description: 'Test Netflix Premium account',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      };

      const result = await repository.create(createData);
      createdAccountId = result.id;

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.serviceName).toBe(createData.serviceName);
      expect(result.accountType).toBe(createData.accountType);
      expect(result.encryptedCredentials).toBeDefined();
      expect(result.encryptedCredentials).not.toBe(createData.credentials);
      expect(result.category).toBe(createData.category);
      expect(result.status).toBe(RewardStatus.AVAILABLE);
      expect(result.creator).toBeDefined();
      expect(result.creator.id).toBe(adminId);
    });

    it('should find reward account by id', async () => {
      const result = await repository.findById(createdAccountId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAccountId);
      expect(result.serviceName).toBe('Test Netflix');
    });

    it('should find reward account with decrypted credentials', async () => {
      const result = await repository.findByIdWithCredentials(createdAccountId);

      expect(result).toBeDefined();
      expect(result.decryptedCredentials).toBe('test-user@example.com:password123');
    });

    it('should update reward account', async () => {
      const updateData = {
        serviceName: 'Test Netflix Updated',
        description: 'Updated description',
      };

      const result = await repository.update(createdAccountId, updateData);

      expect(result.serviceName).toBe(updateData.serviceName);
      expect(result.description).toBe(updateData.description);
    });

    it('should update credentials and encrypt them', async () => {
      const updateData = {
        credentials: 'new-user@example.com:newpassword123',
      };

      const result = await repository.update(createdAccountId, updateData);

      expect(result.encryptedCredentials).toBeDefined();
      expect(result.encryptedCredentials).not.toBe(updateData.credentials);

      // Verify decryption works
      const withCredentials = await repository.findByIdWithCredentials(createdAccountId);
      expect(withCredentials.decryptedCredentials).toBe(updateData.credentials);
    });

    it('should find available reward accounts by category', async () => {
      const result = await repository.findAvailableByCategory(RewardCategory.STREAMING_SERVICE);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe(RewardCategory.STREAMING_SERVICE);
      expect(result[0].status).toBe(RewardStatus.AVAILABLE);
    });

    it('should get statistics', async () => {
      const result = await repository.getStatistics();

      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(typeof result.available).toBe('number');
      expect(typeof result.assigned).toBe('number');
      expect(typeof result.expired).toBe('number');
      expect(typeof result.deactivated).toBe('number');
      expect(result.byCategory).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    it('should delete reward account', async () => {
      const result = await repository.delete(createdAccountId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAccountId);

      // Verify deletion
      const deleted = await repository.findById(createdAccountId);
      expect(deleted).toBeNull();
    });
  });

  describe('Filtering and Pagination', () => {
    let testAccountIds: number[] = [];
    let adminId: number;

    beforeAll(async () => {
      // Create a test admin
      const admin = await prismaService.admin.create({
        data: {
          username: 'test-admin-filter',
          email: 'test-admin-filter@example.com',
          passwordHash: 'hashed-password',
        },
      });
      adminId = admin.id;

      // Create multiple test accounts
      const accounts = [
        {
          serviceName: 'Test Spotify',
          accountType: 'Premium',
          credentials: 'spotify@test.com:pass1',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
        {
          serviceName: 'Test Amazon Gift Card',
          accountType: '$50',
          credentials: 'GIFT-CARD-CODE-123',
          category: RewardCategory.GIFT_CARD,
          createdBy: adminId,
        },
        {
          serviceName: 'Test YouTube Premium',
          accountType: 'Family',
          credentials: 'youtube@test.com:pass2',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: adminId,
        },
      ];

      for (const accountData of accounts) {
        const created = await repository.create(accountData);
        testAccountIds.push(created.id);
      }
    });

    afterAll(async () => {
      // Clean up test accounts
      for (const id of testAccountIds) {
        try {
          await repository.delete(id);
        } catch (error) {
          // Account might already be deleted
        }
      }

      // Clean up test admin
      await prismaService.admin.delete({
        where: { id: adminId },
      });
    });

    it('should filter by category', async () => {
      const result = await repository.findWithFilters(
        { category: RewardCategory.STREAMING_SERVICE },
        { page: 1, limit: 10 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      expect(result.data.length).toBeGreaterThanOrEqual(2);
      result.data.forEach(account => {
        expect(account.category).toBe(RewardCategory.STREAMING_SERVICE);
      });
    });

    it('should filter by status', async () => {
      const result = await repository.findWithFilters(
        { status: RewardStatus.AVAILABLE },
        { page: 1, limit: 10 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(account => {
        expect(account.status).toBe(RewardStatus.AVAILABLE);
      });
    });

    it('should search by service name', async () => {
      const result = await repository.findWithFilters(
        { search: 'Spotify' },
        { page: 1, limit: 10 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0].serviceName).toContain('Spotify');
    });

    it('should paginate results', async () => {
      const page1 = await repository.findWithFilters(
        {},
        { page: 1, limit: 2 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      expect(page1.data.length).toBeLessThanOrEqual(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.total).toBeGreaterThan(0);
      expect(page1.totalPages).toBeGreaterThan(0);

      if (page1.hasNextPage) {
        const page2 = await repository.findWithFilters(
          {},
          { page: 2, limit: 2 },
          { sortBy: 'createdAt', sortOrder: 'desc' }
        );

        expect(page2.page).toBe(2);
        expect(page2.data[0].id).not.toBe(page1.data[0].id);
      }
    });
  });
});