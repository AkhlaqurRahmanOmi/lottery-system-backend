import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsBoolean, Matches } from 'class-validator';
import { AdminBaseDto, AdminRole } from './admin-base.dto';

@InputType('UpdateAdminInput')
export class UpdateAdminDto extends PartialType(
  OmitType(AdminBaseDto, ['id', 'createdAt', 'updatedAt', 'lastLogin'])
) {
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
  password?: string;

  @Field(() => AdminRole, { nullable: true, description: 'Admin role' })
  @ApiPropertyOptional({
    description: 'Admin role',
    enum: AdminRole
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  role?: AdminRole;

  @Field({ nullable: true, description: 'Admin active status' })
  @ApiPropertyOptional({
    description: 'Admin active status',
    example: true
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}