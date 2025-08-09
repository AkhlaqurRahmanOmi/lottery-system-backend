# Authentication REST API

This module provides REST endpoints for admin authentication in the lottery coupon management system.

## Endpoints

### POST /api/auth/login
Authenticate admin user and return JWT tokens with profile information.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "expiresIn": 900
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123",
    "version": "1.0.0"
  },
  "links": {
    "self": "http://localhost:3000/api/auth"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "statusCode": 401,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials",
    "hint": "Please check your username and password"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123",
    "version": "1.0.0"
  },
  "links": {
    "self": "http://localhost:3000/api/auth/login",
    "documentation": "/api/docs"
  }
}
```

### POST /api/auth/refresh
Generate a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123",
    "version": "1.0.0"
  },
  "links": {
    "self": "http://localhost:3000/api/auth"
  }
}
```

### POST /api/auth/logout
Logout the authenticated admin user and invalidate session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logout successful",
  "data": {
    "message": "Successfully logged out"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123",
    "version": "1.0.0"
  },
  "links": {
    "self": "http://localhost:3000/api/auth"
  }
}
```

### GET /api/auth/profile
Get the authenticated admin user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "lastLogin": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "traceId": "trace-123",
    "version": "1.0.0"
  },
  "links": {
    "self": "http://localhost:3000/api/auth/1"
  }
}
```

## Error Handling

All endpoints follow the standard error response format:

- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Authentication required or invalid credentials
- **500 Internal Server Error**: Server-side errors

## Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt with 12 salt rounds
- Role-based authorization (ADMIN, SUPER_ADMIN)
- Token expiration (15 minutes for access tokens, 7 days for refresh tokens)
- Secure logout functionality

## Swagger Documentation

The API endpoints are fully documented with Swagger/OpenAPI. Access the documentation at `/api/docs` when the server is running.

## Usage Example

```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const { accessToken } = data;

// Use token for authenticated requests
const profileResponse = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```