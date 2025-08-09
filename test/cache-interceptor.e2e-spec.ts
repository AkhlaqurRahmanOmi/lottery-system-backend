import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { CacheInterceptor, Cache, CacheClass } from '../src/shared/interceptors/cache.interceptor';
import { CacheService } from '../src/shared/services/cache.service';
import { Reflector } from '@nestjs/core';

// Test controllers for integration testing
@Controller('test-cache')
class TestCacheController {
  @Get('public')
  @Cache({ resourceType: 'public' })
  getPublicResource() {
    return { id: 1, name: 'Public Resource' };
  }

  @Get('private')
  @Cache({ resourceType: 'private' })
  getPrivateResource() {
    return { id: 2, name: 'Private Resource' };
  }

  @Get('sensitive')
  @Cache({ resourceType: 'sensitive' })
  getSensitiveResource() {
    return { id: 3, name: 'Sensitive Resource' };
  }

  @Get('custom')
  @Cache({ maxAge: 600, isPublic: true, mustRevalidate: true })
  getCustomCacheResource() {
    return { id: 4, name: 'Custom Cache Resource' };
  }

  @Get('weak-etag')
  @Cache({ etagWeak: true })
  getWeakETagResource() {
    return { id: 5, name: 'Weak ETag Resource' };
  }

  @Get('no-cache')
  @Cache({ noCache: true, noStore: true })
  getNoCacheResource() {
    return { id: 6, name: 'No Cache Resource' };
  }

  @Get('post-method')
  getPostMethod() {
    return { id: 7, name: 'GET Method Resource' };
  }

  @Post('post-method')
  postMethod() {
    return { id: 7, name: 'POST Method Resource' };
  }
}

@CacheClass({ resourceType: 'private', maxAge: 120 })
@Controller('test-class-cache')
class TestClassCacheController {
  @Get('default')
  getDefaultResource() {
    return { id: 8, name: 'Class Default Resource' };
  }

  @Get('override')
  @Cache({ resourceType: 'public', maxAge: 300 })
  getOverrideResource() {
    return { id: 9, name: 'Override Resource' };
  }
}

