import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService } from './coupon-generator.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CouponService, CouponRepository, CouponGeneratorService],
  exports: [CouponService, CouponRepository, CouponGeneratorService],
})
export class CouponModule {}