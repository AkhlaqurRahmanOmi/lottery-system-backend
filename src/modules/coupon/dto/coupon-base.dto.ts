import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDate, IsJSON } from 'class-validator';
import { CouponStatus, GenerationMethod } from '@prisma/client';

// Re-export enums for other modules
export { CouponStatus, GenerationMethod };

// Base DTO for coupon entity information
@ObjectType('CouponBase')
@InputType('CouponBaseInput')
export class CouponBaseDto {
  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  id?: number;

  @Field()
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  couponCode: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @Field(() => Int)
  @ApiProperty()
  @IsInt()
  codeLength: number;

  @Field(() => CouponStatus)
  @ApiProperty({ enum: CouponStatus })
  @IsEnum(CouponStatus)
  status: CouponStatus;

  @Field(() => Int)
  @ApiProperty()
  @IsInt()
  createdBy: number;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  redeemedAt?: Date;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  redeemedBy?: number;

  @Field(() => GenerationMethod)
  @ApiProperty({ enum: GenerationMethod })
  @IsEnum(GenerationMethod)
  generationMethod: GenerationMethod;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  metadata?: any;
}