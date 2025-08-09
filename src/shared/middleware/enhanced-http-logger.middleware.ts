import { Injectable, NestMiddleware, Inject, Logger as NestLogger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TraceIdService } from '../services/trace-id.service';

/**
 * Performance metrics interface for request tracking
 */
interface PerformanceMetrics {
  requestId: string;
  traceId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  startTime: number;
  endTime?: number;
  responseTime?: number;
  statusCode?: number;
  contentLength?: number;
  errorCount?: number;
  operationType?: string;
  operationName?: string;
}

/**
 * Error rate tracking interface
 */
interface ErrorRateMetrics {
  totalRequests: number;
  errorRequests: number;
  errorRate: number;
  timeWindow: string;
}

/**
 * Enhanced HTTP Logger Middleware with trace ID support, performance metrics,
 * and error rate monitoring
 */
@Injectable()
export class EnhancedHttpLoggerMiddleware implements NestMiddleware {
  private readonly excludedPaths = [
    '/graphql/schema.gql',
    '/favicon.ico',
    '/playground',
    '/health',
    '/metrics'
  ];

  // In-memory storage for performance metrics (in production, use Redis or similar)
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private errorRateTracker: Map<string, { requests: number; errors: number; timestamp: number }> = new Map();
  
  // Error rate monitoring window (5 minutes)
  private readonly ERROR_RATE_WINDOW = 5 * 60 * 1000;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: NestLogger,
    private readonly traceIdService: TraceIdService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body, headers } = req;
    
    // Skip logging for excluded paths and introspection queries
    if (this.shouldSkipLogging(originalUrl, body)) {
      return next();
    }

    // Extract or generate trace ID
    const traceId = this.traceIdService.extractOrGenerateTraceId(headers);
    
    // Add trace ID to request for downstream use
    (req as any).traceId = traceId;

    // Generate unique request ID
    const requestId = this.generateRequestId();
    (req as any).requestId = requestId;

    const ip = this.extractClientIp(req);
    const userAgent = headers['user-agent'];
    const startTime = Date.now();

    // Initialize performance metrics
    const metrics: PerformanceMetrics = {
      requestId,
      traceId,
      method,
      url: originalUrl,
      userAgent,
      ip,
      startTime
    };

    // For GraphQL operations, extract operation details
    if (this.isGraphQLRequest(originalUrl, body)) {
      metrics.operationType = this.getOperationType(body);
      metrics.operationName = body?.operationName || 'anonymous';
    }

    this.performanceMetrics.set(requestId, metrics);

    // Update request count for error rate tracking
    this.updateRequestCount(ip);

    // Log incoming request with trace ID
    this.logIncomingRequest(metrics);

    // Handle response completion
    res.on('finish', () => {
      this.handleResponseComplete(requestId, res);
    });

    // Handle response close (for aborted requests)
    res.on('close', () => {
      if (!res.headersSent) {
        this.handleResponseAborted(requestId);
      }
    });

    // Handle errors
    res.on('error', (error) => {
      this.handleResponseError(requestId, error);
    });

    next();
  }

  /**
   * Check if logging should be skipped for this request
   */
  private shouldSkipLogging(url: string, body: any): boolean {
    // Skip if it's an excluded path
    if (this.excludedPaths.some(path => url.startsWith(path))) {
      return true;
    }

    // Skip introspection queries
    if (this.isIntrospectionQuery(body)) {
      return true;
    }

    return false;
  }

  /**
   * Check if request is a GraphQL introspection query
   */
  private isIntrospectionQuery(body: any): boolean {
    return body?.operationName === 'IntrospectionQuery' || 
           (body?.query && 
            (body.query.includes('__schema') || 
             body.query.includes('__type') ||
             body.query.trim().startsWith('query IntrospectionQuery')));
  }

  /**
   * Check if request is a GraphQL request
   */
  private isGraphQLRequest(url: string, body: any): boolean {
    return url.startsWith('/graphql') || (body && typeof body === 'object' && 'query' in body);
  }

  /**
   * Extract GraphQL operation type from request body
   */
  private getOperationType(body: any): string {
    if (!body?.query) return 'Unknown';
    
    const query = body.query.trim();
    if (query.startsWith('mutation')) return 'Mutation';
    if (query.startsWith('query')) return 'Query';
    if (query.startsWith('subscription')) return 'Subscription';
    return 'Operation';
  }

  /**
   * Extract client IP address from request
   */
  private extractClientIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           (req.headers['x-real-ip'] as string) ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log incoming request with trace ID and performance context
   */
  private logIncomingRequest(metrics: PerformanceMetrics): void {
    const logContext = {
      traceId: metrics.traceId,
      requestId: metrics.requestId,
      method: metrics.method,
      url: metrics.url,
      ip: metrics.ip,
      userAgent: metrics.userAgent,
      timestamp: new Date(metrics.startTime).toISOString()
    };

    if (metrics.operationType) {
      logContext['operationType'] = metrics.operationType;
      logContext['operationName'] = metrics.operationName;
    }

    this.logger.log(`[INCOMING] ${metrics.method} ${metrics.url}`, 'HttpLogger', logContext);
  }

  /**
   * Handle response completion and log performance metrics
   */
  private handleResponseComplete(requestId: string, res: Response): void {
    const metrics = this.performanceMetrics.get(requestId);
    if (!metrics) return;

    const endTime = Date.now();
    const responseTime = endTime - metrics.startTime;
    const statusCode = res.statusCode;
    const contentLength = res.get('content-length');

    // Update metrics
    metrics.endTime = endTime;
    metrics.responseTime = responseTime;
    metrics.statusCode = statusCode;
    metrics.contentLength = contentLength ? parseInt(contentLength) : undefined;

    // Update error count for error rate tracking
    if (statusCode >= 400) {
      this.updateErrorCount(metrics.ip);
      metrics.errorCount = 1;
    }

    // Log response completion
    this.logResponseComplete(metrics);

    // Log performance metrics
    this.logPerformanceMetrics(metrics);

    // Log error rate if applicable
    if (statusCode >= 400) {
      this.logErrorRate(metrics.ip);
    }

    // Clean up metrics (keep for a short time for correlation)
    setTimeout(() => {
      this.performanceMetrics.delete(requestId);
    }, 60000); // Keep for 1 minute
  }

  /**
   * Handle aborted requests
   */
  private handleResponseAborted(requestId: string): void {
    const metrics = this.performanceMetrics.get(requestId);
    if (!metrics) return;

    const endTime = Date.now();
    const responseTime = endTime - metrics.startTime;

    const logContext = {
      traceId: metrics.traceId,
      requestId: metrics.requestId,
      method: metrics.method,
      url: metrics.url,
      ip: metrics.ip,
      responseTime,
      status: 'ABORTED'
    };

    this.logger.warn(`[ABORTED] ${metrics.method} ${metrics.url} - Response Time: ${responseTime}ms`, 'HttpLogger', logContext);

    // Clean up
    this.performanceMetrics.delete(requestId);
  }

  /**
   * Handle response errors
   */
  private handleResponseError(requestId: string, error: Error): void {
    const metrics = this.performanceMetrics.get(requestId);
    if (!metrics) return;

    const logContext = {
      traceId: metrics.traceId,
      requestId: metrics.requestId,
      method: metrics.method,
      url: metrics.url,
      ip: metrics.ip,
      error: error.message,
      stack: error.stack
    };

    this.logger.error(`[ERROR] ${metrics.method} ${metrics.url} - ${error.message}`, 'HttpLogger', logContext);

    // Update error count
    this.updateErrorCount(metrics.ip);
  }

  /**
   * Log response completion with correlation
   */
  private logResponseComplete(metrics: PerformanceMetrics): void {
    const logContext = {
      traceId: metrics.traceId,
      requestId: metrics.requestId,
      method: metrics.method,
      url: metrics.url,
      ip: metrics.ip,
      statusCode: metrics.statusCode,
      responseTime: metrics.responseTime,
      contentLength: metrics.contentLength,
      timestamp: new Date(metrics.endTime!).toISOString()
    };

    if (metrics.operationType) {
      logContext['operationType'] = metrics.operationType;
      logContext['operationName'] = metrics.operationName;
    }

    const statusLevel = metrics.statusCode! >= 400 ? 'ERROR' : 'SUCCESS';
    const message = `[${statusLevel}] ${metrics.method} ${metrics.url} - ${metrics.statusCode} - ${metrics.responseTime}ms`;

    if (metrics.statusCode! >= 400) {
      this.logger.error(message, 'HttpLogger', logContext);
    } else {
      this.logger.log(message, 'HttpLogger', logContext);
    }
  }

  /**
   * Log detailed performance metrics
   */
  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    const performanceContext = {
      traceId: metrics.traceId,
      requestId: metrics.requestId,
      metrics: {
        responseTime: metrics.responseTime,
        statusCode: metrics.statusCode,
        contentLength: metrics.contentLength,
        method: metrics.method,
        url: metrics.url,
        timestamp: new Date(metrics.endTime!).toISOString()
      }
    };

    // Log performance warning for slow requests (>1000ms)
    if (metrics.responseTime! > 1000) {
      this.logger.warn(`[PERFORMANCE] Slow request detected - ${metrics.responseTime}ms`, 'HttpLogger', performanceContext);
    }

    // Log performance info for monitoring
    this.logger.debug(`[METRICS] Request performance data`, 'HttpLogger', performanceContext);
  }

  /**
   * Update request count for error rate tracking
   */
  private updateRequestCount(ip: string): void {
    const now = Date.now();
    const key = this.getErrorRateKey(ip, now);
    
    const existing = this.errorRateTracker.get(key) || { requests: 0, errors: 0, timestamp: now };
    existing.requests += 1;
    this.errorRateTracker.set(key, existing);

    // Clean up old entries
    this.cleanupErrorRateTracker(now);
  }

  /**
   * Update error count for error rate tracking
   */
  private updateErrorCount(ip: string): void {
    const now = Date.now();
    const key = this.getErrorRateKey(ip, now);
    
    const existing = this.errorRateTracker.get(key) || { requests: 0, errors: 0, timestamp: now };
    existing.errors += 1;
    this.errorRateTracker.set(key, existing);
  }

  /**
   * Log error rate metrics
   */
  private logErrorRate(ip: string): void {
    const now = Date.now();
    const key = this.getErrorRateKey(ip, now);
    const data = this.errorRateTracker.get(key);
    
    if (!data || data.requests === 0) return;

    const errorRate = (data.errors / data.requests) * 100;
    
    // Log warning if error rate is high (>10%)
    if (errorRate > 10) {
      const errorRateContext = {
        ip,
        errorRate: errorRate.toFixed(2),
        totalRequests: data.requests,
        errorRequests: data.errors,
        timeWindow: '5min',
        timestamp: new Date(now).toISOString()
      };

      this.logger.warn(`[ERROR_RATE] High error rate detected: ${errorRate.toFixed(2)}%`, 'HttpLogger', errorRateContext);
    }
  }

  /**
   * Generate error rate tracking key
   */
  private getErrorRateKey(ip: string, timestamp: number): string {
    const windowStart = Math.floor(timestamp / this.ERROR_RATE_WINDOW) * this.ERROR_RATE_WINDOW;
    return `${ip}_${windowStart}`;
  }

  /**
   * Clean up old error rate tracking entries
   */
  private cleanupErrorRateTracker(now: number): void {
    const cutoff = now - this.ERROR_RATE_WINDOW * 2; // Keep 2 windows worth of data
    
    for (const [key, data] of this.errorRateTracker.entries()) {
      if (data.timestamp < cutoff) {
        this.errorRateTracker.delete(key);
      }
    }
  }
}