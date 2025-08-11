import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, IsJSON, Min, Max } from 'class-validator';
import { CouponBaseDto, GenerationMethod } from './coupon-base.dto';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType('CreateCouponInput')
export class CreateCouponDto extends OmitType(CouponBaseDto, ['id', 'status', 'createdAt', 'redeemedAt', 'redeemedBy', 'expiresAt']) {
  @Field()
  @ApiProperty({
    description: 'Unique coupon code',
    example: 'ABC123XYZ9'
  })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString({ message: 'Coupon code must be a string' })
  couponCode: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Batch ID for grouping coupons',
    example: 'batch_2024_01_15'
  })
  @IsOptional()
  @IsString({ message: 'Batch ID must be a string' })
  batchId?: string;

  @Field(() => Int)
  @ApiProperty({
    description: 'Length of the coupon code',
    example: 10,
    minimum: 8,
    maximum: 12
  })
  @IsInt({ message: 'Code length must be an integer' })
  @Min(8, { message: 'Code length must be at least 8' })
  @Max(12, { message: 'Code length cannot exceed 12' })
  codeLength: number;

  @Field(() => Int)
  @ApiProperty({
    description: 'ID of the admin who created this coupon',
    example: 1
  })
  @IsInt({ message: 'Created by must be an integer' })
  createdBy: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Expiration date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires at must be a valid ISO date string' })
  expiresAt?: string;

  @Field(() => GenerationMethod)
  @ApiProperty({
    description: 'Method used to generate this coupon',
    enum: GenerationMethod,
    example: GenerationMethod.SINGLE
  })
  generationMethod: GenerationMethod;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { campaign: 'summer2024', source: 'web' }
  })
  @IsOptional()
  @IsJSON({ message: 'Metadata must be valid JSON' })
  metadata?: any;
}