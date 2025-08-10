import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { RewardController } from './reward.controller';
import { RewardService } from '../../../modules/reward/reward.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

describe('RewardController (Integration)', () => {
  let app: INestApplication;
  let rewardService: RewardService;

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
    generateHATEOASLinks: jest.fn().mockReturnValue({ self: 'http://localhost:3000/api/rewards' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    rewardService = moduleFixture.get<RewardService>(RewardService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rewards/public/active', () => {
    it('should return active rewards without authentication', async () => {
      const mockActiveRewards = [
        {
          id: 1,
          name: 'Premium Gift Card',
          description: 'A premium gift card worth $100',
          imageUrl: 'https://example.com/gift-card.jpg',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Electronics Voucher',
          description: 'Electronics store voucher',
          imageUrl: 'https://example.com/electronics.jpg',
          displayOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            id: 1,
            name: 'Premium Gift Card',
            description: 'A premium gift card worth $100',
            imageUrl: 'https://example.com/gift-card.jpg',
            displayOrder: 1,
          },
          {
            id: 2,
            name: 'Electronics Voucher',
            description: 'Electronics store voucher',
            imageUrl: 'https://example.com/electronics.jpg',
            displayOrder: 2,
          },
        ],
        message: 'Active rewards retrieved successfully',
        timestamp: expect.any(String),
      };

      mockRewardService.findActiveRewards.mockResolvedValue(mockActiveRewards);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/rewards/public/active')
        .expect(200);

      expect(mockRewardService.findActiveRewards).toHaveBeenCalled();
      expect(response.body).toEqual(expectedResponse);
    });

    it('should handle service errors gracefully', async () => {
      mockRewardService.findActiveRewards.mockRejectedValue(new Error('Database error'));
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: 400,
        error: {
          code: 'ACTIVE_REWARDS_ERROR',
          message: 'Failed to retrieve active rewards',
        },
      });

      await request(app.getHttpServer())
        .get('/api/rewards/public/active')
        .expect(400);
    });
  });

  describe('POST /api/rewards/public/validate', () => {
    it('should validate an active reward successfully', async () => {
      const mockReward = {
        id: 1,
        name: 'Premium Gift Card',
        description: 'A premium gift card worth $100',
        imageUrl: 'https://example.com/gift-card.jpg',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: {
          isValid: true,
          reward: {
            id: 1,
            name: 'Premium Gift Card',
            description: 'A premium gift card worth $100',
            imageUrl: 'https://example.com/gift-card.jpg',
            displayOrder: 1,
          },
        },
        message: 'Reward validation completed',
      };

      mockRewardService.findOne.mockResolvedValue(mockReward);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/api/rewards/public/validate')
        .send({ rewardId: 1 })
        .expect(200);

      expect(mockRewardService.findOne).toHaveBeenCalledWith(1);
      expect(response.body).toEqual(expectedResponse);
    });

    it('should return invalid for inactive reward', async () => {
      const mockReward = {
        id: 1,
        name: 'Premium Gift Card',
        description: 'A premium gift card worth $100',
        imageUrl: 'https://example.com/gift-card.jpg',
        displayOrder: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: {
          isValid: false,
          error: 'Reward is not currently active',
        },
        message: 'Reward validation completed',
      };

      mockRewardService.findOne.mockResolvedValue(mockReward);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/api/rewards/public/validate')
        .send({ rewardId: 1 })
        .expect(200);

      expect(response.body).toEqual(expectedResponse);
    });

    it('should validate request body', async () => {
      await request(app.getHttpServer())
        .post('/api/rewards/public/validate')
        .send({}) // Missing rewardId
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/rewards/public/validate')
        .send({ rewardId: 'invalid' }) // Invalid type
        .expect(400);
    });
  });

  describe('POST /api/rewards (Admin)', () => {
    it('should create a reward with authentication', async () => {
      const createDto = {
        name: 'New Reward',
        description: 'A new reward',
        displayOrder: 1,
        isActive: true,
      };

      const mockCreatedReward = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResponse = {
        success: true,
        statusCode: 201,
        data: mockCreatedReward,
        message: 'Reward created successfully',
      };

      mockRewardService.create.mockResolvedValue(mockCreatedReward);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/api/rewards')
        .send(createDto)
        .expect(201);

      expect(mockRewardService.create).toHaveBeenCalledWith(createDto);
      expect(response.body).toEqual(expectedResponse);
    });

    it('should validate request body for reward creation', async () => {
      await request(app.getHttpServer())
        .post('/api/rewards')
        .send({}) // Missing required fields
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/rewards')
        .send({ name: '' }) // Empty name
        .expect(400);
    });
  });

  describe('GET /api/rewards (Admin)', () => {
    it('should retrieve rewards with pagination', async () => {
      const mockPaginatedResult = {
        data: [
          {
            id: 1,
            name: 'Reward 1',
            description: 'Description 1',
            isActive: true,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: mockPaginatedResult,
        message: 'Rewards retrieved successfully',
      };

      mockRewardService.findAll.mockResolvedValue(mockPaginatedResult);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/rewards')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(mockRewardService.findAll).toHaveBeenCalledWith({
        page: '1',
        limit: '10',
      });
      expect(response.body).toEqual(expectedResponse);
    });
  });

  describe('PUT /api/rewards/:id/activate (Admin)', () => {
    it('should activate a reward', async () => {
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

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: mockActivatedReward,
        message: 'Reward activated successfully',
      };

      mockRewardService.activate.mockResolvedValue(mockActivatedReward);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .put(`/api/rewards/${rewardId}/activate`)
        .expect(200);

      expect(mockRewardService.activate).toHaveBeenCalledWith(rewardId);
      expect(response.body).toEqual(expectedResponse);
    });
  });

  describe('PUT /api/rewards/:id/deactivate (Admin)', () => {
    it('should deactivate a reward', async () => {
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

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: mockDeactivatedReward,
        message: 'Reward deactivated successfully',
      };

      mockRewardService.deactivate.mockResolvedValue(mockDeactivatedReward);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .put(`/api/rewards/${rewardId}/deactivate`)
        .expect(200);

      expect(mockRewardService.deactivate).toHaveBeenCalledWith(rewardId);
      expect(response.body).toEqual(expectedResponse);
    });
  });

  describe('DELETE /api/rewards/:id (Admin)', () => {
    it('should delete a reward', async () => {
      const rewardId = 1;

      const expectedResponse = {
        success: true,
        statusCode: 200,
        data: { deletedId: rewardId },
        message: 'Reward deleted successfully',
      };

      mockRewardService.remove.mockResolvedValue(undefined);
      mockResponseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .delete(`/api/rewards/${rewardId}`)
        .expect(200);

      expect(mockRewardService.remove).toHaveBeenCalledWith(rewardId);
      expect(response.body).toEqual(expectedResponse);
    });
  });
});