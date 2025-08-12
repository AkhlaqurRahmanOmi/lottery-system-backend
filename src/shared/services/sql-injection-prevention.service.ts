import { Injectable, Logger } from '@nestjs/common';

/**
 * SQL Injection Prevention Service
 * Provides utilities to detect and prevent SQL injection attacks
 * Requirements: 10.2, 10.3
 */
@Injectable()
export class SqlInjectionPreventionService {
  private readonly logger = new Logger(SqlInjectionPreventionService.name);

  /**
   * Common SQL injection patterns to detect
   */
  private readonly sqlInjectionPatterns = [
    // Basic SQL keywords with context
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b.*\b(from|into|set|where|values|table|database)\b)/gi,
    
    // SQL comments
    /(--|\/\*|\*\/|#)/g,
    
    // SQL operators and conditions
    /(\bor\b.*=.*\bor\b|\band\b.*=.*\band\b)/gi,
    
    // String concatenation attacks
    /('.*'.*\+.*'.*'|".*".*\+.*".*")/gi,
    
    // Union-based attacks
    /(\bunion\b.*\bselect\b)/gi,
    
    // Boolean-based attacks
    /(\b(true|false)\b.*=.*\b(true|false)\b)/gi,
    
    // Time-based attacks
    /(\bwaitfor\b|\bsleep\b|\bdelay\b)/gi,
    
    // Information schema attacks
    /(\binformation_schema\b|\bsys\b\.\b)/gi,
    
    // Stacked queries
    /(;.*\b(select|insert|update|delete|drop|create|alter)\b)/gi,
    
    // Hex encoding attacks
    /(0x[0-9a-f]+)/gi,
    
    // CHAR function attacks
    /(\bchar\b\s*\()/gi,
    
    // Concatenation functions
    /(\bconcat\b\s*\(|\|\|)/gi,
  ];

  /**
   * High-risk SQL patterns that should always be blocked
   */
  private readonly highRiskPatterns = [
    /(\bdrop\b.*\btable\b)/gi,
    /(\bdrop\b.*\bdatabase\b)/gi,
    /(\btruncate\b.*\btable\b)/gi,
    /(\bdelete\b.*\bfrom\b)/gi,
    /(\binsert\b.*\binto\b)/gi,
    /(\bupdate\b.*\bset\b)/gi,
    /(\bcreate\b.*\btable\b)/gi,
    /(\balter\b.*\btable\b)/gi,
    /(\bgrant\b|\brevoke\b)/gi,
    /(\bexec\b|\bexecute\b)/gi,
    /(\bsp_\w+)/gi, // Stored procedures
    /(\bxp_\w+)/gi, // Extended stored procedures
  ];

  /**
   * Patterns that might be legitimate in certain contexts
   */
  private readonly contextualPatterns = [
    /(\bselect\b)/gi,
    /(\bfrom\b)/gi,
    /(\bwhere\b)/gi,
    /(\border\b.*\bby\b)/gi,
    /(\bgroup\b.*\bby\b)/gi,
    /(\bhaving\b)/gi,
    /(\bjoin\b)/gi,
    /(\bunion\b)/gi,
  ];

  /**
   * Check if input contains SQL injection patterns
   */
  containsSqlInjection(input: string, context: 'strict' | 'moderate' | 'lenient' = 'moderate'): boolean {
    if (!input || typeof input !== 'string') return false;

    const normalizedInput = input.toLowerCase().trim();

    // Always check high-risk patterns regardless of context
    const hasHighRiskPattern = this.highRiskPatterns.some(pattern => pattern.test(normalizedInput));
    if (hasHighRiskPattern) {
      this.logger.warn(`High-risk SQL injection pattern detected: ${input.substring(0, 100)}...`);
      return true;
    }

    // Check based on context
    switch (context) {
      case 'strict':
        return this.checkStrictPatterns(normalizedInput);
      case 'moderate':
        return this.checkModeratePatterns(normalizedInput);
      case 'lenient':
        return this.checkLenientPatterns(normalizedInput);
      default:
        return this.checkModeratePatterns(normalizedInput);
    }
  }

  /**
   * Strict checking - blocks most SQL-like patterns
   */
  private checkStrictPatterns(input: string): boolean {
    const allPatterns = [...this.sqlInjectionPatterns, ...this.contextualPatterns];
    return allPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Moderate checking - blocks obvious injection attempts
   */
  private checkModeratePatterns(input: string): boolean {
    // Count SQL keyword matches
    let sqlKeywordCount = 0;
    let suspiciousPatternCount = 0;

    for (const pattern of this.sqlInjectionPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        sqlKeywordCount += matches.length;
        suspiciousPatternCount++;
      }
    }

    // Block if multiple SQL patterns or high keyword count
    if (suspiciousPatternCount >= 2 || sqlKeywordCount >= 3) {
      this.logger.warn(`Moderate SQL injection pattern detected: ${input.substring(0, 100)}...`);
      return true;
    }

    // Check for comment-based attacks
    if (/(--|\/\*|\*\/|#)/.test(input)) {
      this.logger.warn(`SQL comment pattern detected: ${input.substring(0, 100)}...`);
      return true;
    }

    return false;
  }

  /**
   * Lenient checking - only blocks obvious attacks
   */
  private checkLenientPatterns(input: string): boolean {
    // Only check for the most obvious injection patterns
    const obviousPatterns = [
      /(\bunion\b.*\bselect\b)/gi,
      /(\bor\b.*=.*\bor\b)/gi,
      /(\band\b.*=.*\band\b)/gi,
      /(--|\/\*|\*\/)/g,
      /('.*'.*=.*'.*')/gi,
    ];

    return obviousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize input to remove potential SQL injection patterns
   */
  sanitizeSqlInput(input: string, preserveSpaces: boolean = true): string {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input;

    // Remove SQL comments
    sanitized = sanitized.replace(/(--|\/\*|\*\/|#)/g, '');

    // Remove dangerous SQL keywords in suspicious contexts
    sanitized = sanitized.replace(/(\b(drop|truncate|delete|insert|update|create|alter|exec|execute|grant|revoke)\b)/gi, '');

    // Remove suspicious operators and patterns
    sanitized = sanitized.replace(/(\bor\b.*=.*\bor\b|\band\b.*=.*\band\b)/gi, '');
    sanitized = sanitized.replace(/(\bunion\b.*\bselect\b)/gi, '');
    sanitized = sanitized.replace(/(0x[0-9a-f]+)/gi, '');

    // Remove quotes in suspicious contexts
    sanitized = sanitized.replace(/('.*'.*=.*'.*'|".*".*=.*".*")/gi, '');

    // Clean up whitespace
    if (preserveSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    } else {
      sanitized = sanitized.replace(/\s/g, '');
    }

    return sanitized;
  }

  /**
   * Validate query parameters for SQL injection
   */
  validateQueryParams(params: Record<string, any>, context: 'strict' | 'moderate' | 'lenient' = 'moderate'): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && this.containsSqlInjection(value, context)) {
        errors.push(`Parameter '${key}' contains potential SQL injection patterns`);
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'string' && this.containsSqlInjection(value[i], context)) {
            errors.push(`Parameter '${key}[${i}]' contains potential SQL injection patterns`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a safe search query by escaping special characters
   */
  createSafeSearchQuery(searchTerm: string): string {
    if (!searchTerm || typeof searchTerm !== 'string') return '';

    // Remove potential SQL injection patterns
    let safeTerm = this.sanitizeSqlInput(searchTerm);

    // Escape special characters for LIKE queries
    safeTerm = safeTerm
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/%/g, '\\%')    // Escape percent signs
      .replace(/_/g, '\\_')    // Escape underscores
      .replace(/'/g, "''");    // Escape single quotes

    return safeTerm;
  }

  /**
   * Validate sort parameters to prevent SQL injection
   */
  validateSortParams(sortField: string, sortOrder: string, allowedFields: string[]): { isValid: boolean; error?: string } {
    // Check if sort field is in allowed list
    if (!allowedFields.includes(sortField)) {
      return {
        isValid: false,
        error: `Invalid sort field: ${sortField}. Allowed fields: ${allowedFields.join(', ')}`
      };
    }

    // Check sort order
    const validSortOrders = ['asc', 'desc', 'ASC', 'DESC'];
    if (!validSortOrders.includes(sortOrder)) {
      return {
        isValid: false,
        error: `Invalid sort order: ${sortOrder}. Must be 'asc' or 'desc'`
      };
    }

    // Check for SQL injection in sort parameters
    if (this.containsSqlInjection(sortField, 'strict') || this.containsSqlInjection(sortOrder, 'strict')) {
      return {
        isValid: false,
        error: 'Sort parameters contain invalid characters'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate safe pagination parameters
   */
  validatePaginationParams(page: number, limit: number, maxLimit: number = 100): { isValid: boolean; error?: string; safePage: number; safeLimit: number } {
    let safePage = Math.max(1, Math.floor(Math.abs(page || 1)));
    let safeLimit = Math.max(1, Math.min(maxLimit, Math.floor(Math.abs(limit || 10))));

    // Prevent extremely large page numbers that could cause performance issues
    if (safePage > 10000) {
      return {
        isValid: false,
        error: 'Page number too large (maximum: 10000)',
        safePage: 1,
        safeLimit: 10
      };
    }

    return {
      isValid: true,
      safePage,
      safeLimit
    };
  }

  /**
   * Log potential SQL injection attempts for monitoring
   */
  logSuspiciousActivity(input: string, context: string, userInfo?: any): void {
    this.logger.warn(`Potential SQL injection attempt detected`, {
      input: input.substring(0, 200),
      context,
      userInfo: userInfo ? {
        id: userInfo.id,
        username: userInfo.username,
        ip: userInfo.ip
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if a database query is safe (for development/debugging)
   */
  isQuerySafe(query: string): { isSafe: boolean; risks: string[] } {
    const risks: string[] = [];

    // Check for high-risk operations
    if (this.highRiskPatterns.some(pattern => pattern.test(query))) {
      risks.push('Contains high-risk SQL operations');
    }

    // Check for dynamic query construction
    if (/\$\{|\+.*'|'.*\+/.test(query)) {
      risks.push('Contains dynamic query construction patterns');
    }

    // Check for unparameterized queries
    if (/'[^']*'/.test(query) && !/\$\d+/.test(query)) {
      risks.push('Contains string literals without parameterization');
    }

    return {
      isSafe: risks.length === 0,
      risks
    };
  }
}