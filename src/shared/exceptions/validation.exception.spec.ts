import { ValidationException } from './validation.exception';
import { ValidationError } from '../types';

describe('ValidationException', () => {
  describe('constructor', () => {
    it('should create exception with validation errors', () => {
      const validationErrors: ValidationError[] = [
        {
          field: 'name',
          message: 'Name is required',
          value: '',
          constraint: 'isNotEmpty'
        }
      ];

      const exception = new ValidationException(validationErrors);

      expect(exception.validationErrors).toEqual(validationErrors);
      expect(exception.message).toBe('Validation failed');
      expect(exception.getStatus()).toBe(400);
    });

    it('should create exception with custom message', () => {
      const validationErrors: ValidationError[] = [
        {
          field: 'email',
          message: 'Invalid email format',
          value: 'invalid-email',
          constraint: 'isEmail'
        }
      ];

      const exception = new ValidationException(validationErrors, 'Custom validation message');

      expect(exception.validationErrors).toEqual(validationErrors);
      expect(exception.message).toBe('Custom validation message');
    });
  });

  describe('fromClassValidatorErrors', () => {
    it('should create exception from class-validator errors', () => {
      const classValidatorErrors = [
        {
          property: 'name',
          value: '',
          constraints: {
            isNotEmpty: 'name should not be empty'
          }
        },
        {
          property: 'email',
          value: 'invalid',
          constraints: {
            isEmail: 'email must be an email'
          }
        }
      ];

      const exception = ValidationException.fromClassValidatorErrors(classValidatorErrors);

      expect(exception.validationErrors).toHaveLength(2);
      expect(exception.validationErrors[0]).toEqual({
        field: 'name',
        message: 'name should not be empty',
        value: '',
        constraint: 'isNotEmpty'
      });
      expect(exception.validationErrors[1]).toEqual({
        field: 'email',
        message: 'email must be an email',
        value: 'invalid',
        constraint: 'isEmail'
      });
    });

    it('should handle nested validation errors', () => {
      const classValidatorErrors = [
        {
          property: 'user',
          value: {},
          children: [
            {
              property: 'profile',
              value: {},
              children: [
                {
                  property: 'name',
                  value: '',
                  constraints: {
                    isNotEmpty: 'name should not be empty'
                  }
                }
              ]
            }
          ]
        }
      ];

      const exception = ValidationException.fromClassValidatorErrors(classValidatorErrors);

      expect(exception.validationErrors).toHaveLength(1);
      expect(exception.validationErrors[0]).toEqual({
        field: 'user.profile.name',
        message: 'name should not be empty',
        value: '',
        constraint: 'isNotEmpty'
      });
    });

    it('should handle multiple constraints on single field', () => {
      const classValidatorErrors = [
        {
          property: 'password',
          value: '123',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
            matches: 'password must contain at least one uppercase letter'
          }
        }
      ];

      const exception = ValidationException.fromClassValidatorErrors(classValidatorErrors);

      expect(exception.validationErrors).toHaveLength(2);
      expect(exception.validationErrors[0].field).toBe('password');
      expect(exception.validationErrors[1].field).toBe('password');
      expect(exception.validationErrors[0].constraint).toBe('minLength');
      expect(exception.validationErrors[1].constraint).toBe('matches');
    });
  });

  describe('forField', () => {
    it('should create exception for single field error', () => {
      const exception = ValidationException.forField(
        'email',
        'Invalid email format',
        'invalid-email',
        'isEmail'
      );

      expect(exception.validationErrors).toHaveLength(1);
      expect(exception.validationErrors[0]).toEqual({
        field: 'email',
        message: 'Invalid email format',
        value: 'invalid-email',
        constraint: 'isEmail'
      });
    });

    it('should create exception for field error without value and constraint', () => {
      const exception = ValidationException.forField('name', 'Name is required');

      expect(exception.validationErrors).toHaveLength(1);
      expect(exception.validationErrors[0]).toEqual({
        field: 'name',
        message: 'Name is required',
        value: undefined,
        constraint: undefined
      });
    });
  });

  describe('forFields', () => {
    it('should create exception for multiple field errors', () => {
      const fieldErrors = [
        {
          field: 'name',
          message: 'Name is required',
          value: '',
          constraint: 'isNotEmpty'
        },
        {
          field: 'email',
          message: 'Invalid email format',
          value: 'invalid',
          constraint: 'isEmail'
        }
      ];

      const exception = ValidationException.forFields(fieldErrors);

      expect(exception.validationErrors).toHaveLength(2);
      expect(exception.validationErrors).toEqual([
        {
          field: 'name',
          message: 'Name is required',
          value: '',
          constraint: 'isNotEmpty'
        },
        {
          field: 'email',
          message: 'Invalid email format',
          value: 'invalid',
          constraint: 'isEmail'
        }
      ]);
    });
  });

  describe('getValidationErrors', () => {
    it('should return validation errors', () => {
      const validationErrors: ValidationError[] = [
        {
          field: 'name',
          message: 'Name is required',
          value: '',
          constraint: 'isNotEmpty'
        }
      ];

      const exception = new ValidationException(validationErrors);
      const result = exception.getValidationErrors();

      expect(result).toEqual(validationErrors);
    });
  });

  describe('getErrorSummary', () => {
    it('should return summary for single error', () => {
      const exception = ValidationException.forField('name', 'Name is required');
      const summary = exception.getErrorSummary();

      expect(summary).toBe('Validation failed for 1 field: name');
    });

    it('should return summary for multiple errors', () => {
      const fieldErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' }
      ];

      const exception = ValidationException.forFields(fieldErrors);
      const summary = exception.getErrorSummary();

      expect(summary).toBe('Validation failed for 2 fields: name, email');
    });
  });

  describe('hasFieldError', () => {
    it('should return true if field has error', () => {
      const exception = ValidationException.forField('name', 'Name is required');

      expect(exception.hasFieldError('name')).toBe(true);
      expect(exception.hasFieldError('email')).toBe(false);
    });
  });

  describe('getFieldErrors', () => {
    it('should return errors for specific field', () => {
      const fieldErrors = [
        { field: 'name', message: 'Name is required', constraint: 'isNotEmpty' },
        { field: 'name', message: 'Name too short', constraint: 'minLength' },
        { field: 'email', message: 'Invalid email', constraint: 'isEmail' }
      ];

      const exception = ValidationException.forFields(fieldErrors);
      const nameErrors = exception.getFieldErrors('name');

      expect(nameErrors).toHaveLength(2);
      expect(nameErrors[0].message).toBe('Name is required');
      expect(nameErrors[1].message).toBe('Name too short');
    });

    it('should return empty array for field without errors', () => {
      const exception = ValidationException.forField('name', 'Name is required');
      const emailErrors = exception.getFieldErrors('email');

      expect(emailErrors).toHaveLength(0);
    });
  });

  describe('getErrorFields', () => {
    it('should return unique field names with errors', () => {
      const fieldErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'name', message: 'Name too short' },
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Age must be positive' }
      ];

      const exception = ValidationException.forFields(fieldErrors);
      const errorFields = exception.getErrorFields();

      expect(errorFields).toHaveLength(3);
      expect(errorFields).toContain('name');
      expect(errorFields).toContain('email');
      expect(errorFields).toContain('age');
    });

    it('should return empty array when no errors', () => {
      const exception = new ValidationException([]);
      const errorFields = exception.getErrorFields();

      expect(errorFields).toHaveLength(0);
    });
  });
});