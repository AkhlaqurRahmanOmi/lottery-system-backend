import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsRepository } from './analytics.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';

describe('AnalyticsRepository', () => {
  let repository: AnalyticsRepository;
  let prismaService: any;

  const mockPrismaService = {
    coupon: {
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    submission: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    rewardAccount: {
      groupBy: jest.fn(),
    },
    reward: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AnalyticsRepository>(AnalyticsRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCouponStatistics', () => {
    it('should return coupon statistics with proper aggregation', async () => {
      const mockStats = [
        { status: 'ACTIVE', _count: { status: 60 } },
        { status: 'REDEEMED', _count: { status: 30 } },
        { status: 'EXPIRED', _count: { status: 5 } },
        { status: 'DEACTIVATED', _count: { status: 5 } }
      ];

      const mockBatches = [
        { batchId: 'batch1' },
        { batchId: 'batch2' },
        { batchId: 'batch3' }
      ];

      prismaService.coupon.groupBy
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockBatches);

      const result = await repository.getCouponStatistics();

      expect(result.totalGenerated).toBe(100);
      expect(result.totalActive).toBe(60);
      expect(result.totalRedeemed).toBe(30);
      expect(result.totalExpired).toBe(5);
      expect(result.totalDeactivated).toBe(5);
      expect(result.totalBatches).toBe(3);
    });

    it('should handle empty statistics', async () => {
      prismaService.coupon.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await repository.getCouponStatistics();

      expect(result.totalGenerated).toBe(0);
      expect(result.totalActive).toBe(0);
      expect(result.totalRedeemed).toBe(0);
      expect(result.totalExpired).toBe(0);
      expect(result.totalDeactivated).toBe(0);
      expect(result.totalBatches).toBe(0);
    });
  });

  describe('getSubmissionStatistics', () => {
    it('should return submission statistics', async () => {
      prismaService.submission.count
        .mockResolvedValueOnce(50) // total submissions
        .mockResolvedValueOnce(30); // with rewards

      prismaService.submission.groupBy.mockResolvedValueOnce([
        { email: 'user1@test.com' },
        { email: 'user2@test.com' },
        { email: 'user3@test.com' }
      ]);

      const result = await repository.getSubmissionStatistics();

      expect(result.totalSubmissions).toBe(50);
      expect(result.submissionsWithRewards).toBe(30);
      expect(result.uniqueUsers).toBe(3);
    });
  });

  describe('getRewardAccountStatistics', () => {
    it('should return reward account statistics with proper aggregation', async () => {
      const mockStats = [
        { status: 'AVAILABLE', _count: { status: 40 } },
        { status: 'ASSIGNED', _count: { status: 25 } },
        { status: 'EXPIRED', _count: { status: 5 } }
      ];

      prismaService.rewardAccount.groupBy.mockResolvedValueOnce(mockStats);

      const result = await repository.getRewardAccountStatistics();

      expect(result.totalRewardAccounts).toBe(70);
      expect(result.availableRewards).toBe(40);
      expect(result.assignedRewards).toBe(25);
      expect(result.expiredRewards).toBe(5);
    });
  });

  describe('getRewardSelectionStatistics', () => {
    it('should return reward selection statistics with details', async () => {
      const mockSelections = [
        { selectedRewardId: 1, _count: { selectedRewardId: 20 } },
        { selectedRewardId: 2, _count: { selectedRewardId: 15 } }
      ];

      const mockRewards = [
        { id: 1, name: 'Spotify Premium', description: 'Music streaming', isActive: true },
        { id: 2, name: 'Netflix', description: 'Video streaming', isActive: true }
      ];

      prismaService.submission.groupBy.mockResolvedValueOnce(mockSelections);
      prismaService.reward.findMany.mockResolvedValueOnce(mockRewards);

      const result = await repository.getRewardSelectionStatistics();

      expect(result.selections).toEqual(mockSelections);
      expect(result.rewards).toEqual(mockRewards);
    });
  });

  describe('getDailyStatistics', () => {
    it('should return daily statistics with proper data conversion', async () => {
      const startDate = new Date('2024-01-01');
      
      const mockCouponStats = [
        { date: new Date('2024-01-01'), coupons_generated: BigInt(10), coupons_redeemed: BigInt(5) },
        { date: new Date('2024-01-02'), coupons_generated: BigInt(15), coupons_redeemed: BigInt(8) }
      ];

      const mockSubmissionStats = [
        { date: new Date('2024-01-01'), submissions: BigInt(4), rewards_assigned: BigInt(2) },
        { date: new Date('2024-01-02'), submissions: BigInt(7), rewards_assigned: BigInt(4) }
      ];

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockCouponStats)
        .mockResolvedValueOnce(mockSubmissionStats);

      const result = await repository.getDailyStatistics(startDate);

      expect(result.couponStats).toHaveLength(2);
      expect(result.submissionStats).toHaveLength(2);
      expect(result.couponStats[0].couponsGenerated).toBe(10);
      expect(result.couponStats[0].couponsRedeemed).toBe(5);
      expect(result.submissionStats[0].submissions).toBe(4);
      expect(result.submissionStats[0].rewardsAssigned).toBe(2);
    });
  });

  describe('getCampaignStatistics', () => {
    it('should return campaign statistics for a batch', async () => {
      const batchId = 'test-batch-123';
      
      const mockBatchCoupons = [
        { status: 'ACTIVE', _count: { status: 40 } },
        { status: 'REDEEMED', _count: { status: 30 } },
        { status: 'EXPIRED', _count: { status: 5 } }
      ];

      prismaService.coupon.groupBy.mockResolvedValueOnce(mockBatchCoupons);
      prismaService.submission.count
        .mockResolvedValueOnce(25) // total submissions
        .mockResolvedValueOnce(15); // with rewards

      const result = await repository.getCampaignStatistics(batchId);

      expect(result.couponStats).toEqual(mockBatchCoupons);
      expect(result.totalSubmissions).toBe(25);
      expect(result.totalRewardsAssigned).toBe(15);
    });
  });

  describe('getAllBatchIds', () => {
    it('should return all batch IDs', async () => {
      const mockBatches = [
        { batchId: 'batch1' },
        { batchId: 'batch2' },
        { batchId: null }
      ];

      prismaService.coupon.groupBy.mockResolvedValueOnce(mockBatches);

      const result = await repository.getAllBatchIds();

      expect(result).toEqual(['batch1', 'batch2']);
    });
  });

  describe('getBatchCreationDate', () => {
    it('should return batch creation date', async () => {
      const batchId = 'test-batch';
      const createdAt = new Date('2024-01-01');
      
      prismaService.coupon.findFirst.mockResolvedValueOnce({ createdAt });

      const result = await repository.getBatchCreationDate(batchId);

      expect(result).toEqual(createdAt);
    });

    it('should return null for non-existent batch', async () => {
      prismaService.coupon.findFirst.mockResolvedValueOnce(null);

      const result = await repository.getBatchCreationDate('non-existent');

      expect(result).toBeNull();
    });
  });
});