import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsInt, IsJSON, Length, Matches } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

/**
 * Internal DTO for creating submissions with all required fields
 * This is used internally by the service layer after coupon validation
 */
@InputType('InternalCreateSubmissionInput')
export class InternalCreateSubmissionDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Coupon ID that was redeemed' })
  @IsNotEmpty()
  @IsInt()
  couponId: number;

  @Field()
  @ApiProperty({ description: 'User full name', minLength: 2, maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @Field()
  @ApiProperty({ description: 'User email address' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field()
  @ApiProperty({ 
    description: 'User phone number (international format with country code)', 
    example: '+1234567890' 
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone number must be in international format starting with + and country code (e.g., +1234567890)' 
  })
  phone: string;

  @Field()
  @ApiProperty({ description: 'User complete address', minLength: 10, maxLength: 500 })
  @IsNotEmpty()
  @IsString()
  @Length(10, 500, { message: 'Address must be between 10 and 500 characters' })
  address: string;

  @Field()
  @ApiProperty({ description: 'User product experience description', minLength: 10, maxLength: 1000 })
  @IsNotEmpty()
  @IsString()
  @Length(10, 1000, { message: 'Product experience must be between 10 and 1000 characters' })
  productExperience: string;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of the reward type/category the user selected' })
  @IsNotEmpty()
  @IsInt()
  selectedRewardId: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'User IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @ApiPropertyOptional({ description: 'Additional data as JSON' })
  @IsOptional()
  @IsJSON()
  additionalData?: any;
}