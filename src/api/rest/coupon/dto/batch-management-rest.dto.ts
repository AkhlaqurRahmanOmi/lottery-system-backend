import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * REST-specific DTO for batch statistics query
 */
export class BatchStatisticsQueryRestDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    type: 'integer'
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : 1)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    type: 'integer'
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : 10)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for batch ID or name',
    example: 'summer',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date from (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created from must be a valid ISO date string' })
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date to (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created to must be a valid ISO date string' })
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['batchId', 'totalCoupons', 'redeemedCoupons', 'createdAt'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * REST-specific DTO for batch deactivation
 */
export class DeactivateBatchRestDto {
  @ApiProperty({
    description: 'Batch ID to deactivate',
    example: 'batch_summer2024_001',
    maxLength: 100
  })
  @IsNotEmpty({ message: 'Batch ID is required' })
  @IsString({ message: 'Batch ID must be a string' })
  batchId: string;

  @ApiPropertyOptional({
    description: 'Reason for deactivation',
    example: 'Campaign ended early',
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;
}