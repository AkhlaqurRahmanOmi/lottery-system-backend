import { Injectable, Logger } from '@nestjs/common';

/**
 * Service for configuring structured logging levels and formats
 */
@Injectable()
export class LoggingConfigService {
  private readonly logger = new Logger(LoggingConfigService.name);
  private readonly logLevels = ['error', 'warn', 'log', 'debug', 'verbose'];

  constructor() {}

  /**
   * Get the current log level based on environment
   */
  getLogLevel(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const configuredLevel = process.env.LOG_LEVEL;

    if (configuredLevel && this.logLevels.includes(configuredLevel)) {
      return configuredLevel;
    }

    // Default log levels based on environment
    switch (nodeEnv) {
      case 'production':
        return 'warn';
      case 'staging':
        return 'log';
      case 'test':
        return 'error';
      default:
        return 'debug';
    }
  }

  /**
   * Check if a log level should be logged based on current configuration
   */
  shouldLog(level: string): boolean {
    const currentLevel = this.getLogLevel();
    const currentLevelIndex = this.logLevels.indexOf(currentLevel);
    const requestedLevelIndex = this.logLevels.indexOf(level);

    return requestedLevelIndex <= currentLevelIndex;
  }

  /**
   * Get structured log format configuration
   */
  getLogFormat(): LogFormat {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    return {
      timestamp: true,
      level: true,
      context: true,
      traceId: true,
      colorize: nodeEnv === 'development',
      prettyPrint: nodeEnv === 'development',
      includeStack: nodeEnv !== 'production',
    };
  }

  /**
   * Configure logger with performance and security considerations
   */
  configureLogger(): LoggerConfig {
    const logLevel = this.getLogLevel();
    const logFormat = this.getLogFormat();
    
    return {
      level: logLevel,
      format: logFormat,
      transports: this.getLogTransports(),
      filters: this.getLogFilters(),
      sanitizers: this.getLogSanitizers(),
    };
  }

  /**
   * Get log transport configurations
   */
  private getLogTransports(): LogTransport[] {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const transports: LogTransport[] = [];

    // Console transport (always enabled)
    transports.push({
      type: 'console',
      level: this.getLogLevel(),
      format: this.getLogFormat(),
    });

    // File transports for non-development environments
    if (nodeEnv !== 'development') {
      // Error log file
      transports.push({
        type: 'file',
        level: 'error',
        filename: 'logs/error.log',
        maxSize: '10m',
        maxFiles: 5,
        format: {
          ...this.getLogFormat(),
          colorize: false,
          prettyPrint: false,
        },
      });

      // Combined log file
      transports.push({
        type: 'file',
        level: 'log',
        filename: 'logs/combined.log',
        maxSize: '50m',
        maxFiles: 10,
        format: {
          ...this.getLogFormat(),
          colorize: false,
          prettyPrint: false,
        },
      });

      // Performance log file
      transports.push({
        type: 'file',
        level: 'log',
        filename: 'logs/performance.log',
        maxSize: '20m',
        maxFiles: 5,
        filter: (log: any) => log.context?.includes('Performance') || log.message?.includes('Performance'),
        format: {
          ...this.getLogFormat(),
          colorize: false,
          prettyPrint: false,
        },
      });
    }

    return transports;
  }

  /**
   * Get log filters to exclude sensitive information
   */
  private getLogFilters(): LogFilter[] {
    return [
      // Filter out health check requests in production
      {
        name: 'health-check-filter',
        condition: (log: any) => {
          const nodeEnv = process.env.NODE_ENV || 'development';
          return nodeEnv === 'production' && 
                 log.message?.includes('GET /health') ||
                 log.url?.includes('/health');
        },
        action: 'exclude',
      },
      
      // Filter out static asset requests in production
      {
        name: 'static-assets-filter',
        condition: (log: any) => {
          const nodeEnv = process.env.NODE_ENV || 'development';
          return nodeEnv === 'production' && 
                 log.url?.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
        },
        action: 'exclude',
      },

      // Rate limit verbose logs in production
      {
        name: 'verbose-rate-limit',
        condition: (log: any) => {
          const nodeEnv = process.env.NODE_ENV || 'development';
          return nodeEnv === 'production' && log.level === 'verbose';
        },
        action: 'rate-limit',
        limit: 100, // Max 100 verbose logs per minute
        window: 60000, // 1 minute window
      },
    ];
  }

