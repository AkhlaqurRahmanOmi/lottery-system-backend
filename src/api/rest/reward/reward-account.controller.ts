import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RewardDistributionService } from '../../../modules/reward/reward-distribution.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';

// Import REST-specific DTOs
import {
  CreateRewardAccountRestDto,
  UpdateRewardAccountRestDto,
  RewardAccountQueryRestDto,
  AssignRewardRestDto,
  BulkRewardAccountOperationRestDto,
  BulkCreateRewardAccountRestDto,
  RewardDistributionTrackingRestDto,
  RewardInventoryManagementRestDto,
} from './dto/reward-account-management-rest.dto';

import {
  RewardAccountRestResponseDto,
  CreateRewardAccountRestResponseDto,
  UpdateRewardAccountRestResponseDto,
  RewardAccountQueryRestResponseDto,
  AssignRewardRestResponseDto,
  BulkRewardAccountOperationRestResponseDto,
  BulkCreateRewardAccountRestResponseDto,
  RewardDistributionTrackingRestResponseDto,
  RewardInventoryStatsRestResponseDto,
  DeleteRewardAccountRestResponseDto,
} from './dto/reward-account-response-rest.dto';

// Import base response DTOs
import {
  RewardAccountResponseDto,
  RewardInventoryStatsDto,
} from '../../../modules/reward/dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  traceId: string;
}

