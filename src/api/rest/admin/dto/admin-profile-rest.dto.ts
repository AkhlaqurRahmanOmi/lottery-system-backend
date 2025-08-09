import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, Matches } from 'class-validator';
import { AdminProfileUpdateDto } from '../../../../modules/admin/dto/admin-profile.dto';

/**
 * REST-specific DTO for admin profile updates
 * Extends the base AdminProfileUpdateDto with REST-specific validation and documentation
 */
export class AdminProfileUpdateRestDto extends AdminProfileUpdateDto {
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
    description: 'Current password (required if changing password)',
    example: 'CurrentPassword123!'
  })
  @IsOptional()
  @IsString({ message: 'Current password must be a string' })
  declare currentPassword?: string;

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
  declare newPassword?: string;
}