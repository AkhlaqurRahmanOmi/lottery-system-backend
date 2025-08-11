import { Module } from '@nestjs/common';
import { RewardResolver } from './reward.resolver';
import { RewardAccountResolver } from './reward-account.resolver';
import { RewardModule } from '../../modules/reward/reward.module';

@Module({
  imports: [RewardModule],
  providers: [RewardResolver, RewardAccountResolver],
  exports: [RewardResolver, RewardAccountResolver],
})
export class RewardGraphQLModule {}