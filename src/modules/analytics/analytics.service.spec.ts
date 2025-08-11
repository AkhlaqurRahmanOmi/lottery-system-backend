import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../core/config/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: any;

  const mockPrismaService = {
    coupon: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    submission: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    rewardAccount: {
      count: jest.fn(),
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
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalyticsSummary', () => {
    it('should return comprehensive analytics summary', async () => {
      // Mock coupon statistics - first set for getCouponStatistics
      prismaService.coupon.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // active
        .mockResolvedValueOnce(30)  // redeemed
        .mockResolvedValueOnce(5)   // expired
        .mockResolvedValueOnce(5);  // deactivated

      prismaService.coupon.groupBy.mockResolvedValueOnce([
        { batchId: 'batch1' },
        { batchId: 'batch2' }
      ]);

      // Mock submission statistics - for getSubmissionStatistics
      prismaService.submission.count
        .mockResolvedValueOnce(25) // total submissions
        .mockResolvedValueOnce(15); // with rewards

      prismaService.submission.groupBy.mockResolvedValueOnce([
        { email: 'user1@test.com' },
        { email: 'user2@test.com' }
      ]);

      // Mock reward account statistics - for getRewardAccountStatistics
      prismaService.rewardAccount.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(35) // available
        .mockResolvedValueOnce(10) // assigned
        .mockResolvedValueOnce(5);  // expired

      // Mock conversion rates - second set for getConversionRates
      prismaService.coupon.count
        .mockResolvedValueOnce(100) // total coupons for conversion
        .mockResolvedValueOnce(30);  // redeemed coupons for conversion

      prismaService.submission.count
        .mockResolvedValueOnce(25)  // total submissions for conversion
        .mockResolvedValueOnce(15); // with rewards for conversion

      // Mock reward selection statistics - for getRewardSelectionAnalytics
      prismaService.submission.groupBy.mockResolvedValueOnce([
        { selectedRewardId: 1, _count: { selectedRewardId: 15 } },
        { selectedRewardId: 2, _count: { selectedRewardId: 10 } }
      ]);

      prismaService.reward.findMany.mockResolvedValueOnce([
        { id: 1, name: 'Spotify Premium', description: 'Music streaming', isActive: true },
        { id: 2, name: 'Netflix', description: 'Video streaming', isActive: true }
      ]);

      prismaService.rewardAccount.groupBy.mockResolvedValueOnce([
        { category: 'STREAMING_SERVICE', _count: { category: 30 } },
        { category: 'GIFT_CARD', _count: { category: 20 } }
      ]);

      const result = await service.getAnalyticsSummary();

      expect(result).toBeDefined();
      expect(result.coupons.totalGenerated).toBe(100);
      expect(result.coupons.totalRedeemed).toBe(30);
      expect(result.submissions.totalSubmissions).toBe(25);
      expect(result.conversion.couponRedemptionRate).toBe(30);
      expect(result.rewardSelection.totalRewardSelections).toBe(25);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getConversionRates', () => {
    it('should calculate conversion rates correctly', async () => {
      prismaService.coupon.count
        .mockResolvedValueOnce(100) // total coupons
        .mockResolvedValueOnce(40);  // redeemed coupons

      prismaService.submission.count
        .mockResolvedValueOnce(35)  // total submissions
        .mockResolvedValueOnce(20); // with rewards

      const result = await service.getConversionRates();

      expect(result.couponRedemptionRate).toBe(40);
      expect(result.rewardAssignmentRate).toBe(57.14);
      expect(result.overallConversionRate).toBe(20);
      expect(result.totalCouponsGenerated).toBe(100);
      expect(result.totalCouponsRedeemed).toBe(40);
      expect(result.totalSubmissions).toBe(35);
      expect(result.totalRewardsAssigned).toBe(20);
    });

    it('should handle zero values correctly', async () => {
      prismaService.coupon.count
        .mockResolvedValueOnce(0) // total coupons
        .mockResolvedValueOnce(0); // redeemed coupons

      prismaService.submission.count
        .mockResolvedValueOnce(0) // total submissions
        .mockResolvedValueOnce(0); // with rewards

      const result = await service.getConversionRates();

      expect(result.couponRedemptionRate).toBe(0);
      expect(result.rewardAssignmentRate).toBe(0);
      expect(result.overallConversionRate).toBe(0);
    });
  });

  describe('getRewardSelectionAnalytics', () => {
    it('should return reward selection analytics', async () => {
      const mockSelections = [
        { selectedRewardId: 1, _count: { selectedRewardId: 15 } },
        { selectedRewardId: 2, _count: { selectedRewardId: 10 } }
      ];

      const mockRewards = [
        { id: 1, name: 'Spotify Premium', description: 'Music streaming', isActive: true },
        { id: 2, name: 'Netflix', description: 'Video streaming', isActive: true }
      ];

      const mockCategories = [
        { category: 'STREAMING_SERVICE', _count: { category: 30 } },
        { category: 'GIFT_CARD', _count: { category: 20 } }
      ];

      prismaService.submission.groupBy.mockResolvedValueOnce(mockSelections);
      prismaService.reward.findMany.mockResolvedValueOnce(mockRewards);
      prismaService.rewardAccount.groupBy.mockResolvedValueOnce(mockCategories);

      const result = await service.getRewardSelectionAnalytics();

      expect(result.totalRewardSelections).toBe(25);
      expect(result.rewardPopularity).toHaveLength(2);
      expect(result.rewardPopularity[0].rewardName).toBe('Spotify Premium');
      expect(result.rewardPopularity[0].selectionCount).toBe(15);
      expect(result.rewardPopularity[0].selectionPercentage).toBe(60);
      expect(result.mostPopularReward?.rewardName).toBe('Spotify Premium');
      expect(result.leastPopularReward?.rewardName).toBe('Netflix');
      expect(result.categoryPopularity).toHaveLength(2);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics for specified period', async () => {
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

      const result = await service.getPerformanceMetrics(7);

      expect(result.periodDays).toBe(7);
      expect(result.dailyCouponStats).toHaveLength(2);
      expect(result.dailySubmissionStats).toHaveLength(2);
      expect(result.dailyCouponStats[0].couponsGenerated).toBe(10);
      expect(result.dailyCouponStats[0].couponsRedeemed).toBe(5);
      expect(result.dailySubmissionStats[0].submissions).toBe(4);
      expect(result.dailySubmissionStats[0].rewardsAssigned).toBe(2);
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics for valid batch', async () => {
      const batchId = 'test-batch-123';
      const mockBatch = {
        batchId,
        createdAt: new Date('2024-01-01')
      };

      const mockBatchCoupons = [
        { status: 'ACTIVE', _count: { status: 40 } },
        { status: 'REDEEMED', _count: { status: 30 } },
        { status: 'EXPIRED', _count: { status: 5 } }
      ];

      prismaService.coupon.findFirst.mockResolvedValueOnce(mockBatch);
      prismaService.coupon.groupBy.mockResolvedValueOnce(mockBatchCoupons);
      prismaService.submission.count
        .mockResolvedValueOnce(25) // total submissions
        .mockResolvedValueOnce(15); // with rewards

      const result = await service.getCampaignAnalytics(batchId);

      expect(result).toBeDefined();
      expect(result!.batchId).toBe(batchId);
      expect(result!.coupons.total).toBe(75);
      expect(result!.coupons.redeemed).toBe(30);
      expect(result!.totalSubmissions).toBe(25);
      expect(result!.totalRewardsAssigned).toBe(15);
      expect(result!.conversionRate).toBe(40);
      expect(result!.rewardAssignmentRate).toBe(60);
    });

    it('should return null for non-existent batch', async () => {
      prismaService.coupon.findFirst.mockResolvedValueOnce(null);

      const result = await service.getCampaignAnalytics('non-existent-batch');

      expect(result).toBeNull();
    });
  });

  describe('getTopPerformingBatches', () => {
    it('should return top performing batches sorted by conversion rate', async () => {
      const mockBatches = [
        { batchId: 'batch1' },
        { batchId: 'batch2' }
      ];

      // Mock for batch1
      const mockBatch1 = { batchId: 'batch1', createdAt: new Date('2024-01-01') };
      const mockBatch1Coupons = [
        { status: 'REDEEMED', _count: { status: 50 } },
        { status: 'ACTIVE', _count: { status: 50 } }
      ];

      // Mock for batch2
      const mockBatch2 = { batchId: 'batch2', createdAt: new Date('2024-01-02') };
      const mockBatch2Coupons = [
        { status: 'REDEEMED', _count: { status: 30 } },
        { status: 'ACTIVE', _count: { status: 70 } }
      ];

      prismaService.coupon.groupBy.mockResolvedValueOnce(mockBatches);
      
      // Mock sequential calls for each batch
      prismaService.coupon.findFirst
        .mockResolvedValueOnce(mockBatch1)
        .mockResolvedValueOnce(mockBatch2);

      prismaService.coupon.groupBy
        .mockResolvedValueOnce(mockBatch1Coupons)
        .mockResolvedValueOnce(mockBatch2Coupons);

      prismaService.submission.count
        .mockResolvedValueOnce(45) // batch1 submissions
        .mockResolvedValueOnce(25) // batch1 rewards
        .mockResolvedValueOnce(25) // batch2 submissions
        .mockResolvedValueOnce(15); // batch2 rewards

      const result = await service.getTopPerformingBatches(2);

      expect(result).toHaveLength(2);
      expect(result[0].batchId).toBe('batch1'); // Higher conversion rate (50%)
      expect(result[0].conversionRate).toBe(50);
      expect(result[1].batchId).toBe('batch2'); // Lower conversion rate (30%)
      expect(result[1].conversionRate).toBe(30);
    });
  });
});