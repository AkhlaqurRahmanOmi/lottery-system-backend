import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsBoolean, Matches } from 'class-validator';
import { UpdateAdminDto } from '../../../modules/admin/dto/update-admin.dto';
import { AdminRole } from '../../../modules/admin/dto/admin-base.dto';

/**
 * GraphQL-specific input type for updating admin accounts
 * Extends the base UpdateAdminDto with GraphQL-specific decorators
 */
@InputType('UpdateAdminInput')
export class UpdateAdminGraphQLDto extends UpdateAdminDto {
  @Field({ 
    nullable: true, 
    description: 'Admin username - must be unique and contain only letters, numbers, and underscores' 
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  declare username?: string;

  @Field({ 
    nullable: true, 
    description: 'Admin email address - must be unique and valid' 
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email?: string;

  @Field({ 
    nullable: true, 
    description: 'New password - must meet security requirements (min 8 chars, uppercase, lowercase, number, special char)' 
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  declare password?: string;

  @Field(() => AdminRole, { 
    nullable: true, 
    description: 'Admin role (ADMIN or SUPER_ADMIN)' 
  })
  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  declare role?: AdminRole;

  @Field({ 
    nullable: true, 
    description: 'Admin active status' 
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  declare isActive?: boolean;
}