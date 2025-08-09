import { Field, ObjectType, Int } from '@nestjs/graphql';
import { 
  CouponResponseDto, 
  CouponWithCreatorResponseDto, 
  PaginatedCouponResponseDto,
  BatchStatisticsDto,
  CouponValidationResultDto
} from '../../../modules/coupon/dto/coupon-response.dto';

/**
 * GraphQL-specific response wrapper for mutations
 */
@ObjectType('CouponMutationResponse')
export class CouponMutationResponseDto {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

/**
 * GraphQL-specific response for coupon generation
 */
@ObjectType('GenerateCouponsResponse')
export class GenerateCouponsGraphQLResponseDto extends CouponMutationResponseDto {
  @Field(() => [CouponResponseDto], { nullable: true })
  coupons?: CouponResponseDto[];

  @Field(() => Int, { nullable: true })
  totalGenerated?: number;

  @Field({ nullable: true })
  batchId?: string;
}

/**
 * GraphQL-specific response for batch operations
 */
@ObjectType('BatchOperationResponse')
export class BatchOperationGraphQLResponseDto extends CouponMutationResponseDto {
  @Field({ nullable: true })
  batchId?: string;

  @Field(() => Int, { nullable: true })
  affectedCoupons?: number;
}

/**
 * GraphQL-specific response for coupon status updates
 */
@ObjectType('UpdateCouponStatusResponse')
export class UpdateCouponStatusGraphQLResponseDto extends CouponMutationResponseDto {
  @Field(() => CouponResponseDto, { nullable: true })
  coupon?: CouponResponseDto;
}

/**
 * GraphQL-specific response for export operations
 */
@ObjectType('ExportResponse')
export class ExportGraphQLResponseDto extends CouponMutationResponseDto {
  @Field({ nullable: true })
  downloadUrl?: string;

  @Field({ nullable: true })
  filename?: string;

  @Field(() => Int, { nullable: true })
  totalRecords?: number;
}

/**
 * GraphQL-specific paginated response for batch statistics
 */
@ObjectType('PaginatedBatchStatisticsResponse')
export class PaginatedBatchStatisticsGraphQLResponseDto {
  @Field(() => [BatchStatisticsDto])
  data: BatchStatisticsDto[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

/**
 * GraphQL-specific subscription payload for coupon updates
 */
@ObjectType('CouponUpdatePayload')
export class CouponUpdatePayloadDto {
  @Field()
  type: string; // 'GENERATED', 'REDEEMED', 'EXPIRED', 'DEACTIVATED'

  @Field(() => CouponResponseDto)
  coupon: CouponResponseDto;

  @Field()
  timestamp: Date;

  @Field({ nullable: true })
  batchId?: string;
}

/**
 * GraphQL-specific subscription payload for batch updates
 */
@ObjectType('BatchUpdatePayload')
export class BatchUpdatePayloadDto {
  @Field()
  type: string; // 'CREATED', 'DEACTIVATED', 'STATISTICS_UPDATED'

  @Field(() => BatchStatisticsDto)
  batch: BatchStatisticsDto;

  @Field()
  timestamp: Date;
}