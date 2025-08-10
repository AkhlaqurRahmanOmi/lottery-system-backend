import { Test, TestingModule } from '@nestjs/testing';
import { RewardRepository } from './reward.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { RewardQueryDto } from './dto';

describe('RewardRepository Integration', () => {
  let repository: RewardRepository;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRepository,
        PrismaService,
      ],
    }).compile();

    repository = module.get<RewardRepository>(RewardRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // Connect to database
    await prismaService.$connect();
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.reward.deleteMany({
      where: {
        name: {
          startsWith: 'Test Reward'
        }
      }
    });

    // Disconnect from database
    await prismaService.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prismaService.reward.deleteMany({
      where: {
        name: {
          startsWith: 'Test Reward'
        }
      }
    });
  });

  describe('Database Operations', () => {
    it('should create and retrieve a reward', async () => {
      const rewardData = {
        name: 'Test Reward 1',
        description: 'Test Description',
        imageUrl: 'https://example.com/image.jpg',
        isActive: true,
        displayOrder: 1,
      };

      // Create reward
      const createdReward = await repository.create(rewardData);

      expect(createdReward).toBeDefined();
      expect(createdReward.id).toBeDefined();
      expect(createdReward.name).toBe(rewardData.name);
      expect(createdReward.description).toBe(rewardData.description);
      expect(createdReward.imageUrl).toBe(rewardData.imageUrl);
      expect(createdReward.isActive).toBe(rewardData.isActive);
      expect(createdReward.displayOrder).toBe(rewardData.displayOrder);

      // Retrieve reward
      const foundReward = await repository.findById(createdReward.id);

      expect(foundReward).toBeDefined();
      expect(foundReward!.id).toBe(createdReward.id);
      expect(foundReward!.name).toBe(rewardData.name);
    });

    it('should handle unique name constraint', async () => {
      const rewardData = {
        name: 'Test Reward Unique',
        description: 'Test Description',
        isActive: true,
      };

      // Create first reward
      await repository.create(rewardData);

      // Try to create second reward with same name
      await expect(repository.create(rewardData)).rejects.toThrow();
    });

    it('should filter and paginate rewards', async () => {
      // Create test rewards
      const rewards = [
        {
          name: 'Test Reward Active 1',
          description: 'Active reward',
          isActive: true,
          displayOrder: 1,
        },
        {
          name: 'Test Reward Active 2',
          description: 'Another active reward',
          isActive: true,
          displayOrder: 2,
        },
        {
          name: 'Test Reward Inactive',
          description: 'Inactive reward',
          isActive: false,
          displayOrder: 3,
        },
      ];

      for (const reward of rewards) {
        await repository.create(reward);
      }

      // Test filtering by active status
      const queryDto: RewardQueryDto = {
        page: 1,
        limit: 10,
        isActive: true,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
      };

      const result = await repository.findWithFilters(queryDto);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].name).toBe('Test Reward Active 1');
      expect(result.data[1].name).toBe('Test Reward Active 2');
    });

    it('should search rewards by name and description', async () => {
      // Create test rewards
      await repository.create({
        name: 'Test Reward Search',
        description: 'Searchable description',
        isActive: true,
      });

      await repository.create({
        name: 'Another Reward',
        description: 'Contains search term',
        isActive: true,
      });

      // Search by name
      const nameResults = await repository.search('Search', 10);
      expect(nameResults).toHaveLength(2);

      // Search by description
      const descResults = await repository.search('Searchable', 10);
      expect(descResults).toHaveLength(1);
      expect(descResults[0].name).toBe('Test Reward Search');
    });

    it('should update display orders', async () => {
      // Create test rewards
      const reward1 = await repository.create({
        name: 'Test Reward Order 1',
        displayOrder: 1,
        isActive: true,
      });

      const reward2 = await repository.create({
        name: 'Test Reward Order 2',
        displayOrder: 2,
        isActive: true,
      });

      // Update display orders
      await repository.updateDisplayOrders([
        { id: reward1.id, displayOrder: 2 },
        { id: reward2.id, displayOrder: 1 },
      ]);

      // Verify updates
      const updatedReward1 = await repository.findById(reward1.id);
      const updatedReward2 = await repository.findById(reward2.id);

      expect(updatedReward1!.displayOrder).toBe(2);
      expect(updatedReward2!.displayOrder).toBe(1);
    });

    it('should get next display order correctly', async () => {
      // When no rewards exist
      let nextOrder = await repository.getNextDisplayOrder();
      expect(nextOrder).toBe(1);

      // Create a reward
      await repository.create({
        name: 'Test Reward Order',
        displayOrder: 5,
        isActive: true,
      });

      // Should return next order after highest
      nextOrder = await repository.getNextDisplayOrder();
      expect(nextOrder).toBe(6);
    });
  });
});