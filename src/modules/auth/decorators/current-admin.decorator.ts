import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Admin } from '@prisma/client';

export const CurrentAdmin = createParamDecorator(
  (data: unknown, context: ExecutionContext): Admin => {
    // Check if this is a GraphQL request
    const gqlContext = GqlExecutionContext.create(context);
    if (gqlContext.getType() === 'graphql') {
      return gqlContext.getContext().req.user;
    }
    
    // Otherwise, it's a REST request
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);