import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardRepository } from './reward.repository';
import { PrismaModule } from '../../core/config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RewardService, RewardRepository],
  exports: [RewardService, RewardRepository],
})
export class RewardModule {}