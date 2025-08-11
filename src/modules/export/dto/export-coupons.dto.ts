import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsDateString, IsInt, IsBoolean, IsString } from 'class-validator';
import { ExportFormat } from './export-format.enum';

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  DEACTIVATED = 'DEACTIVATED'
}

@InputType('ExportCouponsFiltersInput')
export class ExportCouponsFiltersDto {
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
  @IsString()
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
  dateFrom?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Filter to date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  dateTo?: string;
}

@InputType('ExportCouponsInput')
export class ExportCouponsDto {
  @Field(() => ExportFormat)
  @ApiProperty({
    description: 'Export format (PDF not supported for coupons with Excel)',
    enum: [ExportFormat.CSV, ExportFormat.PDF],
    example: ExportFormat.CSV
  })
  @IsEnum([ExportFormat.CSV, ExportFormat.PDF], { message: 'Format must be csv or pdf for coupons' })
  format: ExportFormat.CSV | ExportFormat.PDF;

  @Field(() => ExportCouponsFiltersDto, { nullable: true })
  @ApiPropertyOptional({
    description: 'Export filters',
    type: ExportCouponsFiltersDto
  })
  @IsOptional()
  filters?: ExportCouponsFiltersDto;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Include metadata in export (code length, generation method, etc.)',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  includeMetadata?: boolean;
}