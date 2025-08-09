import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, Matches } from 'class-validator';
import { CreateAdminDto } from '../../../modules/admin/dto/create-admin.dto';
import { AdminRole } from '../../../modules/admin/dto/admin-base.dto';

/**
 * GraphQL-specific input type for creating admin accounts
 * Extends the base CreateAdminDto with GraphQL-specific decorators
 */
@InputType('CreateAdminInput')
export class CreateAdminGraphQLDto extends CreateAdminDto {
  @Field({
    description: 'Admin username - must be unique and contain only letters, numbers, and underscores'
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  declare username: string;

  @Field({
    description: 'Admin email address - must be unique and valid'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  declare email: string;

  @Field({
    description: 'Admin password - must meet security requirements (min 8 chars, uppercase, lowercase, number, special char)'
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  declare password: string;

  @Field(() => AdminRole, { 
    description: 'Admin role (ADMIN or SUPER_ADMIN)',
    defaultValue: AdminRole.ADMIN
  })
  @IsEnum(AdminRole, { message: 'Role must be either ADMIN or SUPER_ADMIN' })
  declare role: AdminRole;
}