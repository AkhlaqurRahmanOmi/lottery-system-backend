import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardModule } from '../../../modules/reward/reward.module';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';

@Module({
  imports: [RewardModule],
  controllers: [RewardController],
  providers: [ResponseBuilderService],
})
export class RewardRestModule {}