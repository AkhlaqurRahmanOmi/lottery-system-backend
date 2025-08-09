import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { CacheInterceptor, Cache, CacheClass, CACHE_CONFIG_KEY } from './cache.interceptor';
import { CacheService } from '../services/cache.service';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let cacheService: CacheService;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        CacheService,
        Reflector,
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    cacheService = module.get<CacheService>(CacheService);
    reflector = module.get<Reflector>(Reflector);

    // Mock request and response
    mockRequest = {
      method: 'GET',
      headers: {},
    };

    mockResponse = {
      statusCode: 200,
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock execution context
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    // Mock call handler
    mockCallHandler = {
      handle: () => of({ id: 1, name: 'test' }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should skip caching for non-GET requests', (done) => {
      mockRequest.method = 'POST';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should skip caching for error responses', (done) => {
      mockResponse.statusCode = 404;
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should set cache headers for successful GET requests', (done) => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
          expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
          expect(mockResponse.setHeader).toHaveBeenCalledWith('Last-Modified', expect.any(String));
          done();
        },
      });
    });

    it('should return 304 for matching If-None-Match header', (done) => {
      const testData = { id: 1, name: 'test' };
      const etag = cacheService.generateETag(testData);
      mockRequest.headers['if-none-match'] = etag;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED);
          expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', etag);
          done();
        },
      });
    });

    it('should handle wildcard If-None-Match header', (done) => {
      mockRequest.headers['if-none-match'] = '*';

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED);
          done();
        },
      });
    });

    it('should use method-level cache configuration', (done) => {
      const methodConfig = { resourceType: 'private' as const, maxAge: 120 };
      jest.spyOn(reflector, 'get')
        .mockReturnValueOnce(methodConfig) // method config
        .mockReturnValueOnce(undefined); // class config

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, max-age=120');
          done();
        },
      });
    });

    it('should use class-level cache configuration when method config is not available', (done) => {
      const classConfig = { resourceType: 'sensitive' as const };
      jest.spyOn(reflector, 'get')
        .mockReturnValueOnce(undefined) // method config
        .mockReturnValueOnce(classConfig); // class config

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
          done();
        },
      });
    });

    it('should merge class and method configurations with method taking precedence', (done) => {
      const classConfig = { resourceType: 'public' as const, maxAge: 300 };
      const methodConfig = { maxAge: 600, mustRevalidate: true };
      
      jest.spyOn(reflector, 'get')
        .mockReturnValueOnce(methodConfig) // method config
        .mockReturnValueOnce(classConfig); // class config

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600, must-revalidate');
          done();
        },
      });
    });

    it('should generate weak ETags when configured', (done) => {
      const config = { etagWeak: true };
      jest.spyOn(reflector, 'get')
        .mockReturnValueOnce(config)
        .mockReturnValueOnce(undefined);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\//));
          done();
        },
      });
    });

    it('should skip caching when both noStore and noCache are true', (done) => {
      const config = { noStore: true, noCache: true };
      jest.spyOn(reflector, 'get')
        .mockReturnValueOnce(config)
        .mockReturnValueOnce(undefined);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 1, name: 'test' });
          expect(mockResponse.setHeader).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('Cache decorator', () => {
    it('should set metadata on method', () => {
      const config = { resourceType: 'private' as const };
      
      class TestController {
        @Cache(config)
        testMethod() {
          return 'test';
        }
      }

      const metadata = Reflect.getMetadata(CACHE_CONFIG_KEY, TestController.prototype.testMethod);
      expect(metadata).toEqual(config);
    });
  });

  describe('CacheClass decorator', () => {
    it('should set metadata on class', () => {
      const config = { resourceType: 'public' as const };
      
      @CacheClass(config)
      class TestController {}

      const metadata = Reflect.getMetadata(CACHE_CONFIG_KEY, TestController);
      expect(metadata).toEqual(config);
    });
  });

  describe('buildCacheOptions', () => {
    it('should use predefined options for resourceType', () => {
      const config = { resourceType: 'private' as const };
      const options = (interceptor as any).buildCacheOptions(config);
      
      expect(options).toEqual({
        maxAge: 60,
        isPublic: false,
        noCache: false,
        noStore: false,
      });
    });

    it('should override predefined options with specific configuration', () => {
      const config = { 
        resourceType: 'public' as const, 
        maxAge: 600,
        mustRevalidate: true 
      };
      const options = (interceptor as any).buildCacheOptions(config);
      
      expect(options).toEqual({
        maxAge: 600,
        isPublic: true,
        noCache: false,
        noStore: false,
        mustRevalidate: true,
      });
    });

    it('should build options from individual properties when no resourceType', () => {
      const config = { 
        maxAge: 120,
        isPublic: false,
        noCache: true 
      };
      const options = (interceptor as any).buildCacheOptions(config);
      
      expect(options).toEqual({
        maxAge: 120,
        isPublic: false,
        noCache: true,
      });
    });
  });

  describe('setCacheHeaders', () => {
    it('should set all provided headers', () => {
      const headers = {
        'ETag': '"abc123"',
        'Cache-Control': 'public, max-age=300',
        'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
      };

      (interceptor as any).setCacheHeaders(mockResponse, headers);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', '"abc123"');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Last-Modified', 'Wed, 21 Oct 2015 07:28:00 GMT');
    });

    it('should skip empty header values', () => {
      const headers = {
        'ETag': '"abc123"',
        'Cache-Control': '',
        'Last-Modified': undefined as any,
      };

      (interceptor as any).setCacheHeaders(mockResponse, headers);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', '"abc123"');
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith('Cache-Control', '');
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith('Last-Modified', undefined);
    });
  });
});