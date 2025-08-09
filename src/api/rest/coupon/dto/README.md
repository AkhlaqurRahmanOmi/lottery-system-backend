# REST Coupon DTOs

This directory contains REST-specific Data Transfer Objects (DTOs) for the coupon management system. These DTOs extend the base coupon DTOs with REST-specific validation, documentation, and transformation logic.

## Structure

### Input DTOs

#### `GenerateCouponsRestDto`
- **Purpose**: REST-specific DTO for generating coupon codes
- **Extends**: `GenerateCouponsDto` from base module
- **Features**:
  - Swagger/OpenAPI documentation
  - REST-specific validation with proper error messages
  - Transform decorators for type conversion from query parameters
  - Comprehensive field validation (quantity: 1-1000, codeLength: 8-12, etc.)

#### `CouponQueryRestDto`
- **Purpose**: REST-specific DTO for querying and filtering coupons
- **Extends**: `CouponQueryDto` from base module
- **Features**:
  - Pagination support with validation
  - Search and filter capabilities
  - Date range filtering with ISO 8601 format
  - Sort options with validation
  - Transform decorators for query parameter conversion

#### `CouponValidationRestDto`
- **Purpose**: REST-specific DTO for validating coupon codes
- **Features**:
  - Coupon code format validation (8-12 chars, A-Z and 2-9 only)
  - Input sanitization and validation
  - Swagger documentation for public API

#### `CouponExportRestDto`
- **Purpose**: REST-specific DTO for exporting coupon data
- **Features**:
  - Export format selection (CSV, PDF, Excel)
  - Filtering options for export
  - Boolean flags for including additional information
  - Transform decorators for query parameter handling

#### `BatchManagementRestDto`
- **Purpose**: REST-specific DTOs for batch operations
- **Includes**:
  - `BatchStatisticsQueryRestDto`: Query batch statistics with pagination
  - `DeactivateBatchRestDto`: Deactivate entire batches with reason

### Response DTOs

#### `RestSuccessResponseDto<T>`
- **Purpose**: Generic wrapper for successful REST responses
- **Features**:
  - Consistent response structure
  - Success flag, status code, and timestamp
  - Generic data payload
  - Optional message field

#### Specific Response DTOs
- `GenerateCouponsRestResponseDto`: Response for coupon generation
- `CouponQueryRestResponseDto`: Response for coupon queries with pagination
- `CouponValidationRestResponseDto`: Response for coupon validation
- `BatchStatisticsRestResponseDto`: Response for batch statistics
- `ExportRestResponseDto`: Response for export operations
- `RestErrorResponseDto`: Standardized error response structure

## Usage Examples

### Generating Coupons
```typescript
// Controller usage
@Post('generate')
@ApiResponse({ type: GenerateCouponsRestResponseDto })
async generateCoupons(@Body() dto: GenerateCouponsRestDto) {
  // Implementation
}
```

### Querying Coupons
```typescript
// Controller usage
@Get()
@ApiResponse({ type: CouponQueryRestResponseDto })
async getCoupons(@Query() query: CouponQueryRestDto) {
  // Implementation
}
```

### Validating Coupons
```typescript
// Public endpoint usage
@Post('validate')
@ApiResponse({ type: CouponValidationRestResponseDto })
async validateCoupon(@Body() dto: CouponValidationRestDto) {
  // Implementation
}
```

## Validation Features

- **Type Safety**: All DTOs use TypeScript for compile-time type checking
- **Runtime Validation**: class-validator decorators for runtime validation
- **Transform Support**: class-transformer decorators for data conversion
- **Swagger Integration**: Complete OpenAPI documentation
- **Error Messages**: Descriptive validation error messages
- **Security**: Input sanitization and format validation

## API Documentation

All DTOs include comprehensive Swagger/OpenAPI documentation with:
- Field descriptions and examples
- Validation constraints
- Response schemas
- Error response formats
- Enum definitions

This ensures automatic API documentation generation and client SDK generation.