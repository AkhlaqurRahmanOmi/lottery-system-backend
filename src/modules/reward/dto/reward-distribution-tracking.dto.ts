import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for reward distribution tracking filters
 */
@InputType('RewardDistributionTrackingInput')
export class RewardDistributionTrackingDto {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Start date for tracking period (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'End date for tracking period (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by reward category' })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by admin who assigned rewards' })
  @IsOptional()
  @IsInt()
  assignedBy?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by specific submission ID' })
  @IsOptional()
  @IsInt()
  submissionId?: number;
}

/**
 * DTO for individual reward distribution record
 */
@ObjectType('RewardDistributionRecord')
export class RewardDistributionRecordDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field(() => Int)
  @ApiProperty()
  rewardAccountId: number;

  @Field()
  @ApiProperty()
  serviceName: string;

  @Field()
  @ApiProperty()
  accountType: string;

  @Field()
  @ApiProperty()
  category: string;

  @Field(() => Int)
  @ApiProperty()
  submissionId: number;

  @Field()
  @ApiProperty()
  submissionUserName: string;

  @Field()
  @ApiProperty()
  submissionUserEmail: string;

  @Field(() => Int)
  @ApiProperty()
  assignedBy: number;

  @Field()
  @ApiProperty()
  assignedByUsername: string;

  @Field()
  @ApiProperty()
  assignedAt: Date;

  @Field()
  @ApiProperty()
  submittedAt: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  notes?: string;

  @Field()
  @ApiProperty({ description: 'Time in hours from submission to assignment' })
  distributionTimeHours: number;
}

/**
 * DTO for reward distribution summary by category
 */
@ObjectType('RewardDistributionByCategory')
export class RewardDistributionByCategoryDto {
  @Field()
  @ApiProperty()
  category: string;

  @Field(() => Int)
  @ApiProperty()
  count: number;

  @Field()
  @ApiProperty()
  percentage: number;

  @Field()
  @ApiProperty()
  averageDistributionTime: number;

  @Field(() => [String])
  @ApiProperty({ type: [String] })
  topServices: string[];
}

/**
 * DTO for reward distribution summary by admin
 */
@ObjectType('RewardDistributionByAdmin')
export class RewardDistributionByAdminDto {
  @Field(() => Int)
  @ApiProperty()
  adminId: number;

  @Field()
  @ApiProperty()
  adminUsername: string;

  @Field(() => Int)
  @ApiProperty()
  count: number;

  @Field()
  @ApiProperty()
  percentage: number;

  @Field()
  @ApiProperty()
  averageDistributionTime: number;

  @Field(() => [String])
  @ApiProperty({ type: [String] })
  topCategories: string[];
}

/**
 * DTO for reward distribution summary by date
 */
@ObjectType('RewardDistributionByDate')
export class RewardDistributionByDateDto {
  @Field()
  @ApiProperty()
  date: string; // YYYY-MM-DD format

  @Field(() => Int)
  @ApiProperty()
  count: number;

  @Field(() => [RewardDistributionByCategoryDto])
  @ApiProperty({ type: [RewardDistributionByCategoryDto] })
  categoryBreakdown: RewardDistributionByCategoryDto[];
}

/**
 * Comprehensive DTO for reward distribution tracking response
 */
@ObjectType('RewardDistributionTrackingResponse')
export class RewardDistributionTrackingResponseDto {
  @Field(() => [RewardDistributionRecordDto])
  @ApiProperty({ type: [RewardDistributionRecordDto] })
  records: RewardDistributionRecordDto[];

  @Field(() => Int)
  @ApiProperty()
  totalDistributed: number;

  @Field()
  @ApiProperty()
  averageDistributionTime: number;

  @Field()
  @ApiProperty()
  medianDistributionTime: number;

  @Field(() => [RewardDistributionByCategoryDto])
  @ApiProperty({ type: [RewardDistributionByCategoryDto] })
  distributionsByCategory: RewardDistributionByCategoryDto[];

  @Field(() => [RewardDistributionByAdminDto])
  @ApiProperty({ type: [RewardDistributionByAdminDto] })
  distributionsByAdmin: RewardDistributionByAdminDto[];

  @Field(() => [RewardDistributionByDateDto])
  @ApiProperty({ type: [RewardDistributionByDateDto] })
  distributionsByDate: RewardDistributionByDateDto[];

  @Field()
  @ApiProperty()
  periodStart: Date;

  @Field()
  @ApiProperty()
  periodEnd: Date;

  @Field(() => Int)
  @ApiProperty()
  totalSubmissions: number;

  @Field()
  @ApiProperty()
  distributionRate: number; // percentage of submissions that received rewards

  @Field({ nullable: true })
  @ApiPropertyOptional()
  insights?: string;
}

/**
 * DTO for reward assignment audit log
 */
@ObjectType('RewardAssignmentAuditLog')
export class RewardAssignmentAuditLogDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field(() => Int)
  @ApiProperty()
  rewardAccountId: number;

  @Field(() => Int)
  @ApiProperty()
  submissionId: number;

  @Field()
  @ApiProperty()
  action: string; // ASSIGNED, UNASSIGNED, REASSIGNED

  @Field(() => Int)
  @ApiProperty()
  performedBy: number;

  @Field()
  @ApiProperty()
  performedByUsername: string;

  @Field()
  @ApiProperty()
  performedAt: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  reason?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  previousAssignmentId?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  metadata?: string; // JSON string with additional context
}

/**
 * DTO for reward distribution efficiency metrics
 */
@ObjectType('RewardDistributionEfficiencyMetrics')
export class RewardDistributionEfficiencyMetricsDto {
  @Field()
  @ApiProperty()
  averageTimeToAssignment: number; // in hours

  @Field()
  @ApiProperty()
  medianTimeToAssignment: number; // in hours

  @Field()
  @ApiProperty()
  fastestAssignmentTime: number; // in hours

  @Field()
  @ApiProperty()
  slowestAssignmentTime: number; // in hours

  @Field(() => Int)
  @ApiProperty()
  assignmentsWithin24Hours: number;

  @Field(() => Int)
  @ApiProperty()
  assignmentsWithin48Hours: number;

  @Field(() => Int)
  @ApiProperty()
  assignmentsWithin7Days: number;

  @Field(() => Int)
  @ApiProperty()
  assignmentsBeyond7Days: number;

  @Field()
  @ApiProperty()
  efficiencyScore: number; // 0-100 score based on assignment speed

  @Field(() => [String])
  @ApiProperty({ type: [String] })
  recommendations: string[];
}

/**
 * DTO for reward availability forecast
 */
@ObjectType('RewardAvailabilityForecast')
export class RewardAvailabilityForecastDto {
  @Field()
  @ApiProperty()
  category: string;

  @Field(() => Int)
  @ApiProperty()
  currentAvailable: number;

  @Field(() => Int)
  @ApiProperty()
  averageWeeklyDistribution: number;

  @Field(() => Int)
  @ApiProperty()
  estimatedWeeksRemaining: number;

  @Field()
  @ApiProperty()
  riskLevel: string; // LOW, MEDIUM, HIGH, CRITICAL

  @Field({ nullable: true })
  @ApiPropertyOptional()
  recommendedAction?: string;

  @Field()
  @ApiProperty()
  lastRestockDate?: Date;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  suggestedRestockQuantity?: number;
}