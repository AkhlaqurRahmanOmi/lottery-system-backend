import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsDateString, IsBoolean, IsString } from 'class-validator';
import { ExportFormat } from './export-format.enum';

@InputType('ExportSubmissionsFiltersInput')
export class ExportSubmissionsFiltersDto {
  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter from date (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid ISO date string' })
  dateFrom?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter to date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  dateTo?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter by whether submission has assigned reward',
    example: true
  })
  @IsOptional()
  @IsBoolean({ message: 'Has reward must be a boolean' })
  hasReward?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter by coupon batch ID',
    example: 'BATCH_001'
  })
  @IsOptional()
  @IsString()
  couponBatchId?: string;
}

@InputType('ExportSubmissionsInput')
export class ExportSubmissionsDto {
  @Field(() => ExportFormat)
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV
  })
  @IsEnum(ExportFormat, { message: 'Format must be csv, excel, or pdf' })
  format: ExportFormat;

  @Field(() => ExportSubmissionsFiltersDto, { nullable: true })
  @ApiPropertyOptional({
    description: 'Export filters',
    type: ExportSubmissionsFiltersDto
  })
  @IsOptional()
  filters?: ExportSubmissionsFiltersDto;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Include metadata in export (IP address, user agent, etc.)',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  includeMetadata?: boolean;
}