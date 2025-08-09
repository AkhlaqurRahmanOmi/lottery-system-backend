import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

@InputType('PasswordResetRequestInput')
export class PasswordResetRequestDto {
  @Field({
    description: 'Admin email address for password reset'
  })
  @ApiProperty({
    description: 'Admin email address for password reset',
    example: 'admin@example.com'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

@InputType('PasswordResetInput')
export class PasswordResetDto {
  @Field({
    description: 'Password reset token'
  })
  @ApiProperty({
    description: 'Password reset token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString({ message: 'Reset token must be a string' })
  resetToken: string;

  @Field({
    description: 'New password'
  })
  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;
}

@InputType('ChangePasswordInput')
export class ChangePasswordDto {
  @Field({
    description: 'Current password'
  })
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!'
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword: string;

  @Field({
    description: 'New password'
  })
  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;
}