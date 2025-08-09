import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';

/**
 * GraphQL-specific input type for batch statistics query
 */
@InputType('BatchStatisticsQueryInput')
export class BatchStatisticsQueryGraphQLDto {
  @Field(() => Int, { 
    nullable: true, 
    description: 'Page number for pagination',
    defaultValue: 1
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @Field(() => Int, { 
    nullable: true, 
    description: 'Number of items per page (1-100)',
    defaultValue: 10
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @Field({ 
    nullable: true, 
    description: 'Search term for batch ID or name'
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

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

  @Field({ 
    nullable: true, 
    description: 'Sort field',
    defaultValue: 'createdAt'
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string = 'createdAt';

  @Field({ 
    nullable: true, 
    description: 'Sort order (asc or desc)',
    defaultValue: 'desc'
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * GraphQL-specific input type for batch deactivation
 */
@InputType('DeactivateBatchInput')
export class DeactivateBatchGraphQLDto {
  @Field({
    description: 'Batch ID to deactivate'
  })
  @IsNotEmpty({ message: 'Batch ID is required' })
  @IsString({ message: 'Batch ID must be a string' })
  batchId: string;

  @Field({ 
    nullable: true,
    description: 'Reason for deactivation'
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;
}