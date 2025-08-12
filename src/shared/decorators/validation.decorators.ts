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
// ============================================================================
// LOTTERY SYSTEM SPECIFIC VALIDATION DECORATORS
// ============================================================================

/**
 * Custom validator for coupon code format validation
 */
@ValidatorConstraint({ name: 'isValidCouponCode', async: false })
export class IsValidCouponCodeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length (8-12 characters)
    if (value.length < 8 || value.length > 12) return false;
    
    // Check format: only uppercase letters A-Z and numbers 2-9 (excluding ambiguous characters)
    const validCouponRegex = /^[A-Z2-9]+$/;
    if (!validCouponRegex.test(value)) return false;
    
    // Ensure no ambiguous characters (0, O, 1, I, L)
    const ambiguousChars = /[01OIL]/;
    if (ambiguousChars.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 8-12 characters long and contain only uppercase letters A-Z and numbers 2-9 (excluding 0, O, 1, I, L)`;
  }
}

/**
 * Decorator for validating coupon codes
 */
export function IsValidCouponCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCouponCodeConstraint,
    });
  };
}

/**
 * Custom validator for user names in lottery system
 */
@ValidatorConstraint({ name: 'isValidUserName', async: false })
export class IsValidUserNameConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length (2-100 characters)
    if (value.length < 2 || value.length > 100) return false;
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes, periods)
    // Allow international characters for names (using broader character ranges)
    const validNameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s\-'.]+$/;
    if (!validNameRegex.test(value)) return false;
    
    // Check that it doesn't start or end with whitespace
    if (value.trim() !== value) return false;
    
    // Check that it doesn't have multiple consecutive spaces
    if (/\s{2,}/.test(value)) return false;
    
    // Prevent potential XSS patterns in names
    const xssPatterns = /<[^>]*>|javascript:|on\w+=/i;
    if (xssPatterns.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 2-100 characters long, contain only letters, spaces, hyphens, apostrophes, and periods, without leading/trailing spaces or multiple consecutive spaces`;
  }
}

/**
 * Decorator for validating user names
 */
export function IsValidUserName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUserNameConstraint,
    });
  };
}

/**
 * Custom validator for phone numbers
 */
@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Remove all non-digit characters for validation
    const digitsOnly = value.replace(/\D/g, '');
    
    // Check length (10-15 digits for international numbers)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
    
    // Check for valid phone number patterns
    const validPhonePatterns = [
      /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/, // US format
      /^\+?[1-9]\d{1,14}$/, // International format (E.164)
      /^[0-9]{10,15}$/, // Simple digit format
      /^\+?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}$/, // General international format
    ];
    
    const isValidFormat = validPhonePatterns.some(pattern => pattern.test(value));
    if (!isValidFormat) return false;
    
    // Prevent potential injection patterns
    const injectionPatterns = /<[^>]*>|javascript:|on\w+=/i;
    if (injectionPatterns.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid phone number with 10-15 digits`;
  }
}

/**
 * Decorator for validating phone numbers
 */
export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}

/**
 * Custom validator for addresses
 */
@ValidatorConstraint({ name: 'isValidAddress', async: false })
export class IsValidAddressConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length (10-500 characters)
    if (value.length < 10 || value.length > 500) return false;
    
    // Check for valid characters (letters, numbers, spaces, common punctuation)
    const validAddressRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s\-.,#/()]+$/;
    if (!validAddressRegex.test(value)) return false;
    
    // Check that it doesn't start or end with whitespace
    if (value.trim() !== value) return false;
    
    // Prevent potential XSS and injection patterns
    const maliciousPatterns = /<[^>]*>|javascript:|on\w+=/i;
    if (maliciousPatterns.test(value)) return false;
    
    // Ensure it contains at least some alphanumeric characters
    const hasAlphanumeric = /[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9]/.test(value);
    if (!hasAlphanumeric) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 10-500 characters long and contain valid address characters`;
  }
}

/**
 * Decorator for validating addresses
 */
export function IsValidAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAddressConstraint,
    });
  };
}

/**
 * Custom validator for product experience text
 */
