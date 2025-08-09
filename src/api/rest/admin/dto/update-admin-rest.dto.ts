import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsBoolean, Matches } from 'class-validator';
import { AdminRole } from '@prisma/client';
import { UpdateAdminDto } from '../../../../modules/admin/dto/update-admin.dto';

/**
 * REST-specific DTO for updating admin accounts
 * Extends the base UpdateAdminDto with REST-specific validation and documentation
 */
export class UpdateAdminRestDto extends UpdateAdminDto {
  @ApiPropertyOptional({
    description: 'Admin username - must be unique and contain only letters, numbers, and underscores',
    example: 'admin_user',
    minLength: 3,
    pattern: '^[a-zA-Z0-9_]+$'
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  declare username?: string;

  @ApiPropertyOptional({
    description: 'Admin email address - must be unique and valid',
    example: 'admin@example.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email?: string;

  @ApiPropertyOptional({
    description: 'New password - must meet security requirements',
    example: 'NewSecurePassword123!',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  declare password?: string;

  @ApiPropertyOptional({
    description: 'Admin role - determines access permissions',
    enum: AdminRole,
    example: AdminRole.ADMIN
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  declare role?: AdminRole;

  @ApiPropertyOptional({
    description: 'Admin active status - determines if admin can login',
    example: true
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  declare isActive?: boolean;
}