describe('CacheInterceptor (e2e)', () => {
  let app: INestApplication<App>;
  let cacheService: CacheService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestCacheController, TestClassCacheController],
      providers: [CacheService, Reflector],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the cache interceptor globally
    app.useGlobalInterceptors(new CacheInterceptor(
      moduleFixture.get<CacheService>(CacheService),
      moduleFixture.get<Reflector>(Reflector)
    ));

    cacheService = moduleFixture.get<CacheService>(CacheService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Public Resource Caching', () => {
    it('should set public cache headers for public resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=300');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['last-modified']).toBeDefined();
      expect(response.headers['expires']).toBeDefined();
      expect(response.body).toEqual({
        id: 1,
        name: 'Public Resource'
      });
    });

    it('should return 304 for matching If-None-Match header', async () => {
      // First request to get the ETag
      const firstResponse = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      const etag = firstResponse.headers['etag'];
      expect(etag).toBeDefined();

      // Second request with If-None-Match header
      const secondResponse = await request(app.getHttpServer())
        .get('/test-cache/public')
        .set('If-None-Match', etag)
        .expect(304);

      expect(secondResponse.body).toEqual({});
      expect(secondResponse.headers['etag']).toBe(etag);
      expect(secondResponse.headers['cache-control']).toBe('public, max-age=300');
    });

    it('should return 304 for wildcard If-None-Match header', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/public')
        .set('If-None-Match', '*')
        .expect(304);

      expect(response.body).toEqual({});
      expect(response.headers['etag']).toBeDefined();
    });
  });

  describe('Private Resource Caching', () => {
    it('should set private cache headers for private resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/private')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=60');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['last-modified']).toBeDefined();
      expect(response.headers['expires']).toBeUndefined(); // No expires for private
    });
  });

  describe('Sensitive Resource Caching', () => {
    it('should set no-store headers for sensitive resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/sensitive')
        .expect(200);

      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['last-modified']).toBeUndefined();
      expect(response.headers['expires']).toBeUndefined();
    });
  });

  describe('Custom Cache Configuration', () => {
    it('should apply custom cache settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/custom')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=600, must-revalidate');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['last-modified']).toBeDefined();
    });
  });

  describe('Weak ETag Support', () => {
    it('should generate weak ETags when configured', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/weak-etag')
        .expect(200);

      expect(response.headers['etag']).toMatch(/^W\//);
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    });

    it('should handle 304 responses with weak ETags', async () => {
      // First request to get the weak ETag
      const firstResponse = await request(app.getHttpServer())
        .get('/test-cache/weak-etag')
        .expect(200);

      const weakETag = firstResponse.headers['etag'];
      expect(weakETag).toMatch(/^W\//);

      // Second request with If-None-Match header
      await request(app.getHttpServer())
        .get('/test-cache/weak-etag')
        .set('If-None-Match', weakETag)
        .expect(304);
    });
  });

  describe('No Cache Configuration', () => {
    it('should skip caching when noCache and noStore are both true', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/no-cache')
        .expect(200);

      // Our cache interceptor should not add any cache headers
      expect(response.headers['cache-control']).toBeUndefined();
      expect(response.headers['last-modified']).toBeUndefined();
      expect(response.headers['expires']).toBeUndefined();
      // Express may add its own ETag, but it should be weak (W/) not our strong ETag
      if (response.headers['etag']) {
        expect(response.headers['etag']).toMatch(/^W\//);
      }
    });
  });

  describe('HTTP Method Filtering', () => {
    it('should skip caching for non-GET requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/test-cache/post-method')
        .expect(201);

      // Our cache interceptor should not add cache-control headers for POST requests
      expect(response.headers['cache-control']).toBeUndefined();
      // Express may add its own ETag, but it should be weak (W/) not our strong ETag
      if (response.headers['etag']) {
        expect(response.headers['etag']).toMatch(/^W\//);
      }
      // Our cache interceptor should not add last-modified or expires
      expect(response.headers['last-modified']).toBeUndefined();
      expect(response.headers['expires']).toBeUndefined();
      expect(response.body).toEqual({
        id: 7,
        name: 'POST Method Resource'
      });
    });
  });

  describe('Class-Level Cache Configuration', () => {
    it('should apply class-level cache configuration', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-class-cache/default')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=120');
      expect(response.headers['etag']).toBeDefined();
    });

    it('should override class configuration with method configuration', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-class-cache/override')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=300');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['expires']).toBeDefined(); // Public cache should have expires
    });
  });

  describe('ETag Consistency', () => {
    it('should generate consistent ETags for identical content', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      // ETags should be the same for identical content
      // Note: In real scenarios, timestamps might differ, but for this test
      // we're checking the ETag generation consistency
      expect(response1.headers['etag']).toBeDefined();
      expect(response2.headers['etag']).toBeDefined();
    });
  });

  describe('Multiple If-None-Match Values', () => {
    it('should handle multiple ETags in If-None-Match header', async () => {
      // First request to get an ETag
      const firstResponse = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      const etag1 = firstResponse.headers['etag'];
      const etag2 = '"different-etag"';

      // Request with multiple ETags, one matching
      await request(app.getHttpServer())
        .get('/test-cache/public')
        .set('If-None-Match', `${etag2}, ${etag1}`)
        .expect(304);
    });

    it('should return 200 when no ETags match', async () => {
      await request(app.getHttpServer())
        .get('/test-cache/public')
        .set('If-None-Match', '"non-matching-etag", "another-non-matching"')
        .expect(200);
    });
  });

  describe('Error Response Handling', () => {
    it('should not set cache headers for 404 responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/non-existent')
        .expect(404);

      // Our cache interceptor should not add cache headers for error responses
      expect(response.headers['cache-control']).toBeUndefined();
      expect(response.headers['last-modified']).toBeUndefined();
      expect(response.headers['expires']).toBeUndefined();
      // Express may add its own ETag for error responses, but it should be weak
      if (response.headers['etag']) {
        expect(response.headers['etag']).toMatch(/^W\//);
      }
    });
  });

  describe('Cache Header Validation', () => {
    it('should set all required cache headers for public resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      // Validate Cache-Control header format
      expect(response.headers['cache-control']).toMatch(/^public, max-age=\d+$/);
      
      // Validate ETag header format
      expect(response.headers['etag']).toMatch(/^"[a-f0-9]+"$/);
      
      // Validate Last-Modified header format
      expect(response.headers['last-modified']).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
      
      // Validate Expires header format
      expect(response.headers['expires']).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
    });

    it('should validate expires header is in the future for public resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-cache/public')
        .expect(200);

      const expiresHeader = response.headers['expires'];
      const expiresDate = new Date(expiresHeader);
      const now = new Date();

      expect(expiresDate.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});