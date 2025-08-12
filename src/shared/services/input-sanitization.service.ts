import { Injectable } from '@nestjs/common';

/**
 * Comprehensive input sanitization service for XSS prevention and data cleaning
 * Requirements: 10.2, 10.3, 10.4, 10.6
 */
@Injectable()
export class InputSanitizationService {
  
  /**
   * Sanitize general text input to prevent XSS attacks
   */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove HTML entities that could be used for XSS
      .replace(/&[#\w]+;/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sanitize user names with international character support
   */
  sanitizeName(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript and dangerous protocols
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sanitize email addresses
   */
  sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .toLowerCase()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove spaces (emails shouldn't have spaces)
      .replace(/\s/g, '');
  }

  /**
   * Sanitize phone numbers
   */
  sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Keep only digits, spaces, hyphens, parentheses, and plus sign
      .replace(/[^\d\s\-()+ ]/g, '')
      .trim();
  }

  /**
   * Sanitize addresses
   */
  sanitizeAddress(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sanitize coupon codes (uppercase alphanumeric only)
   */
  sanitizeCouponCode(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .toUpperCase()
      // Remove everything except A-Z and 2-9
      .replace(/[^A-Z2-9]/g, '')
      // Remove ambiguous characters if they somehow got through
      .replace(/[01OIL]/g, '');
  }

  /**
   * Sanitize product experience text (allows more characters but prevents XSS)
   */
  sanitizeProductExperience(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove dangerous HTML tags but allow basic formatting
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters except newlines
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace but preserve line breaks
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Sanitize admin usernames
   */
  sanitizeUsername(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .toLowerCase()
      // Remove everything except letters, numbers, underscores, and hyphens
      .replace(/[^a-z0-9_-]/g, '');
  }

  /**
   * Sanitize service names for rewards
   */
  sanitizeServiceName(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sanitize batch names
   */
  sanitizeBatchName(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove JavaScript protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Keep only letters, numbers, spaces, hyphens, and underscores
      .replace(/[^\p{L}\p{N}\s\-_]/gu, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Deep sanitize object properties recursively
   */
  sanitizeObject<T extends Record<string, any>>(obj: T, sanitizers?: Record<string, (value: string) => string>): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj } as any;
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        // Use custom sanitizer if provided, otherwise use general text sanitizer
        const sanitizer = sanitizers?.[key] || this.sanitizeText.bind(this);
        sanitized[key] = sanitizer(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' 
            ? (sanitizers?.[key] || this.sanitizeText.bind(this))(item)
            : typeof item === 'object' 
              ? this.sanitizeObject(item, sanitizers)
              : item
        );
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value, sanitizers);
      }
    }
    
    return sanitized as T;
  }

  /**
   * Check if input contains potential XSS patterns
   */
  containsXSS(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<form[^>]*>.*?<\/form>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*on\w+[^>]*>/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /@import/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check if input contains potential SQL injection patterns
   */
  containsSQLInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b.*\b(from|into|set|where|values|table)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\bor\b.*=.*\bor\b|\band\b.*=.*\band\b)/gi,
      /('.*'.*=.*'.*'|".*".*=.*".*")/gi,
      /(\bunion\b.*\bselect\b)/gi,
      /(\bdrop\b.*\btable\b)/gi,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate and sanitize submission data specifically
   */
  sanitizeSubmissionData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sanitizers = {
      couponCode: this.sanitizeCouponCode.bind(this),
      name: this.sanitizeName.bind(this),
      email: this.sanitizeEmail.bind(this),
      phone: this.sanitizePhone.bind(this),
      address: this.sanitizeAddress.bind(this),
      productExperience: this.sanitizeProductExperience.bind(this),
      serviceName: this.sanitizeServiceName.bind(this),
      batchName: this.sanitizeBatchName.bind(this),
      username: this.sanitizeUsername.bind(this),
    };
    
    return this.sanitizeObject(data, sanitizers);
  }

  /**
   * Escape HTML entities for safe display
   */
  escapeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    
    return input.replace(/[&<>"'/]/g, (match) => htmlEntities[match]);
  }

  /**
   * Unescape HTML entities
   */
  unescapeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
    };
    
    return input.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, (match) => htmlEntities[match]);
  }
}