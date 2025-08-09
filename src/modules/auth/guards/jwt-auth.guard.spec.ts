import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
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
});