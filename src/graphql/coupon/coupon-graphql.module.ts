import { Module } from '@nestjs/common';
import { CouponResolver } from './coupon.resolver';
import { CouponModule } from '../../modules/coupon/coupon.module';

@Module({
  imports: [CouponModule],
  providers: [CouponResolver],
  exports: [CouponResolver],
})
export class CouponGraphQLModule {}