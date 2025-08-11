import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from '../../../modules/analytics/analytics.service';
import { ExportService } from '../../../modules/export/export.service';
import { SubmissionService } from '../../../modules/submission/submission.service';
import { RewardDistributionService } from '../../../modules/reward/reward-distribution.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';
import { AdminRole } from '@prisma/client';

// Import DTOs
import {
  SubmissionSearchRestDto,
  AnalyticsSummaryRestDto,
  ConversionRateRestDto,
  PerformanceMetricsRestDto,
  CampaignAnalyticsRestDto,
  RewardDistributionAnalyticsRestDto,
  ExportSubmissionsRestDto,
  ExportCouponsRestDto,
  ExportRequestRestDto,
} from './dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    email: string;
    role: AdminRole;
  };
  traceId: string;
}

@ApiTags('Data Management')
@Controller('api/data-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataManagementController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
    private readonly submissionService: SubmissionService,
    private readonly rewardDistributionService: RewardDistributionService,
    private readonly responseBuilder: ResponseBuilderService,
  ) {}

  // ========================================
  // SUBMISSION SEARCH AND FILTERING
  // ========================================

  @Get('submissions/search')
  @ApiOperation({
    summary: 'Advanced submission search',
    description: 'Search and filter submissions with advanced criteria. Admin only.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search query (name, email, phone)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start date filter (ISO format)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End date filter (ISO format)',
  })
  @ApiQuery({
    name: 'hasReward',
    required: false,
    type: Boolean,
    description: 'Filter by reward assignment status',
  })
  @ApiQuery({
    name: 'couponBatchId',
    required: false,
    type: String,
    description: 'Filter by coupon batch ID',
  })
  @ApiQuery({
    name: 'rewardCategory',
    required: false,
    type: String,
    description: 'Filter by assigned reward category',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (submittedAt, name, email)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: SubmissionSearchRestDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async searchSubmissions(
    @Query() searchParams: any,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      // Build query parameters for submission service
      const queryDto = {
        page: parseInt(searchParams.page) || 1,
        limit: Math.min(parseInt(searchParams.limit) || 20, 100),
        search: searchParams.query,
        hasReward: searchParams.hasReward !== undefined ? searchParams.hasReward === 'true' : undefined,
        sortBy: searchParams.sortBy || 'submittedAt',
        sortOrder: searchParams.sortOrder || 'desc',
        dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
        dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
        couponBatchId: searchParams.couponBatchId,
        rewardCategory: searchParams.rewardCategory,
      };

      const results = await this.submissionService.getSubmissions(queryDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'submissions/search',
        queryParams: searchParams,
      });

      return this.responseBuilder.buildSuccessResponse(
        results,
        'Submission search completed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSION_SEARCH_ERROR',
          'Failed to search submissions',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/submissions/search`,
          error.message,
        ),
      );
    }
  }

  @Get('submissions/filter')
  @ApiOperation({
    summary: 'Filter submissions by criteria',
    description: 'Filter submissions using predefined criteria sets. Admin only.',
  })
  @ApiQuery({
    name: 'filter',
    required: true,
    enum: ['pending-rewards', 'recent', 'high-value', 'expired-coupons'],
    description: 'Predefined filter type',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results (default: 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filtered submissions retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async filterSubmissions(
    @Query('filter') filter: string,
    @Query('limit') limit: number = 50,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      let results;

      switch (filter) {
        case 'pending-rewards':
          results = await this.submissionService.getSubmissionsWithoutRewards();
          break;
        case 'recent':
          results = await this.submissionService.getRecentSubmissions(limit);
          break;
        case 'high-value':
          // Get submissions with premium reward assignments
          const queryDto = {
            page: 1,
            limit,
            hasReward: true,
            sortBy: 'rewardAssignedAt',
            sortOrder: 'desc' as const,
          };
          const paginatedResults = await this.submissionService.getSubmissions(queryDto);
          results = paginatedResults.data;
          break;
        case 'expired-coupons':
          // Get submissions with expired coupons
          const expiredQuery = {
            page: 1,
            limit,
            couponStatus: 'EXPIRED',
            sortBy: 'submittedAt',
            sortOrder: 'desc' as const,
          };
          const expiredResults = await this.submissionService.getSubmissions(expiredQuery);
          results = expiredResults.data;
          break;
        default:
          throw new BadRequestException('Invalid filter type');
      }

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'submissions/filter',
        queryParams: { filter, limit },
      });

      return this.responseBuilder.buildSuccessResponse(
        results,
        `Filtered submissions (${filter}) retrieved successfully`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSION_FILTER_ERROR',
          'Failed to filter submissions',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/submissions/filter`,
          error.message,
        ),
      );
    }
  }

  // ========================================
  // EXPORT ENDPOINTS
  // ========================================

  @Post('export/submissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export submissions data',
    description: 'Export submissions to CSV, Excel, or PDF format with filtering options. Admin only.',
  })
  @ApiBody({
    type: ExportSubmissionsRestDto,
    description: 'Export configuration and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            downloadUrl: { type: 'string' },
            filename: { type: 'string' },
            format: { type: 'string' },
            recordCount: { type: 'number' },
            generatedAt: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async exportSubmissions(
    @Body() exportDto: ExportSubmissionsRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const exportResult = await this.exportService.exportSubmissions(exportDto);

      const responseData = {
        downloadUrl: `${req.protocol}://${req.get('host')}/api/data-management/download/${exportResult.filename}`,
        filename: exportResult.filename,
        format: exportDto.format,
        recordCount: 0, // This would be calculated by the export service
        generatedAt: new Date().toISOString(),
        data: exportResult.data, // Base64 encoded file data
        mimeType: exportResult.mimeType,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'export/submissions',
      });

      return this.responseBuilder.buildSuccessResponse(
        responseData,
        'Submissions export completed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'EXPORT_ERROR',
          'Failed to export submissions',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/export/submissions`,
          error.message,
        ),
      );
    }
  }

  @Post('export/coupons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export coupon codes',
    description: 'Export coupon codes to CSV or PDF format with filtering options. Admin only.',
  })
  @ApiBody({
    type: ExportCouponsRestDto,
    description: 'Export configuration and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export completed successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async exportCoupons(
    @Body() exportDto: ExportCouponsRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const exportResult = await this.exportService.exportCoupons(exportDto);

      const responseData = {
        downloadUrl: `${req.protocol}://${req.get('host')}/api/data-management/download/${exportResult.filename}`,
        filename: exportResult.filename,
        format: exportDto.format,
        recordCount: 0, // This would be calculated by the export service
        generatedAt: new Date().toISOString(),
        data: exportResult.data, // Base64 encoded file data
        mimeType: exportResult.mimeType,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'export/coupons',
      });

      return this.responseBuilder.buildSuccessResponse(
        responseData,
        'Coupons export completed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'EXPORT_ERROR',
          'Failed to export coupons',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/export/coupons`,
          error.message,
        ),
      );
    }
  }

  @Get('export/templates')
  @ApiOperation({
    summary: 'Get available export templates',
    description: 'Get list of available export templates and formats. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export templates retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getExportTemplates(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const templates = {
        submissions: {
          formats: ['CSV', 'EXCEL', 'PDF'],
          fields: [
            'id', 'name', 'email', 'phone', 'address', 'productExperience',
            'couponCode', 'submittedAt', 'rewardService', 'rewardType',
            'rewardAssignedAt', 'assignedBy'
          ],
          optionalFields: ['ipAddress', 'userAgent', 'batchId', 'couponStatus'],
        },
        coupons: {
          formats: ['CSV', 'PDF'],
          fields: [
            'id', 'couponCode', 'status', 'batchId', 'createdAt',
            'expiresAt', 'redeemedAt', 'redeemedBy', 'createdBy'
          ],
          optionalFields: ['codeLength', 'generationMethod'],
        },
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'export/templates',
      });

      return this.responseBuilder.buildSuccessResponse(
        templates,
        'Export templates retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'TEMPLATES_ERROR',
          'Failed to retrieve export templates',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/export/templates`,
          error.message,
        ),
      );
    }
  }

  // ========================================
  // ANALYTICS DASHBOARD ENDPOINTS
  // ========================================

  @Get('analytics/summary')
  @ApiOperation({
    summary: 'Get analytics summary',
    description: 'Get comprehensive analytics summary for dashboard. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics summary retrieved successfully',
    type: AnalyticsSummaryRestDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getAnalyticsSummary(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<AnalyticsSummaryRestDto>> {
    try {
      const summary = await this.analyticsService.getAnalyticsSummary();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/summary',
      });

      return this.responseBuilder.buildSuccessResponse(
        summary,
        'Analytics summary retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve analytics summary',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/summary`,
          error.message,
        ),
      );
    }
  }

  @Get('analytics/conversion-rates')
  @ApiOperation({
    summary: 'Get conversion rate analytics',
    description: 'Get detailed conversion rate metrics and performance data. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversion rates retrieved successfully',
    type: ConversionRateRestDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getConversionRates(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<ConversionRateRestDto>> {
    try {
      const conversionRates = await this.analyticsService.getConversionRates();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/conversion-rates',
      });

      return this.responseBuilder.buildSuccessResponse(
        conversionRates,
        'Conversion rates retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve conversion rates',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/conversion-rates`,
          error.message,
        ),
      );
    }
  }

  @Get('analytics/performance')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Get performance metrics over time with configurable period. Admin only.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics retrieved successfully',
    type: PerformanceMetricsRestDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getPerformanceMetrics(
    @Query('days') days: number = 30,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<PerformanceMetricsRestDto>> {
    try {
      const metrics = await this.analyticsService.getPerformanceMetrics(days);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/performance',
        queryParams: { days },
      });

      return this.responseBuilder.buildSuccessResponse(
        metrics,
        'Performance metrics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve performance metrics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/performance`,
          error.message,
        ),
      );
    }
  }

  @Get('analytics/campaigns')
  @ApiOperation({
    summary: 'Get campaign analytics',
    description: 'Get analytics for all campaigns (batches) or specific campaign. Admin only.',
  })
  @ApiQuery({
    name: 'batchId',
    required: false,
    type: String,
    description: 'Specific batch ID to analyze',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of campaigns (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign analytics retrieved successfully',
    type: [CampaignAnalyticsRestDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getCampaignAnalytics(
    @Request() req: AuthenticatedRequest,
    @Query('batchId') batchId?: string,
    @Query('limit') limit: number = 10,
  ): Promise<StandardApiResponse<CampaignAnalyticsRestDto | CampaignAnalyticsRestDto[]>> {
    try {
      let analytics;

      if (batchId) {
        analytics = await this.analyticsService.getCampaignAnalytics(batchId);
        if (!analytics) {
          throw new NotFoundException(`Campaign with batch ID ${batchId} not found`);
        }
      } else {
        analytics = await this.analyticsService.getTopPerformingBatches(limit);
      }

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/campaigns',
        queryParams: { batchId, limit },
      });

      return this.responseBuilder.buildSuccessResponse(
        analytics,
        batchId 
          ? 'Campaign analytics retrieved successfully'
          : 'Top performing campaigns retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve campaign analytics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/campaigns`,
          error.message,
        ),
      );
    }
  }

  // ========================================
  // REWARD DISTRIBUTION ANALYTICS
  // ========================================

  @Get('analytics/reward-distribution')
  @ApiOperation({
    summary: 'Get reward distribution analytics',
    description: 'Get comprehensive reward distribution analytics and statistics. Admin only.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by reward category',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start date for analysis (ISO format)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End date for analysis (ISO format)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward distribution analytics retrieved successfully',
    type: RewardDistributionAnalyticsRestDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getRewardDistributionAnalytics(
    @Request() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<StandardApiResponse<RewardDistributionAnalyticsRestDto>> {
    try {
      const filters = {
        category,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      };

      const analytics = await this.rewardDistributionService.getDistributionAnalytics(filters);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/reward-distribution',
        queryParams: { category, dateFrom, dateTo },
      });

      return this.responseBuilder.buildSuccessResponse(
        analytics,
        'Reward distribution analytics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve reward distribution analytics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/reward-distribution`,
          error.message,
        ),
      );
    }
  }

  @Get('analytics/reward-inventory')
  @ApiOperation({
    summary: 'Get reward inventory analytics',
    description: 'Get current reward inventory status and availability analytics. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward inventory analytics retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getRewardInventoryAnalytics(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const inventory = await this.rewardDistributionService.getInventoryStatus();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/reward-inventory',
      });

      return this.responseBuilder.buildSuccessResponse(
        inventory,
        'Reward inventory analytics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve reward inventory analytics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/reward-inventory`,
          error.message,
        ),
      );
    }
  }

  @Get('analytics/reward-trends')
  @ApiOperation({
    summary: 'Get reward assignment trends',
    description: 'Get reward assignment trends over time with category breakdown. Admin only.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', '1y'],
    description: 'Analysis period (default: 30d)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward trends retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getRewardTrends(
    @Query('period') period: string = '30d',
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const trends = await this.rewardDistributionService.getAssignmentTrends(period);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/data-management`,
        action: 'analytics/reward-trends',
        queryParams: { period },
      });

      return this.responseBuilder.buildSuccessResponse(
        trends,
        'Reward trends retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ANALYTICS_ERROR',
          'Failed to retrieve reward trends',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/analytics/reward-trends`,
          error.message,
        ),
      );
    }
  }

  // ========================================
  // UTILITY ENDPOINTS
  // ========================================

  @Get('download/:filename')
  @ApiOperation({
    summary: 'Download exported file',
    description: 'Download previously exported file by filename. Admin only.',
  })
  @ApiParam({
    name: 'filename',
    type: String,
    description: 'Filename to download',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
  })
  @ApiNotFoundResponse({
    description: 'File not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async downloadFile(
    @Query('filename') filename: string,
    @Res() res: Response,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      // This would typically serve files from a secure storage location
      // For now, we'll return a placeholder response
      throw new NotFoundException('File download functionality not yet implemented');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'DOWNLOAD_ERROR',
          'Failed to download file',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/download/${filename}`,
          error.message,
        ),
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Data management health check',
    description: 'Check the health status of data management services. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async healthCheck(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          analytics: 'operational',
          export: 'operational',
          database: 'operational',
        },
        version: '1.0.0',
      };

      return this.responseBuilder.buildSuccessResponse(
        healthStatus,
        'Data management services are healthy',
        HttpStatus.OK,
        req.traceId || 'unknown',
        { self: `${req.protocol}://${req.get('host')}/api/data-management/health` },
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'HEALTH_CHECK_ERROR',
          'Health check failed',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/data-management/health`,
          error.message,
        ),
      );
    }
  }
}