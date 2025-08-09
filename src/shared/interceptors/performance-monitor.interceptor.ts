import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

/**
 * Interceptor to monitor HTTP request performance
 */
@Injectable()
export class PerformanceMonitorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceMonitorInterceptor.name);

  constructor(private readonly performanceMonitor?: PerformanceMonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || 'unknown';
    const contentLength = request.get('Content-Length') || '0';
    
    const operation = `HTTP_${method}_${this.sanitizeUrl(url)}`;
    
    const tracker = this.performanceMonitor?.startTracking(operation, {
      method,
      url,
      userAgent,
      contentLength: parseInt(contentLength, 10),
      ip: request.ip,
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
    });

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        // End performance tracking
        tracker?.end({
          statusCode,
          responseTime,
          success: true,
          responseSize: this.estimateResponseSize(data),
        });

        // Log request completion
        this.logRequest(method, url, statusCode, responseTime, tracker?.traceId || 'no-trace');
        
        // Log slow requests
        if (responseTime > 1000) {
          this.logger.warn(`Slow HTTP request: ${method} ${url}`, {
            traceId: tracker?.traceId || 'no-trace',
            responseTime: `${responseTime}ms`,
            statusCode,
          });
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;
        
        // End performance tracking for errors
        tracker?.end({
          statusCode,
          responseTime,
          success: false,
          error: error?.message || error?.toString() || 'Unknown error',
        });

        // Log error request
        this.logRequest(method, url, statusCode, responseTime, tracker?.traceId || 'no-trace', error?.message || error?.toString() || 'Unknown error');
        
        throw error;
      }),
    );
  }

  /**
   * Sanitize URL for operation naming (remove dynamic segments)
   */
  private sanitizeUrl(url: string): string {
    return url
      .split('?')[0] // Remove query parameters
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs with :id
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs with :uuid
      .replace(/\/[a-zA-Z0-9-_]+\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i, '/:file') // Replace file names
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/\/$/, '') || '/'; // Remove trailing slash
  }

  /**
   * Estimate response size in bytes
   */
  private estimateResponseSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Log HTTP request with structured format
   */
  private logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    traceId: string,
    error?: string,
  ): void {
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    
    const logData = {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      traceId,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      (logData as any).error = error;
    }

    this.logger[logLevel](message, logData);
  }
}

/**
 * Performance monitoring middleware for Express
 */
export function performanceMonitoringMiddleware() {
  const logger = new Logger('PerformanceMiddleware');
  
  return (req: Request, res: Response, next: Function) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Override res.send to capture response data
    res.send = function (data: any) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Log performance metrics
      logger.log(`${req.method} ${req.url} ${statusCode} - ${responseTime}ms`, {
        method: req.method,
        url: req.url,
        statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
}