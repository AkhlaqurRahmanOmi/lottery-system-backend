import { Injectable, Logger } from '@nestjs/common';
import { TraceIdService } from './trace-id.service';

/**
 * Performance monitoring service for tracking API performance metrics
 */
@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics = new Map<string, PerformanceMetric[]>();

  constructor(private readonly traceIdService: TraceIdService) {}

  /**
   * Start performance tracking for a request
   */
  startTracking(operation: string, metadata?: Record<string, any>): PerformanceTracker {
    const traceId = this.traceIdService.getTraceId();
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    return {
      operation,
      traceId,
      startTime,
      startMemory,
      metadata: metadata || {},
      end: (additionalMetadata?: Record<string, any>) => {
        this.endTracking(operation, traceId, startTime, startMemory, {
          ...metadata,
          ...additionalMetadata,
        });
      },
    };
  }

  /**
   * End performance tracking and log metrics
   */
  private endTracking(
    operation: string,
    traceId: string,
    startTime: bigint,
    startMemory: NodeJS.MemoryUsage,
    metadata: Record<string, any>,
  ): void {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
    };

    const metric: PerformanceMetric = {
      operation,
      traceId,
      duration,
      memoryDelta,
      timestamp: new Date(),
      metadata,
    };

    // Store metric for aggregation
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(metric);

    // Keep only last 100 metrics per operation to prevent memory leaks
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }

    // Log performance metric
    this.logPerformanceMetric(metric);

    // Log warning for slow operations
    if (duration > 1000) { // More than 1 second
      this.logger.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`, {
        traceId,
        duration,
        metadata,
      });
    }
  }

  /**
   * Log performance metric with structured format
   */
  private logPerformanceMetric(metric: PerformanceMetric): void {
    this.logger.log(`Performance: ${metric.operation}`, {
      traceId: metric.traceId,
      duration: `${metric.duration.toFixed(2)}ms`,
      memoryDelta: {
        rss: `${(metric.memoryDelta.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(metric.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      },
      metadata: metric.metadata,
      timestamp: metric.timestamp.toISOString(),
    });
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string): OperationStats | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    const memoryUsages = metrics.map(m => m.memoryDelta.heapUsed);

    return {
      operation,
      count: metrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        p95: this.calculatePercentile(durations, 95),
        p99: this.calculatePercentile(durations, 99),
      },
      memory: {
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
        avg: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): OperationStats[] {
    const stats: OperationStats[] = [];
    
    for (const operation of this.metrics.keys()) {
      const operationStats = this.getOperationStats(operation);
      if (operationStats) {
        stats.push(operationStats);
      }
    }

    return stats.sort((a, b) => b.duration.avg - a.duration.avg);
  }

  /**
   * Clear metrics for an operation or all operations
   */
  clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
      this.logger.log(`Cleared metrics for operation: ${operation}`);
    } else {
      this.metrics.clear();
      this.logger.log('Cleared all performance metrics');
    }
  }

  /**
   * Calculate percentile for an array of numbers
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Log system resource usage
   */
  logSystemResources(): void {
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.logger.log('System Resources', {
      memory: {
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memory.external / 1024 / 1024).toFixed(2)}MB`,
      },
      cpu: {
        user: `${(cpuUsage.user / 1000).toFixed(2)}ms`,
        system: `${(cpuUsage.system / 1000).toFixed(2)}ms`,
      },
      uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
    });
  }
}

/**
 * Performance tracker interface
 */
export interface PerformanceTracker {
  operation: string;
  traceId: string;
  startTime: bigint;
  startMemory: NodeJS.MemoryUsage;
  metadata: Record<string, any>;
  end: (additionalMetadata?: Record<string, any>) => void;
}

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  operation: string;
  traceId: string;
  duration: number; // in milliseconds
  memoryDelta: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Operation statistics interface
 */
export interface OperationStats {
  operation: string;
  count: number;
  duration: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  memory: {
    min: number;
    max: number;
    avg: number;
  };
  lastUpdated: Date;
}