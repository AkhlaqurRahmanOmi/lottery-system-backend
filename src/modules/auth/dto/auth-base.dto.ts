import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDate } from 'class-validator';
import { AdminRole } from '@prisma/client';

// Re-export AdminRole for other modules
export { AdminRole };

// Base DTO for admin profile information
@ObjectType('AdminBase')
export class AdminBaseDto {
  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id?: number;

  @Field()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;

  @Field()
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => AdminRole)
  @ApiProperty({ enum: AdminRole })
  @IsEnum(AdminRole)
  role: AdminRole;

  @Field(() => Date, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  lastLogin?: Date;
}

// Base DTO for login credentials (no decorators, just structure)
export abstract class LoginBaseDto {
  username: string;
  password: string;
}

// Base DTO for token information (no decorators, just structure)
export abstract class TokenBaseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}