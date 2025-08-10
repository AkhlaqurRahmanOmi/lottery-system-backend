import { 
  Resolver, 
  Query, 
  Mutation, 
  Args, 
  Int,
  Subscription 
} from '@nestjs/graphql';
import { 
  UseGuards, 
  Logger, 
  ForbiddenException, 
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { RewardService } from '../../modules/reward/reward.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import { AdminRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import {
  RewardResponseDto,
  PaginatedRewardResponseDto
} from '../../modules/reward/dto';
import {
  CreateRewardGraphQLInputDto,
  UpdateRewardGraphQLInputDto,
  RewardQueryGraphQLInputDto,
  BulkRewardOperationGraphQLInputDto,
  RewardOrderingGraphQLInputDto,
  RewardSelectionValidationGraphQLInputDto
} from './dto/reward-management-graphql.dto';
import {
  PublicRewardGraphQLDto,
  ActiveRewardsGraphQLResponseDto,
  PublicRewardSelectionValidationGraphQLResponseDto,
  PublicRewardPopularityGraphQLResponseDto,
  PublicRewardUpdatePayloadDto,
  RewardAvailabilityUpdatePayloadDto
} from './dto/public-reward-graphql.dto';
import {
  CreateRewardGraphQLResponseDto,
  UpdateRewardGraphQLResponseDto,
  DeleteRewardGraphQLResponseDto,
  BulkRewardOperationGraphQLResponseDto,
  RewardOrderingGraphQLResponseDto,
  RewardSelectionValidationGraphQLResponseDto,
  RewardStatisticsGraphQLResponseDto,
  RewardPopularityGraphQLResponseDto,
  RewardUpdatePayloadDto,
  RewardStatisticsUpdatePayloadDto
} from './dto/reward-response-graphql.dto';

@Resolver(() => RewardResponseDto)
export class RewardResolver {
  private readonly logger = new Logger(RewardResolver.name);

  constructor(private readonly rewardService: RewardService) {}

  // ==================== PUBLIC QUERIES (No Authentication Required) ====================

