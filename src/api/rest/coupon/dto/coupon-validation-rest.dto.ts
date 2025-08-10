import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * REST-specific DTO for validating coupon codes
 * Used for public coupon validation endpoint
 */
export class CouponValidationRestDto {
  @ApiProperty({
    description: 'Coupon code to validate (8-12 alphanumeric characters)',
    example: 'ABC123XYZ9',
    minLength: 8,
    maxLength: 12,
    pattern: '^[A-Z2-9]+$'
  })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString({ message: 'Coupon code must be a string' })
  @Length(8, 12, { message: 'Coupon code must be between 8 and 12 characters' })
  @Matches(/^[A-Z2-9]+$/, { 
    message: 'Coupon code must contain only uppercase letters (A-Z) and numbers (2-9)' 
  })
  couponCode: string;
}