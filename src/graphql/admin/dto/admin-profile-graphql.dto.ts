import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, MinLength, Matches } from 'class-validator';
import { AdminProfileUpdateDto } from '../../../modules/admin/dto/admin-profile.dto';

/**
 * GraphQL-specific input type for admin profile updates
 * Extends the base AdminProfileUpdateDto with GraphQL-specific decorators
 */
@InputType('AdminProfileUpdateInput')
export class AdminProfileUpdateGraphQLDto extends AdminProfileUpdateDto {
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
    description: 'Current password (required if changing password)' 
  })
  @IsOptional()
  @IsString({ message: 'Current password must be a string' })
  declare currentPassword?: string;

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
  declare newPassword?: string;
}