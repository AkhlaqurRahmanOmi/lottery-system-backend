import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsJWT } from 'class-validator';

@InputType('RefreshTokenInput')
export class RefreshTokenDto {
  @Field({
    description: 'Refresh token for generating new access token'
  })
  @ApiProperty({
    description: 'Refresh token for generating new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  @IsJWT({ message: 'Invalid refresh token format' })
  refreshToken: string;
}