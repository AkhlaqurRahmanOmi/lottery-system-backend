import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SubmissionQueryDto } from '../../../../modules/submission/dto';

export class SubmissionSearchRestDto extends SubmissionQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for name, email, or phone',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by reward assignment status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasReward?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by coupon batch ID',
    example: 'BATCH_2024_001',
  })
  @IsOptional()
  @IsString()
  couponBatchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by assigned reward category',
    example: 'STREAMING_SERVICE',
  })
  @IsOptional()
  @IsString()
  rewardCategory?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'submittedAt',
    enum: ['submittedAt', 'name', 'email', 'rewardAssignedAt'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['submittedAt', 'name', 'email', 'rewardAssignedAt'])
  sortBy?: string = 'submittedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class SubmissionSearchResultRestDto {
  @ApiProperty({
    description: 'Search results',
    type: 'array',
  })
  results: any[];

  @ApiProperty({
    description: 'Total number of matching records',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there are more pages',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there are previous pages',
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Applied search filters',
    type: 'object',
    additionalProperties: true,
  })
  appliedFilters: Record<string, any>;
}