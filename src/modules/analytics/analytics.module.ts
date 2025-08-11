import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';

@Module({
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}