import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsString, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { CouponStatus } from '../../../modules/coupon/dto/coupon-base.dto';

/**
 * Export format enum for GraphQL
 */
export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel'
}

/**
 * GraphQL-specific input type for exporting coupon data
 */
@InputType('CouponExportInput')
export class CouponExportGraphQLDto {
  @Field(() => ExportFormat, { 
    nullable: true,
    description: 'Export format (csv, pdf, or excel)',
    defaultValue: ExportFormat.CSV
  })
  @IsOptional()
  @IsEnum(ExportFormat, { message: 'Format must be csv, pdf, or excel' })
  format?: ExportFormat = ExportFormat.CSV;

  @Field(() => CouponStatus, { 
    nullable: true,
    description: 'Filter by coupon status'
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  status?: CouponStatus;

  @Field({ 
    nullable: true,
    description: 'Filter by batch ID'
  })
  @IsOptional()
  @IsString({ message: 'Batch ID must be a string' })
  batchId?: string;

  @Field({ 
    nullable: true,
    description: 'Filter by creation date from (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created from must be a valid ISO date string' })
  createdFrom?: string;

  @Field({ 
    nullable: true,
    description: 'Filter by creation date to (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created to must be a valid ISO date string' })
  createdTo?: string;

  @Field(() => [String], { 
    nullable: true,
    description: 'Specific coupon codes to export'
  })
  @IsOptional()
  @IsArray({ message: 'Coupon codes must be an array' })
  @IsString({ each: true, message: 'Each coupon code must be a string' })
  couponCodes?: string[];

  @Field({ 
    nullable: true,
    description: 'Include batch information in export',
    defaultValue: true
  })
  @IsOptional()
  @IsBoolean({ message: 'Include batch info must be a boolean' })
  includeBatchInfo?: boolean = true;

  @Field({ 
    nullable: true,
    description: 'Include creator information in export',
    defaultValue: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include creator info must be a boolean' })
  includeCreatorInfo?: boolean = false;

  @Field({ 
    nullable: true,
    description: 'Include redemption information in export',
    defaultValue: true
  })
  @IsOptional()
  @IsBoolean({ message: 'Include redemption info must be a boolean' })
  includeRedemptionInfo?: boolean = true;
}