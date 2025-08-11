import { Test, TestingModule } from '@nestjs/testing';
import { DataManagementController } from './data-management.controller';
import { AnalyticsService } from '../../../modules/analytics/analytics.service';
import { ExportService } from '../../../modules/export/export.service';
import { SubmissionService } from '../../../modules/submission/submission.service';
import { RewardDistributionService } from '../../../modules/reward/reward-distribution.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

describe('DataManagementController', () => {
  let controller: DataManagementController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let exportService: jest.Mocked<ExportService>;
  let submissionService: jest.Mocked<SubmissionService>;
  let rewardDistributionService: jest.Mocked<RewardDistributionService>;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;

  const mockAuthenticatedRequest = {
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: AdminRole.ADMIN,
    },
    traceId: 'test-trace-id',
    protocol: 'https',
    get: jest.fn().mockReturnValue('localhost:3000'),
  };

  beforeEach(async () => {
    const mockAnalyticsService = {
      getAnalyticsSummary: jest.fn(),
      getConversionRates: jest.fn(),
      getPerformanceMetrics: jest.fn(),
      getCampaignAnalytics: jest.fn(),
      getTopPerformingBatches: jest.fn(),
    };

    const mockExportService = {
      exportSubmissions: jest.fn(),
      exportCoupons: jest.fn(),
    };

    const mockSubmissionService = {
      getSubmissions: jest.fn(),
      getSubmissionsWithoutRewards: jest.fn(),
      getRecentSubmissions: jest.fn(),
    };

    const mockRewardDistributionService = {
      getDistributionAnalytics: jest.fn(),
      getInventoryStatus: jest.fn(),
      getAssignmentTrends: jest.fn(),
    };

    const mockResponseBuilder = {
      buildSuccessResponse: jest.fn().mockImplementation((data, message, status, traceId, links) => ({
        success: true,
        statusCode: status,
        message,
        data,
        traceId,
        links,
      })),
      buildErrorResponse: jest.fn(),
      generateHATEOASLinks: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataManagementController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: ExportService, useValue: mockExportService },
        { provide: SubmissionService, useValue: mockSubmissionService },
        { provide: RewardDistributionService, useValue: mockRewardDistributionService },
        { provide: ResponseBuilderService, useValue: mockResponseBuilder },
      ],
    }).compile();

    controller = module.get<DataManagementController>(DataManagementController);
    analyticsService = module.get(AnalyticsService);
    exportService = module.get(ExportService);
    submissionService = module.get(SubmissionService);
    rewardDistributionService = module.get(RewardDistributionService);
    responseBuilder = module.get(ResponseBuilderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchSubmissions', () => {
    it('should search submissions successfully', async () => {
      const mockResults = {
        data: [{ id: 1, name: 'John Doe', email: 'john@example.com' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      submissionService.getSubmissions.mockResolvedValue(mockResults);

      const searchParams = {
        query: 'john',
        page: '1',
        limit: '20',
      };

      const result = await controller.searchSubmissions(searchParams, mockAuthenticatedRequest as any);

      expect(submissionService.getSubmissions).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'john',
        hasReward: undefined,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        dateFrom: undefined,
        dateTo: undefined,
        couponBatchId: undefined,
        rewardCategory: undefined,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });

    it('should handle search errors', async () => {
      submissionService.getSubmissions.mockRejectedValue(new Error('Database error'));

      const searchParams = { query: 'test' };

      await expect(
        controller.searchSubmissions(searchParams, mockAuthenticatedRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('filterSubmissions', () => {
    it('should filter submissions by pending-rewards', async () => {
      const mockResults = [{ id: 1, name: 'John Doe' }];
      submissionService.getSubmissionsWithoutRewards.mockResolvedValue(mockResults);

      const result = await controller.filterSubmissions(
        'pending-rewards',
        50,
        mockAuthenticatedRequest as any
      );

      expect(submissionService.getSubmissionsWithoutRewards).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });

    it('should filter submissions by recent', async () => {
      const mockResults = [{ id: 1, name: 'John Doe' }];
      submissionService.getRecentSubmissions.mockResolvedValue(mockResults);

      const result = await controller.filterSubmissions(
        'recent',
        50,
        mockAuthenticatedRequest as any
      );

      expect(submissionService.getRecentSubmissions).toHaveBeenCalledWith(50);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });

    it('should throw error for invalid filter type', async () => {
      await expect(
        controller.filterSubmissions('invalid-filter', 50, mockAuthenticatedRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportSubmissions', () => {
    it('should export submissions successfully', async () => {
      const mockExportResult = {
        data: 'base64-encoded-data',
        filename: 'submissions_export_2024-01-15.csv',
        mimeType: 'text/csv',
      };

      exportService.exportSubmissions.mockResolvedValue(mockExportResult);

      const exportDto = {
        format: 'CSV' as any,
        includeMetadata: false,
      };

      const result = await controller.exportSubmissions(exportDto, mockAuthenticatedRequest as any);

      expect(exportService.exportSubmissions).toHaveBeenCalledWith(exportDto);
      expect(result.success).toBe(true);
      expect(result.data.filename).toBe(mockExportResult.filename);
    });

    it('should handle export errors', async () => {
      exportService.exportSubmissions.mockRejectedValue(new Error('Export failed'));

      const exportDto = {
        format: 'CSV' as any,
        includeMetadata: false,
      };

      await expect(
        controller.exportSubmissions(exportDto, mockAuthenticatedRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should get analytics summary successfully', async () => {
      const mockSummary = {
        coupons: { totalGenerated: 1000, totalRedeemed: 200 },
        submissions: { totalSubmissions: 180 },
        rewards: { totalRewardAccounts: 500 },
        conversion: { couponRedemptionRate: 20.0 },
        rewardSelection: { totalRewardSelections: 120 },
        generatedAt: new Date(),
      };

      analyticsService.getAnalyticsSummary.mockResolvedValue(mockSummary);

      const result = await controller.getAnalyticsSummary(mockAuthenticatedRequest as any);

      expect(analyticsService.getAnalyticsSummary).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
    });

    it('should handle analytics errors', async () => {
      analyticsService.getAnalyticsSummary.mockRejectedValue(new Error('Analytics error'));

      await expect(
        controller.getAnalyticsSummary(mockAuthenticatedRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConversionRates', () => {
    it('should get conversion rates successfully', async () => {
      const mockRates = {
        couponRedemptionRate: 20.0,
        rewardAssignmentRate: 66.67,
        overallConversionRate: 12.0,
        totalCouponsGenerated: 1000,
        totalCouponsRedeemed: 200,
        totalSubmissions: 180,
        totalRewardsAssigned: 120,
      };

      analyticsService.getConversionRates.mockResolvedValue(mockRates);

      const result = await controller.getConversionRates(mockAuthenticatedRequest as any);

      expect(analyticsService.getConversionRates).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRates);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should get performance metrics successfully', async () => {
      const mockMetrics = {
        periodDays: 30,
        startDate: new Date(),
        endDate: new Date(),
        dailyCouponStats: [],
        dailySubmissionStats: [],
      };

      analyticsService.getPerformanceMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getPerformanceMetrics(30, mockAuthenticatedRequest as any);

      expect(analyticsService.getPerformanceMetrics).toHaveBeenCalledWith(30);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMetrics);
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should get specific campaign analytics', async () => {
      const mockAnalytics = {
        batchId: 'BATCH_001',
        coupons: { total: 100, redeemed: 20 },
        totalSubmissions: 18,
        conversionRate: 20.0,
      };

      analyticsService.getCampaignAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getCampaignAnalytics(
        'BATCH_001',
        10,
        mockAuthenticatedRequest as any
      );

      expect(analyticsService.getCampaignAnalytics).toHaveBeenCalledWith('BATCH_001');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalytics);
    });

    it('should get top performing campaigns', async () => {
      const mockCampaigns = [
        { batchId: 'BATCH_001', conversionRate: 25.0 },
        { batchId: 'BATCH_002', conversionRate: 20.0 },
      ];

      analyticsService.getTopPerformingBatches.mockResolvedValue(mockCampaigns);

      const result = await controller.getCampaignAnalytics(
        undefined,
        10,
        mockAuthenticatedRequest as any
      );

      expect(analyticsService.getTopPerformingBatches).toHaveBeenCalledWith(10);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCampaigns);
    });

    it('should handle campaign not found', async () => {
      analyticsService.getCampaignAnalytics.mockResolvedValue(null);

      await expect(
        controller.getCampaignAnalytics('NONEXISTENT', 10, mockAuthenticatedRequest as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRewardDistributionAnalytics', () => {
    it('should get reward distribution analytics successfully', async () => {
      const mockAnalytics = {
        totalRewardAccounts: 500,
        totalAssignedAccounts: 120,
        totalAvailableAccounts: 380,
        overallAssignmentRate: 24.0,
        categoryDistribution: [],
        serviceDistribution: [],
        assignmentTrends: [],
        mostPopularCategory: 'STREAMING_SERVICE',
        leastPopularCategory: 'OTHER',
        averageAssignmentTime: 48.5,
        peakAssignmentDay: 'Monday',
        appliedFilters: {},
        generatedAt: new Date(),
      };

      rewardDistributionService.getDistributionAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getRewardDistributionAnalytics(
        undefined,
        undefined,
        undefined,
        mockAuthenticatedRequest as any
      );

      expect(rewardDistributionService.getDistributionAnalytics).toHaveBeenCalledWith({
        category: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalytics);
    });
  });

  describe('getRewardInventoryAnalytics', () => {
    it('should get reward inventory analytics successfully', async () => {
      const mockInventory = {
        overview: { total: 500, available: 380, assigned: 120 },
        categoryBreakdown: [],
        lowStockAlerts: [],
        utilizationRate: 24.0,
        generatedAt: new Date(),
      };

      rewardDistributionService.getInventoryStatus.mockResolvedValue(mockInventory);

      const result = await controller.getRewardInventoryAnalytics(mockAuthenticatedRequest as any);

      expect(rewardDistributionService.getInventoryStatus).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInventory);
    });
  });

  describe('getRewardTrends', () => {
    it('should get reward trends successfully', async () => {
      const mockTrends = {
        period: '30d',
        days: 30,
        trends: [],
        totalAssignments: 120,
        averagePerDay: 4.0,
        generatedAt: new Date(),
      };

      rewardDistributionService.getAssignmentTrends.mockResolvedValue(mockTrends);

      const result = await controller.getRewardTrends('30d', mockAuthenticatedRequest as any);

      expect(rewardDistributionService.getAssignmentTrends).toHaveBeenCalledWith('30d');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTrends);
    });
  });

  describe('getExportTemplates', () => {
    it('should get export templates successfully', async () => {
      const result = await controller.getExportTemplates(mockAuthenticatedRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('submissions');
      expect(result.data).toHaveProperty('coupons');
      expect(result.data.submissions).toHaveProperty('formats');
      expect(result.data.submissions).toHaveProperty('fields');
    });
  });

  describe('healthCheck', () => {
    it('should return health status successfully', async () => {
      const result = await controller.healthCheck(mockAuthenticatedRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'healthy');
      expect(result.data).toHaveProperty('services');
      expect(result.data.services).toHaveProperty('analytics', 'operational');
    });
  });
});