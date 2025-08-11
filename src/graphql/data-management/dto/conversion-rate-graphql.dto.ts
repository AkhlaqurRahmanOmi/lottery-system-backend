import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ConversionRateGraphQLDto {
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