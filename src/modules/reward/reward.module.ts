import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardRepository } from './reward.repository';
import { RewardAccountRepository } from './reward-account.repository';
import { RewardDistributionService } from './reward-distribution.service';
import { PrismaModule } from '../../core/config/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  providers: [RewardService, RewardRepository, RewardAccountRepository, RewardDistributionService],
  exports: [RewardService, RewardRepository, RewardAccountRepository, RewardDistributionService],
})
export class RewardModule {}