  @Query(() => ActiveRewardsGraphQLResponseDto, {
    description: 'Get all active rewards available for user selection (public endpoint)'
  })
  async activeRewards(): Promise<ActiveRewardsGraphQLResponseDto> {
    try {
      this.logger.log('Public request for active rewards');
      
      const rewards = await this.rewardService.findActiveRewards();
      
      const publicRewards: PublicRewardGraphQLDto[] = rewards.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        displayOrder: reward.displayOrder
      }));

      this.logger.log(`Successfully retrieved ${publicRewards.length} active rewards`);
      
      return {
        rewards: publicRewards,
        totalCount: publicRewards.length
      };
    } catch (error) {
      this.logger.error(`Failed to get active rewards: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve active rewards');
    }
  }

  @Query(() => PublicRewardSelectionValidationGraphQLResponseDto, {
    description: 'Validate reward selection for coupon redemption (public endpoint)'
  })
  async validateRewardSelection(
    @Args('input') input: RewardSelectionValidationGraphQLInputDto
  ): Promise<PublicRewardSelectionValidationGraphQLResponseDto> {
    try {
      this.logger.log(`Public validation request for reward ID: ${input.rewardId}`);
      
      const reward = await this.rewardService.findOne(input.rewardId);
      
      if (!reward.isActive) {
        return {
          isValid: false,
          error: 'Selected reward is no longer available'
        };
      }

      const publicReward: PublicRewardGraphQLDto = {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        displayOrder: reward.displayOrder
      };

      this.logger.log(`Reward validation successful for ID: ${input.rewardId}`);
      
      return {
        isValid: true,
        reward: publicReward
      };
    } catch (error) {
      this.logger.error(`Failed to validate reward selection: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        return {
          isValid: false,
          error: 'Selected reward does not exist'
        };
      }
      
      throw new BadRequestException('Failed to validate reward selection');
    }
  }

  // ==================== ADMIN QUERIES (Authentication Required) ====================

  @Query(() => RewardResponseDto, {
    description: 'Get reward by ID (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async reward(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward with ID: ${id}`);
      
      const reward = await this.rewardService.findOne(id);
      
      this.logger.log(`Successfully retrieved reward: ${reward.name}`);
      return reward;
    } catch (error) {
      this.logger.error(`Failed to get reward by ID ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to retrieve reward');
    }
  }

  @Query(() => PaginatedRewardResponseDto, {
    description: 'Get all rewards with filtering and pagination (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewards(
    @Args('query', { nullable: true }) query?: RewardQueryGraphQLInputDto,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<PaginatedRewardResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested reward list with query:`, query);
      
      const result = await this.rewardService.findAll(query || {});
      
      this.logger.log(`Successfully retrieved ${result.data.length} rewards (total: ${result.total})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get reward list: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward list');
    }
  }

  @Query(() => [RewardResponseDto], {
    description: 'Search rewards by name or description (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async searchRewards(
    @Args('searchTerm') searchTerm: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardResponseDto[]> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} searching rewards with term: ${searchTerm}`);
      
      const rewards = await this.rewardService.search(searchTerm, limit);
      
      this.logger.log(`Found ${rewards.length} rewards matching search term: ${searchTerm}`);
      return rewards;
    } catch (error) {
      this.logger.error(`Failed to search rewards: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to search rewards');
    }
  }

  @Query(() => RewardStatisticsGraphQLResponseDto, {
    description: 'Get reward statistics (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardStatistics(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardStatisticsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward statistics`);
      
      const stats = await this.rewardService.getSummaryStats();
      
      this.logger.log(`Successfully retrieved reward statistics`);
      return {
        totalRewards: stats.totalRewards,
        activeRewards: stats.activeRewards,
        inactiveRewards: stats.inactiveRewards
      };
    } catch (error) {
      this.logger.error(`Failed to get reward statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward statistics');
    }
  }

  @Query(() => Int, {
    description: 'Get next available display order (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async nextDisplayOrder(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<number> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested next display order`);
      
      const nextOrder = await this.rewardService.getNextDisplayOrder();
      
      this.logger.log(`Next available display order: ${nextOrder}`);
      return nextOrder;
    } catch (error) {
      this.logger.error(`Failed to get next display order: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get next display order');
    }
  }

  // ==================== ADMIN MUTATIONS ====================

  @Mutation(() => CreateRewardGraphQLResponseDto, {
    description: 'Create new reward (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async createReward(
    @Args('input') input: CreateRewardGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<CreateRewardGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} creating new reward: ${input.name}`);
      
      const reward = await this.rewardService.create(input);
      
      this.logger.log(`Successfully created reward: ${reward.name} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward created successfully',
        reward
      };
    } catch (error) {
      this.logger.error(`Failed to create reward: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to create reward',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardGraphQLResponseDto, {
    description: 'Update reward (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async updateReward(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateRewardGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} updating reward ID: ${id}`);
      
      const reward = await this.rewardService.update(id, input);
      
      this.logger.log(`Successfully updated reward: ${reward.name} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward updated successfully',
        reward
      };
    } catch (error) {
      this.logger.error(`Failed to update reward: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to update reward',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardGraphQLResponseDto, {
    description: 'Activate reward (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async activateReward(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} activating reward ID: ${id}`);
      
      const reward = await this.rewardService.activate(id);
      
      this.logger.log(`Successfully activated reward: ${reward.name} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward activated successfully',
        reward
      };
    } catch (error) {
      this.logger.error(`Failed to activate reward: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to activate reward',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardGraphQLResponseDto, {
    description: 'Deactivate reward (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async deactivateReward(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} deactivating reward ID: ${id}`);
      
      const reward = await this.rewardService.deactivate(id);
      
      this.logger.log(`Successfully deactivated reward: ${reward.name} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward deactivated successfully',
        reward
      };
    } catch (error) {
      this.logger.error(`Failed to deactivate reward: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to deactivate reward',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => DeleteRewardGraphQLResponseDto, {
    description: 'Delete reward permanently (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async deleteReward(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<DeleteRewardGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} deleting reward ID: ${id}`);
      
      await this.rewardService.remove(id);
      
      this.logger.log(`Successfully deleted reward ID: ${id} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward deleted successfully',
        deletedId: id
      };
    } catch (error) {
      this.logger.error(`Failed to delete reward: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to delete reward',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => RewardOrderingGraphQLResponseDto, {
    description: 'Update display orders for multiple rewards (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async updateRewardOrdering(
    @Args('input') input: RewardOrderingGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardOrderingGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} updating reward ordering for ${input.rewards.length} rewards`);
      
      await this.rewardService.updateDisplayOrders(input.rewards);
      
      this.logger.log(`Successfully updated display orders for ${input.rewards.length} rewards by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward ordering updated successfully',
        updatedCount: input.rewards.length
      };
    } catch (error) {
      this.logger.error(`Failed to update reward ordering: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to update reward ordering',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => BulkRewardOperationGraphQLResponseDto, {
    description: 'Perform bulk operations on multiple rewards (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async bulkRewardOperation(
    @Args('input') input: BulkRewardOperationGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<BulkRewardOperationGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} performing bulk ${input.operation} on ${input.rewardIds.length} rewards`);
      
      const results: string[] = [];
      let successCount = 0;

      for (const rewardId of input.rewardIds) {
        try {
          switch (input.operation) {
            case 'activate':
              await this.rewardService.activate(rewardId);
              results.push(`Reward ${rewardId}: activated successfully`);
              successCount++;
              break;
            case 'deactivate':
              await this.rewardService.deactivate(rewardId);
              results.push(`Reward ${rewardId}: deactivated successfully`);
              successCount++;
              break;
            case 'delete':
              await this.rewardService.remove(rewardId);
              results.push(`Reward ${rewardId}: deleted successfully`);
              successCount++;
              break;
          }
        } catch (error) {
          results.push(`Reward ${rewardId}: ${error.message}`);
        }
      }
      
      this.logger.log(`Bulk operation completed: ${successCount}/${input.rewardIds.length} successful`);
      
      return {
        success: successCount > 0,
        message: `Bulk ${input.operation} completed: ${successCount}/${input.rewardIds.length} successful`,
        affectedCount: successCount,
        details: results
      };
    } catch (error) {
      this.logger.error(`Failed to perform bulk reward operation: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to perform bulk operation',
        errors: [error.message],
        affectedCount: 0
      };
    }
  }
}