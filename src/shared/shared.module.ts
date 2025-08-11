import { Module } from '@nestjs/common';
import { 
  ResponseBuilderService, 
  TraceIdService, 
  CacheService, 
  PerformanceMonitorService, 
  QueryOptimizerService,
  EncryptionService 
} from './services';

@Module({
  providers: [
    ResponseBuilderService,
    TraceIdService,
    CacheService,
    PerformanceMonitorService,
    QueryOptimizerService,
    EncryptionService,
  ],
  exports: [
    ResponseBuilderService,
    TraceIdService,
    CacheService,
    PerformanceMonitorService,
    QueryOptimizerService,
    EncryptionService,
  ],
})
export class SharedModule {}