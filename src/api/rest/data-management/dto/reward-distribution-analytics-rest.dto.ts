import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RewardCategoryDistributionRestDto {
  @ApiProperty({
    description: 'Reward category',
    example: 'STREAMING_SERVICE',
  })
  category: string;

  @ApiProperty({
    description: 'Total accounts in category',
    example: 200,
  })
  totalAccounts: number;

  @ApiProperty({
    description: 'Available accounts in category',
    example: 150,
  })
  availableAccounts: number;

  @ApiProperty({
    description: 'Assigned accounts in category',
    example: 50,
  })
  assignedAccounts: number;

  @ApiProperty({
    description: 'Assignment rate percentage for category',
    example: 25.0,
  })
  assignmentRate: number;

  @ApiProperty({
    description: 'Average assignment time in hours',
    example: 24.5,
  })
  averageAssignmentTime: number;
}

export class RewardServiceDistributionRestDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Netflix',
  })
  serviceName: string;

  @ApiProperty({
    description: 'Account type',
    example: 'Premium',
  })
  accountType: string;

  @ApiProperty({
    description: 'Total accounts for this service',
    example: 100,
  })
  totalAccounts: number;

  @ApiProperty({
    description: 'Assigned accounts for this service',
    example: 25,
  })
  assignedAccounts: number;

  @ApiProperty({
    description: 'Assignment rate percentage',
    example: 25.0,
  })
  assignmentRate: number;

  @ApiProperty({
    description: 'Category this service belongs to',
    example: 'STREAMING_SERVICE',
  })
  category: string;
}

export class AssignmentTrendRestDto {
  @ApiProperty({
    description: 'Date of assignment',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Number of assignments on this date',
    example: 5,
  })
  assignmentCount: number;

  @ApiProperty({
    description: 'Breakdown by category',
    type: 'object',
    additionalProperties: {
      type: 'number',
    },
    example: {
      'STREAMING_SERVICE': 3,
      'GIFT_CARD': 2,
    },
  })
  categoryBreakdown: Record<string, number>;
}

export class RewardDistributionAnalyticsRestDto {
  @ApiProperty({
    description: 'Total reward accounts in system',
    example: 500,
  })
  totalRewardAccounts: number;

  @ApiProperty({
    description: 'Total assigned reward accounts',
    example: 120,
  })
  totalAssignedAccounts: number;

  @ApiProperty({
    description: 'Total available reward accounts',
    example: 380,
  })
  totalAvailableAccounts: number;

  @ApiProperty({
    description: 'Overall assignment rate percentage',
    example: 24.0,
  })
  overallAssignmentRate: number;

  @ApiProperty({
    description: 'Distribution by category',
    type: [RewardCategoryDistributionRestDto],
  })
  categoryDistribution: RewardCategoryDistributionRestDto[];

  @ApiProperty({
    description: 'Distribution by service',
    type: [RewardServiceDistributionRestDto],
  })
  serviceDistribution: RewardServiceDistributionRestDto[];

  @ApiProperty({
    description: 'Assignment trends over time',
    type: [AssignmentTrendRestDto],
  })
  assignmentTrends: AssignmentTrendRestDto[];

  @ApiProperty({
    description: 'Most popular reward category',
    example: 'STREAMING_SERVICE',
  })
  mostPopularCategory: string;

  @ApiProperty({
    description: 'Least popular reward category',
    example: 'OTHER',
  })
  leastPopularCategory: string;

  @ApiProperty({
    description: 'Average time to assignment in hours',
    example: 48.5,
  })
  averageAssignmentTime: number;

  @ApiProperty({
    description: 'Peak assignment day of week',
    example: 'Monday',
  })
  peakAssignmentDay: string;

  @ApiPropertyOptional({
    description: 'Applied filters for this analysis',
    type: 'object',
    additionalProperties: true,
    example: {
      category: 'STREAMING_SERVICE',
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    },
  })
  appliedFilters?: Record<string, any>;

  @ApiProperty({
    description: 'Analysis generation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  generatedAt: Date;
}