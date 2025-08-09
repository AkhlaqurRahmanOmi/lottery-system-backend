/**
 * JWT Strategy and Guards Usage Examples
 * 
 * This file demonstrates how to use the implemented JWT strategy and guards
 * in REST controllers and GraphQL resolvers.
 */

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard } from '../guards';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin } from '../decorators/current-admin.decorator';

// ============================================================================
// REST Controller Examples
// ============================================================================

@Controller('admin')
export class AdminControllerExample {
  
  /**
   * Protected endpoint - requires valid JWT token
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentAdmin() admin: any) {
    return {
      message: 'Admin profile retrieved successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  /**
   * Role-protected endpoint - requires SUPER_ADMIN role
   */
  @Post('create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async createAdmin(@CurrentAdmin() admin: any) {
    return {
      message: 'Only super admins can create new admins',
      createdBy: admin.username,
    };
  }

  /**
   * Multiple roles allowed - SUPER_ADMIN or ADMIN
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  async getDashboard(@CurrentAdmin() admin: any) {
    return {
      message: 'Dashboard data',
      userRole: admin.role,
    };
  }

  /**
   * Optional authentication - works with or without token
   */
  @Get('public-stats')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicStats(@CurrentAdmin() admin?: any) {
    return {
      message: 'Public statistics',
      isAuthenticated: !!admin,
      adminInfo: admin ? { username: admin.username, role: admin.role } : null,
    };
  }
}

// ============================================================================
// GraphQL Resolver Examples
// ============================================================================

@Resolver()
export class AdminResolverExample {
  
  /**
   * Protected GraphQL query - requires valid JWT token
   */
  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async adminProfile(@CurrentAdmin() admin: any): Promise<string> {
    return `Hello ${admin.username}, your role is ${admin.role}`;
  }

  /**
   * Role-protected GraphQL mutation - requires SUPER_ADMIN role
   */
  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  async deleteAdmin(@CurrentAdmin() admin: any): Promise<string> {
    return `Admin deletion requested by ${admin.username}`;
  }

  /**
   * Multiple roles allowed in GraphQL
   */
  @Query(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  async systemHealth(@CurrentAdmin() admin: any): Promise<string> {
    return `System health checked by ${admin.role}`;
  }

  /**
   * Optional authentication in GraphQL
   */
  @Query(() => String)
  @UseGuards(OptionalJwtAuthGuard)
  async publicInfo(@CurrentAdmin() admin?: any): Promise<string> {
    if (admin) {
      return `Authenticated user: ${admin.username}`;
    }
    return 'Public information for anonymous user';
  }
}

// ============================================================================
// Usage Notes
// ============================================================================

/**
 * GUARD USAGE PATTERNS:
 * 
 * 1. JwtAuthGuard:
 *    - Use for endpoints that require authentication
 *    - Validates JWT token and populates request.user
 *    - Throws UnauthorizedException if token is invalid/missing
 * 
 * 2. RolesGuard:
 *    - Always use together with JwtAuthGuard
 *    - Checks if authenticated user has required role(s)
 *    - Use @Roles() decorator to specify required roles
 * 
 * 3. OptionalJwtAuthGuard:
 *    - Use for endpoints that can work with or without authentication
 *    - Populates request.user if valid token is provided
 *    - Does not throw error if token is missing/invalid
 * 
 * DECORATOR USAGE:
 * 
 * 1. @CurrentAdmin():
 *    - Extracts authenticated admin from request
 *    - Works with both REST and GraphQL
 *    - Returns null if used with OptionalJwtAuthGuard and no token
 * 
 * 2. @Roles():
 *    - Specifies required roles for the endpoint
 *    - Can accept multiple roles (user needs only one)
 *    - Must be used with RolesGuard
 * 
 * SECURITY CONSIDERATIONS:
 * 
 * 1. Always use HTTPS in production
 * 2. Keep JWT secrets secure and rotate them regularly
 * 3. Use appropriate token expiration times
 * 4. Consider implementing token blacklisting for logout
 * 5. Log authentication failures for security monitoring
 * 6. Validate admin status (isActive) in JWT strategy
 */