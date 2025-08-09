import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { 
  PasswordResetRequestDto, 
  PasswordResetConfirmDto, 
  ChangePasswordDto 
} from '../../../../modules/admin/dto/password-reset.dto';

/**
 * REST-specific DTO for password reset request
 * Extends the base PasswordResetRequestDto with REST-specific validation and documentation
 */
export class PasswordResetRequestRestDto extends PasswordResetRequestDto {
  @ApiProperty({
    description: 'Admin email address for password reset',
    example: 'admin@example.com',
    format: 'email'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email: string;
}

/**
 * REST-specific DTO for password reset confirmation
 * Extends the base PasswordResetConfirmDto with REST-specific validation and documentation
 */
export class PasswordResetConfirmRestDto extends PasswordResetConfirmDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'abc123def456789...'
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString({ message: 'Reset token must be a string' })
  declare token: string;

  @ApiProperty({
    description: 'New password - must meet security requirements',
    example: 'NewSecurePassword123!',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  declare newPassword: string;
}

/**
 * REST-specific DTO for password change
 * Extends the base ChangePasswordDto with REST-specific validation and documentation
 */
export class ChangePasswordRestDto extends ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!'
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  declare currentPassword: string;

  @ApiProperty({
    description: 'New password - must meet security requirements',
    example: 'NewSecurePassword123!',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  declare newPassword: string;
}