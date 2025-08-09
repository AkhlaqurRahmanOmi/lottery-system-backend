import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AdminRole } from '@prisma/client';
import { AdminQueryDto } from '../../../../modules/admin/dto/admin-query.dto';

/**
 * REST-specific DTO for querying admin accounts
 * Extends the base AdminQueryDto with REST-specific validation and documentation
 */
export class AdminQueryRestDto extends AdminQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  declare page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  declare limit?: number;

  @ApiPropertyOptional({
    description: 'Search term for username or email',
    example: 'admin'
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  declare search?: string;

  @ApiPropertyOptional({
    description: 'Filter by admin role',
    enum: AdminRole,
    example: AdminRole.ADMIN
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  declare role?: AdminRole;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: 'boolean'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  declare isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt', 'lastLogin']
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  declare sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  declare sortOrder?: 'asc' | 'desc';
}