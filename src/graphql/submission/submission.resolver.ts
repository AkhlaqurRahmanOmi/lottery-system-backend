import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Int
} from '@nestjs/graphql';
import {
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
const { PubSub } = require('graphql-subscriptions');
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import { SubmissionService } from '../../modules/submission/submission.service';
import {
  CreateSubmissionGraphQLDto,
  ValidateCouponGraphQLDto,
  CouponValidationGraphQLResponseDto,
  SubmissionGraphQLResponseDto,
  SubmissionWithRelationsGraphQLResponseDto,
  PaginatedSubmissionGraphQLResponseDto,
  SubmissionStatisticsGraphQLDto,
  SubmissionQueryGraphQLDto,
  AssignRewardToSubmissionGraphQLDto,
  BulkAssignRewardGraphQLDto
} from './dto';
import {
  SubmissionResponseDto,
  SubmissionWithRelationsResponseDto,
  PaginatedSubmissionResponseDto,
  SubmissionStatisticsDto
} from '../../modules/submission/dto';

// Use any type to avoid Prisma import issues - this will be resolved when Prisma client is regenerated
type Admin = any;

// Subscription payload types (interfaces for internal use)
interface ISubmissionUpdatePayload {
  type: 'CREATED' | 'UPDATED' | 'REWARD_ASSIGNED' | 'REWARD_REMOVED';
  submission: SubmissionResponseDto;
  timestamp: Date;
  adminId?: number;
}

interface ISubmissionAnalyticsPayload {
  type: 'STATISTICS_UPDATED';
  statistics: SubmissionStatisticsDto;
  timestamp: Date;
}

@Resolver()
export class SubmissionResolver {
  private readonly logger = new Logger(SubmissionResolver.name);
  private readonly pubSub: any;

  constructor(private readonly submissionService: SubmissionService) {
    this.pubSub = new PubSub();
  }

  // Public Queries

  @Query(() => CouponValidationGraphQLResponseDto, {
    description: 'Validate coupon code for redemption (public endpoint)'
  })
  async validateCouponForSubmission(
    @Args('input') input: ValidateCouponGraphQLDto
  ): Promise<CouponValidationGraphQLResponseDto> {
    try {
      this.logger.log(`Public coupon validation request for code: ${input.couponCode}`);
      const result = await this.submissionService.validateCouponCode(input.couponCode);
      
      return {
        isValid: result.isValid,
        message: result.error
      };
    } catch (error) {
      this.logger.error(`Failed to validate coupon ${input.couponCode}: ${error.message}`, error.stack);
      return {
        isValid: false,
        message: 'Validation error occurred'
      };
    }
  }

  // Admin Queries

  @Query(() => SubmissionWithRelationsGraphQLResponseDto, {
    description: 'Get submission by ID with relations'
  })
  @UseGuards(JwtAuthGuard)
  async submission(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionWithRelationsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting submission with ID: ${id}`);
      return await this.submissionService.getSubmissionById(id);
    } catch (error) {
      this.logger.error(`Failed to get submission ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => PaginatedSubmissionGraphQLResponseDto, {
    description: 'Get paginated list of submissions with filters'
  })
  @UseGuards(JwtAuthGuard)
  async submissions(
    @Args('query', { nullable: true }) query: SubmissionQueryGraphQLDto,
    @CurrentAdmin() admin: Admin
  ): Promise<PaginatedSubmissionGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting submissions list`);
      return await this.submissionService.getSubmissions(query || {});
    } catch (error) {
      this.logger.error(`Failed to get submissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [SubmissionGraphQLResponseDto], {
    description: 'Get submissions without assigned rewards (for admin review)'
  })
  @UseGuards(JwtAuthGuard)
  async submissionsWithoutRewards(
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionGraphQLResponseDto[]> {
    try {
      this.logger.log(`Admin ${admin.username} requesting submissions without rewards`);
      return await this.submissionService.getSubmissionsWithoutRewards();
    } catch (error) {
      this.logger.error(`Failed to get submissions without rewards: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [SubmissionGraphQLResponseDto], {
    description: 'Get recent submissions'
  })
  @UseGuards(JwtAuthGuard)
  async recentSubmissions(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionGraphQLResponseDto[]> {
    try {
      this.logger.log(`Admin ${admin.username} requesting recent submissions (limit: ${limit})`);
      return await this.submissionService.getRecentSubmissions(limit);
    } catch (error) {
      this.logger.error(`Failed to get recent submissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [SubmissionGraphQLResponseDto], {
    description: 'Search submissions by email'
  })
  @UseGuards(JwtAuthGuard)
  async searchSubmissionsByEmail(
    @Args('email') email: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionGraphQLResponseDto[]> {
    try {
      this.logger.log(`Admin ${admin.username} searching submissions by email: ${email}`);
      return await this.submissionService.searchSubmissionsByEmail(email, limit);
    } catch (error) {
      this.logger.error(`Failed to search submissions by email ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => SubmissionStatisticsGraphQLDto, {
    description: 'Get submission statistics'
  })
  @UseGuards(JwtAuthGuard)
  async submissionStatistics(
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionStatisticsGraphQLDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting submission statistics`);
      return await this.submissionService.getSubmissionStatistics();
    } catch (error) {
      this.logger.error(`Failed to get submission statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Public Mutations

  @Mutation(() => SubmissionGraphQLResponseDto, {
    description: 'Submit user form data with coupon redemption (public endpoint)'
  })
  async createSubmission(
    @Args('input') input: CreateSubmissionGraphQLDto
  ): Promise<SubmissionGraphQLResponseDto> {
    try {
      this.logger.log(`Public submission creation for coupon: ${input.couponCode}`);
      
      // Convert GraphQL input to service format
      // Use a default reward ID (1) if not provided, as users no longer select rewards
      const submissionData = {
        couponCode: input.couponCode,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        productExperience: input.productExperience,
        selectedRewardId: input.selectedRewardId || 1 // Default reward ID
      };

      const submission = await this.submissionService.processUserSubmission(submissionData);

      // Publish subscription event
      this.pubSub.publish('submissionUpdated', {
        submissionUpdated: {
          type: 'CREATED',
          submission,
          timestamp: new Date()
        }
      });

      // Update statistics
      this.publishStatisticsUpdate();

      return submission;
    } catch (error) {
      this.logger.error(`Failed to create submission: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Admin Mutations

  @Mutation(() => SubmissionGraphQLResponseDto, {
    description: 'Assign reward to user submission (admin only)'
  })
  @UseGuards(JwtAuthGuard)
  async assignRewardToSubmission(
    @Args('input') input: AssignRewardToSubmissionGraphQLDto,
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} assigning reward ${input.rewardAccountId} to submission ${input.submissionId}`);
      
      const updatedSubmission = await this.submissionService.assignRewardToSubmission(input, admin.id);

      // Publish subscription event
      this.pubSub.publish('submissionUpdated', {
        submissionUpdated: {
          type: 'REWARD_ASSIGNED',
          submission: updatedSubmission,
          timestamp: new Date(),
          adminId: admin.id
        }
      });

      // Update statistics
      this.publishStatisticsUpdate();

      return updatedSubmission;
    } catch (error) {
      this.logger.error(`Failed to assign reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => SubmissionGraphQLResponseDto, {
    description: 'Remove reward assignment from submission (admin only)'
  })
  @UseGuards(JwtAuthGuard)
  async removeRewardAssignment(
    @Args('submissionId', { type: () => Int }) submissionId: number,
    @CurrentAdmin() admin: Admin
  ): Promise<SubmissionGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} removing reward assignment from submission ${submissionId}`);
      
      const updatedSubmission = await this.submissionService.removeRewardAssignment(submissionId);

      // Publish subscription event
      this.pubSub.publish('submissionUpdated', {
        submissionUpdated: {
          type: 'REWARD_REMOVED',
          submission: updatedSubmission,
          timestamp: new Date(),
          adminId: admin.id
        }
      });

      // Update statistics
      this.publishStatisticsUpdate();

      return updatedSubmission;
    } catch (error) {
      this.logger.error(`Failed to remove reward assignment: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Subscriptions

  @Subscription(() => SubmissionUpdatePayload, {
    description: 'Subscribe to submission updates (created, reward assigned/removed)'
  })
  submissionUpdated() {
    return this.pubSub.asyncIterator('submissionUpdated');
  }

  @Subscription(() => SubmissionAnalyticsPayload, {
    description: 'Subscribe to submission analytics updates'
  })
  @UseGuards(JwtAuthGuard)
  submissionAnalyticsUpdated() {
    return this.pubSub.asyncIterator('submissionAnalyticsUpdated');
  }

  // Helper methods

  private async publishStatisticsUpdate(): Promise<void> {
    try {
      const statistics = await this.submissionService.getSubmissionStatistics();
      this.pubSub.publish('submissionAnalyticsUpdated', {
        submissionAnalyticsUpdated: {
          type: 'STATISTICS_UPDATED',
          statistics,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Failed to publish statistics update: ${error.message}`);
    }
  }
}

// Subscription payload object types for GraphQL
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SubmissionUpdatePayload {
  @Field()
  type: string;

  @Field(() => SubmissionGraphQLResponseDto)
  submission: SubmissionGraphQLResponseDto;

  @Field()
  timestamp: Date;

  @Field(() => Int, { nullable: true })
  adminId?: number;
}

@ObjectType()
export class SubmissionAnalyticsPayload {
  @Field()
  type: string;

  @Field(() => SubmissionStatisticsGraphQLDto)
  statistics: SubmissionStatisticsGraphQLDto;

  @Field()
  timestamp: Date;
}