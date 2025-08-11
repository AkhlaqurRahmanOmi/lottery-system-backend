import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RewardAccountController } from './reward-account.controller';
import { RewardDistributionService } from '../../../modules/reward/reward-distribution.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { RewardCategory, RewardStatus } from '@prisma/client';

describe('RewardAccountController', () => {
  let controller: RewardAccountController;
  let rewardDistributionService: jest.Mocked<RewardDistributionService>;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;

  const mockRequest = {
    user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'ADMIN' },
    traceId: 'test-trace-id',
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
  };

  const mockRewardAccount = {
    id: 1,
    serviceName: 'Netflix Premium',
    accountType: 'Premium Account',
    encryptedCredentials: 'encrypted-credentials',
    subscriptionDuration: '12 months',
    description: 'Premium Netflix account with 4K streaming',
    category: RewardCategory.STREAMING_SERVICE,
    status: RewardStatus.AVAILABLE,
    assignedToUserId: null,
    assignedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 1,
  };

  const mockInventoryStats = {
    total: 100,
    available: 75,
    assigned: 20,
    expired: 3,
    deactivated: 2,
    byCategory: JSON.stringify({
      STREAMING_SERVICE: 50,
      GIFT_CARD: 30,
      SUBSCRIPTION: 20,
    }),
  };

  const mockSuccessResponse = {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'Success',
    data: {},
    timestamp: new Date().toISOString(),
    traceId: 'test-trace-id',
    links: {},
  };

  const mockErrorResponse = {
    success: false,
    statusCode: HttpStatus.BAD_REQUEST,
    error: {
      code: 'ERROR_CODE',
      message: 'Error message',
      timestamp: new Date().toISOString(),
      path: '/test',
      traceId: 'test-trace-id',
    },
  };

  beforeEach(async () => {
    const mockRewardDistributionService = {
      createRewardAccount: jest.fn(),
      getRewardAccounts: jest.fn(),
      getRewardInventoryStats: jest.fn(),
      getRewardDistributionAnalytics: jest.fn(),
      getAssignableRewards: jest.fn(),
      getRewardAccount: jest.fn(),
      getRewardAccountWithCredentials: jest.fn(),
      updateRewardAccount: jest.fn(),
      deleteRewardAccount: jest.fn(),
      assignRewardToUser: jest.fn(),
      validateRewardAssignment: jest.fn(),
      unassignRewardFromUser: jest.fn(),
      getUserAssignedRewards: jest.fn(),
      bulkCreateRewardAccounts: jest.fn(),
      reactivateRewardAccount: jest.fn(),
      deactivateRewardAccount: jest.fn(),
      markExpiredRewardAccounts: jest.fn(),
    };

    const mockResponseBuilder = {
      buildSuccessResponse: jest.fn().mockReturnValue(mockSuccessResponse),
      buildErrorResponse: jest.fn().mockReturnValue(mockErrorResponse),
      generateHATEOASLinks: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RewardAccountController],
      providers: [
        {
          provide: RewardDistributionService,
          useValue: mockRewardDistributionService,
        },
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
      ],
    }).compile();

    controller = module.get<RewardAccountController>(RewardAccountController);
    rewardDistributionService = module.get(RewardDistributionService);
    responseBuilder = module.get(ResponseBuilderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRewardAccount', () => {
    const createDto = {
      serviceName: 'Netflix Premium',
      accountType: 'Premium Account',
      credentials: 'username:password123',
      subscriptionDuration: '12 months',
      description: 'Premium Netflix account',
      category: RewardCategory.STREAMING_SERVICE,
      createdBy: 1,
    };

    it('should create a reward account successfully', async () => {
      rewardDistributionService.createRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await controller.createRewardAccount(createDto, mockRequest as any);

      expect(rewardDistributionService.createRewardAccount).toHaveBeenCalledWith({
        ...createDto,
        createdBy: mockRequest.user.id,
      });
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockRewardAccount,
        'Reward account created successfully',
        HttpStatus.CREATED,
        mockRequest.traceId,
        {},
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle conflict exception', async () => {
      const conflictError = new ConflictException('Account already exists');
      rewardDistributionService.createRewardAccount.mockRejectedValue(conflictError);

      await expect(controller.createRewardAccount(createDto, mockRequest as any)).rejects.toThrow(ConflictException);
      expect(responseBuilder.buildErrorResponse).toHaveBeenCalled();
    });

    it('should handle general errors', async () => {
      const error = new Error('Database error');
      rewardDistributionService.createRewardAccount.mockRejectedValue(error);

      await expect(controller.createRewardAccount(createDto, mockRequest as any)).rejects.toThrow(BadRequestException);
      expect(responseBuilder.buildErrorResponse).toHaveBeenCalled();
    });
  });

  describe('getRewardAccounts', () => {
    const queryDto = {
      page: 1,
      limit: 10,
      search: 'Netflix',
      category: RewardCategory.STREAMING_SERVICE,
      status: RewardStatus.AVAILABLE,
    };

    const mockPaginatedResult = {
      data: [mockRewardAccount],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('should get reward accounts successfully', async () => {
      rewardDistributionService.getRewardAccounts.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getRewardAccounts(queryDto, mockRequest as any);

      expect(rewardDistributionService.getRewardAccounts).toHaveBeenCalledWith(
        {
          search: queryDto.search,
          category: queryDto.category,
          status: queryDto.status,
          assignedToUserId: undefined,
          createdBy: undefined,
        },
        {
          page: queryDto.page,
          limit: queryDto.limit,
        },
        {
          sortBy: undefined,
          sortOrder: undefined,
        },
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      rewardDistributionService.getRewardAccounts.mockRejectedValue(error);

      await expect(controller.getRewardAccounts(queryDto, mockRequest as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInventoryStats', () => {
    it('should get inventory statistics successfully', async () => {
      rewardDistributionService.getRewardInventoryStats.mockResolvedValue(mockInventoryStats);

      const result = await controller.getInventoryStats(mockRequest as any);

      expect(rewardDistributionService.getRewardInventoryStats).toHaveBeenCalled();
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle stats errors', async () => {
      const error = new Error('Stats failed');
      rewardDistributionService.getRewardInventoryStats.mockRejectedValue(error);

      await expect(controller.getInventoryStats(mockRequest as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDistributionAnalytics', () => {
    const mockAnalytics = {
      inventory: mockInventoryStats,
      distributionRate: 20,
      availabilityRate: 75,
      categoryDistribution: '{"STREAMING_SERVICE": 50}',
    };

    it('should get distribution analytics successfully', async () => {
      rewardDistributionService.getRewardDistributionAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getDistributionAnalytics({}, mockRequest as any);

      expect(rewardDistributionService.getRewardDistributionAnalytics).toHaveBeenCalled();
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('getRewardAccount', () => {
    it('should get reward account by ID successfully', async () => {
      rewardDistributionService.getRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await controller.getRewardAccount(1, mockRequest as any);

      expect(rewardDistributionService.getRewardAccount).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.getRewardAccount.mockRejectedValue(notFoundError);

      await expect(controller.getRewardAccount(1, mockRequest as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRewardAccountWithCredentials', () => {
    const mockRewardAccountWithCredentials = {
      ...mockRewardAccount,
      decryptedCredentials: 'decrypted-credentials',
    };

    it('should get reward account with credentials successfully', async () => {
      rewardDistributionService.getRewardAccountWithCredentials.mockResolvedValue(mockRewardAccountWithCredentials);

      const result = await controller.getRewardAccountWithCredentials(1, mockRequest as any);

      expect(rewardDistributionService.getRewardAccountWithCredentials).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('updateRewardAccount', () => {
    const updateDto = {
      serviceName: 'Netflix Premium Updated',
      description: 'Updated description',
    };

    it('should update reward account successfully', async () => {
      const updatedRewardAccount = { ...mockRewardAccount, ...updateDto };
      rewardDistributionService.updateRewardAccount.mockResolvedValue(updatedRewardAccount);

      const result = await controller.updateRewardAccount(1, updateDto, mockRequest as any);

      expect(rewardDistributionService.updateRewardAccount).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.updateRewardAccount.mockRejectedValue(notFoundError);

      await expect(controller.updateRewardAccount(1, updateDto, mockRequest as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRewardAccount', () => {
    it('should delete reward account successfully', async () => {
      const deleteResult = { message: 'Reward account deleted successfully' };
      rewardDistributionService.deleteRewardAccount.mockResolvedValue(deleteResult);

      const result = await controller.deleteRewardAccount(1, mockRequest as any);

      expect(rewardDistributionService.deleteRewardAccount).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.deleteRewardAccount.mockRejectedValue(notFoundError);

      await expect(controller.deleteRewardAccount(1, mockRequest as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle bad request error', async () => {
      const badRequestError = new BadRequestException('Cannot delete assigned reward');
      rewardDistributionService.deleteRewardAccount.mockRejectedValue(badRequestError);

      await expect(controller.deleteRewardAccount(1, mockRequest as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignRewardToUser', () => {
    const assignDto = {
      rewardAccountId: 1,
      submissionId: 1,
      assignedBy: 1,
      notes: 'Winner of weekly draw',
    };

    it('should assign reward to user successfully', async () => {
      const assignedReward = { ...mockRewardAccount, status: RewardStatus.ASSIGNED, assignedToUserId: 1 };
      rewardDistributionService.assignRewardToUser.mockResolvedValue(assignedReward);

      const result = await controller.assignRewardToUser(assignDto, mockRequest as any);

      expect(rewardDistributionService.assignRewardToUser).toHaveBeenCalledWith({
        ...assignDto,
        assignedBy: mockRequest.user.id,
      });
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.assignRewardToUser.mockRejectedValue(notFoundError);

      await expect(controller.assignRewardToUser(assignDto, mockRequest as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle conflict error', async () => {
      const conflictError = new ConflictException('Reward not available');
      rewardDistributionService.assignRewardToUser.mockRejectedValue(conflictError);

      await expect(controller.assignRewardToUser(assignDto, mockRequest as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateRewardAssignment', () => {
    const assignDto = {
      rewardAccountId: 1,
      submissionId: 1,
      assignedBy: 1,
    };

    it('should validate assignment successfully', async () => {
      const validationResult = {
        isValid: true,
        rewardAccount: mockRewardAccount,
      };
      rewardDistributionService.validateRewardAssignment.mockResolvedValue(validationResult);

      const result = await controller.validateRewardAssignment(assignDto, mockRequest as any);

      expect(rewardDistributionService.validateRewardAssignment).toHaveBeenCalledWith(
        assignDto.rewardAccountId,
        assignDto.submissionId,
      );
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('unassignRewardFromUser', () => {
    it('should unassign reward from user successfully', async () => {
      const unassignedReward = { ...mockRewardAccount, status: RewardStatus.AVAILABLE, assignedToUserId: null };
      rewardDistributionService.unassignRewardFromUser.mockResolvedValue(unassignedReward);

      const result = await controller.unassignRewardFromUser(1, mockRequest as any);

      expect(rewardDistributionService.unassignRewardFromUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.unassignRewardFromUser.mockRejectedValue(notFoundError);

      await expect(controller.unassignRewardFromUser(1, mockRequest as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle conflict error', async () => {
      const conflictError = new ConflictException('Reward not assigned');
      rewardDistributionService.unassignRewardFromUser.mockRejectedValue(conflictError);

      await expect(controller.unassignRewardFromUser(1, mockRequest as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserAssignedRewards', () => {
    it('should get user assigned rewards successfully', async () => {
      const assignedRewards = [{ ...mockRewardAccount, status: RewardStatus.ASSIGNED }];
      rewardDistributionService.getUserAssignedRewards.mockResolvedValue(assignedRewards);

      const result = await controller.getUserAssignedRewards(1, mockRequest as any);

      expect(rewardDistributionService.getUserAssignedRewards).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('bulkCreateRewardAccounts', () => {
    const bulkCreateDto = {
      rewardAccounts: [
        {
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          credentials: 'username:password123',
          category: RewardCategory.STREAMING_SERVICE,
          createdBy: 1,
        },
      ],
    };

    it('should bulk create reward accounts successfully', async () => {
      const bulkResult = {
        successful: [mockRewardAccount],
        failed: [],
        summary: { total: 1, successful: 1, failed: 0 },
      };
      rewardDistributionService.bulkCreateRewardAccounts.mockResolvedValue(bulkResult);

      const result = await controller.bulkCreateRewardAccounts(bulkCreateDto, mockRequest as any);

      expect(rewardDistributionService.bulkCreateRewardAccounts).toHaveBeenCalledWith([
        { ...bulkCreateDto.rewardAccounts[0], createdBy: mockRequest.user.id },
      ]);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('bulkOperation', () => {
    const bulkOperationDto = {
      rewardAccountIds: [1, 2, 3],
      operation: 'activate' as const,
    };

    it('should perform bulk activate operation successfully', async () => {
      rewardDistributionService.reactivateRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await controller.bulkOperation(bulkOperationDto, mockRequest as any);

      expect(rewardDistributionService.reactivateRewardAccount).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should perform bulk deactivate operation successfully', async () => {
      const deactivateDto = { ...bulkOperationDto, operation: 'deactivate' as const };
      rewardDistributionService.deactivateRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await controller.bulkOperation(deactivateDto, mockRequest as any);

      expect(rewardDistributionService.deactivateRewardAccount).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should perform bulk delete operation successfully', async () => {
      const deleteDto = { ...bulkOperationDto, operation: 'delete' as const };
      rewardDistributionService.deleteRewardAccount.mockResolvedValue({ message: 'Deleted' });

      const result = await controller.bulkOperation(deleteDto, mockRequest as any);

      expect(rewardDistributionService.deleteRewardAccount).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('activateRewardAccount', () => {
    it('should activate reward account successfully', async () => {
      rewardDistributionService.reactivateRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await controller.activateRewardAccount(1, mockRequest as any);

      expect(rewardDistributionService.reactivateRewardAccount).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.reactivateRewardAccount.mockRejectedValue(notFoundError);

      await expect(controller.activateRewardAccount(1, mockRequest as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle conflict error', async () => {
      const conflictError = new ConflictException('Cannot activate assigned reward');
      rewardDistributionService.reactivateRewardAccount.mockRejectedValue(conflictError);

      await expect(controller.activateRewardAccount(1, mockRequest as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateRewardAccount', () => {
    it('should deactivate reward account successfully', async () => {
      rewardDistributionService.deactivateRewardAccount.mockResolvedValue(mockRewardAccount);

      const result = await controller.deactivateRewardAccount(1, mockRequest as any);

      expect(rewardDistributionService.deactivateRewardAccount).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle not found error', async () => {
      const notFoundError = new NotFoundException('Reward account not found');
      rewardDistributionService.deactivateRewardAccount.mockRejectedValue(notFoundError);

      await expect(controller.deactivateRewardAccount(1, mockRequest as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markExpiredRewardAccounts', () => {
    it('should mark expired reward accounts successfully', async () => {
      const expiredResult = {
        message: 'Marked 5 reward accounts as expired',
        expiredCount: 5,
      };
      rewardDistributionService.markExpiredRewardAccounts.mockResolvedValue(expiredResult);

      const result = await controller.markExpiredRewardAccounts(mockRequest as any);

      expect(rewardDistributionService.markExpiredRewardAccounts).toHaveBeenCalled();
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('getAvailableRewardAccounts', () => {
    it('should get available reward accounts successfully', async () => {
      const availableRewards = [
        {
          id: 1,
          serviceName: 'Netflix Premium',
          accountType: 'Premium Account',
          category: RewardCategory.STREAMING_SERVICE,
          subscriptionDuration: '12 months',
          description: 'Premium Netflix account',
          createdAt: new Date(),
        },
      ];
      rewardDistributionService.getAssignableRewards.mockResolvedValue(availableRewards);

      const result = await controller.getAvailableRewardAccounts('STREAMING_SERVICE', mockRequest as any);

      expect(rewardDistributionService.getAssignableRewards).toHaveBeenCalledWith('STREAMING_SERVICE');
      expect(result).toEqual(mockSuccessResponse);
    });
  });
});