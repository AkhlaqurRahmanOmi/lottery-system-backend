import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DailyCouponStatsGraphQLDto {
  @Field()
  date: Date;

  @Field(() => Int)
  couponsGenerated: number;

  @Field(() => Int)
  couponsRedeemed: number;
}

@ObjectType()
export class DailySubmissionStatsGraphQLDto {
  @Field()
  date: Date;

  @Field(() => Int)
  submissions: number;

  @Field(() => Int)
  rewardsAssigned: number;
}

@ObjectType()
export class PerformanceMetricsGraphQLDto {
  @Field(() => Int)
  periodDays: number;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field(() => [DailyCouponStatsGraphQLDto])
  dailyCouponStats: DailyCouponStatsGraphQLDto[];

  @Field(() => [DailySubmissionStatsGraphQLDto])
  dailySubmissionStats: DailySubmissionStatsGraphQLDto[];
}