import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { CouponQueryDto } from '../../../modules/coupon/dto/coupon-query.dto';
import { CouponStatus, GenerationMethod } from '../../../modules/coupon/dto/coupon-base.dto';

/**
 * GraphQL-specific input type for querying coupons
 * Extends the base CouponQueryDto with GraphQL-specific decorators
 */
@InputType('CouponQueryInput')
export class CouponQueryGraphQLDto extends CouponQueryDto {
  @Field(() => Int, { 
    nullable: true, 
    description: 'Page number for pagination',
    defaultValue: 1
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  declare page?: number;

  @Field(() => Int, { 
    nullable: true, 
    description: 'Number of items per page (1-100)',
    defaultValue: 10
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  declare limit?: number;

  @Field({ 
    nullable: true, 
    description: 'Search term for coupon code (partial match)'
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  declare search?: string;

  @Field(() => CouponStatus, { 
    nullable: true, 
    description: 'Filter by coupon status'
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  declare status?: CouponStatus;

  @Field({ 
    nullable: true, 
    description: 'Filter by batch ID'
  })
  @IsOptional()
  @IsString({ message: 'Batch ID must be a string' })
  declare batchId?: string;

  @Field(() => GenerationMethod, { 
    nullable: true, 
    description: 'Filter by generation method'
  })
  @IsOptional()
  @IsEnum(GenerationMethod, { message: 'Generation method must be a valid GenerationMethod' })
  declare generationMethod?: GenerationMethod;

  @Field(() => Int, { 
    nullable: true, 
    description: 'Filter by creator admin ID'
  })
  @IsOptional()
  @IsInt({ message: 'Created by must be an integer' })
  declare createdBy?: number;

  @Field({ 
    nullable: true, 
    description: 'Filter by creation date from (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created from must be a valid ISO date string' })
  declare createdFrom?: string;

  @Field({ 
    nullable: true, 
    description: 'Filter by creation date to (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created to must be a valid ISO date string' })
  declare createdTo?: string;

  @Field({ 
    nullable: true, 
    description: 'Filter by expiration date from (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires from must be a valid ISO date string' })
  declare expiresFrom?: string;

  @Field({ 
    nullable: true, 
    description: 'Filter by expiration date to (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires to must be a valid ISO date string' })
  declare expiresTo?: string;

  @Field({ 
    nullable: true, 
    description: 'Sort field',
    defaultValue: 'createdAt'
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  declare sortBy?: string;

  @Field({ 
    nullable: true, 
    description: 'Sort order (asc or desc)',
    defaultValue: 'desc'
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  declare sortOrder?: 'asc' | 'desc';
}