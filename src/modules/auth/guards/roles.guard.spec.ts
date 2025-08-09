import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RolesGuard } from './roles.guard';
import { AdminRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    const mockUser = {
      id: 1,
      username: 'testadmin',
      email: 'test@example.com',
      role: AdminRole.ADMIN,
      isActive: true,
    };

    it('should return true when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
      
      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should return true when user has required role (REST)', () => {
      mockReflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: mockUser }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // Mock GqlExecutionContext to return non-GraphQL type
      const mockGqlContext = {
        getType: () => 'http',
      };
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true when user has required role (GraphQL)', () => {
      mockReflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN]);

      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // Mock GqlExecutionContext for GraphQL
      const mockGqlContext = {
        getType: () => 'graphql',
        getContext: () => ({ req: { user: mockUser } }),
      };
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([AdminRole.SUPER_ADMIN]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: mockUser }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // Mock GqlExecutionContext to return non-GraphQL type
      const mockGqlContext = {
        getType: () => 'http',
      };
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when user is not present', () => {
      mockReflector.getAllAndOverride.mockReturnValue([AdminRole.ADMIN]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // Mock GqlExecutionContext to return non-GraphQL type
      const mockGqlContext = {
        getType: () => 'http',
      };
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        AdminRole.SUPER_ADMIN,
        AdminRole.ADMIN,
      ]);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: mockUser }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // Mock GqlExecutionContext to return non-GraphQL type
      const mockGqlContext = {
        getType: () => 'http',
      };
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });
});