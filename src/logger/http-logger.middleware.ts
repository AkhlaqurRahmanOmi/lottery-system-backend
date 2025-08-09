// src/logger/http-logger.middleware.ts
import { Injectable, NestMiddleware, Inject, Logger as NestLogger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly excludedPaths = [
    '/graphql/schema.gql',
    '/favicon.ico',
    '/playground',
    // Removed '/graphql' from excluded paths to ensure we log actual operations
  ];

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: NestLogger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body } = req;
    
    // Skip logging for excluded paths and introspection queries
    if (this.shouldSkipLogging(originalUrl, body)) {
      return next();
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      
      // For GraphQL operations, log the operation name if available
      const operationName = body?.operationName || 'anonymous';
      const operationType = this.getOperationType(body);
      const logMessage = `[GraphQL ${operationType}] ${operationName} - IP: ${ip}, Method: ${method}, URL: ${originalUrl}, Status: ${statusCode}, Response Time: ${responseTime}ms`;
      
      this.logger.log(logMessage);
    });

    next();
  }

  private shouldSkipLogging(url: string, body: any): boolean {
    // Skip if it's an excluded path
    if (this.excludedPaths.some(path => url.startsWith(path))) {
      return true;
    }

    // Skip introspection queries
    if (this.isIntrospectionQuery(body)) {
      return true;
    }

    // Don't skip actual GraphQL operations
    return false;
  }

  private isIntrospectionQuery(body: any): boolean {
    // Check if it's an introspection query
    return body?.operationName === 'IntrospectionQuery' || 
           (body?.query && 
            (body.query.includes('__schema') || 
             body.query.includes('__type') ||
             body.query.trim().startsWith('query IntrospectionQuery')));
  }

  private getOperationType(body: any): string {
    if (!body?.query) return 'Unknown';
    
    const query = body.query.trim();
    if (query.startsWith('mutation')) return 'Mutation';
    if (query.startsWith('query')) return 'Query';
    if (query.startsWith('subscription')) return 'Subscription';
    return 'Operation';
  }
}
