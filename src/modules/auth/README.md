# Authentication Module

This module provides comprehensive JWT-based authentication and authorization for the Lottery Coupon Management System.

## Features

- **JWT Token Management**: Secure token generation, validation, and refresh
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Role-Based Access Control**: Support for ADMIN and SUPER_ADMIN roles
- **Dual API Support**: Works with both REST and GraphQL endpoints
- **Optional Authentication**: Support for endpoints that work with or without authentication
- **Session Management**: Login, logout, and token refresh functionality

## Components

### Strategies

#### JwtStrategy
- Validates JWT tokens using Passport.js
- Extracts admin information from token payload
- Handles both active/inactive admin validation
- Supports both REST and GraphQL contexts

### Guards

#### JwtAuthGuard
- **Purpose**: Protects endpoints requiring authentication
- **Usage**: Apply to controllers/resolvers that need authenticated users
- **Behavior**: Throws `UnauthorizedException` if token is invalid/missing

#### RolesGuard
- **Purpose**: Implements role-based access control
- **Usage**: Use with `@Roles()` decorator to specify required roles
- **Behavior**: Checks if authenticated user has required role(s)

#### OptionalJwtAuthGuard
- **Purpose**: For endpoints that can work with or without authentication
- **Usage**: Apply when you want different behavior for authenticated vs anonymous users
- **Behavior**: Populates user if token is valid, null otherwise (no exception)

### Decorators

#### @CurrentAdmin()
- Extracts authenticated admin from request context
- Works with both REST and GraphQL
- Returns the admin object or null (with OptionalJwtAuthGuard)

#### @Roles(...roles)
- Specifies required roles for endpoint access
- Accepts multiple roles (user needs only one)
- Must be used with RolesGuard

## Usage Examples

### REST Controller

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';

@Controller('admin')
export class AdminController {
  
  // Basic authentication required
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentAdmin() admin: any) {
    return { admin };
  }

  // Role-based access control
  @Post('create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async createAdmin(@CurrentAdmin() admin: any) {
    // Only SUPER_ADMIN can access this
    return { message: 'Admin created' };
  }

  // Multiple roles allowed
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  async getDashboard(@CurrentAdmin() admin: any) {
    // Both SUPER_ADMIN and ADMIN can access
    return { dashboard: 'data' };
  }

  // Optional authentication
  @Get('public-stats')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicStats(@CurrentAdmin() admin?: any) {
    // Works with or without authentication
    return { 
      stats: 'data',
      isAuthenticated: !!admin 
    };
  }
}
```

### GraphQL Resolver

```typescript
import { Resolver, Query, Mutation, UseGuards } from '@nestjs/graphql';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';

@Resolver()
export class AdminResolver {
  
  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async adminProfile(@CurrentAdmin() admin: any): Promise<string> {
    return `Hello ${admin.username}`;
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async deleteAdmin(@CurrentAdmin() admin: any): Promise<string> {
    return 'Admin deleted';
  }
}
```

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lottery_db
```

### Module Import

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  // ...
})
export class AppModule {}
```

## Security Features

### Password Security
- Uses bcrypt with 12 salt rounds
- Secure password comparison
- Password reset functionality

### Token Security
- JWT tokens with configurable expiration
- Refresh token mechanism
- Token validation with error handling
- Admin status validation (active/inactive)

### Role-Based Access Control
- Two-tier role system (ADMIN, SUPER_ADMIN)
- Flexible role assignment
- Method-level role protection

## Testing

The module includes comprehensive tests for:
- JWT Strategy validation
- Guard functionality (both REST and GraphQL)
- Role-based access control
- Error handling scenarios
- Optional authentication behavior

Run tests:
```bash
npm test -- src/modules/auth/
```

## API Endpoints

### Authentication Endpoints
- `POST /auth/login` - Admin login
- `POST /auth/logout` - Admin logout
- `POST /auth/refresh` - Refresh access token

### Protected Endpoints
All admin endpoints require authentication and appropriate roles.

## Error Handling

The module provides specific error types:
- `UnauthorizedException` - Invalid/missing token
- `ForbiddenException` - Insufficient permissions
- Custom error messages for different scenarios

## Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT secrets** regularly
3. **Use appropriate token expiration** times
4. **Log authentication events** for security monitoring
5. **Validate admin status** in all authentication flows
6. **Implement rate limiting** for auth endpoints
7. **Use strong passwords** and enforce password policies

## Dependencies

- `@nestjs/jwt` - JWT token handling
- `@nestjs/passport` - Authentication strategies
- `passport-jwt` - JWT strategy implementation
- `bcrypt` - Password hashing
- `@prisma/client` - Database access

## Future Enhancements

- Token blacklisting for secure logout
- Multi-factor authentication (MFA)
- Session management with Redis
- OAuth integration
- Audit logging for all authentication events