import { Module } from '@nestjs/common';
import { DataManagementResolver } from './data-management.resolver';
import { AnalyticsModule } from '../../modules/analytics/analytics.module';
import { ExportModule } from '../../modules/export/export.module';
import { SubmissionModule } from '../../modules/submission/submission.module';
import { RewardModule } from '../../modules/reward/reward.module';
// Import to register GraphQL enum
import '../enums/export-format.enum';

@Module({
  imports: [
    AnalyticsModule,
    ExportModule,
    SubmissionModule,
    RewardModule,
  ],
  providers: [DataManagementResolver],
  exports: [DataManagementResolver],
})
export class DataManagementGraphQLModule {}