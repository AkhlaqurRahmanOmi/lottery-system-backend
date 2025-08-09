import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { AdminRole } from './auth-base.dto';

@InputType('RegisterInput')
export class RegisterDto {
  @Field({
    description: 'Admin username'
  })
  @ApiProperty({
    description: 'Admin username',
    example: 'admin_user'
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username: string;

  @Field({
    description: 'Admin email address'
  })
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field({
    description: 'Admin password'
  })
  @ApiProperty({
    description: 'Admin password',
    example: 'SecurePassword123!',
    minLength: 8
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;

  @Field(() => AdminRole, { 
    nullable: true,
    description: 'Admin role',
    defaultValue: AdminRole.ADMIN
  })
  @ApiPropertyOptional({
    description: 'Admin role',
    enum: AdminRole,
    default: AdminRole.ADMIN
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  role?: AdminRole = AdminRole.ADMIN;
}