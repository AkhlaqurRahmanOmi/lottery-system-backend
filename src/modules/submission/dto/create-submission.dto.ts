import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEmail, IsInt, Length, Matches } from 'class-validator';

@InputType()
export class CreateSubmissionDto {
  @Field()
  @ApiProperty({ description: 'Coupon code to redeem', example: 'ABC123XYZ9' })
  @IsNotEmpty({ message: 'Coupon code is required' })
  @IsString()
  @Length(8, 12, { message: 'Coupon code must be between 8 and 12 characters' })
  @Matches(/^[A-Z2-9]+$/, { message: 'Coupon code must contain only uppercase letters and numbers (2-9)' })
  couponCode: string;

  @Field()
  @ApiProperty({ description: 'User full name', minLength: 2, maxLength: 100, example: 'John Doe' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @Field()
  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field()
  @ApiProperty({ 
    description: 'User phone number in international format with country code', 
    example: '+1234567890' 
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone number must be in international format starting with + and country code (e.g., +1234567890)' 
  })
  phone: string;

  @Field()
  @ApiProperty({ 
    description: 'User complete address including street, city, state/province, postal code, and country', 
    minLength: 10, 
    maxLength: 500,
    example: '123 Main St, Anytown, ST 12345, Country'
  })
  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  @Length(10, 500, { message: 'Address must be between 10 and 500 characters' })
  address: string;

  @Field()
  @ApiProperty({ 
    description: 'User experience with the product or service', 
    minLength: 10, 
    maxLength: 1000,
    example: 'I have been using this product for 2 years and find it very helpful for my daily tasks.'
  })
  @IsNotEmpty({ message: 'Product experience is required' })
  @IsString()
  @Length(10, 1000, { message: 'Product experience must be between 10 and 1000 characters' })
  productExperience: string;

  @Field(() => Int)
  @ApiProperty({ 
    description: 'ID of the reward type/category the user wants to receive',
    example: 1
  })
  @IsNotEmpty({ message: 'Reward selection is required' })
  @IsInt({ message: 'Reward ID must be a valid integer' })
  selectedRewardId: number;
}