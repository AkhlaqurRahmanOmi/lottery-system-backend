import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max, IsJSON } from 'class-validator';
import { Transform } from 'class-transformer';
import { GenerateCouponsDto } from '../../../../modules/coupon/dto/generate-coupons.dto';

/**
 * REST-specific DTO for generating coupon codes
 * Extends the base GenerateCouponsDto with REST-specific validation and documentation
 */
export class GenerateCouponsRestDto extends GenerateCouponsDto {
  @ApiProperty({
    description: 'Number of coupons to generate',
    example: 10,
    minimum: 1,
    maximum: 1000,
    type: 'integer'
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(1000, { message: 'Quantity cannot exceed 1000' })
  declare quantity: number;

  @ApiPropertyOptional({
    description: 'Length of the coupon code (8-12 characters)',
    example: 10,
    minimum: 8,
    maximum: 12,
    default: 10,
    type: 'integer'
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt({ message: 'Code length must be an integer' })
  @Min(8, { message: 'Code length must be at least 8' })
  @Max(12, { message: 'Code length cannot exceed 12' })
  declare codeLength?: number;

  @ApiPropertyOptional({
    description: 'Number of days until expiration (1-365 days)',
    example: 30,
    minimum: 1,
    maximum: 365,
    type: 'integer'
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt({ message: 'Expiration days must be an integer' })
  @Min(1, { message: 'Expiration days must be at least 1' })
  @Max(365, { message: 'Expiration days cannot exceed 365' })
  declare expirationDays?: number;

  @ApiPropertyOptional({
    description: 'Custom batch name for grouping coupons',
    example: 'Summer Campaign 2024',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Batch name must be a string' })
  declare batchName?: string;

  @ApiProperty({
    description: 'ID of the admin creating the coupons',
    example: 1,
    type: 'integer'
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Created by must be an integer' })
  declare createdBy: number;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { campaign: 'summer2024', source: 'web' }
  })
  @IsOptional()
  @IsJSON({ message: 'Metadata must be valid JSON' })
  declare metadata?: any;
}