@ApiTags('Reward Account Management')
@Controller('api/admin/reward-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RewardAccountController {
  constructor(
    private readonly rewardDistributionService: RewardDistributionService,
    private readonly responseBuilder: ResponseBuilderService,
  ) {}

  // ==================== REWARD ACCOUNT MANAGEMENT ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create reward account',
    description: 'Create a new reward account with encrypted credentials. Admin authentication required.',
  })
  @ApiBody({
    type: CreateRewardAccountRestDto,
    description: 'Reward account creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reward account created successfully',
    type: CreateRewardAccountRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid reward account data',
  })
  @ApiConflictResponse({
    description: 'Reward account with these details already exists',
  })
  async createRewardAccount(
    @Body() createDto: CreateRewardAccountRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardAccountResponseDto>> {
    try {
      // Set the createdBy field from the authenticated user
      const createData = {
        ...createDto,
        createdBy: req.user.id,
      };

      const rewardAccount = await this.rewardDistributionService.createRewardAccount(createData);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: rewardAccount.id,
        action: 'create',
      });

      return this.responseBuilder.buildSuccessResponse(
        rewardAccount as RewardAccountResponseDto,
        'Reward account created successfully',
        HttpStatus.CREATED,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
          ),
        );
      }
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_ACCOUNT_CREATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
          error.message,
          'Please check your reward account data and try again',
        ),
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reward accounts',
    description: 'Retrieve a paginated list of reward accounts with filtering and sorting options. Admin authentication required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for service name, account type, or description',
    example: 'Netflix',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['STREAMING_SERVICE', 'GIFT_CARD', 'SUBSCRIPTION', 'DIGITAL_PRODUCT', 'OTHER'],
    description: 'Filter by reward category',
    example: 'STREAMING_SERVICE',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['AVAILABLE', 'ASSIGNED', 'EXPIRED', 'DEACTIVATED'],
    description: 'Filter by reward status',
    example: 'AVAILABLE',
  })
  @ApiQuery({
    name: 'assignedToUserId',
    required: false,
    type: Number,
    description: 'Filter by assigned user ID',
    example: 1,
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
    description: 'Filter by creator admin ID',
    example: 1,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward accounts retrieved successfully',
    type: RewardAccountQueryRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getRewardAccounts(
    @Query() queryDto: RewardAccountQueryRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const result = await this.rewardDistributionService.getRewardAccounts(
        {
          search: queryDto.search,
          category: queryDto.category,
          status: queryDto.status,
          assignedToUserId: queryDto.assignedToUserId,
          createdBy: queryDto.createdBy,
        },
        {
          page: queryDto.page,
          limit: queryDto.limit,
        },
        {
          sortBy: queryDto.sortBy,
          sortOrder: queryDto.sortOrder,
        },
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        currentPage: result.page,
        totalPages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
        queryParams: queryDto,
        action: 'list',
      });

      const paginationMeta = {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
      };

      return this.responseBuilder.buildSuccessResponse(
        result,
        'Reward accounts retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
        paginationMeta,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_ACCOUNT_QUERY_ERROR',
          'Failed to retrieve reward accounts',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
          error.message,
        ),
      );
    }
  }

  @Get('inventory/stats')
  @ApiOperation({
    summary: 'Get reward inventory statistics',
    description: 'Retrieve statistics about reward account inventory and distribution. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory statistics retrieved successfully',
    type: RewardInventoryStatsRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getInventoryStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardInventoryStatsDto>> {
    try {
      const stats = await this.rewardDistributionService.getRewardInventoryStats();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/inventory/stats`,
        action: 'inventory-stats',
      });

      return this.responseBuilder.buildSuccessResponse(
        stats,
        'Reward inventory statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'INVENTORY_STATS_ERROR',
          'Failed to retrieve inventory statistics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/inventory/stats`,
          error.message,
        ),
      );
    }
  }

  @Get('distribution/analytics')
  @ApiOperation({
    summary: 'Get reward distribution analytics',
    description: 'Retrieve analytics about reward distribution patterns and performance. Admin authentication required.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['STREAMING_SERVICE', 'GIFT_CARD', 'SUBSCRIPTION', 'DIGITAL_PRODUCT', 'OTHER'],
    description: 'Filter by reward category',
    example: 'STREAMING_SERVICE',
  })
  @ApiQuery({
    name: 'assignedBy',
    required: false,
    type: Number,
    description: 'Filter by admin who assigned the rewards',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Distribution analytics retrieved successfully',
    type: RewardDistributionTrackingRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getDistributionAnalytics(
    @Query() queryDto: RewardDistributionTrackingRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const analytics = await this.rewardDistributionService.getRewardDistributionAnalytics();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/distribution/analytics`,
        action: 'distribution-analytics',
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
          'DISTRIBUTION_ANALYTICS_ERROR',
          'Failed to retrieve distribution analytics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/distribution/analytics`,
          error.message,
        ),
      );
    }
  }

  @Get('available')
  @ApiOperation({
    summary: 'Get available reward accounts',
    description: 'Retrieve reward accounts that are available for assignment. Admin authentication required.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['STREAMING_SERVICE', 'GIFT_CARD', 'SUBSCRIPTION', 'DIGITAL_PRODUCT', 'OTHER'],
    description: 'Filter by reward category',
    example: 'STREAMING_SERVICE',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available reward accounts retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getAvailableRewardAccounts(
    @Query('category') category: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any[]>> {
    try {
      const availableRewards = await this.rewardDistributionService.getAssignableRewards(category as any);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/available`,
        action: 'get-available',
      });

      return this.responseBuilder.buildSuccessResponse(
        availableRewards,
        'Available reward accounts retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'AVAILABLE_REWARDS_ERROR',
          'Failed to retrieve available reward accounts',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/available`,
          error.message,
        ),
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get reward account by ID',
    description: 'Retrieve a specific reward account by ID. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward account retrieved successfully',
    type: RewardAccountRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  async getRewardAccount(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardAccountResponseDto>> {
    try {
      const rewardAccount = await this.rewardDistributionService.getRewardAccount(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: id,
        action: 'get',
      });

      return this.responseBuilder.buildSuccessResponse(
        rewardAccount as RewardAccountResponseDto,
        'Reward account retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}`,
          ),
        );
      }
      throw error;
    }
  }

  @Get(':id/credentials')
  @ApiOperation({
    summary: 'Get reward account with decrypted credentials',
    description: 'Retrieve a specific reward account with decrypted credentials. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward account with credentials retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  async getRewardAccountWithCredentials(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const rewardAccount = await this.rewardDistributionService.getRewardAccountWithCredentials(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: id,
        action: 'get-credentials',
      });

      return this.responseBuilder.buildSuccessResponse(
        rewardAccount,
        'Reward account with credentials retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}/credentials`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update reward account',
    description: 'Update a specific reward account. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateRewardAccountRestDto,
    description: 'Reward account update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward account updated successfully',
    type: UpdateRewardAccountRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid reward account data',
  })
  async updateRewardAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRewardAccountRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardAccountResponseDto>> {
    try {
      const rewardAccount = await this.rewardDistributionService.updateRewardAccount(id, updateDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: id,
        action: 'update',
      });

      return this.responseBuilder.buildSuccessResponse(
        rewardAccount as RewardAccountResponseDto,
        'Reward account updated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}`,
          ),
        );
      }
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_ACCOUNT_UPDATE_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}`,
          error.message,
          'Please check your reward account data and try again',
        ),
      );
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete reward account',
    description: 'Permanently delete a reward account. Only accounts not assigned to users can be deleted. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward account deleted successfully',
    type: DeleteRewardAccountRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  @ApiBadRequestResponse({
    description: 'Cannot delete reward account that is assigned to a user',
  })
  async deleteRewardAccount(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ deletedId: number; message: string }>> {
    try {
      const result = await this.rewardDistributionService.deleteRewardAccount(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        action: 'delete',
      });

      return this.responseBuilder.buildSuccessResponse(
        { deletedId: id, message: result.message },
        'Reward account deleted successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}`,
          ),
        );
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_DELETE_ERROR',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}`,
            undefined,
            'Consider deactivating the reward account instead',
          ),
        );
      }
      throw error;
    }
  }

  // ==================== REWARD ASSIGNMENT ENDPOINTS ====================

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign reward account to user',
    description: 'Assign a specific reward account to a user submission. Admin authentication required.',
  })
  @ApiBody({
    type: AssignRewardRestDto,
    description: 'Reward assignment data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward assigned successfully',
    type: AssignRewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid assignment data or reward not available',
  })
  @ApiNotFoundResponse({
    description: 'Reward account or user submission not found',
  })
  @ApiConflictResponse({
    description: 'Reward account is not available for assignment',
  })
  async assignRewardToUser(
    @Body() assignDto: AssignRewardRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      // Set the assignedBy field from the authenticated user
      const assignmentData = {
        ...assignDto,
        assignedBy: req.user.id,
      };

      const assignedReward = await this.rewardDistributionService.assignRewardToUser(assignmentData);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/assign`,
        action: 'assign',
      });

      return this.responseBuilder.buildSuccessResponse(
        assignedReward,
        'Reward assigned to user successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'ASSIGNMENT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/assign`,
          ),
        );
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'ASSIGNMENT_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/assign`,
          ),
        );
      }
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ASSIGNMENT_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/assign`,
          error.message,
          'Please check your assignment data and try again',
        ),
      );
    }
  }

  @Post('validate-assignment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate reward assignment eligibility',
    description: 'Validate if a reward account can be assigned to a user submission. Admin authentication required.',
  })
  @ApiBody({
    type: AssignRewardRestDto,
    description: 'Assignment validation data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment validation result',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async validateRewardAssignment(
    @Body() assignDto: AssignRewardRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ isValid: boolean; error?: string; rewardAccount?: any }>> {
    try {
      const validation = await this.rewardDistributionService.validateRewardAssignment(
        assignDto.rewardAccountId,
        assignDto.submissionId,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/validate-assignment`,
        action: 'validate-assignment',
      });

      return this.responseBuilder.buildSuccessResponse(
        validation,
        'Assignment validation completed',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'VALIDATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/validate-assignment`,
          error.message,
        ),
      );
    }
  }

  @Put(':id/unassign')
  @ApiOperation({
    summary: 'Unassign reward account from user',
    description: 'Remove assignment of a reward account from a user, making it available again. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward unassigned successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  @ApiConflictResponse({
    description: 'Reward account is not currently assigned',
  })
  async unassignRewardFromUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const unassignedReward = await this.rewardDistributionService.unassignRewardFromUser(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: id,
        action: 'unassign',
      });

      return this.responseBuilder.buildSuccessResponse(
        unassignedReward,
        'Reward unassigned from user successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}/unassign`,
          ),
        );
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'UNASSIGNMENT_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}/unassign`,
          ),
        );
      }
      throw error;
    }
  }

  @Get('user/:userId/assigned')
  @ApiOperation({
    summary: 'Get rewards assigned to user',
    description: 'Retrieve all reward accounts assigned to a specific user. Admin authentication required.',
  })
  @ApiParam({
    name: 'userId',
    type: 'integer',
    description: 'User submission ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User assigned rewards retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getUserAssignedRewards(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any[]>> {
    try {
      const assignedRewards = await this.rewardDistributionService.getUserAssignedRewards(userId);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/user/${userId}/assigned`,
        action: 'get-user-rewards',
      });

      return this.responseBuilder.buildSuccessResponse(
        assignedRewards,
        'User assigned rewards retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'USER_REWARDS_ERROR',
          'Failed to retrieve user assigned rewards',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/user/${userId}/assigned`,
          error.message,
        ),
      );
    }
  }

  // ==================== BULK OPERATIONS ====================

  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk create reward accounts',
    description: 'Create multiple reward accounts in a single operation. Admin authentication required.',
  })
  @ApiBody({
    type: BulkCreateRewardAccountRestDto,
    description: 'Bulk reward account creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk creation completed',
    type: BulkCreateRewardAccountRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid bulk creation data',
  })
  async bulkCreateRewardAccounts(
    @Body() bulkCreateDto: BulkCreateRewardAccountRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      // Set the createdBy field for all accounts from the authenticated user
      const accountsWithCreator = bulkCreateDto.rewardAccounts.map(account => ({
        ...account,
        createdBy: req.user.id,
      }));

      const result = await this.rewardDistributionService.bulkCreateRewardAccounts(accountsWithCreator);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/bulk-create`,
        action: 'bulk-create',
      });

      return this.responseBuilder.buildSuccessResponse(
        result,
        `Bulk creation completed. ${result.summary.successful} accounts created, ${result.summary.failed} failed.`,
        HttpStatus.CREATED,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'BULK_CREATE_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/bulk-create`,
          error.message,
        ),
      );
    }
  }

  @Post('bulk-operation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk reward account operations',
    description: 'Perform bulk operations on multiple reward accounts (activate, deactivate, delete, mark_expired). Admin authentication required.',
  })
  @ApiBody({
    type: BulkRewardAccountOperationRestDto,
    description: 'Bulk operation data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed successfully',
    type: BulkRewardAccountOperationRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid bulk operation data',
  })
  async bulkOperation(
    @Body() bulkOperationDto: BulkRewardAccountOperationRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ affectedCount: number; details: string[] }>> {
    try {
      const results: string[] = [];
      let affectedCount = 0;

      for (const rewardAccountId of bulkOperationDto.rewardAccountIds) {
        try {
          switch (bulkOperationDto.operation) {
            case 'activate':
              await this.rewardDistributionService.reactivateRewardAccount(rewardAccountId);
              results.push(`Reward account ID ${rewardAccountId} activated`);
              affectedCount++;
              break;
            case 'deactivate':
              await this.rewardDistributionService.deactivateRewardAccount(rewardAccountId);
              results.push(`Reward account ID ${rewardAccountId} deactivated`);
              affectedCount++;
              break;
            case 'delete':
              await this.rewardDistributionService.deleteRewardAccount(rewardAccountId);
              results.push(`Reward account ID ${rewardAccountId} deleted`);
              affectedCount++;
              break;
            case 'mark_expired':
              await this.rewardDistributionService.markExpiredRewardAccounts();
              results.push(`Expired reward accounts marked`);
              affectedCount++;
              break;
          }
        } catch (error) {
          results.push(`Reward account ID ${rewardAccountId} failed: ${error.message}`);
        }
      }

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/bulk-operation`,
        action: 'bulk-operation',
      });

      return this.responseBuilder.buildSuccessResponse(
        { affectedCount, details: results },
        `Bulk operation completed. ${affectedCount} reward accounts affected.`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'BULK_OPERATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/bulk-operation`,
          error.message,
        ),
      );
    }
  }

  // ==================== STATUS MANAGEMENT ====================

  @Put(':id/activate')
  @ApiOperation({
    summary: 'Activate reward account',
    description: 'Activate a deactivated reward account, making it available for assignment. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward account activated successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  @ApiConflictResponse({
    description: 'Cannot activate reward account that is currently assigned',
  })
  async activateRewardAccount(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const rewardAccount = await this.rewardDistributionService.reactivateRewardAccount(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: id,
        action: 'activate',
      });

      return this.responseBuilder.buildSuccessResponse(
        rewardAccount,
        'Reward account activated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}/activate`,
          ),
        );
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(
          this.responseBuilder.buildErrorResponse(
            'ACTIVATION_CONFLICT',
            error.message,
            HttpStatus.CONFLICT,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}/activate`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate reward account',
    description: 'Deactivate a reward account, preventing it from being assigned. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward account ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward account deactivated successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward account not found',
  })
  async deactivateRewardAccount(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const rewardAccount = await this.rewardDistributionService.deactivateRewardAccount(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts`,
        resourceId: id,
        action: 'deactivate',
      });

      return this.responseBuilder.buildSuccessResponse(
        rewardAccount,
        'Reward account deactivated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_ACCOUNT_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/${id}/deactivate`,
          ),
        );
      }
      throw error;
    }
  }

  @Post('mark-expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark expired reward accounts',
    description: 'Mark all expired reward accounts as expired status. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired reward accounts marked successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async markExpiredRewardAccounts(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ message: string; expiredCount: number }>> {
    try {
      const result = await this.rewardDistributionService.markExpiredRewardAccounts();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/mark-expired`,
        action: 'mark-expired',
      });

      return this.responseBuilder.buildSuccessResponse(
        result,
        result.message,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'MARK_EXPIRED_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/admin/reward-accounts/mark-expired`,
          error.message,
        ),
      );
    }
  }
}