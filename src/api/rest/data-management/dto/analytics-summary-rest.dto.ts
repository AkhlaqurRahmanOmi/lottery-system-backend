import { ApiProperty } from '@nestjs/swagger';
import { AnalyticsSummaryDto } from '../../../../modules/analytics/dto';
import { ConversionRateRestDto } from './conversion-rate-rest.dto';

export class CouponStatisticsRestDto {
  @ApiProperty({
    description: 'Total number of coupons generated',
    example: 1000,
  })
  totalGenerated: number;

  @ApiProperty({
    description: 'Number of active coupons',
    example: 750,
  })
  totalActive: number;

  @ApiProperty({
    description: 'Number of redeemed coupons',
    example: 200,
  })
  totalRedeemed: number;

  @ApiProperty({
    description: 'Number of expired coupons',
    example: 30,
  })
  totalExpired: number;

  @ApiProperty({
    description: 'Number of deactivated coupons',
    example: 20,
  })
  totalDeactivated: number;

  @ApiProperty({
    description: 'Total number of batches',
    example: 15,
  })
  totalBatches: number;
}

export class SubmissionStatisticsRestDto {
  @ApiProperty({
    description: 'Total number of submissions',
    example: 180,
  })
  totalSubmissions: number;

  @ApiProperty({
    description: 'Number of submissions with assigned rewards',
    example: 120,
  })
  submissionsWithRewards: number;

  @ApiProperty({
    description: 'Number of unique users',
    example: 175,
  })
  uniqueUsers: number;
}

export class RewardStatisticsRestDto {
  @ApiProperty({
    description: 'Total number of reward accounts',
    example: 500,
  })
  totalRewardAccounts: number;

  @ApiProperty({
    description: 'Number of available reward accounts',
    example: 380,
  })
  availableRewards: number;

  @ApiProperty({
    description: 'Number of assigned reward accounts',
    example: 120,
  })
  assignedRewards: number;

  @ApiProperty({
    description: 'Number of expired reward accounts',
    example: 0,
  })
  expiredRewards: number;
}



export class RewardPopularityRestDto {
  @ApiProperty({
    description: 'Reward ID',
    example: 1,
  })
  rewardId: number;

  @ApiProperty({
    description: 'Reward name',
    example: 'Netflix Premium',
  })
  rewardName: string;

  @ApiProperty({
    description: 'Reward description',
    example: '1 month Netflix Premium subscription',
    required: false,
  })
  rewardDescription?: string;

  @ApiProperty({
    description: 'Number of times selected',
    example: 45,
  })
  selectionCount: number;

  @ApiProperty({
    description: 'Selection percentage',
    example: 37.5,
  })
  selectionPercentage: number;

  @ApiProperty({
    description: 'Whether reward is active',
    example: true,
  })
  isActive: boolean;
}

export class CategoryPopularityRestDto {
  @ApiProperty({
    description: 'Reward category',
    example: 'STREAMING_SERVICE',
  })
  category: string;

  @ApiProperty({
    description: 'Number of accounts in category',
    example: 200,
  })
  accountCount: number;
}

export class RewardSelectionAnalyticsRestDto {
  @ApiProperty({
    description: 'Total reward selections',
    example: 120,
  })
  totalRewardSelections: number;

  @ApiProperty({
    description: 'Reward popularity ranking',
    type: [RewardPopularityRestDto],
  })
  rewardPopularity: RewardPopularityRestDto[];

  @ApiProperty({
    description: 'Category popularity ranking',
    type: [CategoryPopularityRestDto],
  })
  categoryPopularity: CategoryPopularityRestDto[];

  @ApiProperty({
    description: 'Most popular reward',
    type: RewardPopularityRestDto,
    required: false,
  })
  mostPopularReward?: RewardPopularityRestDto;

  @ApiProperty({
    description: 'Least popular reward',
    type: RewardPopularityRestDto,
    required: false,
  })
  leastPopularReward?: RewardPopularityRestDto;
}

export class AnalyticsSummaryRestDto extends AnalyticsSummaryDto {
  @ApiProperty({
    description: 'Coupon statistics',
    type: CouponStatisticsRestDto,
  })
  declare coupons: CouponStatisticsRestDto;

  @ApiProperty({
    description: 'Submission statistics',
    type: SubmissionStatisticsRestDto,
  })
  declare submissions: SubmissionStatisticsRestDto;

  @ApiProperty({
    description: 'Reward statistics',
    type: RewardStatisticsRestDto,
  })
  declare rewards: RewardStatisticsRestDto;

  @ApiProperty({
    description: 'Conversion rate metrics',
    type: ConversionRateRestDto,
  })
  declare conversion: ConversionRateRestDto;

  @ApiProperty({
    description: 'Reward selection analytics',
    type: RewardSelectionAnalyticsRestDto,
  })
  declare rewardSelection: RewardSelectionAnalyticsRestDto;

  @ApiProperty({
    description: 'Timestamp when analytics were generated',
    example: '2024-01-15T10:30:00.000Z',
  })
  declare generatedAt: Date;
}