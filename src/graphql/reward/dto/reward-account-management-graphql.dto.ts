import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsArray, IsString, IsIn, IsInt, ArrayNotEmpty, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RewardCategory, RewardStatus } from '@prisma/client';
import { 
  CreateRewardAccountDto, 
  UpdateRewardAccountDto, 
  AssignRewardDto,
  RewardAccountQueryDto
} from '../../../modules/reward/dto';

/**
 * GraphQL-specific input for creating reward accounts
 */
@InputType('CreateRewardAccountGraphQLInput')
export class CreateRewardAccountGraphQLInputDto extends CreateRewardAccountDto {
  @Field({ description: 'Name of the service (e.g., Netflix, Spotify, YouTube Premium)' })
  declare serviceName: string;

  @Field({ description: 'Type of account (e.g., Premium, Basic, Family)' })
  declare accountType: string;

  @Field({ description: 'Account credentials (will be encrypted before storage)' })
  declare credentials: string;

  @Field({ nullable: true, description: 'Duration of the subscription' })
  declare subscriptionDuration?: string;

  @Field({ nullable: true, description: 'Additional description of the reward account' })
  declare description?: string;

  @Field(() => RewardCategory, { description: 'Category of the reward account' })
  declare category: RewardCategory;

  @Field(() => Int, { description: 'ID of the admin creating the reward account' })
  declare createdBy: number;
}

/**
 * GraphQL-specific input for updating reward accounts
 */
@InputType('UpdateRewardAccountGraphQLInput')
export class UpdateRewardAccountGraphQLInputDto extends UpdateRewardAccountDto {
  @Field({ nullable: true, description: 'Name of the service' })
  declare serviceName?: string;

  @Field({ nullable: true, description: 'Type of account' })
  declare accountType?: string;

  @Field({ nullable: true, description: 'Updated account credentials (will be encrypted before storage)' })
  declare credentials?: string;

  @Field({ nullable: true, description: 'Updated duration of the subscription' })
  declare subscriptionDuration?: string;

  @Field({ nullable: true, description: 'Updated description of the reward account' })
  declare description?: string;

  @Field(() => RewardCategory, { nullable: true, description: 'Updated category of the reward account' })
  declare category?: RewardCategory;
}

/**
 * GraphQL-specific input for reward account queries
 */
@InputType('RewardAccountQueryGraphQLInput')
export class RewardAccountQueryGraphQLInputDto extends RewardAccountQueryDto {
  @Field(() => Int, { nullable: true, defaultValue: 1, description: 'Page number for pagination' })
  declare page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10, description: 'Number of items per page' })
  declare limit?: number;

  @Field({ nullable: true, description: 'Search term to filter by service name, account type, or description' })
  declare search?: string;

  @Field(() => RewardCategory, { nullable: true, description: 'Filter by reward category' })
  declare category?: RewardCategory;

  @Field(() => RewardStatus, { nullable: true, description: 'Filter by reward status' })
  declare status?: RewardStatus;

  @Field(() => Int, { nullable: true, description: 'Filter by assigned user ID' })
  declare assignedToUserId?: number;

  @Field(() => Int, { nullable: true, description: 'Filter by creator admin ID' })
  declare createdBy?: number;

  @Field({ nullable: true, defaultValue: 'createdAt', description: 'Field to sort by' })
  declare sortBy?: string;

  @Field({ nullable: true, defaultValue: 'desc', description: 'Sort order' })
  declare sortOrder?: 'asc' | 'desc';
}

/**
 * GraphQL-specific input for assigning rewards to users
 */
@InputType('AssignRewardGraphQLInput')
export class AssignRewardGraphQLInputDto extends AssignRewardDto {
  @Field(() => Int, { description: 'ID of the reward account to assign' })
  declare rewardAccountId: number;

  @Field(() => Int, { description: 'ID of the user submission to assign the reward to' })
  declare submissionId: number;

  @Field(() => Int, { description: 'ID of the admin assigning the reward' })
  declare assignedBy: number;

  @Field({ nullable: true, description: 'Optional notes about the assignment' })
  declare notes?: string;
}

/**
 * GraphQL-specific input for bulk reward account operations
 */
@InputType('BulkRewardAccountOperationInput')
export class BulkRewardAccountOperationGraphQLInputDto {
  @Field(() => [Int], { description: 'Array of reward account IDs to operate on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  rewardAccountIds: number[];

  @Field({ description: 'Operation to perform on the selected reward accounts' })
  @IsString()
  @IsIn(['activate', 'deactivate', 'delete', 'mark_expired'])
  operation: 'activate' | 'deactivate' | 'delete' | 'mark_expired';
}

/**
 * GraphQL-specific input for bulk reward account creation
 */
@InputType('BulkCreateRewardAccountInput')
export class BulkCreateRewardAccountGraphQLInputDto {
  @Field(() => [CreateRewardAccountGraphQLInputDto], { description: 'Array of reward accounts to create' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRewardAccountGraphQLInputDto)
  rewardAccounts: CreateRewardAccountGraphQLInputDto[];
}

/**
 * GraphQL-specific input for reward distribution tracking
 */
@InputType('RewardDistributionTrackingInput')
export class RewardDistributionTrackingGraphQLInputDto {
  @Field({ nullable: true, description: 'Start date for distribution tracking (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @Field({ nullable: true, description: 'End date for distribution tracking (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @Field(() => RewardCategory, { nullable: true, description: 'Filter by reward category' })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @Field(() => Int, { nullable: true, description: 'Filter by admin who assigned the rewards' })
  @IsOptional()
  @IsInt()
  assignedBy?: number;
}

/**
 * GraphQL-specific input for reward inventory management
 */
@InputType('RewardInventoryManagementInput')
export class RewardInventoryManagementGraphQLInputDto {
  @Field(() => RewardCategory, { nullable: true, description: 'Filter by reward category' })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @Field(() => RewardStatus, { nullable: true, description: 'Filter by reward status' })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @Field({ nullable: true, description: 'Include detailed breakdown by category and status' })
  @IsOptional()
  includeBreakdown?: boolean;
}

/**
 * GraphQL-specific input for reward assignment validation
 */
@InputType('RewardAssignmentValidationInput')
export class RewardAssignmentValidationGraphQLInputDto {
  @Field(() => Int, { description: 'ID of the reward account to validate for assignment' })
  @IsInt()
  rewardAccountId: number;

  @Field(() => Int, { description: 'ID of the user submission to validate assignment to' })
  @IsInt()
  submissionId: number;
}

/**
 * GraphQL-specific input for getting reward account credentials (admin only)
 */
@InputType('GetRewardAccountCredentialsInput')
export class GetRewardAccountCredentialsGraphQLInputDto {
  @Field(() => Int, { description: 'ID of the reward account to get credentials for' })
  @IsInt()
  rewardAccountId: number;

  @Field({ description: 'Reason for accessing credentials (for audit logging)' })
  @IsString()
  accessReason: string;
}