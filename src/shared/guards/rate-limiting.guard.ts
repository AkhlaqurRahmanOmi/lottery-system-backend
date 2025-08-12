import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
  message?: string; // Custom error message
}

/**
 * Metadata key for rate limiting configuration
 */
export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Decorator to configure rate limiting for specific endpoints
 */
export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor?.value || target);
  };
};

/**
 * In-memory store for rate limiting (in production, use Redis)
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limiting guard to prevent abuse and DoS attacks
 * Requirements: 10.3, 10.4
 */
@Injectable()
export class RateLimitingGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitingGuard.name);
  private readonly store = new Map<string, RateLimitEntry>();

  // Default rate limit configurations
  private readonly defaultConfigs = {
    // Very strict for authentication endpoints
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
    
    // Strict for submission endpoints
    submission: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
    
    // Moderate for admin endpoints
    admin: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
    
    // Lenient for read-only endpoints
    readonly: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
    
    // Default for other endpoints
    default: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  };

  constructor(private readonly reflector: Reflector) {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Get rate limit configuration from metadata
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
      handler,
      classRef,
    ]);

    if (!config) {
      // No rate limiting configured for this endpoint
      return true;
    }

    const key = this.generateKey(request, config);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = this.store.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.store.set(key, entry);
    }

    // Check if request should be counted
    const shouldCount = this.shouldCountRequest(request, config);
    
    if (shouldCount) {
      entry.count++;
    }

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      this.logger.warn(`Rate limit exceeded for key: ${key}`, {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        url: request.url,
        method: request.method,
        count: entry.count,
        limit: config.maxRequests,
        resetIn: resetTimeSeconds,
      });

      throw new HttpException(
        {
          message: config.message || 'Too many requests, please try again later',
          error: 'Rate Limit Exceeded',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: resetTimeSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers to response
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    return true;
  }

  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(request: Request, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    // Default key generation based on IP and endpoint
    const ip = this.getClientIp(request);
    const endpoint = `${request.method}:${request.route?.path || request.url}`;
    
    return `${ip}:${endpoint}`;
  }

  /**
   * Get client IP address with proxy support
   */
  private getClientIp(request: Request): string {
    const forwarded = request.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIp = request.get('X-Real-IP');
    if (realIp) {
      return realIp;
    }
    
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  /**
   * Determine if request should be counted towards rate limit
   */
  private shouldCountRequest(request: Request, config: RateLimitConfig): boolean {
    // Always count by default
    return true;
  }

  /**
   * Clean up expired entries from memory store
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Get current rate limit status for a key
   */
  getRateLimitStatus(key: string): { count: number; resetTime: number; remaining: number } | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, entry.resetTime - Date.now()),
    };
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  resetRateLimit(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Get all active rate limit entries (admin function)
   */
  getAllRateLimits(): Array<{ key: string; count: number; resetTime: number }> {
    const results: Array<{ key: string; count: number; resetTime: number }> = [];
    
    for (const [key, entry] of this.store.entries()) {
      results.push({
        key,
        count: entry.count,
        resetTime: entry.resetTime,
      });
    }
    
    return results;
  }
}

/**
 * Predefined rate limit decorators for common use cases
 */
export const AuthRateLimit = () => RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 });
export const SubmissionRateLimit = () => RateLimit({ windowMs: 60 * 1000, maxRequests: 10 });
export const AdminRateLimit = () => RateLimit({ windowMs: 60 * 1000, maxRequests: 100 });
export const ReadOnlyRateLimit = () => RateLimit({ windowMs: 60 * 1000, maxRequests: 1000 });
export const DefaultRateLimit = () => RateLimit({ windowMs: 60 * 1000, maxRequests: 60 });