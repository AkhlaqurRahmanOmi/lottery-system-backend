import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminRole } from './admin-base.dto';

@InputType('AdminQueryInput')
export class AdminQueryDto {
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

  @Field({ nullable: true, description: 'Search term for username or email' })
  @ApiPropertyOptional({
    description: 'Search term for username or email',
    example: 'admin'
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @Field(() => AdminRole, { nullable: true, description: 'Filter by admin role' })
  @ApiPropertyOptional({
    description: 'Filter by admin role',
    enum: AdminRole
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  role?: AdminRole;

  @Field({ nullable: true, description: 'Filter by active status' })
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;

  @Field({ nullable: true, description: 'Sort field' })
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt', 'lastLogin']
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