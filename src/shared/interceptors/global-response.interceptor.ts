import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { ResponseBuilderService } from '../services/response-builder.service';
import { TraceIdService } from '../services/trace-id.service';
import { CacheService } from '../services/cache.service';
import { ApiResponse, HATEOASLinks, PaginationMeta } from '../types';

/**
 * Metadata key for excluding endpoints from global response transformation
 */
export const EXCLUDE_GLOBAL_RESPONSE_KEY = 'exclude_global_response';

/**
 * Decorator to exclude specific endpoints from global response transformation
 */
export const ExcludeGlobalResponse = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(EXCLUDE_GLOBAL_RESPONSE_KEY, true, descriptor?.value || target);
  };
};

/**
 * Global interceptor that transforms all responses to standardized format
 * Excludes GraphQL endpoints from REST-specific transformations
 */
@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly responseBuilder: ResponseBuilderService,
    private readonly traceIdService: TraceIdService,
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip transformation if explicitly excluded
    if (this.shouldExcludeTransformation(context)) {
      return next.handle();
    }

    // Skip transformation for GraphQL endpoints
    if (this.isGraphQLEndpoint(request)) {
      return next.handle();
    }

    // Skip transformation for already standardized responses
    return next.handle().pipe(
      map((data) => {
        // Skip transformation for null responses (like 304 Not Modified)
        if (data === null) {
          return data;
        }

        // Skip transformation if response is already in standard format
        if (this.isStandardizedResponse(data)) {
          return data;
        }

        // Skip transformation for error responses (handled by exception filter)
        if (this.isErrorResponse(data, response)) {
          return data;
        }

        // Transform response to standard format
        return this.transformToStandardResponse(data, request, response);
      })
    );
  }

  /**
   * Check if transformation should be excluded based on metadata
   */
  private shouldExcludeTransformation(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check method-level exclusion
    const methodExcluded = this.reflector.get<boolean>(
      EXCLUDE_GLOBAL_RESPONSE_KEY,
      handler
    );

    // Check class-level exclusion
    const classExcluded = this.reflector.get<boolean>(
      EXCLUDE_GLOBAL_RESPONSE_KEY,
      classRef
    );

    return methodExcluded || classExcluded;
  }

  /**
   * Check if the request is for a GraphQL endpoint
   */
  private isGraphQLEndpoint(request: Request): boolean {
    return request.url.startsWith('/graphql') || 
           request.headers['content-type']?.includes('application/graphql') ||
           (request.body && typeof request.body === 'object' && 'query' in request.body);
  }

  /**
   * Check if response is already in standardized format
   */
  private isStandardizedResponse(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           'success' in data && 
           'statusCode' in data && 
           'meta' in data && 
           'links' in data;
  }

  /**
   * Check if response is an error response
   */
  private isErrorResponse(data: any, response: Response): boolean {
    return response.statusCode >= 400 || 
           (data && typeof data === 'object' && data.statusCode >= 400);
  }

  /**
   * Transform response to standard format with HATEOAS links
   */
  private transformToStandardResponse(
    data: any,
    request: Request,
    response: Response
  ): ApiResponse<any> {
    const traceId = this.traceIdService.getTraceId();
    const statusCode = response.statusCode;
    
    // Generate HATEOAS links
    const links = this.generateHATEOASLinks(data, request);
    
    // Extract pagination metadata if present
    const pagination = this.extractPaginationMeta(data);
    
    // Determine response message
    const message = this.getResponseMessage(request.method, statusCode);
    
    // Extract actual data (remove pagination metadata from data if present)
    const responseData = this.extractResponseData(data);

    return this.responseBuilder.buildSuccessResponse(
      responseData,
      message,
      statusCode,
      traceId,
      links,
      pagination
    );
  }

  /**
   * Generate HATEOAS links based on request context and data
   */
  private generateHATEOASLinks(data: any, request: Request): HATEOASLinks {
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    const resourcePath = request.path;
    
    // Extract resource ID from URL path (e.g., /api/v1/products/123 -> 123)
    const resourceIdMatch = resourcePath.match(/\/(\d+)$/);
    const resourceId = resourceIdMatch ? resourceIdMatch[1] : undefined;
    
    // Determine if this is a collection or individual resource
    const isCollection = Array.isArray(data) || 
                        (data && typeof data === 'object' && 'items' in data) ||
                        !resourceId;

    // Extract pagination info for collection endpoints
    let paginationContext = {};
    if (isCollection && data && typeof data === 'object') {
      paginationContext = {
        currentPage: data.currentPage || parseInt(request.query.page as string) || 1,
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrev: data.hasPrev,
        queryParams: request.query
      };
    }

    // Build link context
    const linkContext = {
      baseUrl: baseUrl + resourcePath,
      resourceId,
      resourceState: this.extractResourceState(data),
      action: request.method.toLowerCase(),
      ...paginationContext
    };

    return this.responseBuilder.generateHATEOASLinks(linkContext);
  }

  /**
   * Extract resource state for contextual link generation
   */
  private extractResourceState(data: any): Record<string, any> | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    // For individual resources, return the resource data
    if (!Array.isArray(data) && !('items' in data)) {
      return data;
    }

    // For collections, return undefined (no specific resource state)
    return undefined;
  }

  /**
   * Extract pagination metadata from response data
   */
  private extractPaginationMeta(data: any): PaginationMeta | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    // Check if data has pagination properties
    if ('currentPage' in data && 'totalPages' in data && 'totalItems' in data) {
      return {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        itemsPerPage: data.itemsPerPage || data.limit,
        hasNext: data.hasNext,
        hasPrev: data.hasPrev
      };
    }

    return undefined;
  }

  /**
   * Extract actual response data, removing pagination metadata
   */
  private extractResponseData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // If data has 'items' property, it's a paginated collection
    if ('items' in data) {
      return data.items;
    }

    // If data has pagination properties, remove them and return the rest
    if ('currentPage' in data || 'totalPages' in data) {
      const { 
        currentPage, 
        totalPages, 
        totalItems, 
        itemsPerPage, 
        hasNext, 
        hasPrev, 
        limit,
        ...actualData 
      } = data;
      
      // If only pagination properties were present, return empty array
      if (Object.keys(actualData).length === 0) {
        return [];
      }
      
      return actualData;
    }

    return data;
  }

  /**
   * Get appropriate response message based on HTTP method and status code
   */
  private getResponseMessage(method: string, statusCode: number): string {
    const methodMessages: Record<string, string> = {
      GET: 'Resource retrieved successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully'
    };

    // Handle specific status codes
    if (statusCode === 201) {
      return 'Resource created successfully';
    }
    if (statusCode === 204) {
      return 'Operation completed successfully';
    }

    return methodMessages[method.toUpperCase()] || 'Operation completed successfully';
  }
}