import { PaginationMeta } from './pagination.interface';
import { HATEOASLinks } from './hateoas.interface';

/**
 * Standard success response structure for all API endpoints
 */
export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    traceId: string;
    version: string;
    pagination?: PaginationMeta;
  };
  links: HATEOASLinks;
}

/**
 * Standard error response structure for all API endpoints
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: ValidationError[] | string;
    hint?: string;
  };
  meta: {
    timestamp: string;
    traceId: string;
    version: string;
  };
  links: {
    self: string;
    documentation?: string;
  };
}

/**
 * Validation error details for field-level errors
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

/**
 * Generic response type that can be either success or error
 */
export type StandardResponse<T> = ApiResponse<T> | ApiErrorResponse;