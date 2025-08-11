import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int
} from '@nestjs/graphql';
import {
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
// import { PubSub } from 'graphql-subscriptions';
import { AnalyticsService } from '../../modules/analytics/analytics.service';
import { ExportService } from '../../modules/export/export.service';
import { SubmissionService } from '../../modules/submission/submission.service';
import { RewardDistributionService } from '../../modules/reward/reward-distribution.service';
import { ExportFormat } from '../../modules/export/dto/export-format.enum';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import {
  AnalyticsSummaryGraphQLDto,
  ConversionRateGraphQLDto,
  PerformanceMetricsGraphQLDto,
  CampaignAnalyticsGraphQLDto,
  RewardDistributionAnalyticsGraphQLDto,
  RewardDistributionFiltersGraphQLDto,
  SubmissionSearchQueryGraphQLDto,
  SubmissionSearchResultGraphQLDto,
  ExportResultGraphQLDto,
  ExportSubmissionsGraphQLDto,
  ExportCouponsGraphQLDto,
  ExportTemplatesGraphQLDto
} from './dto';

@Resolver()
export class DataManagementResolver {
  private readonly logger = new Logger(DataManagementResolver.name);
  // private readonly pubSub = new PubSub();

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
    private readonly submissionService: SubmissionService,
    private readonly rewardDistributionService: RewardDistributionService,
  ) { }

  // ==================== ANALYTICS QUERIES ====================

  @Query(() => AnalyticsSummaryGraphQLDto, {
    description: 'Get comprehensive analytics summary for dashboard (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async analyticsSummary(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AnalyticsSummaryGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested analytics summary`);

      const summary = await this.analyticsService.getAnalyticsSummary();

      // Publish real-time update
      // this.pubSub.publish('ANALYTICS_UPDATED', {
      //   analyticsUpdated: {
      //     type: 'SUMMARY_UPDATED',
      //     data: summary,
      //     timestamp: new Date(),
      //     adminId: currentAdmin.id
      //   }
      // });

      this.logger.log(`Successfully retrieved analytics summary for admin: ${currentAdmin.username}`);
      return summary;
    } catch (error) {
      this.logger.error(`Failed to get analytics summary: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve analytics summary');
    }
  }

  @Query(() => ConversionRateGraphQLDto, {
    description: 'Get detailed conversion rate metrics and performance data (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async conversionRates(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<ConversionRateGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested conversion rates`);

      const conversionRates = await this.analyticsService.getConversionRates();

      this.logger.log(`Successfully retrieved conversion rates for admin: ${currentAdmin.username}`);
      return conversionRates;
    } catch (error) {
      this.logger.error(`Failed to get conversion rates: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve conversion rates');
    }
  }

  @Query(() => PerformanceMetricsGraphQLDto, {
    description: 'Get performance metrics over time with configurable period (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async performanceMetrics(
    @Args('days', { type: () => Int, nullable: true, defaultValue: 30 }) days: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<PerformanceMetricsGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested performance metrics for ${days} days`);

      const metrics = await this.analyticsService.getPerformanceMetrics(days);

      this.logger.log(`Successfully retrieved performance metrics for admin: ${currentAdmin.username}`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get performance metrics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve performance metrics');
    }
  }

  @Query(() => CampaignAnalyticsGraphQLDto, {
    description: 'Get analytics for specific campaign (batch) (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async campaignAnalytics(
    @Args('batchId') batchId: string,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<CampaignAnalyticsGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested campaign analytics for batch: ${batchId}`);

      const analytics = await this.analyticsService.getCampaignAnalytics(batchId);

      if (!analytics) {
        throw new NotFoundException(`Campaign with batch ID ${batchId} not found`);
      }

      this.logger.log(`Successfully retrieved campaign analytics for batch: ${batchId}`);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get campaign analytics: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to retrieve campaign analytics');
    }
  }

  @Query(() => [CampaignAnalyticsGraphQLDto], {
    description: 'Get top performing campaigns (batches) (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async topPerformingCampaigns(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<CampaignAnalyticsGraphQLDto[]> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested top ${limit} performing campaigns`);

      const campaigns = await this.analyticsService.getTopPerformingBatches(limit);

      this.logger.log(`Successfully retrieved ${campaigns.length} top performing campaigns`);
      return campaigns;
    } catch (error) {
      this.logger.error(`Failed to get top performing campaigns: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve top performing campaigns');
    }
  }

  // ==================== REWARD DISTRIBUTION ANALYTICS ====================

  @Query(() => RewardDistributionAnalyticsGraphQLDto, {
    description: 'Get comprehensive reward distribution analytics and statistics (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardDistributionAnalytics(
    @Args('filters', { nullable: true }) filters?: RewardDistributionFiltersGraphQLDto,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<RewardDistributionAnalyticsGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested reward distribution analytics`);

      const analytics = await this.rewardDistributionService.getDistributionAnalytics(filters || {});

      // Transform assignmentTrends to convert categoryBreakdown to JSON string
      const transformedAnalytics = {
        ...analytics,
        assignmentTrends: analytics.assignmentTrends.map(trend => ({
          ...trend,
          categoryBreakdown: JSON.stringify(trend.categoryBreakdown)
        }))
      };

      this.logger.log(`Successfully retrieved reward distribution analytics`);
      return transformedAnalytics;
    } catch (error) {
      this.logger.error(`Failed to get reward distribution analytics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward distribution analytics');
    }
  }

  @Query(() => RewardDistributionAnalyticsGraphQLDto, {
    description: 'Get current reward inventory status and availability analytics (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardInventoryAnalytics(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<any> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward inventory analytics`);

      const inventory = await this.rewardDistributionService.getInventoryStatus();

      this.logger.log(`Successfully retrieved reward inventory analytics`);
      return inventory;
    } catch (error) {
      this.logger.error(`Failed to get reward inventory analytics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward inventory analytics');
    }
  }

  @Query(() => [RewardDistributionAnalyticsGraphQLDto], {
    description: 'Get reward assignment trends over time with category breakdown (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardTrends(
    @Args('period', { nullable: true, defaultValue: '30d' }) period: string,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<any> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward trends for period: ${period}`);

      const trends = await this.rewardDistributionService.getAssignmentTrends(period);

      this.logger.log(`Successfully retrieved reward trends for period: ${period}`);
      return trends;
    } catch (error) {
      this.logger.error(`Failed to get reward trends: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward trends');
    }
  }

  // ==================== SUBMISSION SEARCH ====================

  @Query(() => SubmissionSearchResultGraphQLDto, {
    description: 'Advanced submission search with filtering and pagination (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async searchSubmissions(
    @Args('query', { nullable: true }) query?: SubmissionSearchQueryGraphQLDto,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<SubmissionSearchResultGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} searching submissions with query:`, query);

      const searchQuery = {
        page: query?.page || 1,
        limit: Math.min(query?.limit || 20, 100),
        search: query?.filters?.query,
        hasReward: query?.filters?.hasReward,
        sortBy: query?.sortBy || 'submittedAt',
        sortOrder: (query?.sortOrder as 'asc' | 'desc') || 'desc',
        dateFrom: query?.filters?.dateFrom,
        dateTo: query?.filters?.dateTo,
        couponBatchId: query?.filters?.couponBatchId,
        rewardCategory: query?.filters?.rewardCategory,
        couponStatus: query?.filters?.couponStatus,
      };

      const results = await this.submissionService.getSubmissions(searchQuery);

      this.logger.log(`Successfully found ${results.data.length} submissions (total: ${results.total})`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to search submissions: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to search submissions');
    }
  }

  // ==================== EXPORT OPERATIONS ====================

  @Mutation(() => ExportResultGraphQLDto, {
    description: 'Export submissions to CSV, Excel, or PDF format with filtering options (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async exportSubmissions(
    @Args('input') input: ExportSubmissionsGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<ExportResultGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} exporting submissions in ${input.format} format`);

      // Convert GraphQL input to service input
      const serviceInput = {
        format: input.format as any,
        includeMetadata: input.includeMetadata,
        filters: input.filters ? {
          dateFrom: input.filters.dateFrom,
          dateTo: input.filters.dateTo,
          hasReward: input.filters.hasReward,
          couponBatchId: input.filters.couponBatchId,
          rewardCategory: input.filters.rewardCategory,
        } : undefined,
      };

      const exportResult = await this.exportService.exportSubmissions(serviceInput);

      const result = {
        data: exportResult.data,
        filename: exportResult.filename,
        mimeType: exportResult.mimeType,
        downloadUrl: `/api/data-management/download/${exportResult.filename}`,
        format: input.format as any,
        recordCount: 0, // This would be calculated by the export service
        generatedAt: new Date(),
      };

      // Publish real-time update
      // this.pubSub.publish('EXPORT_COMPLETED', {
      //   exportCompleted: {
      //     type: 'SUBMISSIONS_EXPORT',
      //     filename: result.filename,
      //     format: input.format,
      //     adminId: currentAdmin.id,
      //     timestamp: new Date()
      //   }
      // });

      this.logger.log(`Successfully exported submissions for admin: ${currentAdmin.username}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to export submissions: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to export submissions');
    }
  }

  @Mutation(() => ExportResultGraphQLDto, {
    description: 'Export coupon codes to CSV or PDF format with filtering options (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async exportCoupons(
    @Args('input') input: ExportCouponsGraphQLDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<ExportResultGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} exporting coupons in ${input.format} format`);

      // Convert GraphQL input to service input
      const serviceInput = {
        format: input.format as any,
        includeMetadata: input.includeMetadata,
        filters: input.filters ? {
          status: input.filters.status as any,
          batchId: input.filters.batchId,
          createdBy: input.filters.createdBy,
          dateFrom: input.filters.dateFrom,
          dateTo: input.filters.dateTo,
        } : undefined,
      };

      const exportResult = await this.exportService.exportCoupons(serviceInput);

      const result = {
        data: exportResult.data,
        filename: exportResult.filename,
        mimeType: exportResult.mimeType,
        downloadUrl: `/api/data-management/download/${exportResult.filename}`,
        format: input.format as any,
        recordCount: 0, // This would be calculated by the export service
        generatedAt: new Date(),
      };

      // Publish real-time update
      // this.pubSub.publish('EXPORT_COMPLETED', {
      //   exportCompleted: {
      //     type: 'COUPONS_EXPORT',
      //     filename: result.filename,
      //     format: input.format,
      //     adminId: currentAdmin.id,
      //     timestamp: new Date()
      //   }
      // });

      this.logger.log(`Successfully exported coupons for admin: ${currentAdmin.username}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to export coupons: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to export coupons');
    }
  }

  @Query(() => ExportTemplatesGraphQLDto, {
    description: 'Get available export templates and formats (Admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async exportTemplates(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<ExportTemplatesGraphQLDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested export templates`);

      const templates = {
        submissions: {
          formats: [ExportFormat.CSV, ExportFormat.EXCEL, ExportFormat.PDF],
          fields: [
            { key: 'id', label: 'ID', required: true, type: 'number' },
            { key: 'name', label: 'Name', required: true, type: 'string' },
            { key: 'email', label: 'Email', required: true, type: 'string' },
            { key: 'phone', label: 'Phone', required: true, type: 'string' },
            { key: 'address', label: 'Address', required: true, type: 'string' },
            { key: 'productExperience', label: 'Product Experience', required: true, type: 'string' },
            { key: 'couponCode', label: 'Coupon Code', required: true, type: 'string' },
            { key: 'submittedAt', label: 'Submitted At', required: true, type: 'date' },
            { key: 'rewardService', label: 'Reward Service', required: false, type: 'string' },
            { key: 'rewardType', label: 'Reward Type', required: false, type: 'string' },
            { key: 'rewardAssignedAt', label: 'Reward Assigned At', required: false, type: 'date' },
            { key: 'assignedBy', label: 'Assigned By Admin', required: false, type: 'string' }
          ],
          optionalFields: [
            { key: 'ipAddress', label: 'IP Address', required: false, type: 'string' },
            { key: 'userAgent', label: 'User Agent', required: false, type: 'string' },
            { key: 'batchId', label: 'Coupon Batch ID', required: false, type: 'string' },
            { key: 'couponStatus', label: 'Coupon Status', required: false, type: 'string' }
          ],
        },
        coupons: {
          formats: [ExportFormat.CSV, ExportFormat.PDF],
          fields: [
            { key: 'id', label: 'ID', required: true, type: 'number' },
            { key: 'couponCode', label: 'Coupon Code', required: true, type: 'string' },
            { key: 'status', label: 'Status', required: true, type: 'string' },
            { key: 'batchId', label: 'Batch ID', required: false, type: 'string' },
            { key: 'createdAt', label: 'Created At', required: true, type: 'date' },
            { key: 'expiresAt', label: 'Expires At', required: false, type: 'date' },
            { key: 'redeemedAt', label: 'Redeemed At', required: false, type: 'date' },
            { key: 'redeemedBy', label: 'Redeemed By', required: false, type: 'string' },
            { key: 'createdBy', label: 'Created By Admin', required: true, type: 'string' }
          ],
          optionalFields: [
            { key: 'codeLength', label: 'Code Length', required: false, type: 'number' },
            { key: 'generationMethod', label: 'Generation Method', required: false, type: 'string' }
          ],
        },
      };

      this.logger.log(`Successfully retrieved export templates for admin: ${currentAdmin.username}`);
      return templates;
    } catch (error) {
      this.logger.error(`Failed to get export templates: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve export templates');
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  // @Subscription(() => String, {
  //   description: 'Subscribe to real-time analytics updates (Admin only)'
  // })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  // analyticsUpdated() {
  //   return this.pubSub.asyncIterator('ANALYTICS_UPDATED');
  // }

  // @Subscription(() => String, {
  //   description: 'Subscribe to export completion notifications (Admin only)'
  // })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  // exportCompleted() {
  //   return this.pubSub.asyncIterator('EXPORT_COMPLETED');
  // }

  // @Subscription(() => String, {
  //   description: 'Subscribe to dashboard updates (Admin only)'
  // })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  // dashboardUpdated() {
  //   return this.pubSub.asyncIterator(['ANALYTICS_UPDATED', 'EXPORT_COMPLETED', 'SUBMISSION_CREATED', 'REWARD_ASSIGNED']);
  // }
}