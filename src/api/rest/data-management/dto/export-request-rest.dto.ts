import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';

export enum ExportType {
  SUBMISSIONS = 'submissions',
  COUPONS = 'coupons',
  ANALYTICS = 'analytics',
  REWARDS = 'rewards',
}

export enum ExportFormatRest {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  JSON = 'JSON',
}

export class ExportRequestRestDto {
  @ApiProperty({
    description: 'Type of data to export',
    enum: ExportType,
    example: ExportType.SUBMISSIONS,
  })
  @IsEnum(ExportType)
  type: ExportType;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormatRest,
    example: ExportFormatRest.CSV,
  })
  @IsEnum(ExportFormatRest)
  format: ExportFormatRest;

  @ApiPropertyOptional({
    description: 'Custom filename (without extension)',
    example: 'my_export_file',
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({
    description: 'Export filters and options',
    type: 'object',
    additionalProperties: true,
    example: {
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      includeMetadata: true,
    },
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class ExportStatusRestDto {
  @ApiProperty({
    description: 'Export job ID',
    example: 'export_123456789',
  })
  jobId: string;

  @ApiProperty({
    description: 'Export status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'completed',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Export progress percentage',
    example: 100,
  })
  progress: number;

  @ApiPropertyOptional({
    description: 'Download URL (available when completed)',
    example: 'https://api.example.com/downloads/export_123456789.csv',
  })
  downloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Error message (if failed)',
    example: 'Export failed due to insufficient permissions',
  })
  error?: string;

  @ApiProperty({
    description: 'Export creation timestamp',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Export completion timestamp',
    example: '2024-01-15T10:05:00.000Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Export expiration timestamp',
    example: '2024-01-22T10:00:00.000Z',
  })
  expiresAt: Date;
}