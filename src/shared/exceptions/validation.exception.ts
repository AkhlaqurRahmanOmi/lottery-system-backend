import { BadRequestException } from '@nestjs/common';
import { ValidationError } from '../types';

/**
 * Custom validation exception that provides structured validation errors
 * for the global exception filter to handle
 */
export class ValidationException extends BadRequestException {
    constructor(
        public readonly validationErrors: ValidationError[],
        message = 'Validation failed',
    ) {
        super({
            message,
            validationErrors,
            statusCode: 400,
        });
    }

    /**
     * Create a validation exception from class-validator errors
     */
    static fromClassValidatorErrors(errors: any[]): ValidationException {
        const validationErrors: ValidationError[] = [];

        const processError = (error: any, parentPath = '') => {
            const fieldPath = parentPath
                ? `${parentPath}.${error.property}`
                : error.property;

            if (error.constraints) {
                Object.entries(error.constraints).forEach(([constraint, message]) => {
                    validationErrors.push({
                        field: fieldPath,
                        message: message as string,
                        value: error.value,
                        constraint,
                    });
                });
            }

            // Handle nested validation errors
            if (error.children && error.children.length > 0) {
                error.children.forEach((child: any) => processError(child, fieldPath));
            }
        };

        errors.forEach((error) => processError(error));

        return new ValidationException(validationErrors, 'Invalid input data');
    }

    /**
     * Create a validation exception for a single field error
     */
    static forField(
        field: string,
        message: string,
        value?: any,
        constraint?: string,
    ): ValidationException {
        const validationError: ValidationError = {
            field,
            message,
            value,
            constraint,
        };

        return new ValidationException([validationError]);
    }

    /**
     * Create a validation exception for multiple field errors
     */
    static forFields(
        errors: Array<{
            field: string;
            message: string;
            value?: any;
            constraint?: string;
        }>,
    ): ValidationException {
        const validationErrors: ValidationError[] = errors.map((error) => ({
            field: error.field,
            message: error.message,
            value: error.value,
            constraint: error.constraint,
        }));

        return new ValidationException(validationErrors);
    }

    /**
     * Get validation errors in a format suitable for API responses
     */
    getValidationErrors(): ValidationError[] {
        return this.validationErrors;
    }

    /**
     * Get a summary of validation errors
     */
    getErrorSummary(): string {
        const fieldCount = this.validationErrors.length;
        const fields = this.validationErrors.map((error) => error.field).join(', ');

        return `Validation failed for ${fieldCount} field${fieldCount > 1 ? 's' : ''}: ${fields}`;
    }

    /**
     * Check if a specific field has validation errors
     */
    hasFieldError(field: string): boolean {
        return this.validationErrors.some((error) => error.field === field);
    }

    /**
     * Get validation errors for a specific field
     */
    getFieldErrors(field: string): ValidationError[] {
        return this.validationErrors.filter((error) => error.field === field);
    }

    /**
     * Get all field names that have validation errors
     */
    getErrorFields(): string[] {
        return [...new Set(this.validationErrors.map((error) => error.field))];
    }
}
