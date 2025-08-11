import { Module } from '@nestjs/common';
import { CouponResolver } from './coupon.resolver';
import { CouponModule } from '../../modules/coupon/coupon.module';
// Import to register coupon enums with GraphQL
import '../enums/coupon.enums';

@Module({
  imports: [CouponModule],
  providers: [CouponResolver],
  exports: [CouponResolver],
})
export class CouponGraphQLModule {}