  /**
   * Get log sanitizers to remove sensitive data
   */
  private getLogSanitizers(): LogSanitizer[] {
    return [
      // Remove password fields
      {
        name: 'password-sanitizer',
        pattern: /"password"\s*:\s*"[^"]*"/gi,
        replacement: '"password":"[REDACTED]"',
      },
      
      // Remove authorization headers
      {
        name: 'auth-header-sanitizer',
        pattern: /"authorization"\s*:\s*"[^"]*"/gi,
        replacement: '"authorization":"[REDACTED]"',
      },
      
      // Remove API keys
      {
        name: 'api-key-sanitizer',
        pattern: /"api[_-]?key"\s*:\s*"[^"]*"/gi,
        replacement: '"api_key":"[REDACTED]"',
      },
      
      // Remove tokens
      {
        name: 'token-sanitizer',
        pattern: /"token"\s*:\s*"[^"]*"/gi,
        replacement: '"token":"[REDACTED]"',
      },
      
      // Remove credit card numbers (basic pattern)
      {
        name: 'credit-card-sanitizer',
        pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        replacement: '[CREDIT_CARD_REDACTED]',
      },
      
      // Remove email addresses in sensitive contexts
      {
        name: 'email-sanitizer',
        pattern: /"email"\s*:\s*"[^"]*@[^"]*"/gi,
        replacement: '"email":"[EMAIL_REDACTED]"',
        condition: (log: any) => log.context?.includes('Auth') || log.message?.includes('login'),
      },
    ];
  }

  /**
   * Sanitize log data before output
   */
  sanitizeLogData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitizers = this.getLogSanitizers();
    let sanitizedData = JSON.stringify(data);

    for (const sanitizer of sanitizers) {
      // Check condition if present
      if (sanitizer.condition && !sanitizer.condition(data)) {
        continue;
      }

      sanitizedData = sanitizedData.replace(sanitizer.pattern, sanitizer.replacement);
    }

    try {
      return JSON.parse(sanitizedData);
    } catch {
      return sanitizedData;
    }
  }

  /**
   * Create structured log entry
   */
  createLogEntry(
    level: string,
    message: string,
    context?: string,
    metadata?: any,
    traceId?: string,
  ): StructuredLogEntry {
    const timestamp = new Date().toISOString();
    const sanitizedMetadata = metadata ? this.sanitizeLogData(metadata) : undefined;

    return {
      timestamp,
      level,
      message,
      context,
      traceId,
      metadata: sanitizedMetadata,
      environment: process.env.NODE_ENV || 'development',
      service: 'product-api',
      version: '1.0.0',
    };
  }
}

/**
 * Log format configuration interface
 */
export interface LogFormat {
  timestamp: boolean;
  level: boolean;
  context: boolean;
  traceId: boolean;
  colorize: boolean;
  prettyPrint: boolean;
  includeStack: boolean;
}

/**
 * Log transport configuration interface
 */
export interface LogTransport {
  type: 'console' | 'file' | 'http';
  level: string;
  filename?: string;
  maxSize?: string;
  maxFiles?: number;
  format: LogFormat;
  filter?: (log: any) => boolean;
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  level: string;
  format: LogFormat;
  transports: LogTransport[];
  filters: LogFilter[];
  sanitizers: LogSanitizer[];
}

/**
 * Log filter interface
 */
export interface LogFilter {
  name: string;
  condition: (log: any) => boolean;
  action: 'exclude' | 'include' | 'rate-limit';
  limit?: number;
  window?: number;
}

/**
 * Log sanitizer interface
 */
export interface LogSanitizer {
  name: string;
  pattern: RegExp;
  replacement: string;
  condition?: (log: any) => boolean;
}

/**
 * Structured log entry interface
 */
export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  traceId?: string;
  metadata?: any;
  environment: string;
  service: string;
  version: string;
}