import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Optional JWT Auth Guard
 * 
 * This guard allows requests to pass through even if no valid JWT token is provided.
 * It's useful for endpoints that can work with or without authentication,
 * providing different behavior based on whether a user is authenticated.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    
    // Check if this is a GraphQL request
    if (ctx.getType() === 'graphql') {
      return ctx.getContext().req;
    }
    
    // Otherwise, it's a REST request
    return context.switchToHttp().getRequest();
  }

  /**
   * Override handleRequest to make authentication optional
   * Returns the user if authentication succeeds, null if it fails
   */
  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}