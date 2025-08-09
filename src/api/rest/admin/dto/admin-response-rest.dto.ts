import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDate, IsBoolean } from 'class-validator';
import { AdminRole } from '@prisma/client';
import { AdminBaseDto } from '../../../../modules/admin/dto/admin-base.dto';

/**
 * REST-specific DTO for admin response data
 * Used for returning admin information in REST API responses
 */
export class AdminResponseRestDto extends AdminBaseDto {
  @ApiProperty({
    description: 'Admin ID',
    example: 1,
    type: 'integer'
  })
  @IsInt()
  @IsNotEmpty()
  declare id: number;

  @ApiProperty({
    description: 'Admin username',
    example: 'admin_user'
  })
  @IsNotEmpty()
  @IsString()
  declare username: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    format: 'email'
  })
  @IsNotEmpty()
  @IsEmail()
  declare email: string;

  @ApiProperty({
    description: 'Admin role',
    enum: AdminRole,
    example: AdminRole.ADMIN
  })
  @IsEnum(AdminRole)
  declare role: AdminRole;

  @ApiProperty({
    description: 'Admin active status',
    example: true
  })
  @IsBoolean()
  declare isActive: boolean;

  @ApiProperty({
    description: 'Admin creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDate()
  declare createdAt: Date;

  @ApiProperty({
    description: 'Admin last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsDate()
  declare updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Admin last login timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    nullable: true
  })
  @IsOptional()
  @IsDate()
  declare lastLogin?: Date | null;
}

/**
 * REST-specific DTO for paginated admin list response
 */
export class AdminListResponseRestDto {
  @ApiProperty({
    description: 'List of admin accounts',
    type: [AdminResponseRestDto]
  })
  data: AdminResponseRestDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'integer', example: 50, description: 'Total number of admin accounts' },
      page: { type: 'integer', example: 1, description: 'Current page number' },
      limit: { type: 'integer', example: 10, description: 'Items per page' },
      totalPages: { type: 'integer', example: 5, description: 'Total number of pages' },
      hasNext: { type: 'boolean', example: true, description: 'Whether there is a next page' },
      hasPrev: { type: 'boolean', example: false, description: 'Whether there is a previous page' }
    }
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * REST-specific DTO for admin profile update response
 */
export class AdminProfileUpdateResponseRestDto {
  @ApiProperty({
    description: 'Updated admin profile',
    type: AdminResponseRestDto
  })
  admin: AdminResponseRestDto;

  @ApiProperty({
    description: 'Success message',
    example: 'Admin profile updated successfully'
  })
  message: string;
}