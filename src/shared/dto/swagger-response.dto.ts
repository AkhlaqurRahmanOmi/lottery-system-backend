import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger DTO for HATEOAS links
 */
export class HATEOASLinkDto {
  @ApiProperty({
    description: 'URL for the action',
    example: '/api/v1/products/1'
  })
  href: string;

  @ApiProperty({
    description: 'HTTP method for the action',
    example: 'PATCH',
    enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  })
  method: string;

  @ApiProperty({
    description: 'Relationship type',
    example: 'update'
  })
  rel: string;

  @ApiPropertyOptional({
    description: 'Content type for the action',
    example: 'application/json'
  })
  type?: string;
}

/**
 * Swagger DTO for HATEOAS links collection
 */
export class HATEOASLinksDto {
  @ApiProperty({
    description: 'Self-referencing link',
    example: '/api/v1/products/1'
  })
  self: string;

  @ApiPropertyOptional({
    description: 'Related action links',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/HATEOASLinkDto'
    },
    example: {
      update: {
        href: '/api/v1/products/1',
        method: 'PATCH',
        rel: 'update'
      },
      delete: {
        href: '/api/v1/products/1',
        method: 'DELETE',
        rel: 'delete'
      }
    }
  })
  related?: Record<string, HATEOASLinkDto>;

  @ApiPropertyOptional({
    description: 'Pagination links',
    type: 'object',
    additionalProperties: { type: 'string' },
    example: {
      first: '/api/v1/products?page=1&limit=10',
      next: '/api/v1/products?page=2&limit=10',
      prev: '/api/v1/products?page=1&limit=10',
      last: '/api/v1/products?page=5&limit=10'
    }
  })
  pagination?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

/**
 * Swagger DTO for pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
    minimum: 0
  })
  totalPages: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 50,
    minimum: 0
  })
  totalItems: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false
  })
  hasPrev: boolean;
}

/**
 * Swagger DTO for response metadata
 */
export class ResponseMetaDto {
  @ApiProperty({
    description: 'Response timestamp in ISO format',
    example: '2025-01-29T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Unique trace ID for request tracking',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  traceId: string;

  @ApiProperty({
    description: 'API version',
    example: '1.0.0'
  })
  version: string;

  @ApiPropertyOptional({
    description: 'Pagination metadata (only for paginated responses)',
    type: PaginationMetaDto
  })
  pagination?: PaginationMetaDto;
}

/**
 * Swagger DTO for validation error details
 */
export class ValidationErrorDto {
  @ApiProperty({
    description: 'Field name that failed validation',
    example: 'price'
  })
  field: string;

  @ApiProperty({
    description: 'Validation error message',
    example: 'Price must be a positive number'
  })
  message: string;

  @ApiPropertyOptional({
    description: 'The value that failed validation',
    example: -10
  })
  value?: any;

  @ApiPropertyOptional({
    description: 'Validation constraint that was violated',
    example: 'isPositive'
  })
  constraint?: string;
}

/**
 * Swagger DTO for error details
 */
export class ErrorDetailsDto {
  @ApiProperty({
    description: 'Error code',
    example: 'VALIDATION_ERROR'
  })
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid input data'
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Detailed error information',
    oneOf: [
      { type: 'array', items: { $ref: '#/components/schemas/ValidationErrorDto' } },
      { type: 'string' }
    ],
    example: [
      {
        field: 'price',
        message: 'Price must be a positive number',
        value: -10
      }
    ]
  })
  details?: ValidationErrorDto[] | string;

  @ApiPropertyOptional({
    description: 'Helpful hint for resolving the error',
    example: 'Please check the API documentation for valid input formats'
  })
  hint?: string;
}

/**
 * Swagger DTO for error response links
 */
export class ErrorLinksDto {
  @ApiProperty({
    description: 'Self-referencing link',
    example: '/api/v1/products'
  })
  self: string;

  @ApiPropertyOptional({
    description: 'Link to API documentation',
    example: '/api/docs'
  })
  documentation?: string;
}

/**
 * Swagger DTO for Product entity
 */
export class ProductDto {
  @ApiProperty({
    description: 'Unique product identifier',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Product name',
    example: 'MacBook Pro 16"'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-performance laptop for professionals',
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: 'Product price in USD',
    example: 2499.99
  })
  price: number;

  @ApiProperty({
    description: 'Product category',
    example: 'electronics'
  })
  category: string;

  @ApiProperty({
    description: 'Product creation timestamp',
    example: '2025-01-29T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Product last update timestamp',
    example: '2025-01-29T10:30:00Z'
  })
  updatedAt: Date;
}

/**
 * Swagger DTO for successful API response
 */
export class ApiSuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates successful response',
    example: true
  })
  success: true;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Response data'
  })
  data: T;

  @ApiProperty({
    description: 'Response metadata',
    type: ResponseMetaDto
  })
  meta: ResponseMetaDto;

  @ApiProperty({
    description: 'HATEOAS links',
    type: HATEOASLinksDto
  })
  links: HATEOASLinksDto;
}

/**
 * Swagger DTO for error API response
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Indicates error response',
    example: false
  })
  success: false;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error details',
    type: ErrorDetailsDto
  })
  error: ErrorDetailsDto;

  @ApiProperty({
    description: 'Response metadata',
    type: ResponseMetaDto
  })
  meta: ResponseMetaDto;

  @ApiProperty({
    description: 'Error response links',
    type: ErrorLinksDto
  })
  links: ErrorLinksDto;
}

/**
 * Specific response DTOs for different endpoints
 */
export class ProductResponseDto extends ApiSuccessResponseDto<ProductDto> {
  @ApiProperty({
    description: 'Product data',
    type: ProductDto
  })
  declare data: ProductDto;
}

export class ProductListResponseDto extends ApiSuccessResponseDto<ProductDto[]> {
  @ApiProperty({
    description: 'Array of products',
    type: [ProductDto]
  })
  declare data: ProductDto[];
}

export class CategoryListResponseDto extends ApiSuccessResponseDto<string[]> {
  @ApiProperty({
    description: 'Array of category names',
    type: [String],
    example: ['electronics', 'clothing', 'books']
  })
  declare data: string[];
}

export class DeleteResponseDto extends ApiSuccessResponseDto<null> {
  @ApiProperty({
    description: 'Null data for delete operations',
    example: null,
    nullable: true
  })
  declare data: null;
}