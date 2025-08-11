import { Test, TestingModule } from '@nestjs/testing';
import { RewardAccountResolver } from './reward-account.resolver';
import { RewardDistributionService } from '../../modules/reward/reward-distribution.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { AdminRole, RewardCategory, RewardStatus } from '@prisma/client';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('RewardAccountResolver', () => {
  let resolver: RewardAccountResolver;
  let rewardDistributionService: jest.Mocked<RewardDistributionService>;

  const mockAdmin = {
    id: 1,
    username: 'testadmin',
    email: 'admin@test.com',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    passwordHash: 'hashedpassword'
  };

  const mockRewardAccount = {
    id: 1,
    serviceName: 'Netflix',
    accountType: 'Premium',
    category: RewardCategory.STREAMING_SERVICE,
    status: RewardStatus.AVAILABLE,
    subscriptionDuration: '1 month',
    description: 'Netflix Premium Account',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
    assignedToUserId: null,
    assignedAt: null
  };

  const mockRewardDistributionService = {
    getRewardAccount: jest.fn(),
    getRewardAccounts: jest.fn(),
    getAvailableRewardAccounts: jest.fn(),
    getAssignableRewards: jest.fn(),
    getUserAssignedRewards: jest.fn(),
    getRewardInventoryStats: jest.fn(),
    getRewardDistributionAnalytics: jest.fn(),
    createRewardAccount: jest.fn(),
    updateRewardAccount: jest.fn(),
    assignRewardToUser: jest.fn(),
    unassignRewardFromUser: jest.fn(),
    deactivateRewardAccount: jest.fn(),
    reactivateRewardAccount: jest.fn(),
    deleteRewardAccount: jest.fn(),
    bulkCreateRewardAccounts: jest.fn(),
    validateRewardAssignment: jest.fn(),
    getRewardAccountWithCredentials: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardAccountResolver,
        {
          provide: RewardDistributionService,
          useValue: mockRewardDistributionService
        }
      ]
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    resolver = module.get<RewardAccountResolver>(RewardAccountResolver);
    rewardDistributionService = module.get(RewardDistributionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rewardAccount', () => {
    it('should return reward account by ID', async () => {
      mockRewardDistributionService.getRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await resolver.rewardAccount(1, mockAdmin);

      expect(result).toEqual(mockRewardAccount);
      expect(mockRewardDistributionService.getRewardAccount).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when reward account not found', async () => {
      mockRewardDistributionService.getRewardAccount.mockRejectedValue(new NotFoundException('Reward account not found'));

      await expect(resolver.rewardAccount(999, mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for other errors', async () => {
      mockRewardDistributionService.getRewardAccount.mockRejectedValue(new Error('Database error'));

      await expect(resolver.rewardAccount(1, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rewardAccounts', () => {
    it('should return paginated reward accounts', async () => {
      const mockPaginatedResult = {
        data: [mockRewardAccount],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRewardDistributionService.getRewardAccounts.mockResolvedValue(mockPaginatedResult);

      const query = {
        page: 1,
        limit: 10,
        search: 'Netflix'
      };

      const result = await resolver.rewardAccounts(query, mockAdmin);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockRewardDistributionService.getRewardAccounts).toHaveBeenCalledWith(
        {
          search: 'Netflix',
          category: undefined,
          status: undefined,
          assignedToUserId: undefined,
          createdBy: undefined
        },
        { page: 1, limit: 10 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );
    });

    it('should use default values when query is not provided', async () => {
      const mockPaginatedResult = {
        data: [mockRewardAccount],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockRewardDistributionService.getRewardAccounts.mockResolvedValue(mockPaginatedResult);

      const result = await resolver.rewardAccounts(undefined, mockAdmin);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockRewardDistributionService.getRewardAccounts).toHaveBeenCalledWith(
        {
          search: undefined,
          category: undefined,
          status: undefined,
          assignedToUserId: undefined,
          createdBy: undefined
        },
        { page: 1, limit: 10 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );
    });
  });

  describe('availableRewardAccounts', () => {
    it('should return available reward accounts', async () => {
      const mockAvailableRewards = [mockRewardAccount];
      mockRewardDistributionService.getAvailableRewardAccounts.mockResolvedValue(mockAvailableRewards);

      const result = await resolver.availableRewardAccounts(RewardCategory.STREAMING_SERVICE, mockAdmin);

      expect(result).toEqual(mockAvailableRewards);
      expect(mockRewardDistributionService.getAvailableRewardAccounts).toHaveBeenCalledWith(RewardCategory.STREAMING_SERVICE);
    });

    it('should return all available rewards when no category specified', async () => {
      const mockAvailableRewards = [mockRewardAccount];
      mockRewardDistributionService.getAvailableRewardAccounts.mockResolvedValue(mockAvailableRewards);

      const result = await resolver.availableRewardAccounts(undefined, mockAdmin);

      expect(result).toEqual(mockAvailableRewards);
      expect(mockRewardDistributionService.getAvailableRewardAccounts).toHaveBeenCalledWith(undefined);
    });
  });

  describe('assignableRewards', () => {
    it('should return assignable rewards with category breakdown', async () => {
      const mockAssignableRewards = [
        { ...mockRewardAccount, category: RewardCategory.STREAMING_SERVICE },
        { ...mockRewardAccount, id: 2, category: RewardCategory.GIFT_CARD }
      ];
      mockRewardDistributionService.getAssignableRewards.mockResolvedValue(mockAssignableRewards);

      const result = await resolver.assignableRewards(undefined, mockAdmin);

      expect(result.rewards).toEqual(mockAssignableRewards);
      expect(result.totalCount).toBe(2);
      expect(JSON.parse(result.categoryBreakdown)).toEqual({
        [RewardCategory.STREAMING_SERVICE]: 1,
        [RewardCategory.GIFT_CARD]: 1
      });
    });
  });

  describe('createRewardAccount', () => {
    it('should create reward account successfully', async () => {
      const createInput = {
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'test@example.com:password',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: 1
      };

      mockRewardDistributionService.createRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await resolver.createRewardAccount(createInput, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.rewardAccount).toEqual(mockRewardAccount);
      expect(mockRewardDistributionService.createRewardAccount).toHaveBeenCalledWith({
        ...createInput,
        createdBy: mockAdmin.id
      });
    });

    it('should handle creation errors gracefully', async () => {
      const createInput = {
        serviceName: 'Netflix',
        accountType: 'Premium',
        credentials: 'test@example.com:password',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: 1
      };

      mockRewardDistributionService.createRewardAccount.mockRejectedValue(new Error('Creation failed'));

      const result = await resolver.createRewardAccount(createInput, mockAdmin);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Creation failed');
    });
  });

  describe('assignRewardToUser', () => {
    it('should assign reward to user successfully', async () => {
      const assignInput = {
        rewardAccountId: 1,
        submissionId: 1,
        assignedBy: 1,
        notes: 'Test assignment'
      };

      mockRewardDistributionService.assignRewardToUser.mockResolvedValue(mockRewardAccount);

      const result = await resolver.assignRewardToUser(assignInput, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.assignment?.rewardAccount).toEqual(mockRewardAccount);
      expect(result.assignment?.submissionId).toBe(1);
      expect(mockRewardDistributionService.assignRewardToUser).toHaveBeenCalledWith({
        ...assignInput,
        assignedBy: mockAdmin.id
      });
    });

    it('should handle assignment errors gracefully', async () => {
      const assignInput = {
        rewardAccountId: 1,
        submissionId: 1,
        assignedBy: 1
      };

      mockRewardDistributionService.assignRewardToUser.mockRejectedValue(new ConflictException('Reward not available'));

      const result = await resolver.assignRewardToUser(assignInput, mockAdmin);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Reward not available');
    });
  });

  describe('validateRewardAssignment', () => {
    it('should validate reward assignment successfully', async () => {
      const validationInput = {
        rewardAccountId: 1,
        submissionId: 1
      };

      const mockValidation = {
        isValid: true,
        rewardAccount: mockRewardAccount
      };

      mockRewardDistributionService.validateRewardAssignment.mockResolvedValue(mockValidation);

      const result = await resolver.validateRewardAssignment(validationInput, mockAdmin);

      expect(result.isValid).toBe(true);
      expect(result.rewardAccount).toEqual(mockRewardAccount);
      expect(result.validationDetails).toBe('Reward assignment is valid and can proceed');
    });

    it('should return invalid validation result', async () => {
      const validationInput = {
        rewardAccountId: 1,
        submissionId: 1
      };

      const mockValidation = {
        isValid: false,
        error: 'Reward not available'
      };

      mockRewardDistributionService.validateRewardAssignment.mockResolvedValue(mockValidation);

      const result = await resolver.validateRewardAssignment(validationInput, mockAdmin);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Reward not available');
      expect(result.validationDetails).toBe('Reward not available');
    });
  });

  describe('rewardInventoryStats', () => {
    it('should return inventory statistics with insights', async () => {
      const mockStats = {
        total: 100,
        available: 80,
        assigned: 15,
        expired: 3,
        deactivated: 2,
        byCategory: JSON.stringify({ STREAMING_SERVICE: 50, GIFT_CARD: 50 })
      };

      mockRewardDistributionService.getRewardInventoryStats.mockResolvedValue(mockStats);

      const result = await resolver.rewardInventoryStats(mockAdmin);

      expect(result.stats).toEqual(mockStats);
      expect(result.insights).toContain('80% of rewards are available');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should provide low inventory alert', async () => {
      const mockStats = {
        total: 100,
        available: 10, // 10% available
        assigned: 85,
        expired: 3,
        deactivated: 2,
        byCategory: JSON.stringify({ STREAMING_SERVICE: 50, GIFT_CARD: 50 })
      };

      mockRewardDistributionService.getRewardInventoryStats.mockResolvedValue(mockStats);

      const result = await resolver.rewardInventoryStats(mockAdmin);

      expect(result.insights).toContain('Low inventory alert');
    });
  });

  describe('bulkCreateRewardAccounts', () => {
    it('should bulk create reward accounts successfully', async () => {
      const bulkInput = {
        rewardAccounts: [
          {
            serviceName: 'Netflix',
            accountType: 'Premium',
            credentials: 'test1@example.com:password',
            category: RewardCategory.STREAMING_SERVICE,
            createdBy: 1
          },
          {
            serviceName: 'Spotify',
            accountType: 'Premium',
            credentials: 'test2@example.com:password',
            category: RewardCategory.STREAMING_SERVICE,
            createdBy: 1
          }
        ]
      };

      const mockBulkResult = {
        successful: [mockRewardAccount],
        failed: [],
        summary: {
          total: 2,
          successful: 2,
          failed: 0
        }
      };

      mockRewardDistributionService.bulkCreateRewardAccounts.mockResolvedValue(mockBulkResult);

      const result = await resolver.bulkCreateRewardAccounts(bulkInput, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockBulkResult);
      expect(mockRewardDistributionService.bulkCreateRewardAccounts).toHaveBeenCalledWith(
        bulkInput.rewardAccounts.map(account => ({ ...account, createdBy: mockAdmin.id }))
      );
    });
  });

  describe('rewardAccountCredentials', () => {
    it('should return reward account credentials with audit warning', async () => {
      const credentialsInput = {
        rewardAccountId: 1,
        accessReason: 'User support request'
      };

      const mockRewardWithCredentials = {
        ...mockRewardAccount,
        credentials: 'decrypted-credentials'
      };

      mockRewardDistributionService.getRewardAccountWithCredentials.mockResolvedValue(mockRewardWithCredentials);

      const result = await resolver.rewardAccountCredentials(credentialsInput, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.rewardAccountWithCredentials).toEqual(mockRewardWithCredentials);
      expect(result.auditWarning).toContain('logged for audit purposes');
    });

    it('should handle credential access errors', async () => {
      const credentialsInput = {
        rewardAccountId: 999,
        accessReason: 'User support request'
      };

      mockRewardDistributionService.getRewardAccountWithCredentials.mockRejectedValue(new NotFoundException('Not found'));

      const result = await resolver.rewardAccountCredentials(credentialsInput, mockAdmin);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Not found');
    });
  });
});