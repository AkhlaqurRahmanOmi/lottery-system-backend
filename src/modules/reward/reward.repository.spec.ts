import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RewardRepository } from './reward.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { RewardQueryDto } from './dto';

describe('RewardRepository', () => {
  let repository: RewardRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    reward: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    submission: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockReward = {
    id: 1,
    name: 'Test Reward',
    description: 'Test Description',
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<RewardRepository>(RewardRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a reward when found', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue(mockReward);

      const result = await repository.findById(1);

      expect(result).toEqual(mockReward);
      expect(mockPrismaService.reward.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when reward not found', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a reward when found by name', async () => {
      mockPrismaService.reward.findFirst.mockResolvedValue(mockReward);

      const result = await repository.findByName('Test Reward');

      expect(result).toEqual(mockReward);
      expect(mockPrismaService.reward.findFirst).toHaveBeenCalledWith({
        where: { 
          name: {
            equals: 'Test Reward',
            mode: 'insensitive'
          }
        },
      });
    });

    it('should return null when reward not found by name', async () => {
      mockPrismaService.reward.findFirst.mockResolvedValue(null);

      const result = await repository.findByName('Non-existent Reward');

      expect(result).toBeNull();
    });
  });

  describe('existsByName', () => {
    it('should return true when reward exists with name', async () => {
      mockPrismaService.reward.count.mockResolvedValue(1);

      const result = await repository.existsByName('Test Reward');

      expect(result).toBe(true);
      expect(mockPrismaService.reward.count).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'Test Reward',
            mode: 'insensitive'
          }
        }
      });
    });

    it('should return false when reward does not exist with name', async () => {
      mockPrismaService.reward.count.mockResolvedValue(0);

      const result = await repository.existsByName('Non-existent Reward');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking existence', async () => {
      mockPrismaService.reward.count.mockResolvedValue(0);

      await repository.existsByName('Test Reward', 1);

      expect(mockPrismaService.reward.count).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'Test Reward',
            mode: 'insensitive'
          },
          NOT: { id: 1 }
        }
      });
    });
  });

  describe('create', () => {
    const createData = {
      name: 'New Reward',
      description: 'New Description',
      imageUrl: 'https://example.com/new.jpg',
      isActive: true,
    };

    it('should create a reward successfully', async () => {
      // Clear any previous mock calls
      jest.clearAllMocks();
      
      mockPrismaService.reward.count.mockResolvedValue(0); // No existing reward
      mockPrismaService.reward.aggregate.mockResolvedValue({ _max: { displayOrder: 5 } });
      mockPrismaService.reward.create.mockResolvedValue({ ...mockReward, ...createData, displayOrder: 6 });

      const result = await repository.create(createData);

      expect(result).toEqual({ ...mockReward, ...createData, displayOrder: 6 });
      expect(mockPrismaService.reward.create).toHaveBeenCalledWith({
        data: { ...createData, displayOrder: 6 },
      });
    });

    it('should throw ConflictException when reward name already exists', async () => {
      mockPrismaService.reward.count.mockResolvedValue(1); // Existing reward

      await expect(repository.create(createData)).rejects.toThrow(ConflictException);
    });

    it('should set displayOrder to 1 when no rewards exist', async () => {
      // Clear any previous mock calls
      jest.clearAllMocks();
      
      mockPrismaService.reward.count.mockResolvedValue(0);
      mockPrismaService.reward.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
      mockPrismaService.reward.create.mockResolvedValue({ ...mockReward, ...createData, displayOrder: 1 });

      await repository.create(createData);

      expect(mockPrismaService.reward.create).toHaveBeenCalledWith({
        data: { ...createData, displayOrder: 1 },
      });
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Reward',
      description: 'Updated Description',
    };

    it('should update a reward successfully', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue(mockReward);
      mockPrismaService.reward.count.mockResolvedValue(0); // No name conflicts
      mockPrismaService.reward.update.mockResolvedValue({ ...mockReward, ...updateData });

      const result = await repository.update(1, updateData);

      expect(result).toEqual({ ...mockReward, ...updateData });
      expect(mockPrismaService.reward.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ...updateData, updatedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when reward does not exist', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue(null);

      await expect(repository.update(999, updateData)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when name conflicts', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue(mockReward);
      mockPrismaService.reward.count.mockResolvedValue(1); // Name conflict

      await expect(repository.update(1, updateData)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a reward successfully', async () => {
      mockPrismaService.reward.delete.mockResolvedValue(mockReward);

      const result = await repository.delete(1);

      expect(result).toEqual(mockReward);
      expect(mockPrismaService.reward.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when reward does not exist', async () => {
      mockPrismaService.reward.delete.mockRejectedValue({ code: 'P2025' });

      await expect(repository.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findWithFilters', () => {
    const queryDto: RewardQueryDto = {
      page: 1,
      limit: 10,
      search: 'test',
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc',
    };

    it('should return paginated rewards with filters', async () => {
      const rewards = [mockReward];
      mockPrismaService.reward.findMany.mockResolvedValue(rewards);
      mockPrismaService.reward.count.mockResolvedValue(1);

      const result = await repository.findWithFilters(queryDto);

      expect(result).toEqual({
        data: rewards.map(reward => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          imageUrl: reward.imageUrl,
          isActive: reward.isActive,
          displayOrder: reward.displayOrder,
          createdAt: reward.createdAt,
          updatedAt: reward.updatedAt,
        })),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(mockPrismaService.reward.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ],
          isActive: true,
        },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle pagination correctly', async () => {
      const queryDto: RewardQueryDto = { page: 2, limit: 5 };
      mockPrismaService.reward.findMany.mockResolvedValue([]);
      mockPrismaService.reward.count.mockResolvedValue(15);

      const result = await repository.findWithFilters(queryDto);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
      expect(mockPrismaService.reward.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('findActiveRewards', () => {
    it('should return active rewards ordered by display order', async () => {
      const activeRewards = [mockReward];
      mockPrismaService.reward.findMany.mockResolvedValue(activeRewards);

      const result = await repository.findActiveRewards();

      expect(result).toEqual(activeRewards);
      expect(mockPrismaService.reward.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      });
    });
  });

  describe('updateDisplayOrders', () => {
    it('should update display orders in transaction', async () => {
      const updates = [
        { id: 1, displayOrder: 2 },
        { id: 2, displayOrder: 1 },
      ];

      mockPrismaService.$transaction.mockResolvedValue([]);
      mockPrismaService.reward.update.mockResolvedValue(mockReward);

      await repository.updateDisplayOrders(updates);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Promise),
          expect.any(Promise)
        ])
      );
      expect(mockPrismaService.reward.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.reward.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { displayOrder: 2, updatedAt: expect.any(Date) }
      });
      expect(mockPrismaService.reward.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { displayOrder: 1, updatedAt: expect.any(Date) }
      });
    });
  });

  describe('canDelete', () => {
    it('should return true when reward has no submissions', async () => {
      mockPrismaService.submission.count.mockResolvedValue(0);

      const result = await repository.canDelete(1);

      expect(result).toBe(true);
      expect(mockPrismaService.submission.count).toHaveBeenCalledWith({
        where: { selectedRewardId: 1 }
      });
    });

    it('should return false when reward has submissions', async () => {
      mockPrismaService.submission.count.mockResolvedValue(5);

      const result = await repository.canDelete(1);

      expect(result).toBe(false);
    });
  });

  describe('getSelectionStats', () => {
    it('should return selection statistics', async () => {
      mockPrismaService.submission.count
        .mockResolvedValueOnce(10) // total selections
        .mockResolvedValueOnce(3); // recent selections

      const result = await repository.getSelectionStats(1);

      expect(result).toEqual({
        totalSelections: 10,
        recentSelections: 3,
      });

      expect(mockPrismaService.submission.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('getNextDisplayOrder', () => {
    it('should return next display order', async () => {
      mockPrismaService.reward.aggregate.mockResolvedValue({ _max: { displayOrder: 5 } });

      const result = await repository.getNextDisplayOrder();

      expect(result).toBe(6);
    });

    it('should return 1 when no rewards exist', async () => {
      mockPrismaService.reward.aggregate.mockResolvedValue({ _max: { displayOrder: null } });

      const result = await repository.getNextDisplayOrder();

      expect(result).toBe(1);
    });
  });
});