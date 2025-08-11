import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsBoolean, IsString } from 'class-validator';
import { ExportSubmissionsDto, ExportSubmissionsFiltersDto, ExportFormat } from '../../../../modules/export/dto';

export class ExportSubmissionsFiltersRestDto extends OmitType(ExportSubmissionsFiltersDto, []) {
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

  @ApiPropertyOptional({
    description: 'Filter by whether submission has assigned reward',
    example: true
  })
  @IsOptional()
  @IsBoolean({ message: 'Has reward must be a boolean' })
  declare hasReward?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by coupon batch ID',
    example: 'BATCH_001'
  })
  @IsOptional()
  @IsString()
  declare couponBatchId?: string;
}

export class ExportSubmissionsRestDto extends OmitType(ExportSubmissionsDto, ['filters']) {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV
  })
  @IsEnum(ExportFormat, { message: 'Format must be csv, excel, or pdf' })
  declare format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Export filters',
    type: ExportSubmissionsFiltersRestDto
  })
  @IsOptional()
  filters?: ExportSubmissionsFiltersRestDto;

  @ApiPropertyOptional({
    description: 'Include metadata in export (IP address, user agent, etc.)',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  declare includeMetadata?: boolean;
}