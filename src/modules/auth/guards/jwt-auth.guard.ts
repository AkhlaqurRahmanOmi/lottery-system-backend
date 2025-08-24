
import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate{
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    let req;
    if (ctx.getType() === 'graphql') {
      req = ctx.getContext().req;
    } else {
      req = context.switchToHttp().getRequest();
    }

    // Extract JWT from Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');

    try {
      // Decode payload (do not verify signature here, just decode)
      const payload = jwt.decode(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid JWT token');
      }
      req.user = payload;
    } catch (err) {
      throw new UnauthorizedException('Failed to decode JWT token');
    }
    return req;
  }
}