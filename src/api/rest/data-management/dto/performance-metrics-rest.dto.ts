import { ApiProperty } from '@nestjs/swagger';
import { PerformanceMetricsDto } from '../../../../modules/analytics/dto';

export class DailyCouponStatsRestDto {
  @ApiProperty({
    description: 'Date of the statistics',
    example: '2024-01-15',
  })
  date: Date;

  @ApiProperty({
    description: 'Number of coupons generated on this date',
    example: 50,
  })
  couponsGenerated: number;

  @ApiProperty({
    description: 'Number of coupons redeemed on this date',
    example: 12,
  })
  couponsRedeemed: number;
}

export class DailySubmissionStatsRestDto {
  @ApiProperty({
    description: 'Date of the statistics',
    example: '2024-01-15',
  })
  date: Date;

  @ApiProperty({
    description: 'Number of submissions on this date',
    example: 10,
  })
  submissions: number;

  @ApiProperty({
    description: 'Number of rewards assigned on this date',
    example: 8,
  })
  rewardsAssigned: number;
}

export class PerformanceMetricsRestDto extends PerformanceMetricsDto {
  @ApiProperty({
    description: 'Analysis period in days',
    example: 30,
  })
  declare periodDays: number;

  @ApiProperty({
    description: 'Start date of analysis period',
    example: '2024-01-01T00:00:00.000Z',
  })
  declare startDate: Date;

  @ApiProperty({
    description: 'End date of analysis period',
    example: '2024-01-31T23:59:59.999Z',
  })
  declare endDate: Date;

  @ApiProperty({
    description: 'Daily coupon statistics',
    type: [DailyCouponStatsRestDto],
  })
  declare dailyCouponStats: DailyCouponStatsRestDto[];

  @ApiProperty({
    description: 'Daily submission statistics',
    type: [DailySubmissionStatsRestDto],
  })
  declare dailySubmissionStats: DailySubmissionStatsRestDto[];
}