import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    
    // Check if this is a GraphQL request
    if (ctx.getType() === 'graphql') {
      return ctx.getContext().req;
    }
    
    // Otherwise, it's a REST request
    return context.switchToHttp().getRequest();
  }
}