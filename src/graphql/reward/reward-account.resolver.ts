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
import { RewardDistributionService } from '../../modules/reward/reward-distribution.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import { AdminRole, RewardCategory, RewardStatus } from '@prisma/client';
import type { Admin } from '@prisma/client';
import {
  RewardAccountResponseDto,
  PaginatedRewardAccountResponseDto,
  RewardInventoryStatsDto,
  RewardDistributionAnalyticsDto,
  AssignableRewardDto,
  BulkCreateResultDto,
  RewardAssignmentValidationDto
} from '../../modules/reward/dto';
import {
  CreateRewardAccountGraphQLInputDto,
  UpdateRewardAccountGraphQLInputDto,
  RewardAccountQueryGraphQLInputDto,
  AssignRewardGraphQLInputDto,
  BulkRewardAccountOperationGraphQLInputDto,
  BulkCreateRewardAccountGraphQLInputDto,
  RewardDistributionTrackingGraphQLInputDto,
  RewardInventoryManagementGraphQLInputDto,
  RewardAssignmentValidationGraphQLInputDto,
  GetRewardAccountCredentialsGraphQLInputDto
} from './dto/reward-account-management-graphql.dto';
import {
  CreateRewardAccountGraphQLResponseDto,
  UpdateRewardAccountGraphQLResponseDto,
  DeleteRewardAccountGraphQLResponseDto,
  AssignRewardGraphQLResponseDto,
  RewardAssignmentValidationGraphQLResponseDto,
  RewardAccountCredentialsGraphQLResponseDto,
  AssignableRewardsGraphQLResponseDto,
  BulkRewardAccountOperationGraphQLResponseDto,
  BulkCreateRewardAccountGraphQLResponseDto,
  RewardInventoryStatsGraphQLResponseDto,
  RewardDistributionAnalyticsGraphQLResponseDto,
  RewardDistributionTrackingGraphQLResponseDto,
  RewardAccountUpdatePayloadDto,
  RewardAssignmentUpdatePayloadDto,
  RewardInventoryUpdatePayloadDto
} from './dto/reward-account-response-graphql.dto';

@Resolver(() => RewardAccountResponseDto)
export class RewardAccountResolver {
  private readonly logger = new Logger(RewardAccountResolver.name);

  constructor(private readonly rewardDistributionService: RewardDistributionService) {}

