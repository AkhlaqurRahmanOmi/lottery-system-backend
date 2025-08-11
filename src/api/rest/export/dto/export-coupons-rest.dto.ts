import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsInt, IsBoolean, IsString } from 'class-validator';
import { ExportCouponsDto, ExportCouponsFiltersDto, ExportFormat, CouponStatus } from '../../../../modules/export/dto';

export class ExportCouponsFiltersRestDto extends OmitType(ExportCouponsFiltersDto, []) {
  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  declare status?: CouponStatus;

  @ApiPropertyOptional({
    description: 'Filter by batch ID',
    example: 'BATCH_001'
  })
  @IsOptional()
  @IsString()
  declare batchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator admin ID',
    example: 1
  })
  @IsOptional()
  @IsInt({ message: 'Created by must be an integer' })
  declare createdBy?: number;

  @ApiPropertyOptional({
    description: 'Filter from date (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid ISO date string' })
  declare dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter to date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  declare dateTo?: string;
}

export class ExportCouponsRestDto extends OmitType(ExportCouponsDto, ['filters']) {
  @ApiProperty({
    description: 'Export format (Excel not supported for coupons)',
    enum: [ExportFormat.CSV, ExportFormat.PDF],
    example: ExportFormat.CSV
  })
  @IsEnum([ExportFormat.CSV, ExportFormat.PDF], { message: 'Format must be csv or pdf for coupons' })
  declare format: ExportFormat.CSV | ExportFormat.PDF;

  @ApiPropertyOptional({
    description: 'Export filters',
    type: ExportCouponsFiltersRestDto
  })
  @IsOptional()
  filters?: ExportCouponsFiltersRestDto;

  @ApiPropertyOptional({
    description: 'Include metadata in export (code length, generation method, etc.)',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  declare includeMetadata?: boolean;
}