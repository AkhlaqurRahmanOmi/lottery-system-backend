import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { ResponseBuilderService } from '../services/response-builder.service';
import { TraceIdService } from '../services/trace-id.service';
import { ValidationError } from '../types';
import { ValidationException } from '../exceptions/validation.exception';

/**
 * Global exception filter that catches all exceptions and transforms them
 * into standardized error responses with trace IDs and proper logging
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly responseBuilder?: ResponseBuilderService,
    private readonly traceIdService?: TraceIdService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      // Safely get trace ID with fallback
      const traceId = this.traceIdService?.getTraceId() || this.generateFallbackTraceId();
      const url = request.url;

      // Determine status code and error details
      const errorInfo = this.getErrorInfo(exception);
      
      // Log the error with trace ID correlation
      this.logError(exception, traceId, url, errorInfo);

      // Build standardized error response
      const errorResponse = this.responseBuilder?.buildErrorResponse(
        errorInfo.code,
        errorInfo.message,
        errorInfo.statusCode,
        traceId,
        url,
        errorInfo.details,
        errorInfo.hint
      ) || this.buildFallbackErrorResponse(errorInfo, traceId, url);

      response.status(errorInfo.statusCode).json(errorResponse);
    } catch (filterError) {
      // Fallback error handling if the filter itself fails
      console.error('GlobalExceptionFilter failed:', filterError);
      console.error('Original exception:', exception);
      
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      
      response.status(500).json({
        success: false,
        statusCode: 500,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: {
          timestamp: new Date().toISOString(),
          traceId: 'fallback-' + Date.now(),
          version: '1.0.0',
        },
      });
    }
  }

  /**
   * Extract error information from different exception types
   */
  private getErrorInfo(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: ValidationError[] | string;
    hint?: string;
  } {
    // Handle custom ValidationException
    if (exception instanceof ValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: exception.getValidationErrors(),
        hint: 'Please check the API documentation for valid input formats'
      };
    }

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const statusCode = exception.getStatus();
      
      // Handle validation errors from class-validator
      if (statusCode === HttpStatus.BAD_REQUEST && typeof response === 'object') {
        const responseObj = response as any;
        if (responseObj.message && Array.isArray(responseObj.message)) {
          return {
            statusCode,
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: this.transformValidationErrors(responseObj.message),
            hint: 'Please check the API documentation for valid input formats'
          };
        }
      }

      return {
        statusCode,
        code: this.getErrorCode(statusCode),
        message: typeof response === 'string' ? response : (response as any).message || exception.message,
        details: typeof response === 'object' ? (response as any).details : undefined,
        hint: this.getErrorHint(statusCode)
      };
    }

    // Handle Prisma errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception as any);
    }

    // Handle validation errors from class-validator directly
    if (Array.isArray(exception) && exception.length > 0 && exception[0] instanceof ClassValidatorError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: this.transformClassValidatorErrors(exception as ClassValidatorError[]),
        hint: 'Please check the API documentation for valid input formats'
      };
    }

    // Handle generic errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? (exception as Error)?.message : undefined,
      hint: 'Please try again later or contact support if the problem persists'
    };
  }

  /**
   * Transform class-validator errors to our ValidationError format
   */
  private transformValidationErrors(errors: any[]): ValidationError[] {
    return errors.map(error => ({
      field: error.property || 'unknown',
      message: error.constraints ? Object.values(error.constraints)[0] as string : error,
      value: error.value,
      constraint: error.constraints ? Object.keys(error.constraints)[0] : undefined
    }));
  }

  /**
   * Transform class-validator ValidationError objects to our format
   */
  private transformClassValidatorErrors(errors: ClassValidatorError[]): ValidationError[] {
    const result: ValidationError[] = [];
    
    const processError = (error: ClassValidatorError, parentPath = '') => {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;
      
      if (error.constraints) {
        Object.entries(error.constraints).forEach(([constraint, message]) => {
          result.push({
            field: fieldPath,
            message,
            value: error.value,
            constraint
          });
        });
      }
      
      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        error.children.forEach(child => processError(child, fieldPath));
      }
    };

    errors.forEach(error => processError(error));
    return result;
  }

  /**
   * Check if the exception is a Prisma error
   */
  private isPrismaError(exception: unknown): exception is { code: string; meta?: any; message?: string } {
    return exception !== null && 
           typeof exception === 'object' && 
           'code' in exception && 
           typeof (exception as any).code === 'string';
  }

  /**
   * Handle Prisma-specific errors
   */
  private handlePrismaError(exception: any): {
    statusCode: number;
    code: string;
    message: string;
    details?: string;
    hint?: string;
  } {
    const prismaCode = exception.code;
    
    switch (prismaCode) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with this value already exists',
          details: `Unique constraint failed on field: ${exception.meta?.target?.join(', ') || 'unknown'}`,
          hint: 'Please use a different value for the specified field(s)'
        };
      
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
          hint: 'Please verify the ID and try again'
        };
      
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Foreign key constraint failed',
          details: exception.meta?.field_name ? `Field: ${exception.meta.field_name}` : undefined,
          hint: 'Please ensure the referenced record exists'
        };
      
      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'INVALID_RELATION',
          message: 'The change would violate a required relation',
          hint: 'Please check the relationships between records'
        };
      
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: process.env.NODE_ENV === 'development' ? exception.message : undefined,
          hint: 'Please try again later or contact support'
        };
    }
  }

  /**
   * Get error code based on HTTP status
   */
  private getErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'METHOD_NOT_ALLOWED';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Get helpful hints based on HTTP status
   */
  private getErrorHint(statusCode: number): string | undefined {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Please check your request parameters and try again';
      case HttpStatus.UNAUTHORIZED:
        return 'Please provide valid authentication credentials';
      case HttpStatus.FORBIDDEN:
        return 'You do not have permission to access this resource';
      case HttpStatus.NOT_FOUND:
        return 'Please verify the URL and resource ID';
      case HttpStatus.METHOD_NOT_ALLOWED:
        return 'Please check the allowed HTTP methods for this endpoint';
      case HttpStatus.CONFLICT:
        return 'The request conflicts with the current state of the resource';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'The request was well-formed but contains semantic errors';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Please wait before making additional requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Please try again later or contact support if the problem persists';
      default:
        return undefined;
    }
  }

  /**
   * Generate fallback trace ID when TraceIdService is not available
   */
  private generateFallbackTraceId(): string {
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build fallback error response when ResponseBuilderService is not available
   */
  private buildFallbackErrorResponse(
    errorInfo: { statusCode: number; code: string; message: string; details?: any; hint?: string },
    traceId: string,
    url: string
  ): any {
    return {
      success: false,
      statusCode: errorInfo.statusCode,
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        details: errorInfo.details,
        hint: errorInfo.hint,
      },
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
        version: '1.0.0',
      },
      links: {
        self: url,
        documentation: '/api/docs',
      },
    };
  }

  /**
   * Log error with trace ID correlation
   */
  private logError(
    exception: unknown,
    traceId: string,
    url: string,
    errorInfo: { statusCode: number; code: string; message: string }
  ): void {
    try {
      const logContext = {
        traceId,
        url,
        statusCode: errorInfo.statusCode,
        errorCode: errorInfo.code,
        timestamp: new Date().toISOString()
      };

      if (errorInfo.statusCode >= 500) {
        // Log server errors as errors
        this.logger.error(`Server Error: ${errorInfo.message}`);
        this.logger.error(`Context: ${JSON.stringify(logContext)}`);
        if (exception instanceof Error) {
          this.logger.error(`Stack: ${exception.stack}`);
        }
      } else if (errorInfo.statusCode >= 400) {
        // Log client errors as warnings
        this.logger.warn(`Client Error: ${errorInfo.message}`);
        this.logger.warn(`Context: ${JSON.stringify(logContext)}`);
      } else {
        // Log other errors as info
        this.logger.log(`Error: ${errorInfo.message}`);
        this.logger.log(`Context: ${JSON.stringify(logContext)}`);
      }
    } catch (logError) {
      // Fallback logging if there's an issue with the logger
      console.error('Failed to log error:', logError);
      console.error('Original exception:', exception);
    }
  }
}