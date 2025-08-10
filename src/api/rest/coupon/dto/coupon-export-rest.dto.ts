import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponExportOptionsDto, ExportFormat } from '../../../../modules/coupon/dto/coupon-export.dto';
import { CouponStatus } from '../../../../modules/coupon/dto/coupon-base.dto';

/**
 * REST-specific DTO for exporting coupon data
 * Extends the base CouponExportOptionsDto with REST-specific validation and documentation
 */
export class CouponExportRestDto extends CouponExportOptionsDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
    default: ExportFormat.CSV
  })
  @IsEnum(ExportFormat, { message: 'Format must be csv or pdf' })
  declare format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus,
    example: 'ACTIVE'
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  status?: CouponStatus;

  @ApiPropertyOptional({
    description: 'Filter by batch ID',
    example: 'batch_123',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Batch ID must be a string' })
  batchId?: string;

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
    description: 'Include batch information in export',
    example: true,
    default: true,
    type: 'boolean'
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeBatchInfo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include creator information in export',
    example: true,
    default: false,
    type: 'boolean'
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCreatorInfo?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include redemption information in export',
    example: true,
    default: true,
    type: 'boolean'
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRedemptionInfo?: boolean = true;
}