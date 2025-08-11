import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class CampaignCouponStatsGraphQLDto {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  active: number;

  @Field(() => Int)
  redeemed: number;

  @Field(() => Int)
  expired: number;

  @Field(() => Int)
  deactivated: number;
}

@ObjectType()
export class CampaignAnalyticsGraphQLDto {
  @Field()
  batchId: string;

  @Field(() => CampaignCouponStatsGraphQLDto)
  coupons: CampaignCouponStatsGraphQLDto;

  @Field(() => Int)
  totalSubmissions: number;

  @Field(() => Int)
  totalRewardsAssigned: number;

  @Field()
  conversionRate: number;

  @Field()
  rewardAssignmentRate: number;

  @Field()
  createdAt: Date;
}