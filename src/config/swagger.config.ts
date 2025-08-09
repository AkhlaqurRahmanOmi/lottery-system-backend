import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Swagger/OpenAPI configuration for the Product API
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Product API')
    .setDescription(`
# Product API Documentation

A comprehensive RESTful API for managing products with standardized response structures, 
advanced caching mechanisms, HATEOAS implementation, and robust error handling.

## Key Features

- **Standardized Responses**: All endpoints return consistent response structures with metadata and HATEOAS links
- **Advanced Caching**: ETag-based caching with conditional requests (304 Not Modified)
- **HATEOAS Implementation**: Hypermedia links for API discoverability and navigation
- **Comprehensive Error Handling**: Detailed error responses with trace IDs and helpful hints
- **Filtering & Search**: Advanced query parameters for filtering, sorting, and searching
- **Field Selection**: Partial responses to reduce bandwidth usage
- **Pagination**: Efficient pagination with metadata and navigation links

## Response Structure

### Success Response
\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { /* actual response data */ },
  "meta": {
    "timestamp": "2025-01-29T10:30:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0",
    "pagination": { /* pagination info for list endpoints */ }
  },
  "links": {
    "self": "/api/v1/products/1",
    "related": {
      "update": { "href": "/api/v1/products/1", "method": "PATCH", "rel": "update" },
      "delete": { "href": "/api/v1/products/1", "method": "DELETE", "rel": "delete" }
    }
  }
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "price",
        "message": "Price must be a positive number",
        "value": -10
      }
    ],
    "hint": "Please check the API documentation for valid input formats"
  },
  "meta": {
    "timestamp": "2025-01-29T10:30:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0"
  },
  "links": {
    "self": "/api/v1/products",
    "documentation": "/api/docs"
  }
}
\`\`\`

## Caching

The API implements ETag-based caching:

- **ETag Header**: Each response includes an ETag header with a unique identifier
- **Conditional Requests**: Use \`If-None-Match\` header to check if resource has changed
- **304 Not Modified**: Server returns 304 status when resource hasn't changed
- **Cache-Control**: Appropriate cache directives based on resource sensitivity

Example:
\`\`\`
GET /api/v1/products/1
If-None-Match: "abc123def456"

Response: 304 Not Modified (if unchanged)
\`\`\`

## Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid input data, malformed JSON |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Unexpected server issues |

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Default Limit**: 100 requests per minute per IP
- **Headers**: Rate limit information included in response headers
- **Exceeded**: Returns 429 Too Many Requests when limit exceeded

## Trace IDs

Every request includes a unique trace ID for debugging and monitoring:
- **Generation**: Automatically generated UUID v4 for each request
- **Logging**: All logs include the trace ID for correlation
- **Response**: Trace ID included in all response metadata
    `)
    .setVersion('1.0.0')
    .setContact(
      'API Support',
      'https://example.com/support',
      'api-support@example.com'
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT'
    )
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.example.com', 'Production Server')
    .addTag('Products', 'Product management operations')
    .addTag('Meta', 'Metadata and utility endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Customize the document with additional examples and schemas
  document.components = {
    ...document.components,
    examples: {
      ProductExample: {
        summary: 'Product Example',
        value: {
          id: 1,
          name: 'MacBook Pro 16"',
          description: 'High-performance laptop for professionals',
          price: 2499.99,
          category: 'electronics',
          createdAt: '2025-01-29T10:00:00Z',
          updatedAt: '2025-01-29T10:00:00Z'
        }
      },
      SuccessResponseExample: {
        summary: 'Success Response Example',
        value: {
          success: true,
          statusCode: 200,
          message: 'Product retrieved successfully',
          data: {
            id: 1,
            name: 'MacBook Pro 16"',
            description: 'High-performance laptop for professionals',
            price: 2499.99,
            category: 'electronics',
            createdAt: '2025-01-29T10:00:00Z',
            updatedAt: '2025-01-29T10:00:00Z'
          },
          meta: {
            timestamp: '2025-01-29T10:30:00Z',
            traceId: '550e8400-e29b-41d4-a716-446655440000',
            version: '1.0.0'
          },
          links: {
            self: '/api/v1/products/1',
            related: {
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
          }
        }
      },
      ErrorResponseExample: {
        summary: 'Error Response Example',
        value: {
          success: false,
          statusCode: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: [
              {
                field: 'price',
                message: 'Price must be a positive number',
                value: -10
              }
            ],
            hint: 'Please check the API documentation for valid input formats'
          },
          meta: {
            timestamp: '2025-01-29T10:30:00Z',
            traceId: '550e8400-e29b-41d4-a716-446655440000',
            version: '1.0.0'
          },
          links: {
            self: '/api/v1/products',
            documentation: '/api/docs'
          }
        }
      },
      PaginatedResponseExample: {
        summary: 'Paginated Response Example',
        value: {
          success: true,
          statusCode: 200,
          message: 'Products retrieved successfully',
          data: [
            {
              id: 1,
              name: 'MacBook Pro 16"',
              description: 'High-performance laptop for professionals',
              price: 2499.99,
              category: 'electronics',
              createdAt: '2025-01-29T10:00:00Z',
              updatedAt: '2025-01-29T10:00:00Z'
            }
          ],
          meta: {
            timestamp: '2025-01-29T10:30:00Z',
            traceId: '550e8400-e29b-41d4-a716-446655440000',
            version: '1.0.0',
            pagination: {
              currentPage: 1,
              totalPages: 5,
              totalItems: 50,
              itemsPerPage: 10,
              hasNext: true,
              hasPrev: false
            }
          },
          links: {
            self: '/api/v1/products?page=1&limit=10',
            pagination: {
              first: '/api/v1/products?page=1&limit=10',
              next: '/api/v1/products?page=2&limit=10',
              last: '/api/v1/products?page=5&limit=10'
            }
          }
        }
      }
    }
  };

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Product API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });
}