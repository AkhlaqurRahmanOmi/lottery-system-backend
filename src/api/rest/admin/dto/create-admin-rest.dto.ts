import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, Matches } from 'class-validator';
import { AdminRole } from '@prisma/client';
import { CreateAdminDto } from '../../../../modules/admin/dto/create-admin.dto';

/**
 * REST-specific DTO for creating admin accounts
 * Extends the base CreateAdminDto with REST-specific validation and documentation
 */
export class CreateAdminRestDto extends CreateAdminDto {
  @ApiProperty({
    description: 'Admin username - must be unique and contain only letters, numbers, and underscores',
    example: 'admin_user',
    minLength: 3,
    pattern: '^[a-zA-Z0-9_]+$'
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  declare username: string;

  @ApiProperty({
    description: 'Admin email address - must be unique and valid',
    example: 'admin@example.com',
    format: 'email'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email: string;

  @ApiProperty({
    description: 'Admin password - must meet security requirements',
    example: 'SecurePassword123!',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  declare password: string;

  @ApiProperty({
    description: 'Admin role - determines access permissions',
    enum: AdminRole,
    default: AdminRole.ADMIN,
    example: AdminRole.ADMIN
  })
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  declare role: AdminRole;
}