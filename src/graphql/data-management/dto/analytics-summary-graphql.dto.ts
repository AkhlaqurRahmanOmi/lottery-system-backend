import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class CouponStatisticsDataGraphQLDto {
  @Field(() => Int)
  totalGenerated: number;

  @Field(() => Int)
  totalActive: number;

  @Field(() => Int)
  totalRedeemed: number;

  @Field(() => Int)
  totalExpired: number;

  @Field(() => Int)
  totalDeactivated: number;

  @Field(() => Int)
  totalBatches: number;
}

@ObjectType()
export class SubmissionStatisticsDataGraphQLDto {
  @Field(() => Int)
  totalSubmissions: number;

  @Field(() => Int)
  submissionsWithRewards: number;

  @Field(() => Int)
  uniqueUsers: number;
}

@ObjectType()
export class RewardStatisticsDataGraphQLDto {
  @Field(() => Int)
  totalRewardAccounts: number;

  @Field(() => Int)
  availableRewards: number;

  @Field(() => Int)
  assignedRewards: number;

  @Field(() => Int)
  expiredRewards: number;
}

@ObjectType()
export class ConversionRateDataGraphQLDto {
  @Field()
  couponRedemptionRate: number;

  @Field()
  rewardAssignmentRate: number;

  @Field()
  overallConversionRate: number;

  @Field(() => Int)
  totalCouponsGenerated: number;

  @Field(() => Int)
  totalCouponsRedeemed: number;

  @Field(() => Int)
  totalSubmissions: number;

  @Field(() => Int)
  totalRewardsAssigned: number;
}

@ObjectType()
export class RewardPopularityDataGraphQLDto {
  @Field(() => Int)
  rewardId: number;

  @Field()
  rewardName: string;

  @Field({ nullable: true })
  rewardDescription?: string;

  @Field(() => Int)
  selectionCount: number;

  @Field()
  selectionPercentage: number;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class CategoryPopularityDataGraphQLDto {
  @Field()
  category: string;

  @Field(() => Int)
  accountCount: number;
}

@ObjectType()
export class RewardSelectionAnalyticsDataGraphQLDto {
  @Field(() => Int)
  totalRewardSelections: number;

  @Field(() => [RewardPopularityDataGraphQLDto])
  rewardPopularity: RewardPopularityDataGraphQLDto[];

  @Field(() => [CategoryPopularityDataGraphQLDto])
  categoryPopularity: CategoryPopularityDataGraphQLDto[];

  @Field(() => RewardPopularityDataGraphQLDto, { nullable: true })
  mostPopularReward?: RewardPopularityDataGraphQLDto;

  @Field(() => RewardPopularityDataGraphQLDto, { nullable: true })
  leastPopularReward?: RewardPopularityDataGraphQLDto;
}

@ObjectType()
export class AnalyticsSummaryGraphQLDto {
  @Field(() => CouponStatisticsDataGraphQLDto)
  coupons: CouponStatisticsDataGraphQLDto;

  @Field(() => SubmissionStatisticsDataGraphQLDto)
  submissions: SubmissionStatisticsDataGraphQLDto;

  @Field(() => RewardStatisticsDataGraphQLDto)
  rewards: RewardStatisticsDataGraphQLDto;

  @Field(() => ConversionRateDataGraphQLDto)
  conversion: ConversionRateDataGraphQLDto;

  @Field(() => RewardSelectionAnalyticsDataGraphQLDto)
  rewardSelection: RewardSelectionAnalyticsDataGraphQLDto;

  @Field()
  generatedAt: Date;
}