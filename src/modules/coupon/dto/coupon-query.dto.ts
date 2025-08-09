import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponStatus, GenerationMethod } from './coupon-base.dto';

@InputType('CouponQueryInput')
export class CouponQueryDto {
  @Field(() => Int, { nullable: true, description: 'Page number for pagination' })
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @Field(() => Int, { nullable: true, description: 'Number of items per page' })
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @Field({ nullable: true, description: 'Search term for coupon code' })
  @ApiPropertyOptional({
    description: 'Search term for coupon code',
    example: 'ABC123'
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @Field(() => CouponStatus, { nullable: true, description: 'Filter by coupon status' })
  @ApiPropertyOptional({
    description: 'Filter by coupon status',
    enum: CouponStatus
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  status?: CouponStatus;

  @Field({ nullable: true, description: 'Filter by batch ID' })
  @ApiPropertyOptional({
    description: 'Filter by batch ID',
    example: 'batch_123'
  })
  @IsOptional()
  @IsString({ message: 'Batch ID must be a string' })
  batchId?: string;

  @Field(() => GenerationMethod, { nullable: true, description: 'Filter by generation method' })
  @ApiPropertyOptional({
    description: 'Filter by generation method',
    enum: GenerationMethod
  })
  @IsOptional()
  @IsEnum(GenerationMethod, { message: 'Generation method must be a valid GenerationMethod' })
  generationMethod?: GenerationMethod;

  @Field(() => Int, { nullable: true, description: 'Filter by creator admin ID' })
  @ApiPropertyOptional({
    description: 'Filter by creator admin ID',
    example: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Created by must be an integer' })
  createdBy?: number;

  @Field({ nullable: true, description: 'Filter by creation date from (ISO string)' })
  @ApiPropertyOptional({
    description: 'Filter by creation date from (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created from must be a valid ISO date string' })
  createdFrom?: string;

  @Field({ nullable: true, description: 'Filter by creation date to (ISO string)' })
  @ApiPropertyOptional({
    description: 'Filter by creation date to (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created to must be a valid ISO date string' })
  createdTo?: string;

  @Field({ nullable: true, description: 'Filter by expiration date from (ISO string)' })
  @ApiPropertyOptional({
    description: 'Filter by expiration date from (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires from must be a valid ISO date string' })
  expiresFrom?: string;

  @Field({ nullable: true, description: 'Filter by expiration date to (ISO string)' })
  @ApiPropertyOptional({
    description: 'Filter by expiration date to (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires to must be a valid ISO date string' })
  expiresTo?: string;

  @Field({ nullable: true, description: 'Sort field' })
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['id', 'couponCode', 'status', 'createdAt', 'expiresAt', 'redeemedAt']
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string = 'createdAt';

  @Field({ nullable: true, description: 'Sort order' })
  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}