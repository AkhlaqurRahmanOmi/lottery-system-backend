import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, MinLength, Matches } from 'class-validator';

@InputType('AdminProfileUpdateInput')
export class AdminProfileUpdateDto {
  @Field({ nullable: true, description: 'Admin username' })
  @ApiPropertyOptional({
    description: 'Admin username',
    example: 'admin_user'
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username?: string;

  @Field({ nullable: true, description: 'Admin email address' })
  @ApiPropertyOptional({
    description: 'Admin email address',
    example: 'admin@example.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @Field({ nullable: true, description: 'Current password (required if changing password)' })
  @ApiPropertyOptional({
    description: 'Current password (required if changing password)',
    example: 'CurrentPassword123!'
  })
  @IsOptional()
  @IsString({ message: 'Current password must be a string' })
  currentPassword?: string;

  @Field({ nullable: true, description: 'New password' })
  @ApiPropertyOptional({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword?: string;
}