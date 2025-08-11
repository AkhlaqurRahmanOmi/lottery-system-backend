import { Module } from '@nestjs/common';
import { DataManagementController } from './data-management.controller';
import { AnalyticsModule } from '../../../modules/analytics/analytics.module';
import { ExportModule } from '../../../modules/export/export.module';
import { SubmissionModule } from '../../../modules/submission/submission.module';
import { RewardModule } from '../../../modules/reward/reward.module';
import { SharedModule } from '../../../shared/shared.module';

@Module({
  imports: [
    AnalyticsModule,
    ExportModule,
    SubmissionModule,
    RewardModule,
    SharedModule,
  ],
  controllers: [DataManagementController],
})
export class DataManagementModule {}