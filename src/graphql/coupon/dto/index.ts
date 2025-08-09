// GraphQL-specific coupon DTOs
export * from './generate-coupons-graphql.dto';
export * from './coupon-query-graphql.dto';
export * from './coupon-validation-graphql.dto';
export * from './coupon-export-graphql.dto';
export * from './batch-management-graphql.dto';
export * from './coupon-response-graphql.dto';

// Re-export base DTOs for convenience (excluding conflicting exports)
export { 
  CouponBaseDto, 
  CouponStatus, 
  GenerationMethod 
} from '../../../modules/coupon/dto/coupon-base.dto';
export * from '../../../modules/coupon/dto/coupon-response.dto';