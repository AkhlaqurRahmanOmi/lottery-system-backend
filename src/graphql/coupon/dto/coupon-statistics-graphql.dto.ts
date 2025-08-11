import { Field, ObjectType, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL-specific response type for coupon statistics
 */
@ObjectType('CouponStatistics')
export class CouponStatisticsGraphQLDto {
  @Field(() => Int, { description: 'Total number of coupons' })
  total: number;

  @Field(() => Int, { description: 'Number of active coupons' })
  active: number;

  @Field(() => Int, { description: 'Number of redeemed coupons' })
  redeemed: number;

  @Field(() => Int, { description: 'Number of expired coupons' })
  expired: number;

  @Field(() => Int, { description: 'Number of deactivated coupons' })
  deactivated: number;

  @Field(() => Float, { description: 'Redemption rate as a percentage (0-100)' })
  redemptionRate: number;
}