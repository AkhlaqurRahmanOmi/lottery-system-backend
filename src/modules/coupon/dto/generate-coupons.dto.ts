import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min, Max, IsJSON } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType('GenerateCouponsInput')
export class GenerateCouponsDto {
  @Field(() => Int)
  @ApiProperty({
    description: 'Number of coupons to generate',
    example: 10,
    minimum: 1,
    maximum: 1000
  })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(1000, { message: 'Quantity cannot exceed 1000' })
  quantity: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({
    description: 'Length of the coupon code',
    example: 10,
    minimum: 8,
    maximum: 12,
    default: 10
  })
  @IsOptional()
  @IsInt({ message: 'Code length must be an integer' })
  @Min(8, { message: 'Code length must be at least 8' })
  @Max(12, { message: 'Code length cannot exceed 12' })
  codeLength?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({
    description: 'Number of days until expiration',
    example: 30,
    minimum: 1,
    maximum: 365
  })
  @IsOptional()
  @IsInt({ message: 'Expiration days must be an integer' })
  @Min(1, { message: 'Expiration days must be at least 1' })
  @Max(365, { message: 'Expiration days cannot exceed 365' })
  expirationDays?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Custom batch name (optional)',
    example: 'Summer Campaign 2024'
  })
  @IsOptional()
  @IsString({ message: 'Batch name must be a string' })
  batchName?: string;

  @Field(() => Int)
  @ApiProperty({
    description: 'ID of the admin creating the coupons',
    example: 1
  })
  @IsInt({ message: 'Created by must be an integer' })
  createdBy: number;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { campaign: 'summer2024', source: 'web' }
  })
  @IsOptional()
  @IsJSON({ message: 'Metadata must be valid JSON' })
  metadata?: any;
}