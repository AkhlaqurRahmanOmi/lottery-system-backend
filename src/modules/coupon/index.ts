export { CouponModule } from './coupon.module';
export { CouponService } from './coupon.service';
export { CouponRepository } from './coupon.repository';
export { CouponGeneratorService } from './coupon-generator.service';
export { CouponValidationService } from './coupon-validation.service';
export type { 
  GenerateCouponOptions, 
  GeneratedCoupon, 
  BatchGenerationResult 
} from './coupon-generator.service';
export type { CouponValidationOptions } from './coupon-validation.service';
export * from './dto';