import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';

@ObjectType()
export class RewardCategoryStatsGraphQLDto {
  @Field()
  category: string;

  @Field(() => Int)
  totalAccounts: number;

  @Field(() => Int)
  availableAccounts: number;

  @Field(() => Int)
  assignedAccounts: number;

  @Field()
  assignmentRate: number;

  @Field()
  averageAssignmentTime: number;
}

@ObjectType()
export class RewardServiceStatsGraphQLDto {
  @Field()
  serviceName: string;

  @Field()
  category: string;

  @Field(() => Int)
  totalAccounts: number;

  @Field(() => Int)
  assignedAccounts: number;

  @Field()
  assignmentRate: number;
}

@ObjectType()
export class RewardAssignmentTrendGraphQLDto {
  @Field()
  date: string;

  @Field(() => Int)
  assignmentCount: number;

  @Field(() => String)
  categoryBreakdown: string; // JSON string of Record<string, number>
}

@InputType()
export class RewardDistributionFiltersGraphQLDto {
  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;
}

@ObjectType()
export class AppliedFiltersGraphQLDto {
  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  dateFrom?: Date;

  @Field({ nullable: true })
  dateTo?: Date;
}

@ObjectType()
export class RewardDistributionAnalyticsGraphQLDto {
  @Field(() => Int)
  totalRewardAccounts: number;

  @Field(() => Int)
  totalAssignedAccounts: number;

  @Field(() => Int)
  totalAvailableAccounts: number;

  @Field()
  overallAssignmentRate: number;

  @Field(() => [RewardCategoryStatsGraphQLDto])
  categoryDistribution: RewardCategoryStatsGraphQLDto[];

  @Field(() => [RewardServiceStatsGraphQLDto])
  serviceDistribution: RewardServiceStatsGraphQLDto[];

  @Field(() => [RewardAssignmentTrendGraphQLDto])
  assignmentTrends: RewardAssignmentTrendGraphQLDto[];

  @Field()
  mostPopularCategory: string;

  @Field()
  leastPopularCategory: string;

  @Field()
  averageAssignmentTime: number;

  @Field()
  peakAssignmentDay: string;

  @Field(() => AppliedFiltersGraphQLDto)
  appliedFilters: AppliedFiltersGraphQLDto;

  @Field()
  generatedAt: Date;
}