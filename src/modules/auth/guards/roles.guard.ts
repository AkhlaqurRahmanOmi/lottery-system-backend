import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AdminRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    let user;
    
    // Check if this is a GraphQL request
    const gqlContext = GqlExecutionContext.create(context);
    if (gqlContext.getType() === 'graphql') {
      user = gqlContext.getContext().req.user;
    } else {
      // REST request
      const request = context.switchToHttp().getRequest();
      user = request.user;
    }

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}