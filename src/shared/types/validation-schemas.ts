import { IsBoolean, IsNumber, IsString, IsOptional, IsObject, ValidateNested, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Validation schema for pagination metadata
 */
export class PaginationMetaSchema {
  @IsNumber()
  currentPage: number;

  @IsNumber()
  totalPages: number;

  @IsNumber()
  totalItems: number;

  @IsNumber()
  itemsPerPage: number;

  @IsBoolean()
  hasNext: boolean;

  @IsBoolean()
  hasPrev: boolean;
}

/**
 * Validation schema for response metadata
 */
export class ResponseMetaSchema {
  @IsString()
  timestamp: string;

  @IsString()
  traceId: string;

  @IsString()
  version: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationMetaSchema)
  pagination?: PaginationMetaSchema;
}

/**
 * Validation schema for HATEOAS links
 */
export class HATEOASLinksSchema {
  @IsString()
  self: string;

  @IsOptional()
  @IsObject()
  related?: { [key: string]: any };

  @IsOptional()
  @IsObject()
  pagination?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

/**
 * Validation schema for validation errors
 */
export class ValidationErrorSchema {
  @IsString()
  field: string;

  @IsString()
  message: string;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsString()
  constraint?: string;
}

/**
 * Validation schema for error details
 */
export class ErrorDetailsSchema {
  @IsString()
  code: string;

  @IsString()
  message: string;

  @IsOptional()
  details?: ValidationErrorSchema[] | string;

  @IsOptional()
  @IsString()
  hint?: string;
}

/**
 * Validation schema for pagination options
 */
export class PaginationOptionsSchema {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Validation schema for sort options
 */
export class SortOptionsSchema {
  @IsString()
  field: string;

  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc';
}

/**
 * Validation schema for search options
 */
export class SearchOptionsSchema {
  @IsString()
  query: string;

  @IsArray()
  @IsString({ each: true })
  fields: string[];
}