import { Injectable, Scope } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * Service for managing trace IDs throughout the request lifecycle
 * Uses REQUEST scope to maintain trace ID per request
 */
@Injectable({ scope: Scope.REQUEST })
export class TraceIdService {
  private traceId: string;

  constructor() {
    this.traceId = this.generateTraceId();
  }

  /**
   * Generate a new UUID v4 trace ID
   */
  generateTraceId(): string {
    return randomUUID();
  }

  /**
   * Get the current trace ID for this request
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Set a custom trace ID (useful for incoming requests with existing trace IDs)
   */
  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  /**
   * Create a new trace ID and return it
   */
  createNewTraceId(): string {
    this.traceId = this.generateTraceId();
    return this.traceId;
  }

  /**
   * Get trace ID for logging context
   */
  getLoggingContext(): { traceId: string } {
    return {
      traceId: this.traceId
    };
  }

  /**
   * Validate if a string is a valid UUID v4 format
   */
  isValidTraceId(traceId: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(traceId);
  }

  /**
   * Extract trace ID from request headers or generate new one
   */
  extractOrGenerateTraceId(headers: Record<string, any>): string {
    const headerTraceId = headers['x-trace-id'] || headers['X-Trace-ID'];
    
    if (headerTraceId && this.isValidTraceId(headerTraceId)) {
      this.setTraceId(headerTraceId);
      return headerTraceId;
    }
    
    return this.createNewTraceId();
  }
}