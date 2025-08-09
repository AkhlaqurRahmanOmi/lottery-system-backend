# API Migration Guide

This guide helps existing API consumers migrate to the new standardized Product API with enhanced features and response structures.

## Overview of Changes

The Product API has been completely redesigned to provide:

- **Standardized Response Structures**: All endpoints now return consistent response formats
- **HATEOAS Implementation**: Hypermedia links for API discoverability
- **Advanced Caching**: ETag-based caching with conditional requests
- **Enhanced Error Handling**: Detailed error responses with trace IDs
- **Improved Query Parameters**: Advanced filtering, sorting, and pagination
- **Field Selection**: Partial responses to reduce bandwidth

## Breaking Changes

### 1. Response Structure Changes

**Before (Old API):**
```json
{
  "id": 1,
  "name": "MacBook Pro",
  "price": 2499.99,
  "category": "electronics"
}
```

**After (New API):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "data": {
    "id": 1,
    "name": "MacBook Pro",
    "price": 2499.99,
    "category": "electronics",
    "description": null,
    "createdAt": "2025-01-29T10:00:00Z",
    "updatedAt": "2025-01-29T10:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-29T10:30:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0"
  },
  "links": {
    "self": "/api/v1/products/1",
    "related": {
      "update": {
        "href": "/api/v1/products/1",
        "method": "PATCH",
        "rel": "update"
      },
      "delete": {
        "href": "/api/v1/products/1",
        "method": "DELETE",
        "rel": "delete"
      }
    }
  }
}
```

**Migration Action Required:**
- Update your client code to access the actual data via the `data` property
- Handle the new response structure with `success`, `statusCode`, `message`, `meta`, and `links`

### 2. Error Response Changes

**Before (Old API):**
```json
{
  "error": "Product not found",
  "statusCode": 404
}
```

**After (New API):**
```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Product not found",
    "details": "Product with ID 999 does not exist",
    "hint": "Please verify the product ID and try again"
  },
  "meta": {
    "timestamp": "2025-01-29T10:30:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0"
  },
  "links": {
    "self": "/api/v1/products/999",
    "documentation": "/api/docs"
  }
}
```

**Migration Action Required:**
- Update error handling to check the `success` field
- Access error details via `error.message` instead of direct `error` property
- Utilize the `traceId` for debugging and support requests

### 3. Pagination Changes

**Before (Old API):**
```json
{
  "products": [...],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**After (New API):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [...],
  "meta": {
    "timestamp": "2025-01-29T10:30:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0",
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "links": {
    "self": "/api/v1/products?page=1&limit=10",
    "pagination": {
      "first": "/api/v1/products?page=1&limit=10",
      "next": "/api/v1/products?page=2&limit=10",
      "last": "/api/v1/products?page=5&limit=10"
    }
  }
}
```

**Migration Action Required:**
- Access pagination metadata via `meta.pagination`
- Use pagination links from `links.pagination` for navigation
- Update pagination logic to use `hasNext` and `hasPrev` flags

## New Features

### 1. HATEOAS Links

The API now includes hypermedia links to help you discover available actions:

```json
{
  "links": {
    "self": "/api/v1/products/1",
    "related": {
      "update": {
        "href": "/api/v1/products/1",
        "method": "PATCH",
        "rel": "update"
      },
      "delete": {
        "href": "/api/v1/products/1",
        "method": "DELETE",
        "rel": "delete"
      }
    }
  }
}
```

**Benefits:**
- Dynamic API navigation
- Reduced hardcoded URLs in client applications
- Better API discoverability

### 2. ETag Caching

The API now supports ETag-based caching for improved performance:

**Request:**
```http
GET /api/v1/products/1
If-None-Match: "abc123def456"
```

**Response (if unchanged):**
```http
HTTP/1.1 304 Not Modified
ETag: "abc123def456"
```

**Benefits:**
- Reduced bandwidth usage
- Faster response times
- Automatic cache invalidation

**Implementation:**
```javascript
// Store ETag from initial request
const response = await fetch('/api/v1/products/1');
const etag = response.headers.get('ETag');

// Use ETag in subsequent requests
const cachedResponse = await fetch('/api/v1/products/1', {
  headers: {
    'If-None-Match': etag
  }
});

if (cachedResponse.status === 304) {
  // Use cached data
} else {
  // Use new data and update ETag
}
```

### 3. Field Selection

Reduce bandwidth by requesting only specific fields:

**Request:**
```http
GET /api/v1/products?fields=id,name,price
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "MacBook Pro",
      "price": 2499.99
    }
  ],
  "meta": {...},
  "links": {...}
}
```

### 4. Advanced Filtering and Search

Enhanced query parameters for better data retrieval:

```http
GET /api/v1/products?category=electronics&minPrice=1000&maxPrice=3000&search=laptop&sortBy=price&sortOrder=asc&page=1&limit=10
```

### 5. Trace IDs

Every request now includes a unique trace ID for debugging:

```json
{
  "meta": {
    "traceId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Benefits:**
- Easier debugging and support
- Request correlation across logs
- Better monitoring and observability

## Migration Steps

### Step 1: Update Response Handling

**Old Code:**
```javascript
const response = await fetch('/api/products/1');
const product = await response.json();
console.log(product.name); // Direct access
```

**New Code:**
```javascript
const response = await fetch('/api/v1/products/1');
const result = await response.json();

if (result.success) {
  const product = result.data;
  console.log(product.name); // Access via data property
} else {
  console.error('Error:', result.error.message);
  console.log('Trace ID:', result.meta.traceId);
}
```

### Step 2: Update Error Handling

**Old Code:**
```javascript
try {
  const response = await fetch('/api/products/1');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
} catch (error) {
  console.error(error.message);
}
```

**New Code:**
```javascript
try {
  const response = await fetch('/api/v1/products/1');
  const result = await response.json();
  
  if (!result.success) {
    console.error('Error Code:', result.error.code);
    console.error('Error Message:', result.error.message);
    console.error('Trace ID:', result.meta.traceId);
    
    if (result.error.details) {
      console.error('Details:', result.error.details);
    }
    
    if (result.error.hint) {
      console.log('Hint:', result.error.hint);
    }
  }
} catch (error) {
  console.error('Network error:', error.message);
}
```

### Step 3: Update Pagination Logic

**Old Code:**
```javascript
const response = await fetch('/api/products?page=1&limit=10');
const result = await response.json();

const products = result.products;
const hasMore = result.page * result.limit < result.total;
```

**New Code:**
```javascript
const response = await fetch('/api/v1/products?page=1&limit=10');
const result = await response.json();

if (result.success) {
  const products = result.data;
  const pagination = result.meta.pagination;
  
  const hasMore = pagination.hasNext;
  const nextPageUrl = result.links.pagination?.next;
}
```

### Step 4: Implement ETag Caching

```javascript
class ApiClient {
  constructor() {
    this.etagCache = new Map();
  }

  async getProduct(id) {
    const url = `/api/v1/products/${id}`;
    const etag = this.etagCache.get(url);
    
    const headers = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const response = await fetch(url, { headers });
    
    if (response.status === 304) {
      // Return cached data
      return this.dataCache.get(url);
    }

    const result = await response.json();
    
    if (result.success) {
      // Cache ETag and data
      const newEtag = response.headers.get('ETag');
      if (newEtag) {
        this.etagCache.set(url, newEtag);
        this.dataCache.set(url, result);
      }
    }

    return result;
  }
}
```

## Endpoint Changes

### New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products/search/:query` | Search products by text |
| GET | `/api/v1/products/category/:category` | Get products by category |
| GET | `/api/v1/products/price-range/:min/:max` | Get products by price range |
| GET | `/api/v1/products/meta/categories` | Get all available categories |

### Updated Endpoints

| Method | Old Endpoint | New Endpoint | Changes |
|--------|--------------|--------------|---------|
| GET | `/api/products` | `/api/v1/products` | Enhanced query parameters, standardized response |
| GET | `/api/products/:id` | `/api/v1/products/:id` | Standardized response, HATEOAS links |
| POST | `/api/products` | `/api/v1/products` | Enhanced validation, standardized response |
| PATCH | `/api/products/:id` | `/api/v1/products/:id` | Partial updates, standardized response |
| DELETE | `/api/products/:id` | `/api/v1/products/:id` | Standardized response |

## Testing Your Migration

### 1. Response Structure Test

```javascript
// Test that responses have the expected structure
const response = await fetch('/api/v1/products/1');
const result = await response.json();

console.assert(typeof result.success === 'boolean');
console.assert(typeof result.statusCode === 'number');
console.assert(typeof result.message === 'string');
console.assert(result.data !== undefined);
console.assert(result.meta !== undefined);
console.assert(result.links !== undefined);
```

### 2. Error Handling Test

```javascript
// Test error response structure
const response = await fetch('/api/v1/products/999999');
const result = await response.json();

if (!result.success) {
  console.assert(result.error.code !== undefined);
  console.assert(result.error.message !== undefined);
  console.assert(result.meta.traceId !== undefined);
}
```

### 3. Pagination Test

```javascript
// Test pagination structure
const response = await fetch('/api/v1/products?page=1&limit=5');
const result = await response.json();

if (result.success && result.meta.pagination) {
  console.assert(typeof result.meta.pagination.currentPage === 'number');
  console.assert(typeof result.meta.pagination.totalPages === 'number');
  console.assert(typeof result.meta.pagination.hasNext === 'boolean');
}
```

## Support and Troubleshooting

### Common Issues

1. **"Cannot read property 'name' of undefined"**
   - **Cause**: Trying to access data directly instead of via `result.data`
   - **Solution**: Update code to access `result.data.name`

2. **Pagination not working**
   - **Cause**: Using old pagination properties
   - **Solution**: Use `result.meta.pagination` instead of direct properties

3. **Error handling not working**
   - **Cause**: Checking `response.ok` instead of `result.success`
   - **Solution**: Check `result.success` after parsing JSON

### Getting Help

When reporting issues, please include:

1. **Trace ID**: Found in `result.meta.traceId`
2. **Request details**: Method, URL, headers, body
3. **Expected vs actual response**
4. **Client code snippet**

### Gradual Migration Strategy

1. **Phase 1**: Update response parsing to handle new structure
2. **Phase 2**: Implement proper error handling with trace IDs
3. **Phase 3**: Add ETag caching for performance
4. **Phase 4**: Utilize HATEOAS links for dynamic navigation
5. **Phase 5**: Implement field selection for bandwidth optimization

## Conclusion

The new Product API provides significant improvements in consistency, performance, and developer experience. While the migration requires updates to client code, the benefits include:

- Better error handling and debugging
- Improved performance through caching
- Enhanced API discoverability
- Consistent response structures
- Advanced filtering and search capabilities

For additional support, please refer to the [API Documentation](/api/docs) or contact our support team with your trace ID for faster assistance.