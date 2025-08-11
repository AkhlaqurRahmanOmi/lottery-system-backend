import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { ExportSubmissionsDto, ExportFormat } from '../../../../modules/export/dto';

export class SubmissionExportFiltersRestDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering submissions',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering submissions',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by reward assignment status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  hasReward?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by coupon batch ID',
    example: 'BATCH_2024_001',
  })
  @IsOptional()
  @IsString()
  couponBatchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by reward category',
    example: 'STREAMING_SERVICE',
  })
  @IsOptional()
  @IsString()
  rewardCategory?: string;
}

export class ExportSubmissionsRestDto extends ExportSubmissionsDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  declare format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Include metadata fields (IP address, user agent, etc.)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = false;

  @ApiPropertyOptional({
    description: 'Export filters',
    type: SubmissionExportFiltersRestDto,
  })
  @IsOptional()
  declare filters?: SubmissionExportFiltersRestDto;

  @ApiPropertyOptional({
    description: 'Custom filename for export (without extension)',
    example: 'submissions_january_2024',
  })
  @IsOptional()
  @IsString()
  filename?: string;
}