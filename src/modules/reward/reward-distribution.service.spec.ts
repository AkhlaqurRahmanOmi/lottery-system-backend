import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardDistributionService } from './reward-distribution.service';
import { RewardAccountRepository } from './reward-account.repository';
import { RewardCategory, RewardStatus } from '@prisma/client';

describe('RewardDistributionService', () => {
  let service: RewardDistributionService;
  let repository: jest.Mocked<RewardAccountRepository>;

  const mockRewardAccount = {
    id: 1,
    serviceName: 'Netflix',
    accountType: 'Premium',
    encryptedCredentials: 'encrypted_credentials',
    subscriptionDuration: '1 month',
    description: 'Netflix Premium Account',
    category: RewardCategory.STREAMING_SERVICE,
    status: RewardStatus.AVAILABLE,
    assignedToUserId: null,
    assignedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    creator: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
    },
    assignedSubmissions: [],
  };

  const mockCreateRewardAccountDto = {
    serviceName: 'Spotify',
    accountType: 'Premium',
    credentials: 'user:password',
    subscriptionDuration: '3 months',
    description: 'Spotify Premium Account',
    category: RewardCategory.STREAMING_SERVICE,
    createdBy: 1,
  };

  const mockAssignRewardDto = {
    rewardAccountId: 1,
    submissionId: 1,
    assignedBy: 1,
    notes: 'Assigned to winner',
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByIdWithCredentials: jest.fn(),
      findWithFilters: jest.fn(),
      findAvailableByCategory: jest.fn(),
      assignToUser: jest.fn(),
      unassignFromUser: jest.fn(),
      findAssignedToUser: jest.fn(),
      getStatistics: jest.fn(),
      findByCreator: jest.fn(),
      markExpiredAccounts: jest.fn(),
      canDelete: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardDistributionService,
        {
          provide: RewardAccountRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RewardDistributionService>(RewardDistributionService);
    repository = module.get(RewardAccountRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRewardAccount', () => {
    it('should create a reward account successfully', async () => {
      repository.create.mockResolvedValue(mockRewardAccount);

      const result = await service.createRewardAccount(mockCreateRewardAccountDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateRewardAccountDto);
      expect(result).toEqual(mockRewardAccount);
    });

    it('should throw ConflictException when reward account already exists', async () => {
      repository.create.mockRejectedValue(new ConflictException('Reward account already exists'));

      await expect(service.createRewardAccount(mockCreateRewardAccountDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateRewardAccount', () => {
    it('should update a reward account successfully', async () => {
      const updateDto = { serviceName: 'Updated Netflix' };
      const updatedReward = { ...mockRewardAccount, serviceName: 'Updated Netflix' };
      repository.update.mockResolvedValue(updatedReward);

      const result = await service.updateRewardAccount(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedReward);
    });

    it('should throw NotFoundException when reward account not found', async () => {
      repository.update.mockRejectedValue(new NotFoundException('Reward account not found'));

      await expect(service.updateRewardAccount(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRewardAccount', () => {
    it('should return reward account when found', async () => {
      repository.findById.mockResolvedValue(mockRewardAccount);

      const result = await service.getRewardAccount(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRewardAccount);
    });

    it('should throw NotFoundException when reward account not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getRewardAccount(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRewardAccountWithCredentials', () => {
    it('should return reward account with decrypted credentials', async () => {
      const rewardWithCredentials = {
        ...mockRewardAccount,
        decryptedCredentials: 'user:password',
      };
      repository.findByIdWithCredentials.mockResolvedValue(rewardWithCredentials);

      const result = await service.getRewardAccountWithCredentials(1);

      expect(repository.findByIdWithCredentials).toHaveBeenCalledWith(1);
      expect(result).toEqual(rewardWithCredentials);
    });

    it('should throw NotFoundException when reward account not found', async () => {
      repository.findByIdWithCredentials.mockResolvedValue(null);

      await expect(service.getRewardAccountWithCredentials(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRewardAccounts', () => {
    it('should return paginated reward accounts', async () => {
      const mockResponse = {
        data: [mockRewardAccount],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      repository.findWithFilters.mockResolvedValue(mockResponse);

      const result = await service.getRewardAccounts();

      expect(repository.findWithFilters).toHaveBeenCalledWith({}, {}, {});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAvailableRewardAccounts', () => {
    it('should return available reward accounts', async () => {
      repository.findAvailableByCategory.mockResolvedValue([mockRewardAccount]);

      const result = await service.getAvailableRewardAccounts();

      expect(repository.findAvailableByCategory).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockRewardAccount]);
    });

    it('should return available reward accounts by category', async () => {
      repository.findAvailableByCategory.mockResolvedValue([mockRewardAccount]);

      const result = await service.getAvailableRewardAccounts(RewardCategory.STREAMING_SERVICE);

      expect(repository.findAvailableByCategory).toHaveBeenCalledWith(RewardCategory.STREAMING_SERVICE);
      expect(result).toEqual([mockRewardAccount]);
    });
  });

  describe('assignRewardToUser', () => {
    it('should assign reward to user successfully', async () => {
      const assignedReward = { ...mockRewardAccount, status: RewardStatus.ASSIGNED, assignedToUserId: 1 };
      repository.findById.mockResolvedValue(mockRewardAccount);
      repository.assignToUser.mockResolvedValue(assignedReward);

      const result = await service.assignRewardToUser(mockAssignRewardDto);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.assignToUser).toHaveBeenCalledWith(1, 1, 1);
      expect(result).toEqual(assignedReward);
    });

    it('should throw NotFoundException when reward account not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.assignRewardToUser(mockAssignRewardDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when reward account is not available', async () => {
      const assignedReward = { ...mockRewardAccount, status: RewardStatus.ASSIGNED };
      repository.findById.mockResolvedValue(assignedReward);

      await expect(service.assignRewardToUser(mockAssignRewardDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('unassignRewardFromUser', () => {
    it('should unassign reward from user successfully', async () => {
      const unassignedReward = { ...mockRewardAccount, status: RewardStatus.AVAILABLE, assignedToUserId: null };
      repository.unassignFromUser.mockResolvedValue(unassignedReward);

      const result = await service.unassignRewardFromUser(1);

      expect(repository.unassignFromUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(unassignedReward);
    });

    it('should throw BadRequestException when unassignment fails', async () => {
      repository.unassignFromUser.mockRejectedValue(new Error('Database error'));

      await expect(service.unassignRewardFromUser(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserAssignedRewards', () => {
    it('should return user assigned rewards', async () => {
      const assignedRewards = [{ ...mockRewardAccount, status: RewardStatus.ASSIGNED, assignedToUserId: 1 }];
      repository.findAssignedToUser.mockResolvedValue(assignedRewards);

      const result = await service.getUserAssignedRewards(1);

      expect(repository.findAssignedToUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(assignedRewards);
    });
  });

  describe('getRewardInventoryStats', () => {
    it('should return reward inventory statistics', async () => {
      const mockStats = {
        total: 10,
        available: 5,
        assigned: 3,
        expired: 1,
        deactivated: 1,
        byCategory: {
          [RewardCategory.STREAMING_SERVICE]: 5,
          [RewardCategory.GIFT_CARD]: 3,
          [RewardCategory.SUBSCRIPTION]: 2,
          [RewardCategory.DIGITAL_PRODUCT]: 0,
          [RewardCategory.OTHER]: 0,
        },
      };
      repository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getRewardInventoryStats();

      expect(repository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('getRewardAccountsByCreator', () => {
    it('should return reward accounts created by admin', async () => {
      repository.findByCreator.mockResolvedValue([mockRewardAccount]);

      const result = await service.getRewardAccountsByCreator(1);

      expect(repository.findByCreator).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockRewardAccount]);
    });
  });

  describe('deactivateRewardAccount', () => {
    it('should deactivate reward account successfully', async () => {
      const deactivatedReward = { ...mockRewardAccount, status: RewardStatus.DEACTIVATED };
      repository.update.mockResolvedValue(deactivatedReward);

      const result = await service.deactivateRewardAccount(1);

      expect(repository.update).toHaveBeenCalledWith(1, { status: RewardStatus.DEACTIVATED });
      expect(result).toEqual(deactivatedReward);
    });

    it('should throw NotFoundException when reward account not found', async () => {
      repository.update.mockRejectedValue(new NotFoundException('Reward account not found'));

      await expect(service.deactivateRewardAccount(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reactivateRewardAccount', () => {
    it('should reactivate reward account successfully', async () => {
      const deactivatedReward = { ...mockRewardAccount, status: RewardStatus.DEACTIVATED };
      const reactivatedReward = { ...mockRewardAccount, status: RewardStatus.AVAILABLE };
      repository.findById.mockResolvedValue(deactivatedReward);
      repository.update.mockResolvedValue(reactivatedReward);

      const result = await service.reactivateRewardAccount(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, {
        status: RewardStatus.AVAILABLE,
        assignedToUserId: null,
      });
      expect(result).toEqual(reactivatedReward);
    });

    it('should throw ConflictException when trying to reactivate assigned reward', async () => {
      const assignedReward = { ...mockRewardAccount, status: RewardStatus.ASSIGNED };
      repository.findById.mockResolvedValue(assignedReward);

      await expect(service.reactivateRewardAccount(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('markExpiredRewardAccounts', () => {
    it('should mark expired reward accounts', async () => {
      repository.markExpiredAccounts.mockResolvedValue(3);

      const result = await service.markExpiredRewardAccounts();

      expect(repository.markExpiredAccounts).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Marked 3 reward accounts as expired',
        expiredCount: 3,
      });
    });
  });

  describe('deleteRewardAccount', () => {
    it('should delete reward account successfully', async () => {
      repository.canDelete.mockResolvedValue(true);
      repository.delete.mockResolvedValue(mockRewardAccount);

      const result = await service.deleteRewardAccount(1);

      expect(repository.canDelete).toHaveBeenCalledWith(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Reward account 1 deleted successfully' });
    });

    it('should throw BadRequestException when reward cannot be deleted', async () => {
      repository.canDelete.mockResolvedValue(false);

      await expect(service.deleteRewardAccount(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRewardDistributionAnalytics', () => {
    it('should return reward distribution analytics', async () => {
      const mockStats = {
        total: 10,
        available: 5,
        assigned: 3,
        expired: 1,
        deactivated: 1,
        byCategory: {
          [RewardCategory.STREAMING_SERVICE]: 5,
          [RewardCategory.GIFT_CARD]: 3,
          [RewardCategory.SUBSCRIPTION]: 2,
          [RewardCategory.DIGITAL_PRODUCT]: 0,
          [RewardCategory.OTHER]: 0,
        },
      };
      repository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getRewardDistributionAnalytics();

      expect(result).toEqual({
        inventory: mockStats,
        distributionRate: 30, // 3/10 * 100
        availabilityRate: 50, // 5/10 * 100
        categoryDistribution: mockStats.byCategory,
      });
    });

    it('should handle zero total rewards', async () => {
      const mockStats = {
        total: 0,
        available: 0,
        assigned: 0,
        expired: 0,
        deactivated: 0,
        byCategory: {
          [RewardCategory.STREAMING_SERVICE]: 0,
          [RewardCategory.GIFT_CARD]: 0,
          [RewardCategory.SUBSCRIPTION]: 0,
          [RewardCategory.DIGITAL_PRODUCT]: 0,
          [RewardCategory.OTHER]: 0,
        },
      };
      repository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getRewardDistributionAnalytics();

      expect(result.distributionRate).toBe(0);
      expect(result.availabilityRate).toBe(0);
    });
  });

  describe('bulkCreateRewardAccounts', () => {
    it('should create multiple reward accounts successfully', async () => {
      const accounts = [mockCreateRewardAccountDto, { ...mockCreateRewardAccountDto, serviceName: 'YouTube' }];
      repository.create
        .mockResolvedValueOnce(mockRewardAccount)
        .mockResolvedValueOnce({ ...mockRewardAccount, id: 2, serviceName: 'YouTube' });

      const result = await service.bulkCreateRewardAccounts(accounts);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures in bulk creation', async () => {
      const accounts = [mockCreateRewardAccountDto, { ...mockCreateRewardAccountDto, serviceName: 'YouTube' }];
      repository.create
        .mockResolvedValueOnce(mockRewardAccount)
        .mockRejectedValueOnce(new ConflictException('Duplicate account'));

      const result = await service.bulkCreateRewardAccounts(accounts);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('getAssignableRewards', () => {
    it('should return assignable rewards', async () => {
      repository.findAvailableByCategory.mockResolvedValue([mockRewardAccount]);

      const result = await service.getAssignableRewards();

      expect(repository.findAvailableByCategory).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([
        {
          id: mockRewardAccount.id,
          serviceName: mockRewardAccount.serviceName,
          accountType: mockRewardAccount.accountType,
          category: mockRewardAccount.category,
          subscriptionDuration: mockRewardAccount.subscriptionDuration,
          description: mockRewardAccount.description,
          createdAt: mockRewardAccount.createdAt,
        },
      ]);
    });
  });

  describe('validateRewardAssignment', () => {
    it('should validate reward assignment successfully', async () => {
      repository.findById.mockResolvedValue(mockRewardAccount);

      const result = await service.validateRewardAssignment(1, 1);

      expect(result.isValid).toBe(true);
      expect(result.rewardAccount).toEqual(mockRewardAccount);
    });

    it('should return invalid when reward account not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.validateRewardAssignment(999, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return invalid when reward account is not available', async () => {
      const assignedReward = { ...mockRewardAccount, status: RewardStatus.ASSIGNED };
      repository.findById.mockResolvedValue(assignedReward);

      const result = await service.validateRewardAssignment(1, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not available');
    });
  });
});