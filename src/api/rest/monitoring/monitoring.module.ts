import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { PerformanceMonitorService } from '../../../shared/services/performance-monitor.service';
import { QueryOptimizerService } from '../../../shared/services/query-optimizer.service';
import { TraceIdService } from '../../../shared/services/trace-id.service';
import { PrismaModule } from '../../../core/config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [
    PerformanceMonitorService,
    QueryOptimizerService,
    TraceIdService,
  ],
  exports: [
    PerformanceMonitorService,
    QueryOptimizerService,
  ],
})
export class MonitoringModule {}