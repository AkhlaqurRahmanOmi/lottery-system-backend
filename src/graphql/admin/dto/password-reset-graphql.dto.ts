import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

/**
 * GraphQL input type for password reset operations
 */
@InputType('PasswordResetInput')
export class PasswordResetGraphQLDto {
  @Field({
    description: 'Admin ID whose password will be reset'
  })
  @IsNotEmpty({ message: 'Admin ID is required' })
  adminId: number;

  @Field({
    description: 'New password - must meet security requirements (min 8 chars, uppercase, lowercase, number, special char)'
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;
}

/**
 * GraphQL input type for change password operations (self-service)
 */
@InputType('ChangePasswordInput')
export class ChangePasswordGraphQLDto {
  @Field({
    description: 'Current password for verification'
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword: string;

  @Field({
    description: 'New password - must meet security requirements (min 8 chars, uppercase, lowercase, number, special char)'
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;
}