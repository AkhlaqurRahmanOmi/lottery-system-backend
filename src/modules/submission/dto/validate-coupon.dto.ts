import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

@InputType()
export class ValidateCouponDto {
  @Field()
  @ApiProperty({ description: 'Coupon code to validate', example: 'ABC123XYZ9' })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString()
  @Length(8, 12, { message: 'Coupon code must be between 8 and 12 characters' })
  @Matches(/^[A-Z2-9]+$/, { message: 'Coupon code must contain only uppercase letters and numbers (2-9)' })
  couponCode: string;
}

@ObjectType()
export class CouponValidationResponseDto {
  @Field()
  @ApiProperty({ description: 'Whether the coupon is valid' })
  isValid: boolean;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Error message if coupon is invalid', required: false })
  message?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Coupon code that was validated', required: false })
  couponCode?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Expiration date if coupon is valid', required: false })
  expiresAt?: Date;
}