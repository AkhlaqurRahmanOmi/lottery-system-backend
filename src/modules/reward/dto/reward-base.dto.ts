import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsDate, IsBoolean, IsUrl, MaxLength } from 'class-validator';

// Base DTO for reward entity information
@ObjectType('RewardBase')
@InputType('RewardBaseInput')
export class RewardBaseDto {
  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id?: number;

  @Field()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  displayOrder?: number;

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
}