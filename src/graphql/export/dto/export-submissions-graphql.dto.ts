import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsDateString, IsBoolean, IsString } from 'class-validator';
import { ExportFormat } from '../../../modules/export/dto';

@InputType('ExportSubmissionsFiltersGraphQLInput')
export class ExportSubmissionsFiltersGraphQLDto {
  @Field({ nullable: true, description: 'Filter from date (ISO string)' })
  @IsOptional()
  @IsDateString({}, { message: 'Date from must be a valid ISO date string' })
  dateFrom?: string;

  @Field({ nullable: true, description: 'Filter to date (ISO string)' })
  @IsOptional()
  @IsDateString({}, { message: 'Date to must be a valid ISO date string' })
  dateTo?: string;

  @Field({ nullable: true, description: 'Filter by whether submission has assigned reward' })
  @IsOptional()
  @IsBoolean({ message: 'Has reward must be a boolean' })
  hasReward?: boolean;

  @Field({ nullable: true, description: 'Filter by coupon batch ID' })
  @IsOptional()
  @IsString()
  couponBatchId?: string;
}

@InputType('ExportSubmissionsGraphQLInput')
export class ExportSubmissionsGraphQLDto {
  @Field(() => ExportFormat, { description: 'Export format' })
  @IsEnum(ExportFormat, { message: 'Format must be csv, excel, or pdf' })
  format: ExportFormat;

  @Field(() => ExportSubmissionsFiltersGraphQLDto, { 
    nullable: true, 
    description: 'Export filters' 
  })
  @IsOptional()
  filters?: ExportSubmissionsFiltersGraphQLDto;

  @Field({ 
    nullable: true, 
    description: 'Include metadata in export (IP address, user agent, etc.)',
    defaultValue: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Include metadata must be a boolean' })
  includeMetadata?: boolean;
}