import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Request, Response, NextFunction } from 'express';
import { EnhancedHttpLoggerMiddleware } from './enhanced-http-logger.middleware';
import { TraceIdService } from '../services/trace-id.service';

describe('EnhancedHttpLoggerMiddleware', () => {
  let middleware: EnhancedHttpLoggerMiddleware;
  let mockLogger: any;
  let mockTraceIdService: jest.Mocked<TraceIdService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedHttpLoggerMiddleware,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger
        },
        {
          provide: TraceIdService,
          useValue: {
            extractOrGenerateTraceId: jest.fn().mockReturnValue('test-trace-id')
          }
        }
      ]
    }).compile();

    middleware = module.get<EnhancedHttpLoggerMiddleware>(EnhancedHttpLoggerMiddleware);
    mockTraceIdService = module.get(TraceIdService);

    // Setup mock request
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/v1/products',
      body: {},
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1'
      },
      socket: {
        remoteAddress: '127.0.0.1'
      }
    } as any;

    // Setup mock response
    mockResponse = {
      statusCode: 200,
      on: jest.fn(),
      get: jest.fn(),
      headersSent: false
    } as any;

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should be defined', () => {
      expect(middleware).toBeDefined();
    });

    it('should skip logging for excluded paths', () => {
      mockRequest.originalUrl = '/favicon.ico';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
      expect(mockTraceIdService.extractOrGenerateTraceId).not.toHaveBeenCalled();
    });

    it('should skip logging for GraphQL introspection queries', () => {
      mockRequest.originalUrl = '/graphql';
      mockRequest.body = {
        operationName: 'IntrospectionQuery',
        query: 'query IntrospectionQuery { __schema { types { name } } }'
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('should extract trace ID and add to request', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockTraceIdService.extractOrGenerateTraceId).toHaveBeenCalledWith(mockRequest.headers);
      expect((mockRequest as any).traceId).toBe('test-trace-id');
      expect((mockRequest as any).requestId).toBeDefined();
    });

    it('should log incoming request with trace ID', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        '[INCOMING] GET /api/v1/products',
        'HttpLogger',
        expect.objectContaining({
          traceId: 'test-trace-id',
          method: 'GET',
          url: '/api/v1/products',
          ip: '192.168.1.1',
          userAgent: 'test-agent'
        })
      );
    });

    it('should extract client IP from x-forwarded-for header', () => {
      mockRequest.headers!['x-forwarded-for'] = '203.0.113.1, 192.168.1.1';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          ip: '203.0.113.1'
        })
      );
    });

    it('should extract client IP from x-real-ip header when x-forwarded-for is not present', () => {
      delete mockRequest.headers!['x-forwarded-for'];
      mockRequest.headers!['x-real-ip'] = '203.0.113.2';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          ip: '203.0.113.2'
        })
      );
    });

    it('should fall back to socket remote address when headers are not present', () => {
      delete mockRequest.headers!['x-forwarded-for'];
      delete mockRequest.headers!['x-real-ip'];

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          ip: '127.0.0.1'
        })
      );
    });

    it('should handle GraphQL requests and extract operation details', () => {
      mockRequest.originalUrl = '/graphql';
      mockRequest.body = {
        operationName: 'GetProducts',
        query: 'query GetProducts { products { id name } }'
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          operationType: 'Query',
          operationName: 'GetProducts'
        })
      );
    });

    it('should detect mutation operations', () => {
      mockRequest.originalUrl = '/graphql';
      mockRequest.body = {
        operationName: 'CreateProduct',
        query: 'mutation CreateProduct($input: CreateProductInput!) { createProduct(input: $input) { id } }'
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          operationType: 'Mutation',
          operationName: 'CreateProduct'
        })
      );
    });

    it('should detect subscription operations', () => {
      mockRequest.originalUrl = '/graphql';
      mockRequest.body = {
        operationName: 'ProductUpdates',
        query: 'subscription ProductUpdates { productUpdated { id name } }'
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          operationType: 'Subscription',
          operationName: 'ProductUpdates'
        })
      );
    });

    it('should handle anonymous GraphQL operations', () => {
      mockRequest.originalUrl = '/graphql';
      mockRequest.body = {
        query: 'query { products { id name } }'
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(String),
        'HttpLogger',
        expect.objectContaining({
          operationType: 'Query',
          operationName: 'anonymous'
        })
      );
    });

    it('should register response event handlers', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockResponse.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockResponse.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should call next middleware', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('response handling', () => {
    let finishCallback: Function;
    let closeCallback: Function;
    let errorCallback: Function;

    beforeEach(() => {
      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: Function) => {
        if (event === 'finish') finishCallback = callback;
        if (event === 'close') closeCallback = callback;
        if (event === 'error') errorCallback = callback;
      });

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    });

    it('should log successful response completion', (done) => {
      mockResponse.statusCode = 200;
      (mockResponse.get as jest.Mock).mockReturnValue('1024');

      // Simulate response finish after a delay
      setTimeout(() => {
        finishCallback();

        setTimeout(() => {
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('[SUCCESS] GET /api/v1/products - 200'),
            'HttpLogger',
            expect.objectContaining({
              traceId: 'test-trace-id',
              statusCode: 200,
              responseTime: expect.any(Number),
              contentLength: 1024
            })
          );
          done();
        }, 10);
      }, 10);
    });

    it('should log error response completion', (done) => {
      mockResponse.statusCode = 500;

      setTimeout(() => {
        finishCallback();

        setTimeout(() => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('[ERROR] GET /api/v1/products - 500'),
            'HttpLogger',
            expect.objectContaining({
              traceId: 'test-trace-id',
              statusCode: 500,
              responseTime: expect.any(Number)
            })
          );
          done();
        }, 10);
      }, 10);
    });

    it('should log performance warning for slow requests', (done) => {
      mockResponse.statusCode = 200;

      // Wait for a longer time to simulate slow request
      setTimeout(() => {
        finishCallback();

        setTimeout(() => {
          // Check if performance warning was logged (response time should be > 1000ms due to setTimeout)
          expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('[PERFORMANCE] Slow request detected'),
            'HttpLogger',
            expect.objectContaining({
              traceId: 'test-trace-id'
            })
          );
          done();
        }, 10);
      }, 1100); // Wait 1100ms to ensure response time > 1000ms
    });

    it('should log aborted requests', () => {
      mockResponse.headersSent = false;

      closeCallback();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[ABORTED] GET /api/v1/products'),
        'HttpLogger',
        expect.objectContaining({
          traceId: 'test-trace-id',
          status: 'ABORTED'
        })
      );
    });

    it('should log response errors', () => {
      const testError = new Error('Test error');

      errorCallback(testError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] GET /api/v1/products - Test error'),
        'HttpLogger',
        expect.objectContaining({
          traceId: 'test-trace-id',
          error: 'Test error',
          stack: expect.any(String)
        })
      );
    });
  });

  describe('error rate monitoring', () => {
    it('should track error rates and log warnings for high error rates', (done) => {
      // Simulate multiple requests with high error rate
      for (let i = 0; i < 10; i++) {
        const req = { ...mockRequest } as Request;
        const res = { 
          ...mockResponse, 
          statusCode: i < 8 ? 500 : 200, // 80% error rate
          on: jest.fn().mockImplementation((event: string, callback: Function) => {
            if (event === 'finish') {
              setTimeout(callback, 1);
            }
          })
        } as Response;
        
        middleware.use(req, res, mockNext);
      }

      // Wait for all responses to complete
      setTimeout(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR_RATE] High error rate detected'),
          'HttpLogger',
          expect.objectContaining({
            ip: '192.168.1.1',
            errorRate: expect.any(String),
            totalRequests: expect.any(Number),
            errorRequests: expect.any(Number)
          })
        );
        done();
      }, 50);
    });
  });
});