@ValidatorConstraint({ name: 'isValidProductExperience', async: false })
export class IsValidProductExperienceConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length (10-1000 characters)
    if (value.length < 10 || value.length > 1000) return false;
    
    // Check for valid characters (allow most printable characters)
    const validTextRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s\-.,!?;:'"()[\]{}@#$%^&*+=_|\\/<>~`]+$/;
    if (!validTextRegex.test(value)) return false;
    
    // Check that it doesn't start or end with whitespace
    if (value.trim() !== value) return false;
    
    // Prevent potential XSS and injection patterns
    const maliciousPatterns = /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=|<iframe|<object|<embed/i;
    if (maliciousPatterns.test(value)) return false;
    
    // Ensure it contains meaningful content (not just punctuation/spaces)
    const meaningfulContent = /[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9]/.test(value);
    if (!meaningfulContent) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 10-1000 characters long and contain meaningful text about your product experience`;
  }
}

/**
 * Decorator for validating product experience
 */
export function IsValidProductExperience(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidProductExperienceConstraint,
    });
  };
}

/**
 * Custom validator for reward service names
 */
@ValidatorConstraint({ name: 'isValidServiceName', async: false })
export class IsValidServiceNameConstraint implements ValidatorConstraintInterface {
  private readonly validServiceNames = [
    'spotify',
    'netflix',
    'youtube premium',
    'amazon prime',
    'disney+',
    'hulu',
    'apple music',
    'google play',
    'steam',
    'xbox game pass',
    'playstation plus',
    'twitch',
    'other'
  ];

  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length
    if (value.length < 2 || value.length > 50) return false;
    
    // Check if it's a known service or "other"
    const normalizedValue = value.toLowerCase().trim();
    const isKnownService = this.validServiceNames.includes(normalizedValue);
    
    if (!isKnownService) {
      // If not a known service, validate as custom service name
      const validServiceRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s\-+&.]+$/;
      if (!validServiceRegex.test(value)) return false;
    }
    
    // Prevent XSS patterns
    const xssPatterns = /<[^>]*>|javascript:|on\w+=/i;
    if (xssPatterns.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid service name (${this.validServiceNames.join(', ')}) or a custom service name`;
  }
}

/**
 * Decorator for validating service names
 */
export function IsValidServiceName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidServiceNameConstraint,
    });
  };
}

/**
 * Custom validator for batch names
 */
@ValidatorConstraint({ name: 'isValidBatchName', async: false })
export class IsValidBatchNameConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Optional field
    if (typeof value !== 'string') return false;
    
    // Check length (3-100 characters)
    if (value.length < 3 || value.length > 100) return false;
    
    // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
    const validBatchNameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s\-_]+$/;
    if (!validBatchNameRegex.test(value)) return false;
    
    // Check that it doesn't start or end with whitespace
    if (value.trim() !== value) return false;
    
    // Prevent XSS patterns
    const xssPatterns = /<[^>]*>|javascript:|on\w+=/i;
    if (xssPatterns.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 3-100 characters long and contain only letters, numbers, spaces, hyphens, and underscores`;
  }
}

/**
 * Decorator for validating batch names
 */
export function IsValidBatchName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidBatchNameConstraint,
    });
  };
}

/**
 * Custom validator for admin usernames
 */
@ValidatorConstraint({ name: 'isValidAdminUsername', async: false })
export class IsValidAdminUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check length (3-50 characters)
    if (value.length < 3 || value.length > 50) return false;
    
    // Check format: letters, numbers, underscores, hyphens (no spaces)
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(value)) return false;
    
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(value)) return false;
    
    // Prevent common injection patterns
    const injectionPatterns = /<[^>]*>|javascript:|on\w+=|script|select|union|drop|delete|insert|update/i;
    if (injectionPatterns.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 3-50 characters long, start with a letter, and contain only letters, numbers, underscores, and hyphens`;
  }
}

/**
 * Decorator for validating admin usernames
 */
export function IsValidAdminUsername(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAdminUsernameConstraint,
    });
  };
}

/**
 * Custom validator for secure passwords
 */
@ValidatorConstraint({ name: 'isSecurePassword', async: false })
export class IsSecurePasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check minimum length
    if (value.length < 8) return false;
    
    // Check maximum length (prevent DoS attacks)
    if (value.length > 128) return false;
    
    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(value)) return false;
    
    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(value)) return false;
    
    // Must contain at least one number
    if (!/\d/.test(value)) return false;
    
    // Must contain at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false;
    
    // Prevent common weak passwords
    const weakPatterns = [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^letmein/i,
      /^welcome/i,
    ];
    
    if (weakPatterns.some(pattern => pattern.test(value))) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be 8-128 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character`;
  }
}

/**
 * Decorator for validating secure passwords
 */
export function IsSecurePassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSecurePasswordConstraint,
    });
  };
}

/**
 * Custom validator for safe text input (prevents XSS)
 */
@ValidatorConstraint({ name: 'isSafeText', async: false })
export class IsSafeTextConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    
    // Check for dangerous HTML tags and JavaScript
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<form[^>]*>.*?<\/form>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*on\w+[^>]*>/gi,
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(value))) return false;
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|\||&|\+)/g,
    ];
    
    // Only flag if multiple SQL keywords or obvious injection patterns
    const sqlMatches = sqlPatterns.reduce((count, pattern) => {
      const matches = value.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    if (sqlMatches > 2) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} contains potentially unsafe content`;
  }
}

/**
 * Decorator for validating safe text input
 */
export function IsSafeText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeTextConstraint,
    });
  };
}