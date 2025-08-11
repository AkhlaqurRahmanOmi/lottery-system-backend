import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsDateString, IsInt, IsBoolean, IsString } from 'class-validator';
import { ExportFormat, CouponStatus } from '../../../modules/export/dto';

@InputType('ExportCouponsFiltersGraphQLInput')
export class ExportCouponsFiltersGraphQLDto {
  @Field(() => CouponStatus, { nullable: true, description: 'Filter by coupon status' })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  status?: CouponStatus;

  @Field({ nullable: true, description: 'Filter by batch ID' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @Field(() => Int, { nullable: true, description: 'Filter by creator admin ID' })
  @IsOptional()
  @IsInt({ message: 'Created by must be an integer' })
  createdBy?: number;

  @Field({ nullable: true, description: 'Filter from date (ISO string)' })
  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid ISO date string' })
  dateFrom?: string;

  @Field({ nullable: true, description: 'Filter to date (ISO string)' })
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  dateTo?: string;
}

@InputType('ExportCouponsGraphQLInput')
export class ExportCouponsGraphQLDto {
  @Field(() => ExportFormat, { 
    description: 'Export format (Excel not supported for coupons)' 
  })
  @IsEnum([ExportFormat.CSV, ExportFormat.PDF], { message: 'Format must be csv or pdf for coupons' })
  format: ExportFormat.CSV | ExportFormat.PDF;

  @Field(() => ExportCouponsFiltersGraphQLDto, { 
    nullable: true, 
    description: 'Export filters' 
  })
  @IsOptional()
  filters?: ExportCouponsFiltersGraphQLDto;

  @Field({ 
    nullable: true, 
    description: 'Include metadata in export (code length, generation method, etc.)',
    defaultValue: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  includeMetadata?: boolean;
}