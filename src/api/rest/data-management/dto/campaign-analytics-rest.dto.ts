import { ApiProperty } from '@nestjs/swagger';
import { CampaignAnalyticsDto } from '../../../../modules/analytics/dto';

export class CampaignCouponStatsRestDto {
  @ApiProperty({
    description: 'Total coupons in campaign',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Active coupons in campaign',
    example: 75,
  })
  active: number;

  @ApiProperty({
    description: 'Redeemed coupons in campaign',
    example: 20,
  })
  redeemed: number;

  @ApiProperty({
    description: 'Expired coupons in campaign',
    example: 3,
  })
  expired: number;

  @ApiProperty({
    description: 'Deactivated coupons in campaign',
    example: 2,
  })
  deactivated: number;
}

export class CampaignAnalyticsRestDto extends CampaignAnalyticsDto {
  @ApiProperty({
    description: 'Campaign batch ID',
    example: 'BATCH_2024_001',
  })
  declare batchId: string;

  @ApiProperty({
    description: 'Coupon statistics for this campaign',
    type: CampaignCouponStatsRestDto,
  })
  declare coupons: CampaignCouponStatsRestDto;

  @ApiProperty({
    description: 'Total submissions for this campaign',
    example: 18,
  })
  declare totalSubmissions: number;

  @ApiProperty({
    description: 'Total rewards assigned for this campaign',
    example: 15,
  })
  declare totalRewardsAssigned: number;

  @ApiProperty({
    description: 'Conversion rate percentage',
    example: 20.0,
  })
  declare conversionRate: number;

  @ApiProperty({
    description: 'Reward assignment rate percentage',
    example: 83.33,
  })
  declare rewardAssignmentRate: number;

  @ApiProperty({
    description: 'Campaign creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  declare createdAt: Date;
}