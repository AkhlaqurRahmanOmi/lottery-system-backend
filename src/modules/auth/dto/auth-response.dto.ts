import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { AdminBaseDto } from './auth-base.dto';

@ObjectType('AdminProfile')
export class AdminProfileDto extends AdminBaseDto {
  @Field(() => Int)
  @ApiProperty({
    description: 'Admin ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  declare id: number;
}

@ObjectType('AuthResponse')
export class AuthResponseDto {
  @Field()
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @Field()
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @Field(() => AdminProfileDto)
  @ApiProperty({
    description: 'Admin profile information',
    type: AdminProfileDto
  })
  admin: AdminProfileDto;

  @Field(() => Int)
  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900
  })
  @IsInt()
  expiresIn: number;
}

@ObjectType('TokenResponse')
export class TokenResponseDto {
  @Field()
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @Field(() => Int)
  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900
  })
  @IsInt()
  expiresIn: number;
}

@ObjectType('LogoutResponse')
export class LogoutResponseDto {
  @Field()
  @ApiProperty({
    description: 'Logout success message',
    example: 'Successfully logged out'
  })
  @IsString()
  message: string;
}