import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService } from './coupon-generator.service';
import { CouponValidationService } from './coupon-validation.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CouponService, CouponRepository, CouponGeneratorService, CouponValidationService],
  exports: [CouponService, CouponRepository, CouponGeneratorService, CouponValidationService],
})
export class CouponModule {}