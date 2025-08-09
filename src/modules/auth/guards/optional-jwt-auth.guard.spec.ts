import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OptionalJwtAuthGuard],
    }).compile();

    guard = module.get<OptionalJwtAuthGuard>(OptionalJwtAuthGuard);
  });

  describe('getRequest', () => {
    it('should return GraphQL request when context is GraphQL', () => {
      const mockRequest = { headers: { authorization: 'Bearer token' } };
      const mockGqlContext = {
        getContext: () => ({ req: mockRequest }),
        getType: () => 'graphql',
      };

      // Mock GqlExecutionContext.create
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const mockExecutionContext = {} as ExecutionContext;
      const result = guard.getRequest(mockExecutionContext);

      expect(result).toBe(mockRequest);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
    });

    it('should return HTTP request when context is not GraphQL', () => {
      const mockRequest = { headers: { authorization: 'Bearer token' } };
      const mockGqlContext = {
        getType: () => 'http',
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Mock GqlExecutionContext.create
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const result = guard.getRequest(mockExecutionContext);

      expect(result).toBe(mockRequest);
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication succeeds', () => {
      const mockUser = { id: 1, username: 'testuser' };
      
      const result = guard.handleRequest(null, mockUser);
      
      expect(result).toBe(mockUser);
    });

    it('should return null when there is an error', () => {
      const mockError = new Error('Authentication failed');
      const mockUser = { id: 1, username: 'testuser' };
      
      const result = guard.handleRequest(mockError, mockUser);
      
      expect(result).toBeNull();
    });

    it('should return null when user is not provided', () => {
      const result = guard.handleRequest(null, null);
      
      expect(result).toBeNull();
    });

    it('should return null when user is undefined', () => {
      const result = guard.handleRequest(null, undefined);
      
      expect(result).toBeNull();
    });
  });
});