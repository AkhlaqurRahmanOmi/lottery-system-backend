import { Test, TestingModule } from '@nestjs/testing';
import { RewardController } from './reward.controller';
import { RewardService } from '../../../modules/reward/reward.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RewardController', () => {
  let controller: RewardController;
  let rewardService: RewardService;
  let responseBuilder: ResponseBuilderService;

  const mockRewardService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    remove: jest.fn(),
    findActiveRewards: jest.fn(),
    getSummaryStats: jest.fn(),
    getRewardStats: jest.fn(),
    updateDisplayOrders: jest.fn(),
  };

  const mockResponseBuilder = {
    buildSuccessResponse: jest.fn(),
    buildErrorResponse: jest.fn(),
    generateHATEOASLinks: jest.fn(),
  };

  const mockRequest = {
    user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'ADMIN' },
    traceId: 'test-trace-id',
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RewardController],
      providers: [
        {
          provide: RewardService,
          useValue: mockRewardService,
        },
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RewardController>(RewardController);
    rewardService = module.get<RewardService>(RewardService);
    responseBuilder = module.get<ResponseBuilderService>(ResponseBuilderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a reward successfully', async () => {
      const createDto = {
        name: 'Test Reward',
        description: 'Test Description',
        displayOrder: 1,
        isActive: true,
      };

      const mockReward = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        data: mockReward,
        message: 'Reward created successfully',
        timestamp: new Date().toISOString(),
      };

      mockRewardService.create.mockResolvedValue(mockReward);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.create(createDto, mockRequest as any);

      expect(mockRewardService.create).toHaveBeenCalledWith(createDto);
      expect(mockResponseBuilder.buildSuccessResponse).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      const createDto = {
        name: 'Test Reward',
        description: 'Test Description',
        displayOrder: 1,
        isActive: true,
      };

      mockRewardService.create.mockRejectedValue(new Error('Creation failed'));
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: 400,
        error: { code: 'REWARD_CREATION_ERROR', message: 'Creation failed' },
      });

      await expect(controller.create(createDto, mockRequest as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should retrieve rewards with pagination', async () => {
      const queryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [{ id: 1, name: 'Test Reward' }],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockResult,
        message: 'Rewards retrieved successfully',
      };

      mockRewardService.findAll.mockResolvedValue(mockResult);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.findAll(queryDto, mockRequest as any);

      expect(mockRewardService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should retrieve a reward by ID', async () => {
      const rewardId = 1;
      const mockReward = {
        id: rewardId,
        name: 'Test Reward',
        description: 'Test Description',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockReward,
        message: 'Reward retrieved successfully',
      };

      mockRewardService.findOne.mockResolvedValue(mockReward);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.findOne(rewardId, mockRequest as any);

      expect(mockRewardService.findOne).toHaveBeenCalledWith(rewardId);
      expect(result).toEqual(mockResponse);
    });

    it('should handle reward not found', async () => {
      const rewardId = 999;

      mockRewardService.findOne.mockRejectedValue(
        new NotFoundException('Reward not found'),
      );
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: 404,
        error: { code: 'REWARD_NOT_FOUND', message: 'Reward not found' },
      });

      await expect(controller.findOne(rewardId, mockRequest as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActiveRewards', () => {
    it('should retrieve active rewards for public access', async () => {
      const mockActiveRewards = [
        {
          id: 1,
          name: 'Active Reward 1',
          description: 'Description 1',
          imageUrl: 'image1.jpg',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Active Reward 2',
          description: 'Description 2',
          imageUrl: 'image2.jpg',
          displayOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedPublicRewards = [
        {
          id: 1,
          name: 'Active Reward 1',
          description: 'Description 1',
          imageUrl: 'image1.jpg',
          displayOrder: 1,
        },
        {
          id: 2,
          name: 'Active Reward 2',
          description: 'Description 2',
          imageUrl: 'image2.jpg',
          displayOrder: 2,
        },
      ];

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: expectedPublicRewards,
        message: 'Active rewards retrieved successfully',
      };

      mockRewardService.findActiveRewards.mockResolvedValue(mockActiveRewards);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.getActiveRewards(mockRequest as any);

      expect(mockRewardService.findActiveRewards).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateRewardSelection', () => {
    it('should validate an active reward successfully', async () => {
      const validationDto = { rewardId: 1 };
      const mockReward = {
        id: 1,
        name: 'Test Reward',
        description: 'Test Description',
        imageUrl: 'test.jpg',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        isValid: true,
        reward: {
          id: 1,
          name: 'Test Reward',
          description: 'Test Description',
          imageUrl: 'test.jpg',
          displayOrder: 1,
        },
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: expectedResult,
        message: 'Reward validation completed',
      };

      mockRewardService.findOne.mockResolvedValue(mockReward);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.validateRewardSelection(
        validationDto,
        mockRequest as any,
      );

      expect(mockRewardService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return invalid for inactive reward', async () => {
      const validationDto = { rewardId: 1 };
      const mockReward = {
        id: 1,
        name: 'Test Reward',
        description: 'Test Description',
        imageUrl: 'test.jpg',
        displayOrder: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        isValid: false,
        error: 'Reward is not currently active',
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: expectedResult,
        message: 'Reward validation completed',
      };

      mockRewardService.findOne.mockResolvedValue(mockReward);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.validateRewardSelection(
        validationDto,
        mockRequest as any,
      );

      expect(result).toEqual(mockResponse);
    });

    it('should return invalid for non-existent reward', async () => {
      const validationDto = { rewardId: 999 };

      const expectedResult = {
        isValid: false,
        error: 'Reward not found',
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: expectedResult,
        message: 'Reward validation completed',
      };

      mockRewardService.findOne.mockRejectedValue(
        new NotFoundException('Reward not found'),
      );
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.validateRewardSelection(
        validationDto,
        mockRequest as any,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update a reward successfully', async () => {
      const rewardId = 1;
      const updateDto = { name: 'Updated Reward' };
      const mockUpdatedReward = {
        id: rewardId,
        name: 'Updated Reward',
        description: 'Test Description',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockUpdatedReward,
        message: 'Reward updated successfully',
      };

      mockRewardService.update.mockResolvedValue(mockUpdatedReward);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.update(rewardId, updateDto, mockRequest as any);

      expect(mockRewardService.update).toHaveBeenCalledWith(rewardId, updateDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('activate', () => {
    it('should activate a reward successfully', async () => {
      const rewardId = 1;
      const mockActivatedReward = {
        id: rewardId,
        name: 'Test Reward',
        description: 'Test Description',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockActivatedReward,
        message: 'Reward activated successfully',
      };

      mockRewardService.activate.mockResolvedValue(mockActivatedReward);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.activate(rewardId, mockRequest as any);

      expect(mockRewardService.activate).toHaveBeenCalledWith(rewardId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a reward successfully', async () => {
      const rewardId = 1;
      const mockDeactivatedReward = {
        id: rewardId,
        name: 'Test Reward',
        description: 'Test Description',
        isActive: false,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockDeactivatedReward,
        message: 'Reward deactivated successfully',
      };

      mockRewardService.deactivate.mockResolvedValue(mockDeactivatedReward);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.deactivate(rewardId, mockRequest as any);

      expect(mockRewardService.deactivate).toHaveBeenCalledWith(rewardId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    it('should delete a reward successfully', async () => {
      const rewardId = 1;

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: { deletedId: rewardId },
        message: 'Reward deleted successfully',
      };

      mockRewardService.remove.mockResolvedValue(undefined);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue([]);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      const result = await controller.remove(rewardId, mockRequest as any);

      expect(mockRewardService.remove).toHaveBeenCalledWith(rewardId);
      expect(result).toEqual(mockResponse);
    });

    it('should handle deletion of reward with user selections', async () => {
      const rewardId = 1;

      mockRewardService.remove.mockRejectedValue(
        new BadRequestException('Cannot delete reward that has been selected by users'),
      );
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: 400,
        error: { code: 'REWARD_DELETE_ERROR', message: 'Cannot delete reward that has been selected by users' },
      });

      await expect(controller.remove(rewardId, mockRequest as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});