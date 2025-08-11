import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsInt, IsDateString, IsEmail, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

@InputType()
export class SubmissionQueryDto {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Search term for name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by coupon ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  couponId?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by selected reward ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  selectedRewardId?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by assigned reward ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignedRewardId?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by admin who assigned reward' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rewardAssignedBy?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by submission date from (ISO string)' })
  @IsOptional()
  @IsDateString()
  submittedFrom?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by submission date to (ISO string)' })
  @IsOptional()
  @IsDateString()
  submittedTo?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by reward assignment date from (ISO string)' })
  @IsOptional()
  @IsDateString()
  rewardAssignedFrom?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by reward assignment date to (ISO string)' })
  @IsOptional()
  @IsDateString()
  rewardAssignedTo?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Sort field', 
    enum: ['id', 'name', 'email', 'submittedAt', 'rewardAssignedAt'],
    default: 'submittedAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'submittedAt';

  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc' = 'desc';

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by whether reward has been assigned' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasAssignedReward?: boolean;
}