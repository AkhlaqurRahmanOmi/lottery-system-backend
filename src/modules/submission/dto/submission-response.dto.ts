import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { SubmissionBaseDto } from './submission-base.dto';

@ObjectType()
export class CouponInfoDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Coupon ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Coupon code' })
  couponCode: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Batch ID' })
  batchId?: string;

  @Field()
  @ApiProperty({ description: 'Coupon status' })
  status: string;

  @Field()
  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;
}

@ObjectType()
export class RewardInfoDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Reward ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Reward name' })
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Reward description' })
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Reward image URL' })
  imageUrl?: string;

  @Field()
  @ApiProperty({ description: 'Whether reward is active' })
  isActive: boolean;
}

@ObjectType()
export class RewardAccountInfoDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Reward account ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @Field()
  @ApiProperty({ description: 'Account type' })
  accountType: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Subscription duration' })
  subscriptionDuration?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @Field()
  @ApiProperty({ description: 'Reward category' })
  category: string;

  @Field()
  @ApiProperty({ description: 'Assignment date' })
  assignedAt?: Date;
}

@ObjectType()
export class AdminInfoDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Admin ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Admin username' })
  username: string;

  @Field()
  @ApiProperty({ description: 'Admin email' })
  email: string;
}



@ObjectType()
export class RewardSelectionStatsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Reward ID' })
  rewardId: number;

  @Field()
  @ApiProperty({ description: 'Reward name' })
  rewardName: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of times selected' })
  selectionCount: number;

  @Field()
  @ApiProperty({ description: 'Percentage of total selections' })
  selectionPercentage: number;
}

@ObjectType()
export class SubmissionStatisticsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total number of submissions' })
  total: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of submissions with assigned rewards' })
  withAssignedRewards: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of submissions without assigned rewards' })
  withoutAssignedRewards: number;

  @Field()
  @ApiProperty({ description: 'Reward assignment rate as percentage' })
  rewardAssignmentRate: number;

  @Field(() => [RewardSelectionStatsDto])
  @ApiProperty({ type: [RewardSelectionStatsDto], description: 'Reward selection statistics' })
  rewardSelectionStats: RewardSelectionStatsDto[];
}

@ObjectType()
export class SubmissionResponseDto extends SubmissionBaseDto {
  // Simple response DTO without relations
}

@ObjectType()
export class SubmissionWithRelationsResponseDto extends SubmissionBaseDto {
  @Field(() => CouponInfoDto, { nullable: true })
  @ApiPropertyOptional({ description: 'Coupon information' })
  coupon?: CouponInfoDto;

  @Field(() => RewardInfoDto, { nullable: true })
  @ApiPropertyOptional({ description: 'Selected reward information' })
  selectedReward?: RewardInfoDto;

  @Field(() => RewardAccountInfoDto, { nullable: true })
  @ApiPropertyOptional({ description: 'Assigned reward account information' })
  assignedReward?: RewardAccountInfoDto;

  @Field(() => AdminInfoDto, { nullable: true })
  @ApiPropertyOptional({ description: 'Admin who assigned the reward' })
  rewardAssignedByAdmin?: AdminInfoDto;
}

@ObjectType()
export class PaginatedSubmissionResponseDto {
  @Field(() => [SubmissionWithRelationsResponseDto])
  @ApiProperty({ type: [SubmissionWithRelationsResponseDto], description: 'Array of submissions' })
  data: SubmissionWithRelationsResponseDto[];

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of submissions' })
  total: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @Field()
  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @Field()
  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}