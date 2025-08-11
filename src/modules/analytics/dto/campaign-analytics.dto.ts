import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CampaignCouponStatsDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Total coupons in the campaign' })
  total: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Active coupons in the campaign' })
  active: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Redeemed coupons in the campaign' })
  redeemed: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Expired coupons in the campaign' })
  expired: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Deactivated coupons in the campaign' })
  deactivated: number;
}

@ObjectType()
export class CampaignAnalyticsDto {
  @Field()
  @ApiProperty({ description: 'Batch ID of the campaign' })
  batchId: string;

  @Field(() => CampaignCouponStatsDto)
  @ApiProperty({ description: 'Coupon statistics for the campaign' })
  coupons: CampaignCouponStatsDto;

  @Field(() => Int)
  @ApiProperty({ description: 'Total submissions for this campaign' })
  totalSubmissions: number;

  @Field(() => Int)
  @ApiProperty({ description: 'Total rewards assigned for this campaign' })
  totalRewardsAssigned: number;

  @Field(() => Float)
  @ApiProperty({ description: 'Conversion rate (redeemed/total coupons)' })
  conversionRate: number;

  @Field(() => Float)
  @ApiProperty({ description: 'Reward assignment rate (rewards/submissions)' })
  rewardAssignmentRate: number;

  @Field()
  @ApiProperty({ description: 'When the campaign was created' })
  createdAt: Date;
}