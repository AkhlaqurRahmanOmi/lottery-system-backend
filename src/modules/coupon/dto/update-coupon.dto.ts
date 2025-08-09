import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsDateString, IsJSON, IsInt } from 'class-validator';
import { CreateCouponDto } from './create-coupon.dto';
import { CouponStatus } from './coupon-base.dto';

@InputType('UpdateCouponInput')
export class UpdateCouponDto extends PartialType(
  OmitType(CreateCouponDto, ['couponCode', 'createdBy', 'generationMethod'])
) {
  @Field(() => CouponStatus, { nullable: true })
  @ApiPropertyOptional({
    description: 'Coupon status',
    enum: CouponStatus
  })
  @IsOptional()
  @IsEnum(CouponStatus, { message: 'Status must be a valid CouponStatus' })
  status?: CouponStatus;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Expiration date (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Expires at must be a valid ISO date string' })
  expiresAt?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Redemption date (ISO string) - set when coupon is redeemed',
    example: '2024-06-15T10:30:00.000Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Redeemed at must be a valid ISO date string' })
  redeemedAt?: string;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({
    description: 'ID of the user who redeemed this coupon',
    example: 123
  })
  @IsOptional()
  @IsInt({ message: 'Redeemed by must be an integer' })
  redeemedBy?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { campaign: 'summer2024', source: 'web', notes: 'Updated expiration' }
  })
  @IsOptional()
  @IsJSON({ message: 'Metadata must be valid JSON' })
  metadata?: any;
}