import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { CouponBaseDto, CouponStatus, GenerationMethod } from './coupon-base.dto';

// Coupon response DTO with all information
@ObjectType('CouponResponse')
export class CouponResponseDto extends OmitType(CouponBaseDto, []) {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  couponCode: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  batchId?: string;

  @Field(() => Int)
  @ApiProperty()
  codeLength: number;

  @Field(() => CouponStatus)
  @ApiProperty({ enum: CouponStatus })
  status: CouponStatus;

  @Field(() => Int)
  @ApiProperty()
  createdBy: number;

  @Field()
  @ApiProperty()
  createdAt: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  expiresAt?: Date;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  redeemedAt?: Date;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  redeemedBy?: number;

  @Field(() => GenerationMethod)
  @ApiProperty({ enum: GenerationMethod })
  generationMethod: GenerationMethod;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  metadata?: any;
}

// Creator information DTO
@ObjectType('CreatorInfo')
export class CreatorInfoDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  username: string;

  @Field()
  @ApiProperty()
  email: string;
}

// Submission information DTO
@ObjectType('SubmissionInfo')
export class SubmissionInfoDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field()
  @ApiProperty()
  name: string;

  @Field()
  @ApiProperty()
  email: string;

  @Field()
  @ApiProperty()
  submittedAt: Date;
}

// Coupon response with creator information
@ObjectType('CouponWithCreatorResponse')
export class CouponWithCreatorResponseDto extends CouponResponseDto {
  @Field(() => CreatorInfoDto, { nullable: true })
  @ApiPropertyOptional({ type: CreatorInfoDto })
  creator?: CreatorInfoDto;

  @Field(() => SubmissionInfoDto, { nullable: true })
  @ApiPropertyOptional({ type: SubmissionInfoDto })
  submission?: SubmissionInfoDto;
}

// Paginated coupon response
@ObjectType('PaginatedCouponResponse')
export class PaginatedCouponResponseDto {
  @Field(() => [CouponWithCreatorResponseDto])
  @ApiProperty({ type: [CouponWithCreatorResponseDto] })
  data: CouponWithCreatorResponseDto[];

  @Field(() => Int)
  @ApiProperty()
  total: number;

  @Field(() => Int)
  @ApiProperty()
  page: number;

  @Field(() => Int)
  @ApiProperty()
  limit: number;

  @Field(() => Int)
  @ApiProperty()
  totalPages: number;

  @Field()
  @ApiProperty()
  hasNextPage: boolean;

  @Field()
  @ApiProperty()
  hasPreviousPage: boolean;
}

// Batch statistics DTO
@ObjectType('BatchStatistics')
export class BatchStatisticsDto {
  @Field()
  @ApiProperty()
  batchId: string;

  @Field(() => Int)
  @ApiProperty()
  totalCoupons: number;

  @Field(() => Int)
  @ApiProperty()
  activeCoupons: number;

  @Field(() => Int)
  @ApiProperty()
  redeemedCoupons: number;

  @Field(() => Int)
  @ApiProperty()
  expiredCoupons: number;

  @Field(() => Int)
  @ApiProperty()
  deactivatedCoupons: number;

  @Field()
  @ApiProperty()
  createdAt: Date;

  @Field(() => CreatorInfoDto)
  @ApiProperty({ type: CreatorInfoDto })
  creator: CreatorInfoDto;
}

// Coupon validation result DTO
@ObjectType('CouponValidationResult')
export class CouponValidationResultDto {
  @Field()
  @ApiProperty()
  isValid: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  coupon?: CouponResponseDto;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  error?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  errorCode?: string;
}