import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class DailyCouponStatsDto {
  @Field()
  @ApiProperty({ description: 'Date for the statistics' })
  date: Date;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of coupons generated on this date' })
  couponsGenerated: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of coupons redeemed on this date' })
  couponsRedeemed: number;
}

@ObjectType()
export class DailySubmissionStatsDto {
  @Field()
  @ApiProperty({ description: 'Date for the statistics' })
  date: Date;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of submissions on this date' })
  submissions: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Number of rewards assigned on this date' })
  rewardsAssigned: number;
}

@ObjectType()
export class PerformanceMetricsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Number of days covered by the metrics' })
  periodDays: number;

  @Field()
  @ApiProperty({ description: 'Start date of the metrics period' })
  startDate: Date;

  @Field()
  @ApiProperty({ description: 'End date of the metrics period' })
  endDate: Date;

  @Field(() => [DailyCouponStatsDto])
  @ApiProperty({ description: 'Daily coupon statistics', type: [DailyCouponStatsDto] })
  dailyCouponStats: DailyCouponStatsDto[];

  @Field(() => [DailySubmissionStatsDto])
  @ApiProperty({ description: 'Daily submission statistics', type: [DailySubmissionStatsDto] })
  dailySubmissionStats: DailySubmissionStatsDto[];
}