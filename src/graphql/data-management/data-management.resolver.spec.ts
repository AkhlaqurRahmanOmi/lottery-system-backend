import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataManagementResolver } from './data-management.resolver';
import { AnalyticsService } from '../../modules/analytics/analytics.service';
import { ExportService } from '../../modules/export/export.service';
import { SubmissionService } from '../../modules/submission/submission.service';
import { RewardDistributionService } from '../../modules/reward/reward-distribution.service';
import { AdminRole } from '@prisma/client';
import { ExportFormat } from '../../modules/export/dto/export-format.enum';

describe('DataManagementResolver', () => {
  let resolver: DataManagementResolver;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let exportService: jest.Mocked<ExportService>;
  let submissionService: jest.Mocked<SubmissionService>;
  let rewardDistributionService: jest.Mocked<RewardDistributionService>;

  const mockAdmin = {
    id: 1,
    username: 'testadmin',
    email: 'admin@test.com',
    role: AdminRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordHash: 'hashedpassword',
    lastLogin: new Date(),
  };

  const mockAnalyticsSummary = {
    coupons: {
      totalGenerated: 100,
      totalActive: 80,
      totalRedeemed: 15,
      totalExpired: 3,
      totalDeactivated: 2,
      totalBatches: 5,
    },
    submissions: {
      totalSubmissions: 15,
      submissionsWithRewards: 10,
      uniqueUsers: 15,
    },
    rewards: {
      totalRewardAccounts: 50,
      availableRewards: 40,
      assignedRewards: 10,
      expiredRewards: 0,
    },
    conversion: {
      couponRedemptionRate: 15.0,
      rewardAssignmentRate: 66.67,
      overallConversionRate: 10.0,
      totalCouponsGenerated: 100,
      totalCouponsRedeemed: 15,
      totalSubmissions: 15,
      totalRewardsAssigned: 10,
    },
    rewardSelection: {
      totalRewardSelections: 10,
      rewardPopularity: [],
      categoryPopularity: [],
      mostPopularReward: undefined,
      leastPopularReward: undefined,
    },
    generatedAt: new Date(),
  };

  const mockConversionRates = {
    couponRedemptionRate: 15.0,
    rewardAssignmentRate: 66.67,
    overallConversionRate: 10.0,
    totalCouponsGenerated: 100,
    totalCouponsRedeemed: 15,
    totalSubmissions: 15,
    totalRewardsAssigned: 10,
  };

  const mockPerformanceMetrics = {
    periodDays: 30,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    dailyCouponStats: [
      {
        date: new Date('2024-01-01'),
        couponsGenerated: 10,
        couponsRedeemed: 2,
      },
    ],
    dailySubmissionStats: [
      {
        date: new Date('2024-01-01'),
        submissions: 2,
        rewardsAssigned: 1,
      },
    ],
  };

  const mockCampaignAnalytics = {
    batchId: 'BATCH001',
    coupons: {
      total: 50,
      active: 40,
      redeemed: 8,
      expired: 1,
      deactivated: 1,
    },
    totalSubmissions: 8,
    totalRewardsAssigned: 6,
    conversionRate: 16.0,
    rewardAssignmentRate: 75.0,
    createdAt: new Date(),
  };

  const mockSubmissionSearchResult = {
    data: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
        submittedAt: new Date(),
        couponId: 1,
        selectedRewardId: 1,
        assignedRewardId: null,
        rewardAssignedAt: null,
        rewardAssignedBy: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        additionalData: null,
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const mockExportResult = {
    data: 'base64encodeddata',
    filename: 'export_2024-01-01.csv',
    mimeType: 'text/csv',
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
    };

    const mockRewardDistributionService = {
      getDistributionAnalytics: jest.fn(),
      getInventoryStatus: jest.fn(),
      getAssignmentTrends: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataManagementResolver,
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: ExportService,
          useValue: mockExportService,
        },
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
        {
          provide: RewardDistributionService,
          useValue: mockRewardDistributionService,
        },
      ],
    }).compile();

    resolver = module.get<DataManagementResolver>(DataManagementResolver);
    analyticsService = module.get(AnalyticsService);
    exportService = module.get(ExportService);
    submissionService = module.get(SubmissionService);
    rewardDistributionService = module.get(RewardDistributionService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('analyticsSummary', () => {
    it('should return analytics summary successfully', async () => {
      analyticsService.getAnalyticsSummary.mockResolvedValue(mockAnalyticsSummary);

      const result = await resolver.analyticsSummary(mockAdmin);

      expect(result).toEqual(mockAnalyticsSummary);
      expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when service fails', async () => {
      analyticsService.getAnalyticsSummary.mockRejectedValue(new Error('Service error'));

      await expect(resolver.analyticsSummary(mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('conversionRates', () => {
    it('should return conversion rates successfully', async () => {
      analyticsService.getConversionRates.mockResolvedValue(mockConversionRates);

      const result = await resolver.conversionRates(mockAdmin);

      expect(result).toEqual(mockConversionRates);
      expect(analyticsService.getConversionRates).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when service fails', async () => {
      analyticsService.getConversionRates.mockRejectedValue(new Error('Service error'));

      await expect(resolver.conversionRates(mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('performanceMetrics', () => {
    it('should return performance metrics with default days', async () => {
      analyticsService.getPerformanceMetrics.mockResolvedValue(mockPerformanceMetrics);

      const result = await resolver.performanceMetrics(30, mockAdmin);

      expect(result).toEqual(mockPerformanceMetrics);
      expect(analyticsService.getPerformanceMetrics).toHaveBeenCalledWith(30);
    });

    it('should return performance metrics with custom days', async () => {
      analyticsService.getPerformanceMetrics.mockResolvedValue(mockPerformanceMetrics);

      const result = await resolver.performanceMetrics(7, mockAdmin);

      expect(result).toEqual(mockPerformanceMetrics);
      expect(analyticsService.getPerformanceMetrics).toHaveBeenCalledWith(7);
    });

    it('should throw BadRequestException when service fails', async () => {
      analyticsService.getPerformanceMetrics.mockRejectedValue(new Error('Service error'));

      await expect(resolver.performanceMetrics(30, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('campaignAnalytics', () => {
    it('should return campaign analytics successfully', async () => {
      analyticsService.getCampaignAnalytics.mockResolvedValue(mockCampaignAnalytics);

      const result = await resolver.campaignAnalytics('BATCH001', mockAdmin);

      expect(result).toEqual(mockCampaignAnalytics);
      expect(analyticsService.getCampaignAnalytics).toHaveBeenCalledWith('BATCH001');
    });

    it('should throw NotFoundException when campaign not found', async () => {
      analyticsService.getCampaignAnalytics.mockResolvedValue(null);

      await expect(resolver.campaignAnalytics('NONEXISTENT', mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when service fails', async () => {
      analyticsService.getCampaignAnalytics.mockRejectedValue(new Error('Service error'));

      await expect(resolver.campaignAnalytics('BATCH001', mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('topPerformingCampaigns', () => {
    it('should return top performing campaigns successfully', async () => {
      const mockCampaigns = [mockCampaignAnalytics];
      analyticsService.getTopPerformingBatches.mockResolvedValue(mockCampaigns);

      const result = await resolver.topPerformingCampaigns(10, mockAdmin);

      expect(result).toEqual(mockCampaigns);
      expect(analyticsService.getTopPerformingBatches).toHaveBeenCalledWith(10);
    });

    it('should throw BadRequestException when service fails', async () => {
      analyticsService.getTopPerformingBatches.mockRejectedValue(new Error('Service error'));

      await expect(resolver.topPerformingCampaigns(10, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchSubmissions', () => {
    it('should search submissions successfully', async () => {
      submissionService.getSubmissions.mockResolvedValue(mockSubmissionSearchResult);

      const query = {
        page: 1,
        limit: 20,
        sortBy: 'submittedAt',
        sortOrder: 'desc' as const,
        filters: {
          query: 'john',
          hasReward: false,
        },
      };

      const result = await resolver.searchSubmissions(query, mockAdmin);

      expect(result).toEqual(mockSubmissionSearchResult);
      expect(submissionService.getSubmissions).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'john',
        hasReward: false,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        dateFrom: undefined,
        dateTo: undefined,
        couponBatchId: undefined,
        rewardCategory: undefined,
        couponStatus: undefined,
      });
    });

    it('should use default values when query is not provided', async () => {
      submissionService.getSubmissions.mockResolvedValue(mockSubmissionSearchResult);

      const result = await resolver.searchSubmissions(undefined, mockAdmin);

      expect(result).toEqual(mockSubmissionSearchResult);
      expect(submissionService.getSubmissions).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        hasReward: undefined,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        dateFrom: undefined,
        dateTo: undefined,
        couponBatchId: undefined,
        rewardCategory: undefined,
        couponStatus: undefined,
      });
    });

    it('should throw BadRequestException when service fails', async () => {
      submissionService.getSubmissions.mockRejectedValue(new Error('Service error'));

      await expect(resolver.searchSubmissions(undefined, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportSubmissions', () => {
    it('should export submissions successfully', async () => {
      exportService.exportSubmissions.mockResolvedValue(mockExportResult);

      const input = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        filters: {
          hasReward: true,
        },
      };

      const result = await resolver.exportSubmissions(input, mockAdmin);

      expect(result.data).toBe(mockExportResult.data);
      expect(result.filename).toBe(mockExportResult.filename);
      expect(result.mimeType).toBe(mockExportResult.mimeType);
      expect(result.format).toBe(ExportFormat.CSV);
      expect(exportService.exportSubmissions).toHaveBeenCalledWith(input);
    });

    it('should throw BadRequestException when service fails', async () => {
      exportService.exportSubmissions.mockRejectedValue(new Error('Service error'));

      const input = {
        format: ExportFormat.CSV,
        includeMetadata: false,
      };

      await expect(resolver.exportSubmissions(input, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportCoupons', () => {
    it('should export coupons successfully', async () => {
      exportService.exportCoupons.mockResolvedValue(mockExportResult);

      const input = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        filters: {
          status: 'ACTIVE' as any,
        },
      };

      const result = await resolver.exportCoupons(input, mockAdmin);

      expect(result.data).toBe(mockExportResult.data);
      expect(result.filename).toBe(mockExportResult.filename);
      expect(result.mimeType).toBe(mockExportResult.mimeType);
      expect(result.format).toBe(ExportFormat.CSV);
      expect(exportService.exportCoupons).toHaveBeenCalledWith(input);
    });

    it('should throw BadRequestException when service fails', async () => {
      exportService.exportCoupons.mockRejectedValue(new Error('Service error'));

      const input = {
        format: ExportFormat.CSV,
        includeMetadata: false,
      };

      await expect(resolver.exportCoupons(input, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportTemplates', () => {
    it('should return export templates successfully', async () => {
      const result = await resolver.exportTemplates(mockAdmin);

      expect(result).toHaveProperty('submissions');
      expect(result).toHaveProperty('coupons');
      expect(result.submissions.formats).toContain('CSV');
      expect(result.submissions.formats).toContain('EXCEL');
      expect(result.submissions.formats).toContain('PDF');
      expect(result.coupons.formats).toContain('CSV');
      expect(result.coupons.formats).toContain('PDF');
    });
  });

  describe('rewardDistributionAnalytics', () => {
    it('should return reward distribution analytics successfully', async () => {
      const mockAnalytics = {
        totalRewardAccounts: 50,
        totalAssignedAccounts: 10,
        totalAvailableAccounts: 40,
        overallAssignmentRate: 20.0,
        categoryDistribution: [],
        serviceDistribution: [],
        assignmentTrends: [],
        mostPopularCategory: 'N/A',
        leastPopularCategory: 'N/A',
        averageAssignmentTime: 48.5,
        peakAssignmentDay: 'Monday',
        appliedFilters: {},
        generatedAt: new Date(),
      };

      rewardDistributionService.getDistributionAnalytics.mockResolvedValue(mockAnalytics);

      const result = await resolver.rewardDistributionAnalytics(undefined, mockAdmin);

      expect(result).toEqual(mockAnalytics);
      expect(rewardDistributionService.getDistributionAnalytics).toHaveBeenCalledWith({});
    });

    it('should throw BadRequestException when service fails', async () => {
      rewardDistributionService.getDistributionAnalytics.mockRejectedValue(new Error('Service error'));

      await expect(resolver.rewardDistributionAnalytics(undefined, mockAdmin)).rejects.toThrow(BadRequestException);
    });
  });
});