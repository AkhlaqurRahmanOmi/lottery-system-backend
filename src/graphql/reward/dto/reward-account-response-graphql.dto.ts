import { Field, ObjectType, Int } from '@nestjs/graphql';
import { 
  RewardAccountResponseDto, 
  RewardAccountWithCredentialsDto,
  PaginatedRewardAccountResponseDto,
  RewardInventoryStatsDto,
  RewardDistributionAnalyticsDto,
  AssignableRewardDto,
  BulkCreateResultDto,
  RewardAssignmentValidationDto
} from '../../../modules/reward/dto';

/**
 * GraphQL-specific response wrapper for mutations
 */
@ObjectType('RewardAccountMutationResponse')
export class RewardAccountMutationResponseDto {
  @Field({ description: 'Whether the operation was successful' })
  success: boolean;

  @Field({ nullable: true, description: 'Success or error message' })
  message?: string;

  @Field(() => [String], { nullable: true, description: 'Array of error messages if any' })
  errors?: string[];
}

/**
 * GraphQL-specific response for reward account creation
 */
@ObjectType('CreateRewardAccountResponse')
export class CreateRewardAccountGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => RewardAccountResponseDto, { nullable: true, description: 'Created reward account data' })
  rewardAccount?: RewardAccountResponseDto;
}

/**
 * GraphQL-specific response for reward account updates
 */
@ObjectType('UpdateRewardAccountResponse')
export class UpdateRewardAccountGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => RewardAccountResponseDto, { nullable: true, description: 'Updated reward account data' })
  rewardAccount?: RewardAccountResponseDto;
}

/**
 * GraphQL-specific response for reward account deletion
 */
@ObjectType('DeleteRewardAccountResponse')
export class DeleteRewardAccountGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => Int, { nullable: true, description: 'ID of the deleted reward account' })
  deletedId?: number;
}

/**
 * GraphQL-specific type for reward assignment result
 */
@ObjectType('RewardAccountAssignmentResult')
export class RewardAccountAssignmentResult {
  @Field(() => RewardAccountResponseDto, { description: 'Assigned reward account' })
  rewardAccount: RewardAccountResponseDto;

  @Field(() => Int, { description: 'ID of the user submission' })
  submissionId: number;

  @Field(() => Date, { description: 'When the reward was assigned' })
  assignedAt: Date;

  @Field(() => Int, { description: 'ID of the admin who assigned the reward' })
  assignedBy: number;

  @Field({ nullable: true, description: 'Optional notes about the assignment' })
  notes?: string;
}

/**
 * GraphQL-specific response for reward assignment
 */
@ObjectType('AssignRewardResponse')
export class AssignRewardGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => RewardAccountAssignmentResult, { nullable: true, description: 'Reward assignment details' })
  assignment?: RewardAccountAssignmentResult;
}

/**
 * GraphQL-specific response for reward assignment validation
 */
@ObjectType('RewardAssignmentValidationResponse')
export class RewardAssignmentValidationGraphQLResponseDto {
  @Field({ description: 'Whether the reward assignment is valid' })
  isValid: boolean;

  @Field(() => RewardAccountResponseDto, { nullable: true, description: 'Reward account data if valid' })
  rewardAccount?: RewardAccountResponseDto;

  @Field({ nullable: true, description: 'Error message if invalid' })
  error?: string;

  @Field({ nullable: true, description: 'Additional validation details' })
  validationDetails?: string;
}

/**
 * GraphQL-specific response for reward account credentials (admin only)
 */
@ObjectType('RewardAccountCredentialsResponse')
export class RewardAccountCredentialsGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => RewardAccountWithCredentialsDto, { nullable: true, description: 'Reward account with decrypted credentials' })
  rewardAccountWithCredentials?: RewardAccountWithCredentialsDto;

  @Field({ nullable: true, description: 'Warning about credential access for audit purposes' })
  auditWarning?: string;
}

/**
 * GraphQL-specific response for assignable rewards
 */
@ObjectType('AssignableRewardsResponse')
export class AssignableRewardsGraphQLResponseDto {
  @Field(() => [AssignableRewardDto], { description: 'Array of available rewards that can be assigned' })
  rewards: AssignableRewardDto[];

  @Field(() => Int, { description: 'Total count of assignable rewards' })
  totalCount: number;

  @Field(() => String, { description: 'JSON object with category breakdown' })
  categoryBreakdown: string; // JSON string representation
}

/**
 * GraphQL-specific response for bulk reward account operations
 */
@ObjectType('BulkRewardAccountOperationResponse')
export class BulkRewardAccountOperationGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => Int, { nullable: true, description: 'Number of reward accounts affected by the operation' })
  affectedCount?: number;

  @Field(() => [String], { nullable: true, description: 'Details of the operation for each reward account' })
  details?: string[];

  @Field(() => [String], { nullable: true, description: 'Failed operations if any' })
  failed?: string[];
}

