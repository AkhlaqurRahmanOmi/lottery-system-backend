import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsString, IsDateString, IsInt } from 'class-validator';
import { ExportCouponsDto, ExportFormat } from '../../../../modules/export/dto';
import { CouponStatus } from '../../../../modules/export/dto/export-coupons.dto';

export class CouponExportFiltersRestDto {
  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus,
    example: CouponStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @ApiPropertyOptional({
    description: 'Filter by batch ID',
    example: 'BATCH_2024_001',
  })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by admin who created the coupons',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  createdBy?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering coupon creation',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering coupon creation',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ExportCouponsRestDto extends ExportCouponsDto {
  @ApiProperty({
    description: 'Export format (CSV or PDF only for coupons)',
    enum: [ExportFormat.CSV, ExportFormat.PDF],
    example: ExportFormat.CSV,
  })
  @IsEnum([ExportFormat.CSV, ExportFormat.PDF])
  declare format: ExportFormat.CSV | ExportFormat.PDF;

  @ApiPropertyOptional({
    description: 'Include metadata fields (code length, generation method, etc.)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = false;

  @ApiPropertyOptional({
    description: 'Export filters',
    type: CouponExportFiltersRestDto,
  })
  @IsOptional()
  declare filters?: CouponExportFiltersRestDto;

  @ApiPropertyOptional({
    description: 'Custom filename for export (without extension)',
    example: 'coupons_batch_001',
  })
  @IsOptional()
  @IsString()
  filename?: string;
}