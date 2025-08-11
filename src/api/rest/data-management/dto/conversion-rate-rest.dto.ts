import { ApiProperty } from '@nestjs/swagger';
import { ConversionRateDto } from '../../../../modules/analytics/dto';

export class ConversionRateRestDto extends ConversionRateDto {
  @ApiProperty({
    description: 'Coupon redemption rate percentage',
    example: 20.0,
  })
  declare couponRedemptionRate: number;

  @ApiProperty({
    description: 'Reward assignment rate percentage',
    example: 66.67,
  })
  declare rewardAssignmentRate: number;

  @ApiProperty({
    description: 'Overall conversion rate percentage (coupons to rewards)',
    example: 12.0,
  })
  declare overallConversionRate: number;

  @ApiProperty({
    description: 'Total coupons generated',
    example: 1000,
  })
  declare totalCouponsGenerated: number;

  @ApiProperty({
    description: 'Total coupons redeemed',
    example: 200,
  })
  declare totalCouponsRedeemed: number;

  @ApiProperty({
    description: 'Total submissions received',
    example: 180,
  })
  declare totalSubmissions: number;

  @ApiProperty({
    description: 'Total rewards assigned',
    example: 120,
  })
  declare totalRewardsAssigned: number;
}