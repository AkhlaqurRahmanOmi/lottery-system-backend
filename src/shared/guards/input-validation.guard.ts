import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { SqlInjectionPreventionService } from '../services/sql-injection-prevention.service';

/**
 * Metadata key for validation configuration
 */
export const VALIDATION_CONFIG_KEY = 'validation_config';

/**
 * Validation configuration interface
 */
export interface ValidationConfig {
  skipXssCheck?: boolean;
  skipSqlInjectionCheck?: boolean;
  allowedFields?: string[];
  maxFieldLength?: number;
  context?: 'strict' | 'moderate' | 'lenient';
}

/**
 * Decorator to configure validation for specific endpoints
 */
export const ValidationConfig = (config: ValidationConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(VALIDATION_CONFIG_KEY, config, descriptor?.value || target);
  };
};

/**
 * Input validation guard that performs comprehensive security checks
 * Requirements: 10.2, 10.3, 10.4, 10.6
 */
@Injectable()
export class InputValidationGuard implements CanActivate {
  private readonly logger = new Logger(InputValidationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly sanitizationService: InputSanitizationService,
    private readonly sqlInjectionService: SqlInjectionPreventionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Get validation configuration from metadata
    const config = this.reflector.getAllAndOverride<ValidationConfig>(VALIDATION_CONFIG_KEY, [
      handler,
      classRef,
    ]) || {};

    try {
      // Validate request body
      if (request.body && Object.keys(request.body).length > 0) {
        await this.validateRequestData(request.body, 'body', config);
      }

      // Validate query parameters
      if (request.query && Object.keys(request.query).length > 0) {
        await this.validateRequestData(request.query, 'query', config);
      }

      // Validate route parameters
      if (request.params && Object.keys(request.params).length > 0) {
        await this.validateRequestData(request.params, 'params', config);
      }

      // Validate headers (only specific ones that might contain user input)
      this.validateHeaders(request.headers, config);

      return true;
    } catch (error) {
      this.logger.warn(`Input validation failed: ${error.message}`, {
        url: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
      });
      throw error;
    }
  }

  /**
   * Validate request data (body, query, params)
   */
  private async validateRequestData(
    data: any,
    dataType: 'body' | 'query' | 'params',
    config: ValidationConfig,
  ): Promise<void> {
    if (!data || typeof data !== 'object') return;

    const context = config.context || 'moderate';
    const maxFieldLength = config.maxFieldLength || 10000;

    for (const [key, value] of Object.entries(data)) {
      // Check if field is allowed (if allowedFields is specified)
      if (config.allowedFields && !config.allowedFields.includes(key)) {
        throw new BadRequestException(`Field '${key}' is not allowed in ${dataType}`);
      }

      // Validate field value
      await this.validateFieldValue(key, value, dataType, config, maxFieldLength, context);
    }
  }

  /**
   * Validate individual field value
   */
  private async validateFieldValue(
    fieldName: string,
    value: any,
    dataType: string,
    config: ValidationConfig,
    maxFieldLength: number,
    context: 'strict' | 'moderate' | 'lenient',
  ): Promise<void> {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      // Check field length
      if (value.length > maxFieldLength) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} exceeds maximum length of ${maxFieldLength} characters`
        );
      }

      // Check for XSS patterns
      if (!config.skipXssCheck && this.sanitizationService.containsXSS(value)) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains potentially dangerous content`
        );
      }

      // Check for SQL injection patterns
      if (!config.skipSqlInjectionCheck && this.sqlInjectionService.containsSqlInjection(value, context)) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains potentially malicious patterns`
        );
      }

      // Check for null bytes and control characters
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains invalid control characters`
        );
      }

      // Check for extremely long lines (potential DoS)
      const lines = value.split('\n');
      if (lines.some(line => line.length > 5000)) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains excessively long lines`
        );
      }

    } else if (Array.isArray(value)) {
      // Validate array elements
      if (value.length > 1000) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains too many elements (max: 1000)`
        );
      }

      for (let i = 0; i < value.length; i++) {
        await this.validateFieldValue(`${fieldName}[${i}]`, value[i], dataType, config, maxFieldLength, context);
      }

    } else if (typeof value === 'object') {
      // Validate nested objects
      const nestedKeys = Object.keys(value);
      if (nestedKeys.length > 100) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains too many nested properties (max: 100)`
        );
      }

      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        await this.validateFieldValue(`${fieldName}.${nestedKey}`, nestedValue, dataType, config, maxFieldLength, context);
      }

    } else if (typeof value === 'number') {
      // Validate numeric values
      if (!Number.isFinite(value)) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains invalid numeric value`
        );
      }

      // Check for extremely large numbers (potential DoS)
      if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
        throw new BadRequestException(
          `Field '${fieldName}' in ${dataType} contains number that is too large`
        );
      }
    }
  }

  /**
   * Validate specific headers that might contain user input
   */
  private validateHeaders(headers: any, config: ValidationConfig): void {
    const headersToValidate = [
      'user-agent',
      'referer',
      'origin',
      'x-forwarded-for',
      'x-real-ip',
    ];

    for (const headerName of headersToValidate) {
      const headerValue = headers[headerName];
      if (headerValue && typeof headerValue === 'string') {
        // Check for XSS in headers
        if (!config.skipXssCheck && this.sanitizationService.containsXSS(headerValue)) {
          this.logger.warn(`Potentially malicious content detected in header '${headerName}': ${headerValue.substring(0, 100)}`);
          // Don't throw error for headers, just log the warning
        }

        // Check header length
        if (headerValue.length > 2000) {
          throw new BadRequestException(`Header '${headerName}' is too long`);
        }
      }
    }
  }
}

/**
 * Decorator for applying input validation with custom configuration
 */
export const ValidateInput = (config?: ValidationConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    ValidationConfig(config || {})(target, propertyKey, descriptor);
  };
};