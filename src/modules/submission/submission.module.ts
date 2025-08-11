import { Module } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';
import { CouponModule } from '../coupon/coupon.module';
import { RewardModule } from '../reward/reward.module';
import { PrismaModule } from '../../core/config/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CouponModule,
    RewardModule,
  ],
  providers: [
    SubmissionService,
    SubmissionRepository,
  ],
  exports: [
    SubmissionService,
    SubmissionRepository,
  ],
})
export class SubmissionModule {}