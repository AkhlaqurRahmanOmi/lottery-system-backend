import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CacheService, CacheOptions } from '../services/cache.service';
import { Reflector } from '@nestjs/core';

/**
 * Cache configuration metadata key
 */
export const CACHE_CONFIG_KEY = 'cache_config';

/**
 * Cache configuration decorator options
 */
export interface CacheConfig {
  resourceType?: 'public' | 'private' | 'sensitive';
  maxAge?: number;
  isPublic?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  etagWeak?: boolean;
}

/**
 * Decorator to configure caching for specific endpoints
 */
export const CacheConfig = (config: CacheConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_CONFIG_KEY, config, descriptor?.value || target);
  };
};

/**
 * Interceptor that automatically handles caching headers and conditional requests
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if this is a GraphQL context by trying to get HTTP context
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const response = context.switchToHttp().getResponse<Response>();

      // Skip caching for non-GET requests by default
      if (!request || !request.method || request.method !== 'GET') {
        return next.handle();
      }

      // Continue with caching logic for HTTP requests
      return this.handleHttpCaching(context, next, request, response);
    } catch (error) {
      // If we can't get HTTP context, it's likely a GraphQL request
      // Skip caching for GraphQL requests for now
      return next.handle();
    }
  }

  private handleHttpCaching(context: ExecutionContext, next: CallHandler, request: Request, response: Response): Observable<any> {

    // Get cache configuration from decorator or use defaults
    const cacheConfig = this.getCacheConfig(context);

    // Skip caching if explicitly disabled (but not for resourceType configurations)
    if (cacheConfig.noStore && cacheConfig.noCache && !cacheConfig.resourceType) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Skip caching for error responses (check both status code and error data)
        if (response.statusCode >= 400 || (data && data.statusCode >= 400)) {
          return data;
        }

        // Generate cache options
        const cacheOptions = this.buildCacheOptions(cacheConfig);

        // Don't skip here - let the cache service handle the no-cache/no-store logic

        // Generate cache headers
        const cacheHeaders = this.cacheService.generateCacheHeaders(
          data,
          cacheOptions,
          { weak: cacheConfig.etagWeak }
        );

        // Check for conditional request
        const ifNoneMatch = request.headers['if-none-match'] as string;
        const serverETag = cacheHeaders['ETag'];

        if (serverETag && this.cacheService.shouldReturn304(ifNoneMatch, serverETag)) {
          // Set cache headers for 304 response
          this.setCacheHeaders(response, cacheHeaders);
          response.status(HttpStatus.NOT_MODIFIED);
          return null; // No body for 304 responses
        }

        // Set cache headers for successful response
        this.setCacheHeaders(response, cacheHeaders);

        return data;
      })
    );
  }

  /**
   * Get cache configuration from decorator metadata
   */
  private getCacheConfig(context: ExecutionContext): CacheConfig {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Get configuration from method decorator first, then class decorator
    const methodConfig = this.reflector.get<CacheConfig>(CACHE_CONFIG_KEY, handler);
    const classConfig = this.reflector.get<CacheConfig>(CACHE_CONFIG_KEY, classRef);

    // Merge configurations with method taking precedence
    const config: CacheConfig = {
      ...classConfig,
      ...methodConfig,
    };

    // Set default resourceType only if not explicitly configured
    if (!config.resourceType && !config.noCache && !config.noStore) {
      config.resourceType = 'public';
    }

    return config;
  }

  /**
   * Build cache options from configuration
   */
  private buildCacheOptions(config: CacheConfig): CacheOptions {
    // If resourceType is specified, use predefined options
    if (config.resourceType) {
      const baseOptions = this.cacheService.getCacheOptionsForResource(config.resourceType);

      // Override with specific configuration
      return {
        ...baseOptions,
        ...(config.maxAge !== undefined && { maxAge: config.maxAge }),
        ...(config.isPublic !== undefined && { isPublic: config.isPublic }),
        ...(config.noCache !== undefined && { noCache: config.noCache }),
        ...(config.noStore !== undefined && { noStore: config.noStore }),
        ...(config.mustRevalidate !== undefined && { mustRevalidate: config.mustRevalidate }),
      };
    }

    // Build options from individual configuration properties
    return {
      maxAge: config.maxAge,
      isPublic: config.isPublic,
      noCache: config.noCache,
      noStore: config.noStore,
      mustRevalidate: config.mustRevalidate,
    };
  }

  /**
   * Set cache headers on the response
   */
  private setCacheHeaders(response: Response, headers: Record<string, string | undefined>): void {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.setHeader(key, value);
      }
    });
  }
}

/**
 * Method decorator for configuring cache settings
 */
export function Cache(config: CacheConfig = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_CONFIG_KEY, config, descriptor.value);
    return descriptor;
  };
}

/**
 * Class decorator for configuring default cache settings
 */
export function CacheClass(config: CacheConfig = {}) {
  return (target: any) => {
    Reflect.defineMetadata(CACHE_CONFIG_KEY, config, target);
    return target;
  };
}