import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UnitOfWork } from './shared/services/unit-of-work/unit-of-work.service';

import { MonitoringModule } from './api/rest/monitoring/monitoring.module';
import { AuthRestModule } from './api/rest/auth/auth.module';
import { AdminRestModule } from './api/rest/admin/admin.module';
import { CouponRestModule } from './api/rest/coupon/coupon.module';
import { RewardRestModule } from './api/rest/reward/reward.module';
import { SubmissionRestModule } from './api/rest/submission/submission.module';
import { AuthGraphQLModule } from './graphql/auth/auth-graphql.module';
import { AdminGraphQLModule } from './graphql/admin/admin-graphql.module';
import { CouponGraphQLModule } from './graphql/coupon/coupon-graphql.module';
import { RewardGraphQLModule } from './graphql/reward/reward-graphql.module';
import { SubmissionGraphQLModule } from './graphql/submission/submission-graphql.module';
import { PrismaModule } from './core/config/prisma/prisma.module';
import { winstonConfig } from './logger/winston.config';
import { WinstonModule } from 'nest-winston';
import { EnhancedHttpLoggerMiddleware, TraceIdService } from './shared';
import { GlobalResponseInterceptor } from './shared/interceptors/global-response.interceptor';
import { CacheInterceptor } from './shared/interceptors/cache.interceptor';
import { PerformanceMonitorInterceptor } from './shared/interceptors/performance-monitor.interceptor';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { EnhancedValidationPipe } from './shared/pipes/enhanced-validation.pipe';
import { ResponseBuilderService } from './shared/services/response-builder.service';
import { CacheService } from './shared/services/cache.service';
import { PerformanceMonitorService } from './shared/services/performance-monitor.service';
import { QueryOptimizerService } from './shared/services/query-optimizer.service';
import { LoggingConfigService } from './shared/services/logging-config.service';

@Module({
  imports: [
    MonitoringModule,
    AuthRestModule,
    AdminRestModule,
    CouponRestModule,
    RewardRestModule,
    SubmissionRestModule,
    AuthGraphQLModule,
    AdminGraphQLModule,
    CouponGraphQLModule,
    RewardGraphQLModule,
    SubmissionGraphQLModule,
    WinstonModule.forRoot(winstonConfig),
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      installSubscriptionHandlers: true,
      playground: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UnitOfWork,
    TraceIdService,
    ResponseBuilderService,
    CacheService,
    PerformanceMonitorService,
    QueryOptimizerService,
    LoggingConfigService,
    Reflector,
    EnhancedHttpLoggerMiddleware,
    // Global interceptors (order matters - performance monitoring first, then cache, then response transformation)
    // Temporarily disabled for debugging
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: PerformanceMonitorInterceptor,
    // },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (cacheService: CacheService, reflector: Reflector) => {
        return new CacheInterceptor(cacheService, reflector);
      },
      inject: [CacheService, Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (responseBuilder: ResponseBuilderService, traceIdService: TraceIdService, cacheService: CacheService, reflector: Reflector) => {
        return new GlobalResponseInterceptor(responseBuilder, traceIdService, cacheService, reflector);
      },
      inject: [ResponseBuilderService, TraceIdService, CacheService, Reflector],
    },
    // Global filters
    {
      provide: APP_FILTER,
      useFactory: (responseBuilder: ResponseBuilderService, traceIdService: TraceIdService) => {
        return new GlobalExceptionFilter(responseBuilder, traceIdService);
      },
      inject: [ResponseBuilderService, TraceIdService],
    },
    // Global validation pipe with custom error handling
    {
      provide: APP_PIPE,
      useClass: EnhancedValidationPipe,
    },
  ],
  exports: [
    UnitOfWork,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EnhancedHttpLoggerMiddleware).forRoutes('*'); // Apply to all routes
  }
}
