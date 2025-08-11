import { Field, ObjectType, Int } from '@nestjs/graphql';
import { 
  RewardResponseDto, 
  PaginatedRewardResponseDto
} from '../../../modules/reward/dto';

/**
 * GraphQL-specific response wrapper for mutations
 */
@ObjectType('RewardMutationResponse')
export class RewardMutationResponseDto {
  @Field({ description: 'Whether the operation was successful' })
  success: boolean;

  @Field({ nullable: true, description: 'Success or error message' })
  message?: string;

  @Field(() => [String], { nullable: true, description: 'Array of error messages if any' })
  errors?: string[];
}

/**
 * GraphQL-specific response for reward creation
 */
@ObjectType('CreateRewardResponse')
export class CreateRewardGraphQLResponseDto extends RewardMutationResponseDto {
  @Field(() => RewardResponseDto, { nullable: true, description: 'Created reward data' })
  reward?: RewardResponseDto;
}

/**
 * GraphQL-specific response for reward updates
 */
@ObjectType('UpdateRewardResponse')
export class UpdateRewardGraphQLResponseDto extends RewardMutationResponseDto {
  @Field(() => RewardResponseDto, { nullable: true, description: 'Updated reward data' })
  reward?: RewardResponseDto;
}

/**
 * GraphQL-specific response for reward deletion
 */
@ObjectType('DeleteRewardResponse')
export class DeleteRewardGraphQLResponseDto extends RewardMutationResponseDto {
  @Field(() => Int, { nullable: true, description: 'ID of the deleted reward' })
  deletedId?: number;
}

/**
 * GraphQL-specific response for bulk operations
 */
@ObjectType('BulkRewardOperationResponse')
export class BulkRewardOperationGraphQLResponseDto extends RewardMutationResponseDto {
  @Field(() => Int, { nullable: true, description: 'Number of rewards affected by the operation' })
  affectedCount?: number;

  @Field(() => [String], { nullable: true, description: 'Details of the operation for each reward' })
  details?: string[];
}

/**
 * GraphQL-specific response for reward ordering
 */
@ObjectType('RewardOrderingResponse')
export class RewardOrderingGraphQLResponseDto extends RewardMutationResponseDto {
  @Field(() => Int, { nullable: true, description: 'Number of rewards with updated display order' })
  updatedCount?: number;
}

/**
 * GraphQL-specific response for reward selection validation
 */
@ObjectType('RewardSelectionValidationResponse')
export class RewardSelectionValidationGraphQLResponseDto {
  @Field({ description: 'Whether the reward selection is valid' })
  isValid: boolean;

  @Field(() => RewardResponseDto, { nullable: true, description: 'Reward data if valid' })
  reward?: RewardResponseDto;

  @Field({ nullable: true, description: 'Error message if invalid' })
  error?: string;
}

/**
 * GraphQL-specific type for reward popularity data
 */
@ObjectType('RewardPopularityItem')
export class RewardPopularityItem {
  @Field(() => Int, { description: 'Reward ID' })
  id: number;

  @Field({ description: 'Reward name' })
  name: string;

  @Field(() => Int, { description: 'Number of times this reward has been selected' })
  selectionCount: number;

  @Field({ nullable: true, description: 'Percentage of total selections' })
  selectionPercentage?: number;
}

/**
 * GraphQL-specific response for reward statistics
 */
@ObjectType('RewardStatistics')
export class RewardStatisticsGraphQLResponseDto {
  @Field(() => Int, { description: 'Total number of rewards' })
  totalRewards: number;

  @Field(() => Int, { description: 'Number of active rewards' })
  activeRewards: number;

  @Field(() => Int, { description: 'Number of inactive rewards' })
  inactiveRewards: number;

  @Field(() => RewardPopularityItem, { nullable: true, description: 'Most popular reward' })
  mostPopularReward?: RewardPopularityItem;

  @Field(() => RewardPopularityItem, { nullable: true, description: 'Least popular reward' })
  leastPopularReward?: RewardPopularityItem;
}

/**
 * GraphQL-specific response for reward popularity statistics
 */
@ObjectType('RewardPopularityResponse')
export class RewardPopularityGraphQLResponseDto {
  @Field(() => [RewardPopularityItem], { description: 'Array of reward popularity statistics' })
  rewards: RewardPopularityItem[];

  @Field(() => Int, { description: 'Total number of reward selections' })
  totalSelections: number;
}

/**
 * GraphQL-specific subscription payload for reward updates
 */
@ObjectType('RewardUpdatePayload')
export class RewardUpdatePayloadDto {
  @Field({ description: 'Type of update (CREATED, UPDATED, DELETED, ACTIVATED, DEACTIVATED)' })
  type: string;

  @Field(() => RewardResponseDto, { description: 'Updated reward data' })
  reward: RewardResponseDto;

  @Field(() => Date, { description: 'Timestamp of the update' })
  timestamp: Date;

  @Field(() => Int, { nullable: true, description: 'ID of the admin who performed the update' })
  updatedBy?: number;
}

/**
 * GraphQL-specific subscription payload for reward statistics updates
 */
@ObjectType('RewardStatisticsUpdatePayload')
export class RewardStatisticsUpdatePayloadDto {
  @Field({ description: 'Type of statistics update' })
  type: string;

  @Field(() => RewardStatisticsGraphQLResponseDto, { description: 'Updated statistics data' })
  statistics: RewardStatisticsGraphQLResponseDto;

  @Field(() => Date, { description: 'Timestamp of the update' })
  timestamp: Date;
}