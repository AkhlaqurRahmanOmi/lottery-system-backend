import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminRole } from '@prisma/client';
import { AdminQueryDto } from '../../../modules/admin/dto/admin-query.dto';

/**
 * GraphQL-specific input type for querying admin accounts
 * Extends the base AdminQueryDto with GraphQL-specific decorators
 */
@InputType('AdminQueryInput')
export class AdminQueryGraphQLDto extends AdminQueryDto {
  @Field(() => Int, { 
    nullable: true, 
    description: 'Page number for pagination (minimum: 1)',
    defaultValue: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  declare page?: number;

  @Field(() => Int, { 
    nullable: true, 
    description: 'Number of items per page (minimum: 1, maximum: 100)',
    defaultValue: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  declare limit?: number;

  @Field({ 
    nullable: true, 
    description: 'Search term for username or email' 
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  declare search?: string;

  @Field(() => AdminRole, { 
    nullable: true, 
    description: 'Filter by admin role' 
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  declare role?: AdminRole;

  @Field({ 
    nullable: true, 
    description: 'Filter by active status' 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  declare isActive?: boolean;

  @Field({ 
    nullable: true, 
    description: 'Sort field (id, username, email, role, createdAt, updatedAt, lastLogin)',
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