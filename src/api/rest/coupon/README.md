# Coupon REST API

This module provides REST API endpoints for coupon management in the lottery system.

## Overview

The Coupon REST API provides comprehensive functionality for:
- Generating unique coupon codes (single or batch)
- Managing coupon lifecycle (activation, deactivation, expiration)
- Validating coupons for redemption
- Exporting coupon data (CSV, PDF formats)
- Batch operations and statistics
- Admin management of coupons

## Architecture

### Controller: `CouponController`
- **Path**: `/api/coupons`
- **Authentication**: JWT-based authentication for admin endpoints
- **Public Endpoints**: Coupon validation endpoint is public

### Key Features

#### 1. Coupon Generation
- **Endpoint**: `POST /api/coupons/generate`
- **Authentication**: Required (Admin)
- **Features**:
  - Generate 1-1000 coupons in a single request
  - Configurable code length (8-12 characters)
  - Batch tracking with custom names
  - Expiration date configuration
  - Collision detection and retry mechanism
  - Metadata support

#### 2. Coupon Management
- **List Coupons**: `GET /api/coupons` - Paginated list with filtering
- **Get Coupon**: `GET /api/coupons/:id` - Get coupon by ID with relations
- **Get by Code**: `GET /api/coupons/code/:couponCode` - Get coupon by code
- **Deactivate**: `PUT /api/coupons/:id/deactivate` - Deactivate single coupon
- **Delete**: `DELETE /api/coupons/:id` - Delete unredeemed coupon

#### 3. Batch Operations
- **Batch Statistics**: `GET /api/coupons/batches` - All batch statistics
- **Single Batch**: `GET /api/coupons/batches/:batchId` - Specific batch stats
- **Deactivate Batch**: `PUT /api/coupons/batches/:batchId/deactivate` - Deactivate all coupons in batch

#### 4. Statistics and Analytics
- **Overall Stats**: `GET /api/coupons/statistics` - System-wide coupon statistics
- **Expiration Management**: `POST /api/coupons/expire` - Manually expire expired coupons

#### 5. Export Functionality
- **Export Data**: `POST /api/coupons/export` - Export as JSON response
- **Download Export**: `POST /api/coupons/export/download` - Direct file download
- **Formats**: CSV, PDF support
- **Filtering**: By status, batch, date range, specific codes

#### 6. Public Validation
- **Validate Coupon**: `POST /api/coupons/validate` - Public endpoint for coupon validation

## DTOs (Data Transfer Objects)

### REST-Specific DTOs
Located in `./dto/` directory:

- **GenerateCouponsRestDto**: Coupon generation parameters
- **CouponQueryRestDto**: Query parameters for listing coupons
- **CouponValidationRestDto**: Coupon code validation
- **CouponExportRestDto**: Export configuration and filters
- **BatchManagementRestDto**: Batch operation parameters

### Response DTOs
- Inherits from base coupon DTOs in `modules/coupon/dto/`
- Wrapped in standardized API response format
- Includes HATEOAS links for navigation
- Pagination metadata for list endpoints

## Authentication & Authorization

### Admin Endpoints
- Require JWT authentication via `JwtAuthGuard`
- Admin role verification where applicable
- Request user information injected via `@Request()` decorator

### Public Endpoints
- `/api/coupons/validate` - No authentication required
- Used by frontend for coupon validation before form submission

## Error Handling

### Comprehensive Error Responses
- Standardized error format using `ResponseBuilderService`
- Specific error codes for different failure scenarios:
  - `COUPON_GENERATION_ERROR`: Generation failures
  - `COUPON_NOT_FOUND`: Coupon lookup failures
  - `VALIDATION_ERROR`: Input validation failures
  - `EXPORT_ERROR`: Export operation failures
  - `BATCH_NOT_FOUND`: Batch operation failures

### Error Context
- Includes trace IDs for debugging
- Request path and timestamp
- Helpful hints for resolution

## Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123",
    "version": "1.0.0"
  },
  "links": {
    "self": "/api/coupons",
    "related": { /* HATEOAS links */ }
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": ["Quantity must be at least 1"]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123"
  }
}
```

## Testing

### Unit Tests
- **File**: `coupon.controller.spec.ts`
- **Coverage**: All controller methods
- **Mocking**: Service layer and dependencies
- **Scenarios**: Success cases, error handling, edge cases

### Integration Tests
- Database integration testing
- End-to-end API testing
- Authentication flow testing

## Dependencies

### Internal Dependencies
- `CouponService`: Business logic layer
- `ResponseBuilderService`: Standardized response formatting
- `JwtAuthGuard`: Authentication middleware

### External Dependencies
- `@nestjs/common`: Core NestJS decorators and utilities
- `@nestjs/swagger`: API documentation
- `class-validator`: Input validation
- `class-transformer`: Data transformation

## API Documentation

### Swagger Integration
- Comprehensive OpenAPI documentation
- Request/response examples
- Authentication requirements
- Error response schemas
- Interactive API explorer

### Documentation Features
- Detailed parameter descriptions
- Example values for all fields
- Enum value documentation
- Response schema definitions

## Performance Considerations

### Pagination
- Default page size: 10 items
- Maximum page size: 100 items
- Efficient database queries with proper indexing

### Caching
- Response caching for statistics endpoints
- Cache invalidation on data modifications

### Rate Limiting
- Applied at application level
- Stricter limits for generation endpoints

## Security Features

### Input Validation
- Comprehensive validation using class-validator
- SQL injection prevention
- XSS protection through input sanitization

### Authentication
- JWT token validation
- Role-based access control
- Request tracing for audit logs

### Data Protection
- Sensitive data filtering in responses
- Secure error messages (no internal details exposed)

## Usage Examples

### Generate Coupons
```bash
POST /api/coupons/generate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "quantity": 100,
  "codeLength": 10,
  "expirationDays": 30,
  "batchName": "Summer Campaign 2024"
}
```

### Validate Coupon (Public)
```bash
POST /api/coupons/validate
Content-Type: application/json

{
  "couponCode": "ABC123XYZ9"
}
```

### Export Coupons
```bash
POST /api/coupons/export
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "format": "csv",
  "status": "ACTIVE",
  "createdFrom": "2024-01-01T00:00:00.000Z",
  "includeBatchInfo": true
}
```

## Future Enhancements

### Planned Features
- Real-time coupon usage analytics
- Advanced filtering options
- Bulk coupon operations
- Integration with external systems
- Enhanced export formats (Excel, JSON)

### Performance Optimizations
- Database query optimization
- Response caching strategies
- Async processing for large operations
- Connection pooling improvements