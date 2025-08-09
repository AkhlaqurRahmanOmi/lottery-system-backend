import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { GlobalResponseInterceptor, EXCLUDE_GLOBAL_RESPONSE_KEY } from './global-response.interceptor';
import { ResponseBuilderService } from '../services/response-builder.service';
import { TraceIdService } from '../services/trace-id.service';
import { CacheService } from '../services/cache.service';
import { ApiResponse, HATEOASLinks } from '../types';

describe('GlobalResponseInterceptor', () => {
  let interceptor: GlobalResponseInterceptor;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;
  let traceIdService: jest.Mocked<TraceIdService>;
  let cacheService: jest.Mocked<CacheService>;
  let reflector: jest.Mocked<Reflector>;

  const mockRequest = {
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
    path: '/api/v1/products',
    method: 'GET',
    url: '/api/v1/products',
    query: {},
    headers: {},
    body: {}
  };

  const mockResponse = {
    statusCode: 200
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse)
    }),
    getHandler: jest.fn(),
    getClass: jest.fn()
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn()
  } as unknown as CallHandler;

  const createMockLinks = (): HATEOASLinks => ({
    self: '/api/v1/products',
    related: {}
  });

  const createMockResponse = <T>(data: T): ApiResponse<T> => ({
    success: true,
    statusCode: 200,
    message: 'Resource retrieved successfully',
    data,
    meta: { 
      timestamp: '2023-01-01T00:00:00.000Z',
      traceId: 'test-trace-id',
      version: '1.0.0'
    },
    links: createMockLinks()
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalResponseInterceptor,
        {
          provide: ResponseBuilderService,
          useValue: {
            buildSuccessResponse: jest.fn(),
            generateHATEOASLinks: jest.fn()
          }
        },
        {
          provide: TraceIdService,
          useValue: {
            getTraceId: jest.fn().mockReturnValue('test-trace-id')
          }
        },
        {
          provide: CacheService,
          useValue: {}
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn()
          }
        }
      ]
    }).compile();

    interceptor = module.get<GlobalResponseInterceptor>(GlobalResponseInterceptor);
    responseBuilder = module.get(ResponseBuilderService);
    traceIdService = module.get(TraceIdService);
    cacheService = module.get(CacheService);
    reflector = module.get(Reflector);

    // Reset mocks
    jest.clearAllMocks();
    
    // Reset execution context mock
    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse)
    });
  });

  describe('intercept', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should skip transformation when explicitly excluded', (done) => {
      const testData = { test: 'data' };
      reflector.get.mockReturnValue(true);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBe(testData);
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip transformation for GraphQL endpoints', (done) => {
      const testData = { test: 'data' };
      const graphqlRequest = { ...mockRequest, url: '/graphql' };
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(graphqlRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse)
      });

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBe(testData);
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip transformation for GraphQL content-type', (done) => {
      const testData = { test: 'data' };
      const graphqlRequest = { 
        ...mockRequest, 
        headers: { 'content-type': 'application/graphql' }
      };
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(graphqlRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse)
      });

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBe(testData);
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip transformation for GraphQL query in body', (done) => {
      const testData = { test: 'data' };
      const graphqlRequest = { 
        ...mockRequest, 
        body: { query: 'query { products { id name } }' }
      };
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(graphqlRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse)
      });

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBe(testData);
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip transformation for null responses (304 Not Modified)', (done) => {
      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBeNull();
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip transformation for already standardized responses', (done) => {
      const standardizedResponse = {
        success: true,
        statusCode: 200,
        meta: { traceId: 'test' },
        links: { self: '/test' }
      };

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(standardizedResponse));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBe(standardizedResponse);
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip transformation for error responses', (done) => {
      const errorData = { error: 'test error' };
      const errorResponse = { statusCode: 400 };
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(errorResponse)
      });

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(errorData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(result).toBe(errorData);
        expect(responseBuilder.buildSuccessResponse).not.toHaveBeenCalled();
        done();
      });
    });

    it('should transform simple data to standard response format', (done) => {
      const testData = { id: 1, name: 'Test Product' };
      const expectedLinks = createMockLinks();
      const expectedResponse = createMockResponse(testData);

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));
      responseBuilder.generateHATEOASLinks.mockReturnValue(expectedLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue(expectedResponse);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(result => {
        expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
          testData,
          'Resource retrieved successfully',
          200,
          'test-trace-id',
          expectedLinks,
          undefined
        );
        expect(result).toEqual(expectedResponse);
        done();
      });
    });

    it('should extract pagination metadata from response', (done) => {
      const paginatedData = {
        items: [{ id: 1, name: 'Product 1' }],
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNext: true,
        hasPrev: false
      };

      const expectedLinks = createMockLinks();
      const expectedPagination = {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNext: true,
        hasPrev: false
      };

      const mockResponse = createMockResponse([{ id: 1, name: 'Product 1' }]);

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(paginatedData));
      responseBuilder.generateHATEOASLinks.mockReturnValue(expectedLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue(mockResponse);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
          [{ id: 1, name: 'Product 1' }], // items extracted
          'Resource retrieved successfully',
          200,
          'test-trace-id',
          expectedLinks,
          expectedPagination
        );
        done();
      });
    });

    it('should generate correct HATEOAS links for individual resource', (done) => {
      const testData = { id: 1, name: 'Test Product' };
      const resourceRequest = { ...mockRequest, path: '/api/v1/products/1' };
      const mockLinks = createMockLinks();
      const mockApiResponse = createMockResponse(testData);
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(resourceRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse)
      });

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue(mockApiResponse);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(responseBuilder.generateHATEOASLinks).toHaveBeenCalledWith({
          baseUrl: 'http://localhost:3000/api/v1/products/1',
          resourceId: '1',
          resourceState: testData,
          action: 'get'
        });
        done();
      });
    });

    it('should use correct response message for different HTTP methods', (done) => {
      const testData = { id: 1, name: 'Test Product' };
      const postRequest = { ...mockRequest, method: 'POST' };
      const createdResponse = { statusCode: 201 };
      const mockLinks = createMockLinks();
      const mockApiResponse = createMockResponse(testData);
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(postRequest),
        getResponse: jest.fn().mockReturnValue(createdResponse)
      });

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue(mockApiResponse);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
          testData,
          'Resource created successfully',
          201,
          'test-trace-id',
          mockLinks,
          undefined
        );
        done();
      });
    });

    it('should handle array responses correctly', (done) => {
      const testData = [{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }];
      const mockLinks = createMockLinks();
      const mockApiResponse = createMockResponse(testData);

      reflector.get.mockReturnValue(false);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));
      responseBuilder.generateHATEOASLinks.mockReturnValue(mockLinks);
      responseBuilder.buildSuccessResponse.mockReturnValue(mockApiResponse);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
          testData,
          'Resource retrieved successfully',
          200,
          'test-trace-id',
          mockLinks,
          undefined
        );
        done();
      });
    });
  });

  describe('EXCLUDE_GLOBAL_RESPONSE_KEY', () => {
    it('should have correct metadata key', () => {
      expect(EXCLUDE_GLOBAL_RESPONSE_KEY).toBe('exclude_global_response');
    });
  });
});