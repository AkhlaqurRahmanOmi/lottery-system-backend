// REST-specific coupon DTOs
export * from './generate-coupons-rest.dto';
export * from './coupon-query-rest.dto';
export * from './coupon-validation-rest.dto';
export * from './coupon-export-rest.dto';
export * from './batch-management-rest.dto';
export * from './coupon-response-rest.dto';

// Re-export base DTOs for convenience
export { 
  CouponBaseDto, 
  CouponStatus, 
  GenerationMethod 
} from '../../../../modules/coupon/dto/coupon-base.dto';
export * from '../../../../modules/coupon/dto/coupon-response.dto';
export { ExportFormat } from '../../../../modules/coupon/dto/coupon-export.dto';