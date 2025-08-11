import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardAccountController } from './reward-account.controller';
import { RewardModule } from '../../../modules/reward/reward.module';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';

@Module({
  imports: [RewardModule],
  controllers: [RewardController, RewardAccountController],
  providers: [ResponseBuilderService],
})
export class RewardRestModule {}