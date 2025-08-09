import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponQueryDto } from '../../../../modules/coupon/dto/coupon-query.dto';
import { CouponStatus, GenerationMethod } from '../../../../modules/coupon/dto/coupon-base.dto';

/**
 * REST-specific DTO for querying coupons
 * Extends the base CouponQueryDto with REST-specific validation and documentation
 */
export class CouponQueryRestDto extends CouponQueryDto {
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
  declare page?: number;

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
  declare limit?: number;

  @ApiPropertyOptional({
    description: 'Search term for coupon code (partial match)',
    example: 'ABC123',
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  declare search?: string;

  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus,
    example: CouponStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  declare status?: CouponStatus;

  @ApiPropertyOptional({
    description: 'Filter by batch ID',
    example: 'batch_123',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Batch ID must be a string' })
  declare batchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by generation method',
    enum: GenerationMethod,
    example: GenerationMethod.BATCH
  })
  @IsOptional()
  @IsEnum(GenerationMethod, { message: 'Generation method must be a valid GenerationMethod' })
  declare generationMethod?: GenerationMethod;

  @ApiPropertyOptional({
    description: 'Filter by creator admin ID',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt({ message: 'Created by must be an integer' })
  declare createdBy?: number;

  @ApiPropertyOptional({
    description: 'Filter by creation date from (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created from must be a valid ISO date string' })
  declare createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date to (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created to must be a valid ISO date string' })
  declare createdTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by expiration date from (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires from must be a valid ISO date string' })
  declare expiresFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by expiration date to (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires to must be a valid ISO date string' })
  declare expiresTo?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['id', 'couponCode', 'status', 'createdAt', 'expiresAt', 'redeemedAt'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  declare sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  declare sortOrder?: 'asc' | 'desc';
}