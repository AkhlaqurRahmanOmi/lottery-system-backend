import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * Public-facing GraphQL type for rewards (used by end users during coupon redemption)
 * Excludes sensitive admin information
 */
@ObjectType('PublicReward')
export class PublicRewardGraphQLDto {
  @Field(() => Int, { description: 'Unique identifier for the reward' })
  id: number;

  @Field({ description: 'Name of the reward' })
  name: string;

  @Field({ nullable: true, description: 'Description of the reward' })
  description?: string | null;

  @Field({ nullable: true, description: 'URL to the reward image' })
  imageUrl?: string | null;

  @Field(() => Int, { description: 'Display order for the reward (lower numbers appear first)' })
  displayOrder: number;
}

/**
 * GraphQL query response for active rewards list
 */
@ObjectType('ActiveRewardsResponse')
export class ActiveRewardsGraphQLResponseDto {
  @Field(() => [PublicRewardGraphQLDto], { description: 'Array of active rewards available for selection' })
  rewards: PublicRewardGraphQLDto[];

  @Field(() => Int, { description: 'Total number of active rewards' })
  totalCount: number;
}

/**
 * GraphQL input for reward selection validation
 */
@ObjectType('PublicRewardSelectionValidationResponse')
export class PublicRewardSelectionValidationGraphQLResponseDto {
  @Field({ description: 'Whether the reward selection is valid' })
  isValid: boolean;

  @Field(() => PublicRewardGraphQLDto, { nullable: true, description: 'Reward data if valid' })
  reward?: PublicRewardGraphQLDto;

  @Field({ nullable: true, description: 'Error message if invalid' })
  error?: string;
}

/**
 * GraphQL type for public reward popularity statistics
 */
@ObjectType('PublicRewardPopularity')
export class PublicRewardPopularityGraphQLDto {
  @Field(() => Int, { description: 'Reward ID' })
  id: number;

  @Field({ description: 'Reward name' })
  name: string;

  @Field(() => Int, { description: 'Number of times this reward has been selected' })
  selectionCount: number;

  @Field({ description: 'Percentage of total selections' })
  selectionPercentage: number;
}

/**
 * GraphQL response for public reward popularity statistics
 */
@ObjectType('PublicRewardPopularityResponse')
export class PublicRewardPopularityGraphQLResponseDto {
  @Field(() => [PublicRewardPopularityGraphQLDto], { description: 'Array of reward popularity statistics' })
  rewards: PublicRewardPopularityGraphQLDto[];

  @Field(() => Int, { description: 'Total number of reward selections across all rewards' })
  totalSelections: number;

  @Field({ description: 'Date when statistics were last updated' })
  lastUpdated: Date;
}

/**
 * GraphQL subscription payload for public reward updates
 */
@ObjectType('PublicRewardUpdatePayload')
export class PublicRewardUpdatePayloadDto {
  @Field({ description: 'Type of update (ACTIVATED, DEACTIVATED, UPDATED)' })
  type: string;

  @Field(() => PublicRewardGraphQLDto, { nullable: true, description: 'Updated reward data (null if deactivated)' })
  reward?: PublicRewardGraphQLDto;

  @Field({ description: 'Timestamp of the update' })
  timestamp: Date;
}

/**
 * GraphQL subscription payload for reward availability changes
 */
@ObjectType('RewardAvailabilityUpdatePayload')
export class RewardAvailabilityUpdatePayloadDto {
  @Field({ description: 'Type of availability change' })
  type: string; // 'REWARD_ADDED', 'REWARD_REMOVED', 'REWARD_UPDATED'

  @Field(() => [PublicRewardGraphQLDto], { description: 'Current list of available rewards' })
  availableRewards: PublicRewardGraphQLDto[];

  @Field({ description: 'Timestamp of the change' })
  timestamp: Date;
}