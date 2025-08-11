import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDate, IsBoolean } from 'class-validator';
import { AdminRole } from '@prisma/client';

// Re-export AdminRole for other modules
export { AdminRole };

// Base DTO for admin entity information
@ObjectType('AdminBase')
@InputType('AdminBaseInput')
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

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @Field(() => Date, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  lastLogin?: Date | null;
}