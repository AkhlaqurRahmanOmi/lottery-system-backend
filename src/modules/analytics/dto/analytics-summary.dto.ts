import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CouponStatisticsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total number of coupons generated' })
  totalGenerated: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of active coupons' })
  totalActive: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of redeemed coupons' })
  totalRedeemed: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of expired coupons' })
  totalExpired: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of deactivated coupons' })
  totalDeactivated: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of batches created' })
  totalBatches: number;
}

@ObjectType()
export class SubmissionStatisticsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total number of user submissions' })
  totalSubmissions: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of submissions with assigned rewards' })
  submissionsWithRewards: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of unique users who submitted' })
  uniqueUsers: number;
}

@ObjectType()
export class RewardAccountStatisticsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total number of reward accounts' })
  totalRewardAccounts: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of available reward accounts' })
  availableRewards: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of assigned reward accounts' })
  assignedRewards: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of expired reward accounts' })
  expiredRewards: number;
}

@ObjectType()
export class ConversionRateDto {
  @Field(() => Float)
  @ApiProperty({ description: 'Percentage of coupons that were redeemed' })
  couponRedemptionRate: number;

  @Field(() => Float)
  @ApiProperty({ description: 'Percentage of submissions that received rewards' })
  rewardAssignmentRate: number;

  @Field(() => Float)
  @ApiProperty({ description: 'Overall conversion rate from coupon to reward' })
  overallConversionRate: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of coupons generated' })
  totalCouponsGenerated: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of coupons redeemed' })
  totalCouponsRedeemed: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of submissions' })
  totalSubmissions: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total number of rewards assigned' })
  totalRewardsAssigned: number;
}

@ObjectType()
export class RewardPopularityDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Reward ID' })
  rewardId: number;

  @Field()
  @ApiProperty({ description: 'Reward name' })
  rewardName: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Reward description', required: false })
  rewardDescription?: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of times this reward was selected' })
  selectionCount: number;

  @Field(() => Float)
  @ApiProperty({ description: 'Percentage of total selections' })
  selectionPercentage: number;

  @Field()
  @ApiProperty({ description: 'Whether the reward is currently active' })
  isActive: boolean;
}

@ObjectType()
export class CategoryPopularityDto {
  @Field()
  @ApiProperty({ description: 'Reward category' })
  category: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of reward accounts in this category' })
  accountCount: number;
}

@ObjectType()
export class RewardSelectionAnalyticsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total number of reward selections made' })
  totalRewardSelections: number;

  @Field(() => [RewardPopularityDto])
  @ApiProperty({ description: 'Reward popularity statistics', type: [RewardPopularityDto] })
  rewardPopularity: RewardPopularityDto[];

  @Field(() => [CategoryPopularityDto])
  @ApiProperty({ description: 'Category popularity statistics', type: [CategoryPopularityDto] })
  categoryPopularity: CategoryPopularityDto[];

  @Field(() => RewardPopularityDto, { nullable: true })
  @ApiProperty({ description: 'Most popular reward', required: false })
  mostPopularReward?: RewardPopularityDto;

  @Field(() => RewardPopularityDto, { nullable: true })
  @ApiProperty({ description: 'Least popular reward', required: false })
  leastPopularReward?: RewardPopularityDto;
}

@ObjectType()
export class AnalyticsSummaryDto {
  @Field(() => CouponStatisticsDto)
  @ApiProperty({ description: 'Coupon statistics' })
  coupons: CouponStatisticsDto;

  @Field(() => SubmissionStatisticsDto)
  @ApiProperty({ description: 'Submission statistics' })
  submissions: SubmissionStatisticsDto;

  @Field(() => RewardAccountStatisticsDto)
  @ApiProperty({ description: 'Reward account statistics' })
  rewards: RewardAccountStatisticsDto;

  @Field(() => ConversionRateDto)
  @ApiProperty({ description: 'Conversion rate metrics' })
  conversion: ConversionRateDto;

  @Field(() => RewardSelectionAnalyticsDto)
  @ApiProperty({ description: 'Reward selection analytics' })
  rewardSelection: RewardSelectionAnalyticsDto;

  @Field()
  @ApiProperty({ description: 'Timestamp when analytics were generated' })
  generatedAt: Date;
}