import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { LoginBaseDto } from './auth-base.dto';

@InputType('LoginInput')
export class LoginDto extends LoginBaseDto {
  @Field({
    description: 'Admin username'
  })
  @ApiProperty({
    description: 'Admin username',
    example: 'admin'
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  declare username: string;

  @Field({
    description: 'Admin password'
  })
  @ApiProperty({
    description: 'Admin password',
    example: 'password123',
    minLength: 6
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  declare password: string;
}