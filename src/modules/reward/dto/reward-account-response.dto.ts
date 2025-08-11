import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { RewardAccountBaseDto } from './reward-account-base.dto';

// Admin profile for creator information
@ObjectType('RewardCreatorProfile')
export class AdminProfileDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  username: string;

  @Field()
  @ApiProperty()
  email: string;
}

// User submission info for assigned rewards
@ObjectType('RewardSubmissionInfo')
export class SubmissionInfoDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  name: string;

  @Field()
  @ApiProperty()
  email: string;

  @Field()
  @ApiProperty()
  submittedAt: Date;
}

// Response DTO for reward account (without sensitive credentials)
@ObjectType('RewardAccountResponse')
export class RewardAccountResponseDto extends RewardAccountBaseDto {
  @Field(() => AdminProfileDto, { nullable: true })
  @ApiPropertyOptional({ type: AdminProfileDto })
  creator?: AdminProfileDto;

  @Field(() => [SubmissionInfoDto], { nullable: true })
  @ApiPropertyOptional({ type: [SubmissionInfoDto] })
  assignedSubmissions?: SubmissionInfoDto[];
}

// Response DTO for reward account with decrypted credentials (admin only)
@ObjectType('RewardAccountWithCredentials')
export class RewardAccountWithCredentialsDto extends RewardAccountResponseDto {
  @Field()
  @ApiProperty({ description: 'Decrypted account credentials (admin only)' })
  decryptedCredentials: string;
}

// Paginated response for reward accounts
@ObjectType('PaginatedRewardAccountResponse')
export class PaginatedRewardAccountResponseDto {
  @Field(() => [RewardAccountResponseDto])
  @ApiProperty({ type: [RewardAccountResponseDto] })
  data: RewardAccountResponseDto[];

  @Field(() => Int)
  @ApiProperty()
  total: number;

  @Field(() => Int)
  @ApiProperty()
  page: number;

  @Field(() => Int)
  @ApiProperty()
  limit: number;

  @Field(() => Int)
  @ApiProperty()
  totalPages: number;

  @Field()
  @ApiProperty()
  hasNextPage: boolean;

  @Field()
  @ApiProperty()
  hasPreviousPage: boolean;
}

// Reward inventory statistics
@ObjectType('RewardInventoryStats')
export class RewardInventoryStatsDto {
  @Field(() => Int)
  @ApiProperty()
  total: number;

  @Field(() => Int)
  @ApiProperty()
  available: number;

  @Field(() => Int)
  @ApiProperty()
  assigned: number;

  @Field(() => Int)
  @ApiProperty()
  expired: number;

  @Field(() => Int)
  @ApiProperty()
  deactivated: number;

  @Field(() => String)
  @ApiProperty({ description: 'JSON object with category counts' })
  byCategory: string; // JSON string representation of category counts
}

// Reward distribution analytics
@ObjectType('RewardDistributionAnalytics')
export class RewardDistributionAnalyticsDto {
  @Field(() => RewardInventoryStatsDto)
  @ApiProperty({ type: RewardInventoryStatsDto })
  inventory: RewardInventoryStatsDto;

  @Field()
  @ApiProperty()
  distributionRate: number;

  @Field()
  @ApiProperty()
  availabilityRate: number;

  @Field(() => String)
  @ApiProperty({ description: 'JSON object with category distribution' })
  categoryDistribution: string; // JSON string representation
}

// Assignable reward (simplified for assignment purposes)
@ObjectType('AssignableReward')
export class AssignableRewardDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  serviceName: string;

  @Field()
  @ApiProperty()
  accountType: string;

  @Field()
  @ApiProperty()
  category: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  subscriptionDuration?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  description?: string;

  @Field()
  @ApiProperty()
  createdAt: Date;
}

// Bulk creation result
@ObjectType('BulkCreateResult')
export class BulkCreateResultDto {
  @Field(() => [RewardAccountResponseDto])
  @ApiProperty({ type: [RewardAccountResponseDto] })
  successful: RewardAccountResponseDto[];

  @Field(() => String)
  @ApiProperty({ description: 'JSON array of failed creation attempts' })
  failed: string; // JSON string representation of failed attempts

  @Field(() => String)
  @ApiProperty({ description: 'JSON object with summary statistics' })
  summary: string; // JSON string representation of summary
}

// Reward assignment validation result
@ObjectType('RewardAssignmentValidation')
export class RewardAssignmentValidationDto {
  @Field()
  @ApiProperty()
  isValid: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  error?: string;

  @Field(() => RewardAccountResponseDto, { nullable: true })
  @ApiPropertyOptional({ type: RewardAccountResponseDto })
  rewardAccount?: RewardAccountResponseDto;
}