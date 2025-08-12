import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { SqlInjectionPreventionService } from '../services/sql-injection-prevention.service';

/**
 * Enhanced validation pipe that provides detailed error messages,
 * input sanitization, and security validation
 * Requirements: 10.2, 10.3, 10.4, 10.6
 */
@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  constructor(
    private readonly sanitizationService: InputSanitizationService,
    private readonly sqlInjectionService: SqlInjectionPreventionService,
  ) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Step 1: Security validation - check for XSS and SQL injection
    this.performSecurityValidation(value);

    // Step 2: Sanitize input data
    const sanitizedValue = this.sanitizeInputData(value);

    // Step 3: Transform and validate with class-validator
    const object = plainToClass(metatype, sanitizedValue, {
      enableImplicitConversion: true, // Enable automatic type conversion
    });
    
    const errors = await validate(object, {
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for non-whitelisted properties, just strip them
      transform: true, // Transform values to their target types
      validateCustomDecorators: true, // Validate custom decorators
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatValidationErrors(errors);
      throw new BadRequestException({
        message: formattedErrors,
        error: 'Validation failed',
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Format validation errors with helpful hints and suggestions
   */
  private formatValidationErrors(errors: ValidationError[]): any[] {
    const formattedErrors: any[] = [];

    const processError = (error: ValidationError, parentPath = '') => {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints) {
        Object.entries(error.constraints).forEach(([constraint, message]) => {
          const formattedError = {
            property: fieldPath,
            value: error.value,
            constraints: { [constraint]: message },
            // Add helpful hints based on constraint type
            hint: this.getValidationHint(constraint, fieldPath, error.value),
            // Add examples for common validation failures
            example: this.getValidationExample(constraint, fieldPath),
          };

          formattedErrors.push(formattedError);
        });
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        error.children.forEach(child => processError(child, fieldPath));
      }
    };

    errors.forEach(error => processError(error));
    return formattedErrors;
  }

  /**
   * Get helpful hints based on validation constraint type
   */
  private getValidationHint(constraint: string, field: string, value: any): string {
    const hints: { [key: string]: string } = {
      isNotEmpty: `The ${field} field cannot be empty. Please provide a value.`,
      isString: `The ${field} field must be a text value.`,
      isNumber: `The ${field} field must be a numeric value.`,
      isInt: `The ${field} field must be a whole number (integer).`,
      isEmail: `The ${field} field must be a valid email address format (e.g., user@example.com).`,
      isUrl: `The ${field} field must be a valid URL format (e.g., https://example.com).`,
      minLength: `The ${field} field is too short. Please provide more characters.`,
      maxLength: `The ${field} field is too long. Please reduce the number of characters.`,
      min: `The ${field} value is too small. Please provide a larger number.`,
      max: `The ${field} value is too large. Please provide a smaller number.`,
      isPositive: `The ${field} field must be a positive number greater than zero.`,
      isNegative: `The ${field} field must be a negative number less than zero.`,
      isDefined: `The ${field} field is required and must be provided.`,
      isOptional: `The ${field} field is optional but if provided, must meet the validation criteria.`,
      isArray: `The ${field} field must be an array of values.`,
      isObject: `The ${field} field must be a valid object.`,
      isBoolean: `The ${field} field must be either true or false.`,
      isDate: `The ${field} field must be a valid date.`,
      isEnum: `The ${field} field must be one of the predefined values.`,
      matches: `The ${field} field format is invalid. Please check the required pattern.`,
      isUUID: `The ${field} field must be a valid UUID format.`,
      isJSON: `The ${field} field must be valid JSON format.`,
      // Custom validation hints
      isPositivePrice: `The ${field} must be a positive number not exceeding $999,999.99.`,
      isValidCategory: `The ${field} must be a valid product category.`,
      isValidProductName: `The ${field} must be a valid product name with proper formatting.`,
      isValidDescription: `The ${field} must be a valid description if provided.`,
      isValidPage: `The ${field} must be a valid page number for pagination.`,
      isValidLimit: `The ${field} must be a valid limit for pagination results.`,
      isValidSortField: `The ${field} must be a valid field name for sorting.`,
      isValidSortOrder: `The ${field} must be either 'asc' for ascending or 'desc' for descending order.`,
    };

    return hints[constraint] || `The ${field} field has a validation error. Please check the value and try again.`;
  }

  /**
   * Get validation examples based on constraint type
   */
  private getValidationExample(constraint: string, field: string): string | undefined {
    const examples: { [key: string]: string } = {
      isEmail: 'user@example.com',
      isUrl: 'https://example.com',
      isUUID: '123e4567-e89b-12d3-a456-426614174000',
      isPositivePrice: '29.99',
      isValidCategory: 'electronics, clothing, books, home, sports, toys, beauty, automotive, food, health, other',
      isValidProductName: 'iPhone 15 Pro Max',
      isValidDescription: 'A detailed description of the product features and benefits',
      isValidPage: '1, 2, 3, ..., 10000',
      isValidLimit: '10, 25, 50, 100',
      isValidSortField: 'id, name, price, category, createdAt, updatedAt',
      isValidSortOrder: 'asc, desc',
      // Lottery system specific examples
      isValidCouponCode: 'ABC123XYZ9',
      isValidUserName: 'John Doe',
      isValidPhoneNumber: '+1-555-123-4567',
      isValidAddress: '123 Main St, Anytown, ST 12345',
      isValidProductExperience: 'I have been using this product for 6 months and found it very helpful...',
      isValidServiceName: 'Netflix, Spotify, YouTube Premium',
      isValidBatchName: 'Summer Campaign 2024',
      isValidAdminUsername: 'admin_user',
      isSecurePassword: 'MySecure123!',
    };

    return examples[constraint];
  }

  /**
   * Perform security validation to detect XSS and SQL injection attempts
   */
  private performSecurityValidation(value: any): void {
    if (!value || typeof value !== 'object') return;

    const checkValue = (val: any, path: string = ''): void => {
      if (typeof val === 'string') {
        // Check for XSS patterns
        if (this.sanitizationService.containsXSS(val)) {
          throw new BadRequestException({
            message: `Potential XSS attack detected in field: ${path}`,
            error: 'Security validation failed',
            statusCode: 400,
          });
        }

        // Check for SQL injection patterns
        if (this.sanitizationService.containsSQLInjection(val)) {
          throw new BadRequestException({
            message: `Potential SQL injection detected in field: ${path}`,
            error: 'Security validation failed',
            statusCode: 400,
          });
        }
      } else if (Array.isArray(val)) {
        val.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else if (val && typeof val === 'object') {
        Object.entries(val).forEach(([key, nestedVal]) => 
          checkValue(nestedVal, path ? `${path}.${key}` : key)
        );
      }
    };

    Object.entries(value).forEach(([key, val]) => checkValue(val, key));
  }

  /**
   * Sanitize input data based on field types
   */
  private sanitizeInputData(value: any): any {
    if (!value || typeof value !== 'object') return value;

    // Use the sanitization service to clean the data
    return this.sanitizationService.sanitizeSubmissionData(value);
  }
}

/**
 * Validation error response interface for enhanced error handling
 */
export interface EnhancedValidationError {
  property: string;
  value: any;
  constraints: { [type: string]: string };
  hint: string;
  example?: string;
}