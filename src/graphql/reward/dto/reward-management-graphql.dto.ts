import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsArray, IsString, IsIn, IsInt, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  CreateRewardInput, 
  UpdateRewardInput,
  RewardQueryDto
} from '../../../modules/reward/dto';

/**
 * GraphQL-specific input for creating rewards
 */
@InputType('CreateRewardGraphQLInput')
export class CreateRewardGraphQLInputDto extends CreateRewardInput {
  @Field({ description: 'Name of the reward' })
  declare name: string;

  @Field({ nullable: true, description: 'Description of the reward' })
  declare description?: string;

  @Field({ nullable: true, description: 'URL to the reward image' })
  declare imageUrl?: string;

  @Field(() => Int, { nullable: true, description: 'Display order for the reward (lower numbers appear first)' })
  declare displayOrder?: number;

  @Field({ nullable: true, description: 'Whether the reward is active and available for selection' })
  declare isActive?: boolean;
}

/**
 * GraphQL-specific input for updating rewards
 */
@InputType('UpdateRewardGraphQLInput')
export class UpdateRewardGraphQLInputDto extends UpdateRewardInput {
  @Field({ nullable: true, description: 'Name of the reward' })
  declare name?: string;

  @Field({ nullable: true, description: 'Description of the reward' })
  declare description?: string;

  @Field({ nullable: true, description: 'URL to the reward image' })
  declare imageUrl?: string;

  @Field(() => Int, { nullable: true, description: 'Display order for the reward (lower numbers appear first)' })
  declare displayOrder?: number;

  @Field({ nullable: true, description: 'Whether the reward is active and available for selection' })
  declare isActive?: boolean;
}

/**
 * GraphQL-specific input for reward queries
 */
@InputType('RewardQueryGraphQLInput')
export class RewardQueryGraphQLInputDto extends RewardQueryDto {
  @Field(() => Int, { nullable: true, defaultValue: 1, description: 'Page number for pagination' })
  declare page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10, description: 'Number of items per page' })
  declare limit?: number;

  @Field({ nullable: true, description: 'Search term to filter rewards by name or description' })
  declare search?: string;

  @Field({ nullable: true, description: 'Filter by active status (true for active, false for inactive)' })
  declare isActive?: boolean;

  @Field({ nullable: true, defaultValue: 'displayOrder', description: 'Field to sort by' })
  declare sortBy?: string;

  @Field({ nullable: true, defaultValue: 'asc', description: 'Sort order' })
  declare sortOrder?: 'asc' | 'desc';
}

/**
 * GraphQL-specific input for bulk reward operations
 */
@InputType('BulkRewardOperationInput')
export class BulkRewardOperationGraphQLInputDto {
  @Field(() => [Int], { description: 'Array of reward IDs to operate on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  rewardIds: number[];

  @Field({ description: 'Operation to perform on the selected rewards' })
  @IsString()
  @IsIn(['activate', 'deactivate', 'delete'])
  operation: 'activate' | 'deactivate' | 'delete';
}

/**
 * GraphQL-specific input for reward ordering
 */
@InputType('RewardOrderingInput')
export class RewardOrderingGraphQLInputDto {
  @Field(() => [RewardOrderItemInput], { description: 'Array of reward ID and display order pairs' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RewardOrderItemInput)
  rewards: RewardOrderItemInput[];
}

/**
 * GraphQL-specific input for individual reward order item
 */
@InputType('RewardOrderItem')
export class RewardOrderItemInput {
  @Field(() => Int, { description: 'Reward ID' })
  @IsInt()
  id: number;

  @Field(() => Int, { description: 'New display order' })
  @IsInt()
  displayOrder: number;
}

/**
 * GraphQL-specific input for reward selection validation
 */
@InputType('RewardSelectionValidationInput')
export class RewardSelectionValidationGraphQLInputDto {
  @Field(() => Int, { description: 'ID of the reward to validate' })
  @IsInt()
  rewardId: number;
}