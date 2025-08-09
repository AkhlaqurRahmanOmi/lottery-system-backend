import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsDateString, IsInt, IsBoolean } from 'class-validator';
import { CouponStatus } from './coupon-base.dto';

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf'
}

@InputType('CouponExportFiltersInput')
export class CouponExportFiltersDto {
  @Field(() => CouponStatus, { nullable: true })
  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  status?: CouponStatus;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter by batch ID',
    example: 'BATCH_001'
  })
  @IsOptional()
  batchId?: string;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({
    description: 'Filter by creator admin ID',
    example: 1
  })
  @IsOptional()
  @IsInt({ message: 'Created by must be an integer' })
  createdBy?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter from date (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid ISO date string' })
  dateFrom?: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter to date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  dateTo?: Date;
}

@InputType('CouponExportOptionsInput')
export class CouponExportOptionsDto {
  @Field(() => ExportFormat)
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV
  })
  @IsEnum(ExportFormat, { message: 'Format must be csv or pdf' })
  format: ExportFormat;

  @Field(() => CouponExportFiltersDto, { nullable: true })
  @ApiPropertyOptional({
    description: 'Export filters',
    type: CouponExportFiltersDto
  })
  @IsOptional()
  filters?: CouponExportFiltersDto;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Include metadata in export',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  includeMetadata?: boolean;
}

@ObjectType('CouponExportResult')
export class CouponExportResultDto {
  @Field()
  @ApiProperty({
    description: 'Export data as base64 string',
    example: 'data:text/csv;base64,aWQsY291cG9uQ29kZS4uLg=='
  })
  data: string;

  @Field()
  @ApiProperty({
    description: 'Generated filename',
    example: 'coupons_export_2024-01-15.csv'
  })
  filename: string;

  @Field()
  @ApiProperty({
    description: 'MIME type of the export',
    example: 'text/csv'
  })
  mimeType: string;
}