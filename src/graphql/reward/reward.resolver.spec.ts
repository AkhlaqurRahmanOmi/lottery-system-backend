import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RewardResolver } from './reward.resolver';
import { RewardService } from '../../modules/reward/reward.service';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import {
  CreateRewardGraphQLInputDto,
  UpdateRewardGraphQLInputDto,
  RewardQueryGraphQLInputDto,
  BulkRewardOperationGraphQLInputDto,
  RewardOrderingGraphQLInputDto,
  RewardSelectionValidationGraphQLInputDto
} from './dto/reward-management-graphql.dto';

describe('RewardResolver', () => {
  let resolver: RewardResolver;
  let rewardService: jest.Mocked<RewardService>;

  const mockAdmin: Admin = {
    id: 1,
    username: 'testadmin',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
  };

  const mockReward = {
    id: 1,
    name: 'Test Reward',
    description: 'Test Description',
    imageUrl: 'http://example.com/image.jpg',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRewardService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
    findActiveRewards: jest.fn(),
    search: jest.fn(),
    updateDisplayOrders: jest.fn(),
    getSummaryStats: jest.fn(),
    getNextDisplayOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardResolver,
        {
          provide: RewardService,
          useValue: mockRewardService,
        },
      ],
    }).compile();

    resolver = module.get<RewardResolver>(RewardResolver);
    rewardService = module.get(RewardService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Public Queries', () => {
    describe('activeRewards', () => {
      it('should return active rewards successfully', async () => {
        const mockActiveRewards = [mockReward];
        mockRewardService.findActiveRewards.mockResolvedValue(mockActiveRewards);

        const result = await resolver.activeRewards();

        expect(result).toEqual({
          rewards: [{
            id: mockReward.id,
            name: mockReward.name,
            description: mockReward.description,
            imageUrl: mockReward.imageUrl,
            displayOrder: mockReward.displayOrder,
          }],
          totalCount: 1,
        });
        expect(mockRewardService.findActiveRewards).toHaveBeenCalled();
      });

      it('should handle service errors', async () => {
        mockRewardService.findActiveRewards.mockRejectedValue(new Error('Service error'));

        await expect(resolver.activeRewards()).rejects.toThrow(BadRequestException);
      });
    });

    describe('validateRewardSelection', () => {
      it('should validate active reward successfully', async () => {
        const input: RewardSelectionValidationGraphQLInputDto = { rewardId: 1 };
        mockRewardService.findOne.mockResolvedValue(mockReward);

        const result = await resolver.validateRewardSelection(input);

        expect(result).toEqual({
          isValid: true,
          reward: {
            id: mockReward.id,
            name: mockReward.name,
            description: mockReward.description,
            imageUrl: mockReward.imageUrl,
            displayOrder: mockReward.displayOrder,
          },
        });
        expect(mockRewardService.findOne).toHaveBeenCalledWith(1);
      });

      it('should return invalid for inactive reward', async () => {
        const input: RewardSelectionValidationGraphQLInputDto = { rewardId: 1 };
        const inactiveReward = { ...mockReward, isActive: false };
        mockRewardService.findOne.mockResolvedValue(inactiveReward);

        const result = await resolver.validateRewardSelection(input);

        expect(result).toEqual({
          isValid: false,
          error: 'Selected reward is no longer available',
        });
      });

      it('should return invalid for non-existent reward', async () => {
        const input: RewardSelectionValidationGraphQLInputDto = { rewardId: 999 };
        mockRewardService.findOne.mockRejectedValue(new NotFoundException('Reward not found'));

        const result = await resolver.validateRewardSelection(input);

        expect(result).toEqual({
          isValid: false,
          error: 'Selected reward does not exist',
        });
      });

      it('should handle service errors', async () => {
        const input: RewardSelectionValidationGraphQLInputDto = { rewardId: 1 };
        mockRewardService.findOne.mockRejectedValue(new Error('Service error'));

        await expect(resolver.validateRewardSelection(input)).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Admin Queries', () => {
    describe('reward', () => {
      it('should return reward by ID', async () => {
        mockRewardService.findOne.mockResolvedValue(mockReward);

        const result = await resolver.reward(1, mockAdmin);

        expect(result).toEqual(mockReward);
        expect(mockRewardService.findOne).toHaveBeenCalledWith(1);
      });

      it('should handle not found error', async () => {
        mockRewardService.findOne.mockRejectedValue(new NotFoundException('Reward not found'));

        await expect(resolver.reward(999, mockAdmin)).rejects.toThrow(NotFoundException);
      });

      it('should handle service errors', async () => {
        mockRewardService.findOne.mockRejectedValue(new Error('Service error'));

        await expect(resolver.reward(1, mockAdmin)).rejects.toThrow(BadRequestException);
      });
    });

    describe('rewards', () => {
      it('should return paginated rewards', async () => {
        const mockPaginatedResult = {
          data: [mockReward],
          total: 1,
          page: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        };
        mockRewardService.findAll.mockResolvedValue(mockPaginatedResult);

        const query: RewardQueryGraphQLInputDto = { page: 1, limit: 10 };
        const result = await resolver.rewards(query, mockAdmin);

        expect(result).toEqual(mockPaginatedResult);
        expect(mockRewardService.findAll).toHaveBeenCalledWith(query);
      });

      it('should handle empty query', async () => {
        const mockPaginatedResult = {
          data: [mockReward],
          total: 1,
          page: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        };
        mockRewardService.findAll.mockResolvedValue(mockPaginatedResult);

        const result = await resolver.rewards(undefined, mockAdmin);

        expect(result).toEqual(mockPaginatedResult);
        expect(mockRewardService.findAll).toHaveBeenCalledWith({});
      });
    });

    describe('searchRewards', () => {
      it('should search rewards by term', async () => {
        const mockSearchResults = [mockReward];
        mockRewardService.search.mockResolvedValue(mockSearchResults);

        const result = await resolver.searchRewards('test', 10, mockAdmin);

        expect(result).toEqual(mockSearchResults);
        expect(mockRewardService.search).toHaveBeenCalledWith('test', 10);
      });
    });

    describe('rewardStatistics', () => {
      it('should return reward statistics', async () => {
        const mockStats = {
          totalRewards: 10,
          activeRewards: 8,
          inactiveRewards: 2,
        };
        mockRewardService.getSummaryStats.mockResolvedValue(mockStats);

        const result = await resolver.rewardStatistics(mockAdmin);

        expect(result).toEqual(mockStats);
        expect(mockRewardService.getSummaryStats).toHaveBeenCalled();
      });
    });

    describe('nextDisplayOrder', () => {
      it('should return next display order', async () => {
        mockRewardService.getNextDisplayOrder.mockResolvedValue(5);

        const result = await resolver.nextDisplayOrder(mockAdmin);

        expect(result).toBe(5);
        expect(mockRewardService.getNextDisplayOrder).toHaveBeenCalled();
      });
    });
  });

  describe('Admin Mutations', () => {
    describe('createReward', () => {
      it('should create reward successfully', async () => {
        const input: CreateRewardGraphQLInputDto = {
          name: 'New Reward',
          description: 'New Description',
          displayOrder: 1,
        };
        mockRewardService.create.mockResolvedValue(mockReward);

        const result = await resolver.createReward(input, mockAdmin);

        expect(result).toEqual({
          success: true,
          message: 'Reward created successfully',
          reward: mockReward,
        });
        expect(mockRewardService.create).toHaveBeenCalledWith(input);
      });

      it('should handle creation errors', async () => {
        const input: CreateRewardGraphQLInputDto = {
          name: 'New Reward',
          description: 'New Description',
          displayOrder: 1,
        };
        mockRewardService.create.mockRejectedValue(new Error('Creation failed'));

        const result = await resolver.createReward(input, mockAdmin);

        expect(result).toEqual({
          success: false,
          message: 'Failed to create reward',
          errors: ['Creation failed'],
        });
      });
    });

    describe('updateReward', () => {
      it('should update reward successfully', async () => {
        const input: UpdateRewardGraphQLInputDto = {
          name: 'Updated Reward',
        };
        const updatedReward = { ...mockReward, name: 'Updated Reward' };
        mockRewardService.update.mockResolvedValue(updatedReward);

        const result = await resolver.updateReward(1, input, mockAdmin);

        expect(result).toEqual({
          success: true,
          message: 'Reward updated successfully',
          reward: updatedReward,
        });
        expect(mockRewardService.update).toHaveBeenCalledWith(1, input);
      });

      it('should handle update errors', async () => {
        const input: UpdateRewardGraphQLInputDto = {
          name: 'Updated Reward',
        };
        mockRewardService.update.mockRejectedValue(new Error('Update failed'));

        const result = await resolver.updateReward(1, input, mockAdmin);

        expect(result).toEqual({
          success: false,
          message: 'Failed to update reward',
          errors: ['Update failed'],
        });
      });
    });

    describe('activateReward', () => {
      it('should activate reward successfully', async () => {
        const activatedReward = { ...mockReward, isActive: true };
        mockRewardService.activate.mockResolvedValue(activatedReward);

        const result = await resolver.activateReward(1, mockAdmin);

        expect(result).toEqual({
          success: true,
          message: 'Reward activated successfully',
          reward: activatedReward,
        });
        expect(mockRewardService.activate).toHaveBeenCalledWith(1);
      });
    });

    describe('deactivateReward', () => {
      it('should deactivate reward successfully', async () => {
        const deactivatedReward = { ...mockReward, isActive: false };
        mockRewardService.deactivate.mockResolvedValue(deactivatedReward);

        const result = await resolver.deactivateReward(1, mockAdmin);

        expect(result).toEqual({
          success: true,
          message: 'Reward deactivated successfully',
          reward: deactivatedReward,
        });
        expect(mockRewardService.deactivate).toHaveBeenCalledWith(1);
      });
    });

    describe('deleteReward', () => {
      it('should delete reward successfully', async () => {
        mockRewardService.remove.mockResolvedValue(undefined);

        const result = await resolver.deleteReward(1, mockAdmin);

        expect(result).toEqual({
          success: true,
          message: 'Reward deleted successfully',
          deletedId: 1,
        });
        expect(mockRewardService.remove).toHaveBeenCalledWith(1);
      });

      it('should handle deletion errors', async () => {
        mockRewardService.remove.mockRejectedValue(new Error('Deletion failed'));

        const result = await resolver.deleteReward(1, mockAdmin);

        expect(result).toEqual({
          success: false,
          message: 'Failed to delete reward',
          errors: ['Deletion failed'],
        });
      });
    });

    describe('updateRewardOrdering', () => {
      it('should update reward ordering successfully', async () => {
        const input: RewardOrderingGraphQLInputDto = {
          rewards: [
            { id: 1, displayOrder: 1 },
            { id: 2, displayOrder: 2 },
          ],
        };
        mockRewardService.updateDisplayOrders.mockResolvedValue(undefined);

        const result = await resolver.updateRewardOrdering(input, mockAdmin);

        expect(result).toEqual({
          success: true,
          message: 'Reward ordering updated successfully',
          updatedCount: 2,
        });
        expect(mockRewardService.updateDisplayOrders).toHaveBeenCalledWith(input.rewards);
      });

      it('should handle ordering errors', async () => {
        const input: RewardOrderingGraphQLInputDto = {
          rewards: [{ id: 1, displayOrder: 1 }],
        };
        mockRewardService.updateDisplayOrders.mockRejectedValue(new Error('Ordering failed'));

        const result = await resolver.updateRewardOrdering(input, mockAdmin);

        expect(result).toEqual({
          success: false,
          message: 'Failed to update reward ordering',
          errors: ['Ordering failed'],
        });
      });
    });

    describe('bulkRewardOperation', () => {
      it('should perform bulk activate operation successfully', async () => {
        const input: BulkRewardOperationGraphQLInputDto = {
          rewardIds: [1, 2],
          operation: 'activate',
        };
        mockRewardService.activate.mockResolvedValue(mockReward);

        const result = await resolver.bulkRewardOperation(input, mockAdmin);

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);
        expect(mockRewardService.activate).toHaveBeenCalledTimes(2);
      });

      it('should perform bulk deactivate operation successfully', async () => {
        const input: BulkRewardOperationGraphQLInputDto = {
          rewardIds: [1, 2],
          operation: 'deactivate',
        };
        mockRewardService.deactivate.mockResolvedValue(mockReward);

        const result = await resolver.bulkRewardOperation(input, mockAdmin);

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);
        expect(mockRewardService.deactivate).toHaveBeenCalledTimes(2);
      });

      it('should perform bulk delete operation successfully', async () => {
        const input: BulkRewardOperationGraphQLInputDto = {
          rewardIds: [1, 2],
          operation: 'delete',
        };
        mockRewardService.remove.mockResolvedValue(undefined);

        const result = await resolver.bulkRewardOperation(input, mockAdmin);

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);
        expect(mockRewardService.remove).toHaveBeenCalledTimes(2);
      });

      it('should handle partial failures in bulk operations', async () => {
        const input: BulkRewardOperationGraphQLInputDto = {
          rewardIds: [1, 2],
          operation: 'activate',
        };
        mockRewardService.activate
          .mockResolvedValueOnce(mockReward)
          .mockRejectedValueOnce(new Error('Failed to activate'));

        const result = await resolver.bulkRewardOperation(input, mockAdmin);

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(1);
        expect(result.details).toContain('Reward 1: activated successfully');
        expect(result.details).toContain('Reward 2: Failed to activate');
      });

      it('should handle complete failure in bulk operations', async () => {
        const input: BulkRewardOperationGraphQLInputDto = {
          rewardIds: [1],
          operation: 'activate',
        };
        mockRewardService.activate.mockRejectedValue(new Error('Service error'));

        const result = await resolver.bulkRewardOperation(input, mockAdmin);

        expect(result.success).toBe(false);
        expect(result.affectedCount).toBe(0);
      });
    });
  });
});