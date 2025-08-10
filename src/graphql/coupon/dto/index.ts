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

// Type aliases for cleaner imports
export { CouponQueryGraphQLDto as CouponQueryGraphQLDto } from './coupon-query-graphql.dto';
export { CouponValidationGraphQLDto as CouponValidationGraphQLDto, UpdateCouponStatusGraphQLDto } from './coupon-validation-graphql.dto';
export { CouponExportGraphQLDto as CouponExportGraphQLDto } from './coupon-export-graphql.dto';
export { BatchStatisticsQueryGraphQLDto as BatchManagementGraphQLDto } from './batch-management-graphql.dto';