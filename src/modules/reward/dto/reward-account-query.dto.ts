import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { RewardCategory, RewardStatus } from '@prisma/client';

// DTO for querying reward accounts with filters, sorting, and pagination
@InputType('RewardAccountQueryInput')
export class RewardAccountQueryDto {
  // Search filters
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Search term for service name, account type, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => RewardCategory, { nullable: true })
  @ApiPropertyOptional({ enum: RewardCategory, description: 'Filter by reward category' })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @Field(() => RewardStatus, { nullable: true })
  @ApiPropertyOptional({ enum: RewardStatus, description: 'Filter by reward status' })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsInt()
  assignedToUserId?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Filter by creator admin ID' })
  @IsOptional()
  @IsInt()
  createdBy?: number;

  // Pagination
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number = 10;

  // Sorting
  @Field({ nullable: true, defaultValue: 'createdAt' })
  @ApiPropertyOptional({
    default: 'createdAt',
    enum: ['id', 'serviceName', 'category', 'status', 'createdAt', 'updatedAt', 'assignedAt'],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @Field({ nullable: true, defaultValue: 'desc' })
  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}