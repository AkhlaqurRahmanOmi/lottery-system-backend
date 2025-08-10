import { Module } from '@nestjs/common';
import { RewardResolver } from './reward.resolver';
import { RewardModule } from '../../modules/reward/reward.module';

@Module({
  imports: [RewardModule],
  providers: [RewardResolver],
  exports: [RewardResolver],
})
export class RewardGraphQLModule {}