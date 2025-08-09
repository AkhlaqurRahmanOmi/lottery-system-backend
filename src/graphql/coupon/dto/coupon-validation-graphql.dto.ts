import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * GraphQL-specific input type for validating coupon codes
 * Used for public coupon validation operations
 */
@InputType('CouponValidationInput')
export class CouponValidationGraphQLDto {
  @Field({
    description: 'Coupon code to validate (8-12 alphanumeric characters, A-Z and 2-9 only)'
  })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString({ message: 'Coupon code must be a string' })
  @Length(8, 12, { message: 'Coupon code must be between 8 and 12 characters' })
  @Matches(/^[A-Z2-9]+$/, { 
    message: 'Coupon code must contain only uppercase letters (A-Z) and numbers (2-9)' 
  })
  couponCode: string;
}

/**
 * GraphQL-specific input type for batch operations
 */
@InputType('BatchOperationInput')
export class BatchOperationGraphQLDto {
  @Field({
    description: 'Batch ID for the operation'
  })
  @IsNotEmpty({ message: 'Batch ID is required' })
  @IsString({ message: 'Batch ID must be a string' })
  batchId: string;
}

/**
 * GraphQL-specific input type for coupon status updates
 */
@InputType('UpdateCouponStatusInput')
export class UpdateCouponStatusGraphQLDto {
  @Field({
    description: 'Coupon code to update'
  })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString({ message: 'Coupon code must be a string' })
  @Length(8, 12, { message: 'Coupon code must be between 8 and 12 characters' })
  @Matches(/^[A-Z2-9]+$/, { 
    message: 'Coupon code must contain only uppercase letters (A-Z) and numbers (2-9)' 
  })
  couponCode: string;

  @Field({
    description: 'New status for the coupon (ACTIVE or DEACTIVATED)'
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsString({ message: 'Status must be a string' })
  @Matches(/^(ACTIVE|DEACTIVATED)$/, { 
    message: 'Status must be either ACTIVE or DEACTIVATED' 
  })
  status: 'ACTIVE' | 'DEACTIVATED';
}