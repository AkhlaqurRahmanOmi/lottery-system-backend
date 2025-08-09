import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom validator for price validation
 */
@ValidatorConstraint({ name: 'isPositivePrice', async: false })
export class IsPositivePriceConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    return value > 0 && Number.isFinite(value) && value <= 999999.99;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a positive number not exceeding 999,999.99`;
  }
}

/**
 * Decorator for validating positive prices
 */
export function IsPositivePrice(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPositivePriceConstraint,
    });
  };
}

/**
 * Custom validator for product category validation
 */
@ValidatorConstraint({ name: 'isValidCategory', async: false })
export class IsValidCategoryConstraint implements ValidatorConstraintInterface {
  private readonly validCategories = [
    'electronics',
    'clothing',
    'books',
    'home',
    'sports',
    'toys',
    'beauty',
    'automotive',
    'food',
    'health',
    'other'
  ];

  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    return this.validCategories.includes(value.toLowerCase());
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be one of the following: ${this.validCategories.join(', ')}`;
  }
}

/**
 * Decorator for validating product categories
 */
export function IsValidCategory(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCategoryConstraint,
    });
  };
}

/**
 * Custom validator for product name validation
 */
@ValidatorConstraint({ name: 'isValidProductName', async: false })
export class IsValidProductNameConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length
    if (value.length < 2 || value.length > 100) return false;
    
    // Check for valid characters (letters, numbers, spaces, hyphens, apostrophes)
    const validNameRegex = /^[a-zA-Z0-9\s\-']+$/;
    if (!validNameRegex.test(value)) return false;
    
    // Check that it doesn't start or end with whitespace
    if (value.trim() !== value) return false;
    
    // Check that it doesn't have multiple consecutive spaces
    if (/\s{2,}/.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 2-100 characters long, contain only letters, numbers, spaces, hyphens, and apostrophes, and not have leading/trailing spaces or multiple consecutive spaces`;
  }
}

/**
 * Decorator for validating product names
 */
export function IsValidProductName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidProductNameConstraint,
    });
  };
}

/**
 * Custom validator for description validation
 */
@ValidatorConstraint({ name: 'isValidDescription', async: false })
export class IsValidDescriptionConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Optional field
    if (typeof value !== 'string') return false;
    
    // Check length
    if (value.length > 1000) return false;
    
    // If provided, it should not be just whitespace
    if (value.trim().length === 0) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a non-empty string with maximum 1000 characters`;
  }
}

/**
 * Decorator for validating product descriptions
 */
export function IsValidDescription(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDescriptionConstraint,
    });
  };
}

/**
 * Custom validator for pagination parameters
 */
@ValidatorConstraint({ name: 'isValidPage', async: false })
export class IsValidPageConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Optional field
    
    const numValue = Number(value);
    if (!Number.isInteger(numValue)) return false;
    
    return numValue >= 1 && numValue <= 10000;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be an integer between 1 and 10,000`;
  }
}

/**
 * Decorator for validating page numbers
 */
export function IsValidPage(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPageConstraint,
    });
  };
}

/**
 * Custom validator for limit parameters
 */
@ValidatorConstraint({ name: 'isValidLimit', async: false })
export class IsValidLimitConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Optional field
    
    const numValue = Number(value);
    if (!Number.isInteger(numValue)) return false;
    
    return numValue >= 1 && numValue <= 100;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be an integer between 1 and 100`;
  }
}

/**
 * Decorator for validating limit parameters
 */
export function IsValidLimit(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidLimitConstraint,
    });
  };
}

/**
 * Custom validator for sort field validation
 */
@ValidatorConstraint({ name: 'isValidSortField', async: false })
export class IsValidSortFieldConstraint implements ValidatorConstraintInterface {
  private readonly validSortFields = [
    'id',
    'name',
    'price',
    'category',
    'createdAt',
    'updatedAt'
  ];

  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Optional field
    if (typeof value !== 'string') return false;
    
    return this.validSortFields.includes(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be one of the following: ${this.validSortFields.join(', ')}`;
  }
}

/**
 * Decorator for validating sort fields
 */
export function IsValidSortField(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSortFieldConstraint,
    });
  };
}

/**
 * Custom validator for sort order validation
 */
@ValidatorConstraint({ name: 'isValidSortOrder', async: false })
export class IsValidSortOrderConstraint implements ValidatorConstraintInterface {
  private readonly validSortOrders = ['asc', 'desc'];

  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Optional field
    if (typeof value !== 'string') return false;
    
    return this.validSortOrders.includes(value.toLowerCase());
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be either 'asc' or 'desc'`;
  }
}

/**
 * Decorator for validating sort order
 */
export function IsValidSortOrder(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSortOrderConstraint,
    });
  };
}