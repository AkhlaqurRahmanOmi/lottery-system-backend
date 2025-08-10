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
  ApiBody,
} from '@nestjs/swagger';
import { RewardService } from '../../../modules/reward/reward.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';

// Import REST-specific DTOs
import {
  CreateRewardRestDto,
  UpdateRewardRestDto,
  RewardQueryRestDto,
  BulkRewardOperationRestDto,
  RewardOrderingRestDto,
} from './dto/reward-management-rest.dto';

import {
  PublicRewardDto,
  PublicActiveRewardsResponseDto,
  RewardSelectionValidationDto,
  RewardSelectionValidationResponseDto,
} from './dto/public-reward-rest.dto';

import {
  RewardRestResponseDto,
  CreateRewardRestResponseDto,
  UpdateRewardRestResponseDto,
  RewardQueryRestResponseDto,
  PublicRewardQueryRestResponseDto,
  BulkRewardOperationRestResponseDto,
  RewardOrderingRestResponseDto,
  DeleteRewardRestResponseDto,
  RewardStatisticsRestResponseDto,
} from './dto/reward-response-rest.dto';

// Import base response DTOs
import {
  RewardResponseDto,
  PaginatedRewardResponseDto,
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

@ApiTags('Reward Management')
@Controller('api/rewards')
export class RewardController {
  constructor(
    private readonly rewardService: RewardService,
    private readonly responseBuilder: ResponseBuilderService,
  ) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create reward',
    description: 'Create a new reward. Admin authentication required.',
  })
  @ApiBody({
    type: CreateRewardRestDto,
    description: 'Reward creation data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reward created successfully',
    type: CreateRewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid reward data',
  })
  async create(
    @Body() createRewardDto: CreateRewardRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardResponseDto>> {
    try {
      const reward = await this.rewardService.create(createRewardDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        resourceId: reward.id,
        action: 'create',
      });

      return this.responseBuilder.buildSuccessResponse(
        reward,
        'Reward created successfully',
        HttpStatus.CREATED,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_CREATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards`,
          error.message,
          'Please check your reward data and try again',
        ),
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all rewards',
    description: 'Retrieve a paginated list of rewards with filtering and sorting options. Admin authentication required.',
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
    description: 'Search term for reward name or description',
    example: 'gift card',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
    example: 'displayOrder',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'asc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rewards retrieved successfully',
    type: RewardQueryRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async findAll(
    @Query() queryDto: RewardQueryRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<PaginatedRewardResponseDto>> {
    try {
      const result = await this.rewardService.findAll(queryDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
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
        'Rewards retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
        paginationMeta,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_QUERY_ERROR',
          'Failed to retrieve rewards',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards`,
          error.message,
        ),
      );
    }
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reward statistics',
    description: 'Retrieve statistics about rewards and their usage. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: RewardStatisticsRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getStatistics(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const statistics = await this.rewardService.getSummaryStats();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards/statistics`,
        action: 'statistics',
      });

      return this.responseBuilder.buildSuccessResponse(
        statistics,
        'Reward statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'STATISTICS_ERROR',
          'Failed to retrieve statistics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards/statistics`,
          error.message,
        ),
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reward by ID',
    description: 'Retrieve a specific reward by ID. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward retrieved successfully',
    type: RewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardResponseDto>> {
    try {
      const reward = await this.rewardService.findOne(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        resourceId: id,
        action: 'get',
      });

      return this.responseBuilder.buildSuccessResponse(
        reward,
        'Reward retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}`,
          ),
        );
      }
      throw error;
    }
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reward statistics by ID',
    description: 'Retrieve detailed statistics for a specific reward. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward statistics retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward not found',
  })
  async getRewardStats(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const stats = await this.rewardService.getRewardStats(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        resourceId: id,
        action: 'get-stats',
      });

      return this.responseBuilder.buildSuccessResponse(
        stats,
        'Reward statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}/stats`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update reward',
    description: 'Update a specific reward. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateRewardRestDto,
    description: 'Reward update data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward updated successfully',
    type: UpdateRewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid reward data',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRewardDto: UpdateRewardRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardResponseDto>> {
    try {
      const reward = await this.rewardService.update(id, updateRewardDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        resourceId: id,
        action: 'update',
      });

      return this.responseBuilder.buildSuccessResponse(
        reward,
        'Reward updated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}`,
          ),
        );
      }
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_UPDATE_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards/${id}`,
          error.message,
          'Please check your reward data and try again',
        ),
      );
    }
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activate reward',
    description: 'Activate a specific reward. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward activated successfully',
    type: RewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward not found',
  })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardResponseDto>> {
    try {
      const reward = await this.rewardService.activate(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        resourceId: id,
        action: 'activate',
      });

      return this.responseBuilder.buildSuccessResponse(
        reward,
        'Reward activated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}/activate`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate reward',
    description: 'Deactivate a specific reward. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward deactivated successfully',
    type: RewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward not found',
  })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<RewardResponseDto>> {
    try {
      const reward = await this.rewardService.deactivate(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        resourceId: id,
        action: 'deactivate',
      });

      return this.responseBuilder.buildSuccessResponse(
        reward,
        'Reward deactivated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}/deactivate`,
          ),
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete reward',
    description: 'Permanently delete a reward. Only rewards not selected by users can be deleted. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Reward ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward deleted successfully',
    type: DeleteRewardRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Reward not found',
  })
  @ApiBadRequestResponse({
    description: 'Cannot delete reward that has been selected by users',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ deletedId: number }>> {
    try {
      await this.rewardService.remove(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards`,
        action: 'delete',
      });

      return this.responseBuilder.buildSuccessResponse(
        { deletedId: id },
        'Reward deleted successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}`,
          ),
        );
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'REWARD_DELETE_ERROR',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/rewards/${id}`,
            undefined,
            'Consider deactivating the reward instead',
          ),
        );
      }
      throw error;
    }
  }

  @Post('bulk-operation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk reward operations',
    description: 'Perform bulk operations on multiple rewards (activate, deactivate, delete). Admin authentication required.',
  })
  @ApiBody({
    type: BulkRewardOperationRestDto,
    description: 'Bulk operation data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed successfully',
    type: BulkRewardOperationRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid bulk operation data',
  })
  async bulkOperation(
    @Body() bulkOperationDto: BulkRewardOperationRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ affectedCount: number; details: string[] }>> {
    try {
      const results: string[] = [];
      let affectedCount = 0;

      for (const rewardId of bulkOperationDto.rewardIds) {
        try {
          switch (bulkOperationDto.operation) {
            case 'activate':
              await this.rewardService.activate(rewardId);
              results.push(`Reward ID ${rewardId} activated`);
              affectedCount++;
              break;
            case 'deactivate':
              await this.rewardService.deactivate(rewardId);
              results.push(`Reward ID ${rewardId} deactivated`);
              affectedCount++;
              break;
            case 'delete':
              await this.rewardService.remove(rewardId);
              results.push(`Reward ID ${rewardId} deleted`);
              affectedCount++;
              break;
          }
        } catch (error) {
          results.push(`Reward ID ${rewardId} failed: ${error.message}`);
        }
      }

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards/bulk-operation`,
        action: 'bulk-operation',
      });

      return this.responseBuilder.buildSuccessResponse(
        { affectedCount, details: results },
        `Bulk operation completed. ${affectedCount} rewards affected.`,
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
          `${req.protocol}://${req.get('host')}/api/rewards/bulk-operation`,
          error.message,
        ),
      );
    }
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update reward display order',
    description: 'Update the display order for multiple rewards. Admin authentication required.',
  })
  @ApiBody({
    type: RewardOrderingRestDto,
    description: 'Reward ordering data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward ordering updated successfully',
    type: RewardOrderingRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ordering data',
  })
  async updateDisplayOrders(
    @Body() orderingDto: RewardOrderingRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ updatedCount: number }>> {
    try {
      await this.rewardService.updateDisplayOrders(orderingDto.rewards);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards/reorder`,
        action: 'reorder',
      });

      return this.responseBuilder.buildSuccessResponse(
        { updatedCount: orderingDto.rewards.length },
        'Reward ordering updated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ORDERING_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards/reorder`,
          error.message,
        ),
      );
    }
  }

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('public/active')
  @ApiOperation({
    summary: 'Get active rewards',
    description: 'Retrieve all active rewards available for user selection. Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active rewards retrieved successfully',
    type: PublicActiveRewardsResponseDto,
  })
  async getActiveRewards(
    @Request() req: ExpressRequest,
  ): Promise<StandardApiResponse<PublicRewardDto[]>> {
    try {
      const rewards = await this.rewardService.findActiveRewards();

      // Map to public DTO format
      const publicRewards: PublicRewardDto[] = rewards.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        displayOrder: reward.displayOrder,
      }));

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards/public/active`,
        action: 'get-active',
      });

      return this.responseBuilder.buildSuccessResponse(
        publicRewards,
        'Active rewards retrieved successfully',
        HttpStatus.OK,
        (req as any).traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'ACTIVE_REWARDS_ERROR',
          'Failed to retrieve active rewards',
          HttpStatus.BAD_REQUEST,
          (req as any).traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards/public/active`,
          error.message,
        ),
      );
    }
  }

  @Post('public/validate')
  @ApiOperation({
    summary: 'Validate reward selection',
    description: 'Validate if a reward is available for selection. Public endpoint - no authentication required.',
  })
  @ApiBody({
    type: RewardSelectionValidationDto,
    description: 'Reward ID to validate',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward validation result',
    type: RewardSelectionValidationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid reward ID',
  })
  async validateRewardSelection(
    @Body() validationDto: RewardSelectionValidationDto,
    @Request() req: ExpressRequest,
  ): Promise<StandardApiResponse<{
    isValid: boolean;
    reward?: PublicRewardDto;
    error?: string;
  }>> {
    try {
      const reward = await this.rewardService.findOne(validationDto.rewardId);
      
      if (!reward.isActive) {
        const result = {
          isValid: false,
          error: 'Reward is not currently active',
        };

        return this.responseBuilder.buildSuccessResponse(
          result,
          'Reward validation completed',
          HttpStatus.OK,
          (req as any).traceId || 'unknown',
          { self: `${req.protocol}://${req.get('host')}/api/rewards/public/validate` },
        );
      }

      const publicReward: PublicRewardDto = {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        displayOrder: reward.displayOrder,
      };

      const result = {
        isValid: true,
        reward: publicReward,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/rewards/public/validate`,
        action: 'validate',
      });

      return this.responseBuilder.buildSuccessResponse(
        result,
        'Reward validation completed',
        HttpStatus.OK,
        (req as any).traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        const result = {
          isValid: false,
          error: 'Reward not found',
        };

        return this.responseBuilder.buildSuccessResponse(
          result,
          'Reward validation completed',
          HttpStatus.OK,
          (req as any).traceId || 'unknown',
          { self: `${req.protocol}://${req.get('host')}/api/rewards/public/validate` },
        );
      }

      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'VALIDATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          (req as any).traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/rewards/public/validate`,
          error.message,
        ),
      );
    }
  }
}