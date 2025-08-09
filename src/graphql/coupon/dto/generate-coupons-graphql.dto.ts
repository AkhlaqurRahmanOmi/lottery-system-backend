import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min, Max, IsJSON } from 'class-validator';
import { GenerateCouponsDto } from '../../../modules/coupon/dto/generate-coupons.dto';

/**
 * GraphQL-specific input type for generating coupon codes
 * Extends the base GenerateCouponsDto with GraphQL-specific decorators
 */
@InputType('GenerateCouponsInput')
export class GenerateCouponsGraphQLDto extends GenerateCouponsDto {
  @Field(() => Int, {
    description: 'Number of coupons to generate (1-1000)'
  })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(1000, { message: 'Quantity cannot exceed 1000' })
  declare quantity: number;

  @Field(() => Int, { 
    nullable: true,
    description: 'Length of the coupon code (8-12 characters, default: 10)',
    defaultValue: 10
  })
  @IsOptional()
  @IsInt({ message: 'Code length must be an integer' })
  @Min(8, { message: 'Code length must be at least 8' })
  @Max(12, { message: 'Code length cannot exceed 12' })
  declare codeLength?: number;

  @Field(() => Int, { 
    nullable: true,
    description: 'Number of days until expiration (1-365 days)'
  })
  @IsOptional()
  @IsInt({ message: 'Expiration days must be an integer' })
  @Min(1, { message: 'Expiration days must be at least 1' })
  @Max(365, { message: 'Expiration days cannot exceed 365' })
  declare expirationDays?: number;

  @Field({ 
    nullable: true,
    description: 'Custom batch name for grouping coupons'
  })
  @IsOptional()
  @IsString({ message: 'Batch name must be a string' })
  declare batchName?: string;

  @Field(() => Int, {
    description: 'ID of the admin creating the coupons'
  })
  @IsInt({ message: 'Created by must be an integer' })
  declare createdBy: number;

  @Field({ 
    nullable: true,
    description: 'Additional metadata as JSON object'
  })
  @IsOptional()
  @IsJSON({ message: 'Metadata must be valid JSON' })
  declare metadata?: any;
}