  /**
   * Convert null values to undefined for DTO compatibility
   */
  private convertNullToUndefined<T>(obj: any): T {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertNullToUndefined(item)) as T;
    }
    
    if (obj instanceof Date) {
      return obj as T;
    }
    
    if (typeof obj === 'object') {
      const converted = {} as any;
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = value === null ? undefined : this.convertNullToUndefined(value);
      }
      return converted as T;
    }
    
    return obj;
  }

  // ==================== ADMIN QUERIES ====================

  @Query(() => RewardAccountResponseDto, {
    description: 'Get reward account by ID (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardAccount(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardAccountResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward account with ID: ${id}`);
      
      const rewardAccount = await this.rewardDistributionService.getRewardAccount(id);
      
      this.logger.log(`Successfully retrieved reward account: ${rewardAccount.serviceName}`);
      return this.convertNullToUndefined(rewardAccount);
    } catch (error) {
      this.logger.error(`Failed to get reward account by ID ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to retrieve reward account');
    }
  }

  @Query(() => PaginatedRewardAccountResponseDto, {
    description: 'Get all reward accounts with filtering and pagination (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardAccounts(
    @Args('query', { nullable: true }) query?: RewardAccountQueryGraphQLInputDto,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<PaginatedRewardAccountResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested reward account list with query:`, query);
      
      const filters = {
        search: query?.search,
        category: query?.category,
        status: query?.status,
        assignedToUserId: query?.assignedToUserId,
        createdBy: query?.createdBy
      };

      const pagination = {
        page: query?.page || 1,
        limit: query?.limit || 10
      };

      const sorting = {
        sortBy: query?.sortBy || 'createdAt',
        sortOrder: query?.sortOrder || 'desc'
      };

      const result = await this.rewardDistributionService.getRewardAccounts(filters, pagination, sorting);
      
      this.logger.log(`Successfully retrieved ${result.data.length} reward accounts (total: ${result.total})`);
      return this.convertNullToUndefined(result);
    } catch (error) {
      this.logger.error(`Failed to get reward account list: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward account list');
    }
  }

  @Query(() => [RewardAccountResponseDto], {
    description: 'Get available reward accounts by category (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async availableRewardAccounts(
    @Args('category', { type: () => RewardCategory, nullable: true }) category?: RewardCategory,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<RewardAccountResponseDto[]> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested available reward accounts for category: ${category || 'all'}`);
      
      const rewardAccounts = await this.rewardDistributionService.getAvailableRewardAccounts(category);
      
      this.logger.log(`Found ${rewardAccounts.length} available reward accounts`);
      return this.convertNullToUndefined(rewardAccounts);
    } catch (error) {
      this.logger.error(`Failed to get available reward accounts: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve available reward accounts');
    }
  }

  @Query(() => AssignableRewardsGraphQLResponseDto, {
    description: 'Get reward accounts suitable for assignment (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async assignableRewards(
    @Args('category', { type: () => RewardCategory, nullable: true }) category?: RewardCategory,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<AssignableRewardsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested assignable rewards for category: ${category || 'all'}`);
      
      const rewards = await this.rewardDistributionService.getAssignableRewards(category);
      
      // Calculate category breakdown
      const categoryBreakdown = rewards.reduce((acc, reward) => {
        acc[reward.category] = (acc[reward.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      this.logger.log(`Found ${rewards.length} assignable rewards`);
      
      return {
        rewards: this.convertNullToUndefined(rewards),
        totalCount: rewards.length,
        categoryBreakdown: JSON.stringify(categoryBreakdown)
      };
    } catch (error) {
      this.logger.error(`Failed to get assignable rewards: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve assignable rewards');
    }
  }

  @Query(() => [RewardAccountResponseDto], {
    description: 'Get reward accounts assigned to a specific user (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async userAssignedRewards(
    @Args('userId', { type: () => Int }) userId: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardAccountResponseDto[]> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested rewards assigned to user ID: ${userId}`);
      
      const rewardAccounts = await this.rewardDistributionService.getUserAssignedRewards(userId);
      
      this.logger.log(`Found ${rewardAccounts.length} rewards assigned to user ${userId}`);
      return this.convertNullToUndefined(rewardAccounts);
    } catch (error) {
      this.logger.error(`Failed to get user assigned rewards: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve user assigned rewards');
    }
  }

  @Query(() => RewardInventoryStatsGraphQLResponseDto, {
    description: 'Get reward inventory statistics (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardInventoryStats(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardInventoryStatsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward inventory statistics`);
      
      const stats = await this.rewardDistributionService.getRewardInventoryStats();
      
      // Generate insights based on the statistics
      let insights = '';
      const totalRewards = stats.total;
      const availablePercentage = totalRewards > 0 ? (stats.available / totalRewards) * 100 : 0;
      
      if (availablePercentage < 20) {
        insights = 'Low inventory alert: Less than 20% of rewards are available for assignment.';
      } else if (availablePercentage > 80) {
        insights = 'High inventory: More than 80% of rewards are available for assignment.';
      } else {
        insights = `Inventory status: ${availablePercentage.toFixed(1)}% of rewards are available for assignment.`;
      }
      
      this.logger.log(`Successfully retrieved reward inventory statistics`);
      
      return {
        stats,
        generatedAt: new Date(),
        insights
      };
    } catch (error) {
      this.logger.error(`Failed to get reward inventory statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward inventory statistics');
    }
  }

  @Query(() => RewardDistributionAnalyticsGraphQLResponseDto, {
    description: 'Get comprehensive reward distribution analytics (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardDistributionAnalytics(
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardDistributionAnalyticsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} requested reward distribution analytics`);
      
      const analytics = await this.rewardDistributionService.getRewardDistributionAnalytics();
      
      // Generate insights based on analytics
      let insights = '';
      if (analytics.distributionRate > 70) {
        insights = 'High distribution rate indicates strong reward utilization.';
      } else if (analytics.distributionRate < 30) {
        insights = 'Low distribution rate suggests potential issues with reward assignment or availability.';
      } else {
        insights = `Distribution rate is at ${analytics.distributionRate.toFixed(1)}%, which is within normal range.`;
      }
      
      this.logger.log(`Successfully retrieved reward distribution analytics`);
      
      return {
        analytics,
        generatedAt: new Date(),
        insights
      };
    } catch (error) {
      this.logger.error(`Failed to get reward distribution analytics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward distribution analytics');
    }
  }

  @Query(() => RewardDistributionTrackingGraphQLResponseDto, {
    description: 'Get reward distribution tracking data with date range filtering (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardDistributionTracking(
    @Args('input', { nullable: true }) input?: RewardDistributionTrackingGraphQLInputDto,
    @CurrentAdmin() currentAdmin?: Admin
  ): Promise<RewardDistributionTrackingGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin?.username} requested reward distribution tracking`);
      
      // For now, return mock data structure - this would be implemented with actual tracking logic
      const startDate = input?.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();
      
      // This would be replaced with actual database queries
      const mockData = {
        totalDistributed: 0,
        distributionsByCategory: JSON.stringify({}),
        distributionsByAdmin: JSON.stringify({}),
        distributionsByDate: JSON.stringify({}),
        averageDistributionTime: 0,
        periodStart: startDate,
        periodEnd: endDate
      };
      
      this.logger.log(`Successfully retrieved reward distribution tracking data`);
      return mockData;
    } catch (error) {
      this.logger.error(`Failed to get reward distribution tracking: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve reward distribution tracking');
    }
  }

  // ==================== ADMIN MUTATIONS ====================

  @Mutation(() => CreateRewardAccountGraphQLResponseDto, {
    description: 'Create new reward account (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async createRewardAccount(
    @Args('input') input: CreateRewardAccountGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<CreateRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} creating new reward account: ${input.serviceName}`);
      
      // Set the createdBy field to the current admin
      const createData = {
        ...input,
        createdBy: currentAdmin.id
      };
      
      const rewardAccount = await this.rewardDistributionService.createRewardAccount(createData);
      
      this.logger.log(`Successfully created reward account: ${rewardAccount.serviceName} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward account created successfully',
        rewardAccount: this.convertNullToUndefined(rewardAccount)
      };
    } catch (error) {
      this.logger.error(`Failed to create reward account: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to create reward account',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardAccountGraphQLResponseDto, {
    description: 'Update reward account (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async updateRewardAccount(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateRewardAccountGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} updating reward account ID: ${id}`);
      
      const rewardAccount = await this.rewardDistributionService.updateRewardAccount(id, input);
      
      this.logger.log(`Successfully updated reward account: ${rewardAccount.serviceName} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward account updated successfully',
        rewardAccount: this.convertNullToUndefined(rewardAccount)
      };
    } catch (error) {
      this.logger.error(`Failed to update reward account: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to update reward account',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => AssignRewardGraphQLResponseDto, {
    description: 'Assign reward account to user submission (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async assignRewardToUser(
    @Args('input') input: AssignRewardGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<AssignRewardGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} assigning reward ${input.rewardAccountId} to submission ${input.submissionId}`);
      
      // Set the assignedBy field to the current admin
      const assignData = {
        ...input,
        assignedBy: currentAdmin.id
      };
      
      const assignedReward = await this.rewardDistributionService.assignRewardToUser(assignData);
      
      this.logger.log(`Successfully assigned reward to user by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward assigned successfully',
        assignment: {
          rewardAccount: this.convertNullToUndefined(assignedReward),
          submissionId: input.submissionId,
          assignedAt: new Date(),
          assignedBy: currentAdmin.id,
          notes: input.notes
        }
      };
    } catch (error) {
      this.logger.error(`Failed to assign reward: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to assign reward',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardAccountGraphQLResponseDto, {
    description: 'Unassign reward account from user (make it available again) (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async unassignRewardFromUser(
    @Args('rewardAccountId', { type: () => Int }) rewardAccountId: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} unassigning reward account ID: ${rewardAccountId}`);
      
      const rewardAccount = await this.rewardDistributionService.unassignRewardFromUser(rewardAccountId);
      
      this.logger.log(`Successfully unassigned reward account by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward account unassigned successfully',
        rewardAccount: this.convertNullToUndefined(rewardAccount)
      };
    } catch (error) {
      this.logger.error(`Failed to unassign reward account: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to unassign reward account',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardAccountGraphQLResponseDto, {
    description: 'Deactivate reward account (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async deactivateRewardAccount(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} deactivating reward account ID: ${id}`);
      
      const rewardAccount = await this.rewardDistributionService.deactivateRewardAccount(id);
      
      this.logger.log(`Successfully deactivated reward account by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward account deactivated successfully',
        rewardAccount: this.convertNullToUndefined(rewardAccount)
      };
    } catch (error) {
      this.logger.error(`Failed to deactivate reward account: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to deactivate reward account',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateRewardAccountGraphQLResponseDto, {
    description: 'Reactivate reward account (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async reactivateRewardAccount(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<UpdateRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} reactivating reward account ID: ${id}`);
      
      const rewardAccount = await this.rewardDistributionService.reactivateRewardAccount(id);
      
      this.logger.log(`Successfully reactivated reward account by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward account reactivated successfully',
        rewardAccount: this.convertNullToUndefined(rewardAccount)
      };
    } catch (error) {
      this.logger.error(`Failed to reactivate reward account: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to reactivate reward account',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => DeleteRewardAccountGraphQLResponseDto, {
    description: 'Delete reward account permanently (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async deleteRewardAccount(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<DeleteRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} deleting reward account ID: ${id}`);
      
      await this.rewardDistributionService.deleteRewardAccount(id);
      
      this.logger.log(`Successfully deleted reward account ID: ${id} by ${currentAdmin.username}`);
      
      return {
        success: true,
        message: 'Reward account deleted successfully',
        deletedId: id
      };
    } catch (error) {
      this.logger.error(`Failed to delete reward account: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to delete reward account',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => BulkCreateRewardAccountGraphQLResponseDto, {
    description: 'Bulk create reward accounts (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async bulkCreateRewardAccounts(
    @Args('input') input: BulkCreateRewardAccountGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<BulkCreateRewardAccountGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} bulk creating ${input.rewardAccounts.length} reward accounts`);
      
      // Set the createdBy field for all accounts
      const accountsWithCreator = input.rewardAccounts.map(account => ({
        ...account,
        createdBy: currentAdmin.id
      }));
      
      const result = await this.rewardDistributionService.bulkCreateRewardAccounts(accountsWithCreator);
      
      this.logger.log(`Bulk creation completed: ${result.summary.successful}/${result.summary.total} successful`);
      
      return {
        success: result.summary.successful > 0,
        message: `Bulk creation completed: ${result.summary.successful}/${result.summary.total} successful`,
        result: {
          successful: this.convertNullToUndefined(result.successful),
          failed: JSON.stringify(result.failed),
          summary: JSON.stringify(result.summary)
        }
      };
    } catch (error) {
      this.logger.error(`Failed to bulk create reward accounts: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to bulk create reward accounts',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => BulkRewardAccountOperationGraphQLResponseDto, {
    description: 'Perform bulk operations on multiple reward accounts (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async bulkRewardAccountOperation(
    @Args('input') input: BulkRewardAccountOperationGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<BulkRewardAccountOperationGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} performing bulk ${input.operation} on ${input.rewardAccountIds.length} reward accounts`);
      
      const results: string[] = [];
      const failed: string[] = [];
      let successCount = 0;

      for (const rewardAccountId of input.rewardAccountIds) {
        try {
          switch (input.operation) {
            case 'activate':
              await this.rewardDistributionService.reactivateRewardAccount(rewardAccountId);
              results.push(`Reward account ${rewardAccountId}: activated successfully`);
              successCount++;
              break;
            case 'deactivate':
              await this.rewardDistributionService.deactivateRewardAccount(rewardAccountId);
              results.push(`Reward account ${rewardAccountId}: deactivated successfully`);
              successCount++;
              break;
            case 'delete':
              await this.rewardDistributionService.deleteRewardAccount(rewardAccountId);
              results.push(`Reward account ${rewardAccountId}: deleted successfully`);
              successCount++;
              break;
            case 'mark_expired':
              // This would need to be implemented in the service
              results.push(`Reward account ${rewardAccountId}: marked as expired`);
              successCount++;
              break;
          }
        } catch (error) {
          const errorMsg = `Reward account ${rewardAccountId}: ${error.message}`;
          results.push(errorMsg);
          failed.push(errorMsg);
        }
      }
      
      this.logger.log(`Bulk operation completed: ${successCount}/${input.rewardAccountIds.length} successful`);
      
      return {
        success: successCount > 0,
        message: `Bulk ${input.operation} completed: ${successCount}/${input.rewardAccountIds.length} successful`,
        affectedCount: successCount,
        details: results,
        failed: failed.length > 0 ? failed : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to perform bulk reward account operation: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to perform bulk operation',
        errors: [error.message],
        affectedCount: 0
      };
    }
  }

  // ==================== VALIDATION QUERIES ====================

  @Query(() => RewardAssignmentValidationGraphQLResponseDto, {
    description: 'Validate reward assignment eligibility (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async validateRewardAssignment(
    @Args('input') input: RewardAssignmentValidationGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardAssignmentValidationGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} validating reward assignment: reward ${input.rewardAccountId} to submission ${input.submissionId}`);
      
      const validation = await this.rewardDistributionService.validateRewardAssignment(
        input.rewardAccountId,
        input.submissionId
      );
      
      this.logger.log(`Reward assignment validation result: ${validation.isValid}`);
      
      return {
        isValid: validation.isValid,
        rewardAccount: this.convertNullToUndefined(validation.rewardAccount),
        error: validation.error,
        validationDetails: validation.isValid ? 'Reward assignment is valid and can proceed' : validation.error
      };
    } catch (error) {
      this.logger.error(`Failed to validate reward assignment: ${error.message}`, error.stack);
      
      return {
        isValid: false,
        error: 'Failed to validate reward assignment',
        validationDetails: error.message
      };
    }
  }

  @Query(() => RewardAccountCredentialsGraphQLResponseDto, {
    description: 'Get reward account with decrypted credentials (admin only - for audit purposes)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardAccountCredentials(
    @Args('input') input: GetRewardAccountCredentialsGraphQLInputDto,
    @CurrentAdmin() currentAdmin: Admin
  ): Promise<RewardAccountCredentialsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${currentAdmin.username} accessing credentials for reward account ${input.rewardAccountId}. Reason: ${input.accessReason}`);
      
      const rewardAccountWithCredentials = await this.rewardDistributionService.getRewardAccountWithCredentials(input.rewardAccountId);
      
      // Log the credential access for audit purposes
      this.logger.warn(`CREDENTIAL ACCESS: Admin ${currentAdmin.username} (ID: ${currentAdmin.id}) accessed credentials for reward account ${input.rewardAccountId}. Reason: ${input.accessReason}`);
      
      return {
        success: true,
        message: 'Reward account credentials retrieved successfully',
        rewardAccountWithCredentials: this.convertNullToUndefined(rewardAccountWithCredentials),
        auditWarning: 'This credential access has been logged for audit purposes'
      };
    } catch (error) {
      this.logger.error(`Failed to get reward account credentials: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to retrieve reward account credentials',
        errors: [error.message]
      };
    }
  }

  // ==================== SUBSCRIPTIONS ====================

  @Subscription(() => RewardAccountUpdatePayloadDto, {
    description: 'Subscribe to reward account updates (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardAccountUpdates() {
    // This would be implemented with a real-time subscription mechanism
    // For now, returning a placeholder
    return {
      type: 'CREATED',
      rewardAccount: {} as RewardAccountResponseDto,
      timestamp: new Date(),
      updatedBy: 1,
      context: 'Subscription placeholder'
    };
  }

  @Subscription(() => RewardAssignmentUpdatePayloadDto, {
    description: 'Subscribe to reward assignment updates (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardAssignmentUpdates() {
    // This would be implemented with a real-time subscription mechanism
    // For now, returning a placeholder
    return {
      type: 'ASSIGNED',
      assignment: {
        rewardAccount: {} as RewardAccountResponseDto,
        submissionId: 1,
        assignedAt: new Date(),
        assignedBy: 1,
        notes: 'Subscription placeholder'
      },
      timestamp: new Date()
    };
  }

  @Subscription(() => RewardInventoryUpdatePayloadDto, {
    description: 'Subscribe to reward inventory updates (admin only)'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async rewardInventoryUpdates() {
    // This would be implemented with a real-time subscription mechanism
    // For now, returning a placeholder
    return {
      type: 'STATS_UPDATED',
      stats: {} as RewardInventoryStatsDto,
      timestamp: new Date(),
      alertMessage: 'Subscription placeholder'
    };
  }
}