/**
 * GraphQL-specific response for bulk reward account creation
 */
@ObjectType('BulkCreateRewardAccountResponse')
export class BulkCreateRewardAccountGraphQLResponseDto extends RewardAccountMutationResponseDto {
  @Field(() => BulkCreateResultDto, { nullable: true, description: 'Bulk creation results' })
  result?: BulkCreateResultDto;
}

/**
 * GraphQL-specific response for reward inventory statistics
 */
@ObjectType('RewardInventoryStatsResponse')
export class RewardInventoryStatsGraphQLResponseDto {
  @Field(() => RewardInventoryStatsDto, { description: 'Reward inventory statistics' })
  stats: RewardInventoryStatsDto;

  @Field(() => Date, { description: 'When the statistics were generated' })
  generatedAt: Date;

  @Field({ nullable: true, description: 'Additional insights or recommendations' })
  insights?: string;
}

/**
 * GraphQL-specific response for reward distribution analytics
 */
@ObjectType('RewardDistributionAnalyticsResponse')
export class RewardDistributionAnalyticsGraphQLResponseDto {
  @Field(() => RewardDistributionAnalyticsDto, { description: 'Comprehensive reward distribution analytics' })
  analytics: RewardDistributionAnalyticsDto;

  @Field(() => Date, { description: 'When the analytics were generated' })
  generatedAt: Date;

  @Field({ nullable: true, description: 'Trends and insights from the data' })
  insights?: string;
}

/**
 * GraphQL-specific response for reward distribution tracking
 */
@ObjectType('RewardDistributionTrackingResponse')
export class RewardDistributionTrackingGraphQLResponseDto {
  @Field(() => Int, { description: 'Total number of rewards distributed in the period' })
  totalDistributed: number;

  @Field(() => String, { description: 'JSON object with distributions by category' })
  distributionsByCategory: string; // JSON string representation

  @Field(() => String, { description: 'JSON object with distributions by admin' })
  distributionsByAdmin: string; // JSON string representation

  @Field(() => String, { description: 'JSON object with distributions by date' })
  distributionsByDate: string; // JSON string representation

  @Field({ description: 'Average time in hours from submission to reward assignment' })
  averageDistributionTime: number;

  @Field(() => Date, { description: 'Start date of the tracking period' })
  periodStart: Date;

  @Field(() => Date, { description: 'End date of the tracking period' })
  periodEnd: Date;
}

/**
 * GraphQL-specific subscription payload for reward account updates
 */
@ObjectType('RewardAccountUpdatePayload')
export class RewardAccountUpdatePayloadDto {
  @Field({ description: 'Type of update (CREATED, UPDATED, DELETED, ASSIGNED, DEACTIVATED)' })
  type: string;

  @Field(() => RewardAccountResponseDto, { description: 'Updated reward account data' })
  rewardAccount: RewardAccountResponseDto;

  @Field(() => Date, { description: 'Timestamp of the update' })
  timestamp: Date;

  @Field(() => Int, { nullable: true, description: 'ID of the admin who performed the update' })
  updatedBy?: number;

  @Field({ nullable: true, description: 'Additional context about the update' })
  context?: string;
}

/**
 * GraphQL-specific subscription payload for reward assignment updates
 */
@ObjectType('RewardAssignmentUpdatePayload')
export class RewardAssignmentUpdatePayloadDto {
  @Field({ description: 'Type of assignment update (ASSIGNED, UNASSIGNED, REASSIGNED)' })
  type: string;

  @Field(() => RewardAccountAssignmentResult, { description: 'Assignment details' })
  assignment: RewardAccountAssignmentResult;

  @Field(() => Date, { description: 'Timestamp of the assignment update' })
  timestamp: Date;

  @Field({ nullable: true, description: 'Previous assignment details if reassigned' })
  previousAssignment?: string; // JSON string representation
}

/**
 * GraphQL-specific subscription payload for inventory updates
 */
@ObjectType('RewardInventoryUpdatePayload')
export class RewardInventoryUpdatePayloadDto {
  @Field({ description: 'Type of inventory update (STATS_UPDATED, LOW_INVENTORY_ALERT)' })
  type: string;

  @Field(() => RewardInventoryStatsDto, { description: 'Updated inventory statistics' })
  stats: RewardInventoryStatsDto;

  @Field(() => Date, { description: 'Timestamp of the inventory update' })
  timestamp: Date;

  @Field({ nullable: true, description: 'Alert message if applicable' })
  alertMessage?: string;

  @Field(() => [String], { nullable: true, description: 'Categories with low inventory' })
  lowInventoryCategories?: string[];
}