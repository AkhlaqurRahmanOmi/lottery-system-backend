import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardRepository } from './reward.repository';
import { CreateRewardDto, UpdateRewardDto, RewardQueryDto } from './dto';

describe('RewardService', () => {
  let service: RewardService;
  let repository: RewardRepository;

  const mockRewardRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findWithFilters: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    delete: jest.fn(),
    canDelete: jest.fn(),
    findActiveRewards: jest.fn(),
    search: jest.fn(),
    updateDisplayOrders: jest.fn(),
    getSelectionStats: jest.fn(),
    count: jest.fn(),
    getActiveCount: jest.fn(),
    getNextDisplayOrder: jest.fn(),
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

  const mockRewardResponse = {
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
        RewardService,
        {
          provide: RewardRepository,
          useValue: mockRewardRepository,
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
    repository = module.get<RewardRepository>(RewardRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRewardDto: CreateRewardDto = {
      name: 'New Reward',
      description: 'New Description',
      imageUrl: 'https://example.com/new.jpg',
      isActive: true,
      displayOrder: 1,
    };

    it('should create a reward successfully', async () => {
      mockRewardRepository.create.mockResolvedValue(mockReward);

      const result = await service.create(createRewardDto);

      expect(result).toEqual(mockRewardResponse);
      expect(mockRewardRepository.create).toHaveBeenCalledWith({
        name: createRewardDto.name,
        description: createRewardDto.description,
        imageUrl: createRewardDto.imageUrl,
        isActive: true,
        displayOrder: createRewardDto.displayOrder,
      });
    });

    it('should set isActive to true by default', async () => {
      const dtoWithoutActive = { ...createRewardDto };
      delete dtoWithoutActive.isActive;
      
      mockRewardRepository.create.mockResolvedValue(mockReward);

      await service.create(dtoWithoutActive);

      expect(mockRewardRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });
  });

  describe('findAll', () => {
    const queryDto: RewardQueryDto = {
      page: 1,
      limit: 10,
      search: 'test',
      isActive: true,
      sortBy: 'name',
      sortOrder: 'asc',
    };

    it('should return paginated rewards', async () => {
      const paginatedResponse = {
        data: [mockRewardResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockRewardRepository.findWithFilters.mockResolvedValue(paginatedResponse);

      const result = await service.findAll(queryDto);

      expect(result).toEqual(paginatedResponse);
      expect(mockRewardRepository.findWithFilters).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findOne', () => {
    it('should return a reward when found', async () => {
      mockRewardRepository.findById.mockResolvedValue(mockReward);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRewardResponse);
      expect(mockRewardRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when reward not found', async () => {
      mockRewardRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateRewardDto: UpdateRewardDto = {
      name: 'Updated Reward',
      description: 'Updated Description',
    };

    it('should update a reward successfully', async () => {
      const updatedReward = { ...mockReward, ...updateRewardDto };
      mockRewardRepository.update.mockResolvedValue(updatedReward);

      const result = await service.update(1, updateRewardDto);

      expect(result).toEqual({ ...mockRewardResponse, ...updateRewardDto });
      expect(mockRewardRepository.update).toHaveBeenCalledWith(1, updateRewardDto);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a reward successfully', async () => {
      const deactivatedReward = { ...mockReward, isActive: false };
      mockRewardRepository.softDelete.mockResolvedValue(deactivatedReward);

      const result = await service.deactivate(1);

      expect(result).toEqual({ ...mockRewardResponse, isActive: false });
      expect(mockRewardRepository.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should remove a reward when it can be deleted', async () => {
      mockRewardRepository.canDelete.mockResolvedValue(true);
      mockRewardRepository.delete.mockResolvedValue(mockReward);

      await service.remove(1);

      expect(mockRewardRepository.canDelete).toHaveBeenCalledWith(1);
      expect(mockRewardRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when reward cannot be deleted', async () => {
      mockRewardRepository.canDelete.mockResolvedValue(false);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(mockRewardRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('findActiveRewards', () => {
    it('should return active rewards', async () => {
      const activeRewards = [mockReward];
      mockRewardRepository.findActiveRewards.mockResolvedValue(activeRewards);

      const result = await service.findActiveRewards();

      expect(result).toEqual([mockRewardResponse]);
      expect(mockRewardRepository.findActiveRewards).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search rewards', async () => {
      const searchResults = [mockReward];
      mockRewardRepository.search.mockResolvedValue(searchResults);

      const result = await service.search('test', 5);

      expect(result).toEqual([mockRewardResponse]);
      expect(mockRewardRepository.search).toHaveBeenCalledWith('test', 5);
    });

    it('should use default limit when not provided', async () => {
      mockRewardRepository.search.mockResolvedValue([]);

      await service.search('test');

      expect(mockRewardRepository.search).toHaveBeenCalledWith('test', 10);
    });
  });

  describe('updateDisplayOrders', () => {
    const updates = [
      { id: 1, displayOrder: 2 },
      { id: 2, displayOrder: 1 },
    ];

    it('should update display orders successfully', async () => {
      mockRewardRepository.findById
        .mockResolvedValueOnce(mockReward)
        .mockResolvedValueOnce({ ...mockReward, id: 2 });
      mockRewardRepository.updateDisplayOrders.mockResolvedValue(undefined);

      await service.updateDisplayOrders(updates);

      expect(mockRewardRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockRewardRepository.updateDisplayOrders).toHaveBeenCalledWith(updates);
    });

    it('should throw NotFoundException when reward does not exist', async () => {
      mockRewardRepository.findById.mockResolvedValue(null);

      await expect(service.updateDisplayOrders(updates)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for duplicate display orders', async () => {
      const duplicateUpdates = [
        { id: 1, displayOrder: 1 },
        { id: 2, displayOrder: 1 },
      ];

      mockRewardRepository.findById.mockResolvedValue(mockReward);

      await expect(service.updateDisplayOrders(duplicateUpdates)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative display orders', async () => {
      const negativeUpdates = [
        { id: 1, displayOrder: -1 },
      ];

      mockRewardRepository.findById.mockResolvedValue(mockReward);

      await expect(service.updateDisplayOrders(negativeUpdates)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRewardStats', () => {
    it('should return reward statistics', async () => {
      mockRewardRepository.findById.mockResolvedValue(mockReward);
      mockRewardRepository.getSelectionStats.mockResolvedValue({
        totalSelections: 10,
        recentSelections: 3,
      });

      const result = await service.getRewardStats(1);

      expect(result).toEqual({
        reward: mockRewardResponse,
        totalSelections: 10,
        recentSelections: 3,
      });
    });
  });

  describe('getSummaryStats', () => {
    it('should return summary statistics', async () => {
      mockRewardRepository.count.mockResolvedValue(10);
      mockRewardRepository.getActiveCount.mockResolvedValue(7);

      const result = await service.getSummaryStats();

      expect(result).toEqual({
        totalRewards: 10,
        activeRewards: 7,
        inactiveRewards: 3,
      });
    });
  });

  describe('activate', () => {
    it('should activate a reward successfully', async () => {
      const activatedReward = { ...mockReward, isActive: true };
      mockRewardRepository.update.mockResolvedValue(activatedReward);

      const result = await service.activate(1);

      expect(result).toEqual(mockRewardResponse);
      expect(mockRewardRepository.update).toHaveBeenCalledWith(1, { isActive: true });
    });
  });

  describe('getNextDisplayOrder', () => {
    it('should return next display order', async () => {
      mockRewardRepository.getNextDisplayOrder.mockResolvedValue(6);

      const result = await service.getNextDisplayOrder();

      expect(result).toBe(6);
      expect(mockRewardRepository.getNextDisplayOrder).toHaveBeenCalled();
    });
  });
});