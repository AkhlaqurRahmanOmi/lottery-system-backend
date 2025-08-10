import { Module } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponModule } from '../../../modules/coupon/coupon.module';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';

@Module({
  imports: [CouponModule],
  controllers: [CouponController],
  providers: [ResponseBuilderService],
})
export class CouponRestModule {}