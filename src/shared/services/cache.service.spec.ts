import { Test, TestingModule } from '@nestjs/testing';
import { CacheService, CacheOptions, ETagOptions } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateETag', () => {
    it('should generate strong ETag by default', () => {
      const content = { id: 1, name: 'test' };
      const etag = service.generateETag(content);
      
      expect(etag).toMatch(/^"[a-f0-9]+"$/);
      expect(etag.startsWith('W/')).toBe(false);
    });

    it('should generate weak ETag when specified', () => {
      const content = { id: 1, name: 'test' };
      const etag = service.generateETag(content, { weak: true });
      
      expect(etag).toMatch(/^W\/"[a-f0-9]+"$/);
    });

    it('should generate consistent ETags for same content', () => {
      const content = { id: 1, name: 'test' };
      const etag1 = service.generateETag(content);
      const etag2 = service.generateETag(content);
      
      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different content', () => {
      const content1 = { id: 1, name: 'test1' };
      const content2 = { id: 2, name: 'test2' };
      const etag1 = service.generateETag(content1);
      const etag2 = service.generateETag(content2);
      
      expect(etag1).not.toBe(etag2);
    });

    it('should handle string content', () => {
      const content = 'test string';
      const etag = service.generateETag(content);
      
      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should use different algorithms when specified', () => {
      const content = { id: 1, name: 'test' };
      const md5ETag = service.generateETag(content, { algorithm: 'md5' });
      const sha1ETag = service.generateETag(content, { algorithm: 'sha1' });
      const sha256ETag = service.generateETag(content, { algorithm: 'sha256' });
      
      expect(md5ETag).not.toBe(sha1ETag);
      expect(sha1ETag).not.toBe(sha256ETag);
      expect(md5ETag).not.toBe(sha256ETag);
    });
  });

  describe('compareETags', () => {
    it('should return true for identical strong ETags', () => {
      const etag = '"abc123"';
      const result = service.compareETags(etag, etag);
      
      expect(result).toBe(true);
    });

    it('should return true for identical weak ETags', () => {
      const etag = 'W/"abc123"';
      const result = service.compareETags(etag, etag);
      
      expect(result).toBe(true);
    });

    it('should return true for weak and strong ETags with same value', () => {
      const weakETag = 'W/"abc123"';
      const strongETag = '"abc123"';
      const result1 = service.compareETags(weakETag, strongETag);
      const result2 = service.compareETags(strongETag, weakETag);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false for different ETags', () => {
      const etag1 = '"abc123"';
      const etag2 = '"def456"';
      const result = service.compareETags(etag1, etag2);
      
      expect(result).toBe(false);
    });

    it('should return false for empty or null ETags', () => {
      expect(service.compareETags('', '"abc123"')).toBe(false);
      expect(service.compareETags('"abc123"', '')).toBe(false);
      expect(service.compareETags(null as any, '"abc123"')).toBe(false);
      expect(service.compareETags('"abc123"', null as any)).toBe(false);
    });
  });

  describe('matchesAnyETag', () => {
    it('should return true for wildcard', () => {
      const result = service.matchesAnyETag('*', '"abc123"');
      expect(result).toBe(true);
    });

    it('should return true for matching single ETag', () => {
      const result = service.matchesAnyETag('"abc123"', '"abc123"');
      expect(result).toBe(true);
    });

    it('should return true for matching ETag in list', () => {
      const result = service.matchesAnyETag('"abc123", "def456"', '"def456"');
      expect(result).toBe(true);
    });

    it('should return false for non-matching ETags', () => {
      const result = service.matchesAnyETag('"abc123", "def456"', '"ghi789"');
      expect(result).toBe(false);
    });

    it('should handle whitespace in ETag list', () => {
      const result = service.matchesAnyETag(' "abc123" , "def456" ', '"def456"');
      expect(result).toBe(true);
    });

    it('should return false for empty values', () => {
      expect(service.matchesAnyETag('', '"abc123"')).toBe(false);
      expect(service.matchesAnyETag('"abc123"', '')).toBe(false);
    });
  });

  describe('generateCacheControl', () => {
    it('should generate default cache control', () => {
      const result = service.generateCacheControl();
      expect(result).toBe('public, max-age=300');
    });

    it('should generate private cache control', () => {
      const options: CacheOptions = { isPublic: false, maxAge: 60 };
      const result = service.generateCacheControl(options);
      expect(result).toBe('private, max-age=60');
    });

    it('should generate no-cache directive', () => {
      const options: CacheOptions = { noCache: true };
      const result = service.generateCacheControl(options);
      expect(result).toBe('no-cache');
    });

    it('should generate no-store directive', () => {
      const options: CacheOptions = { noStore: true };
      const result = service.generateCacheControl(options);
      expect(result).toBe('no-store');
    });

    it('should include must-revalidate when specified', () => {
      const options: CacheOptions = { mustRevalidate: true };
      const result = service.generateCacheControl(options);
      expect(result).toBe('public, max-age=300, must-revalidate');
    });

    it('should prioritize no-store over other directives', () => {
      const options: CacheOptions = { 
        noStore: true, 
        noCache: true, 
        isPublic: true, 
        maxAge: 300 
      };
      const result = service.generateCacheControl(options);
      expect(result).toBe('no-store');
    });
  });

  describe('generateCacheHeaders', () => {
    it('should generate complete cache headers', () => {
      const content = { id: 1, name: 'test' };
      const headers = service.generateCacheHeaders(content);
      
      expect(headers).toHaveProperty('ETag');
      expect(headers).toHaveProperty('Cache-Control');
      expect(headers).toHaveProperty('Last-Modified');
      expect(headers).toHaveProperty('Expires');
      expect(headers['Cache-Control']).toBe('public, max-age=300');
    });

    it('should not include Last-Modified for no-cache', () => {
      const content = { id: 1, name: 'test' };
      const headers = service.generateCacheHeaders(content, { noCache: true });
      
      expect(headers).toHaveProperty('ETag');
      expect(headers).toHaveProperty('Cache-Control');
      expect(headers).not.toHaveProperty('Last-Modified');
      expect(headers).not.toHaveProperty('Expires');
    });

    it('should not include Expires for private cache', () => {
      const content = { id: 1, name: 'test' };
      const headers = service.generateCacheHeaders(content, { isPublic: false });
      
      expect(headers).toHaveProperty('ETag');
      expect(headers).toHaveProperty('Cache-Control');
      expect(headers).toHaveProperty('Last-Modified');
      expect(headers).not.toHaveProperty('Expires');
    });
  });

  describe('getCacheOptionsForResource', () => {
    it('should return public cache options', () => {
      const options = service.getCacheOptionsForResource('public');
      expect(options).toEqual({
        maxAge: 300,
        isPublic: true,
        noCache: false,
        noStore: false,
      });
    });

    it('should return private cache options', () => {
      const options = service.getCacheOptionsForResource('private');
      expect(options).toEqual({
        maxAge: 60,
        isPublic: false,
        noCache: false,
        noStore: false,
      });
    });

    it('should return sensitive cache options', () => {
      const options = service.getCacheOptionsForResource('sensitive');
      expect(options).toEqual({
        noCache: true,
        noStore: true,
        isPublic: false,
      });
    });
  });

  describe('shouldReturn304', () => {
    it('should return true when ETags match', () => {
      const result = service.shouldReturn304('"abc123"', '"abc123"');
      expect(result).toBe(true);
    });

    it('should return true for wildcard', () => {
      const result = service.shouldReturn304('*', '"abc123"');
      expect(result).toBe(true);
    });

    it('should return false when ETags do not match', () => {
      const result = service.shouldReturn304('"abc123"', '"def456"');
      expect(result).toBe(false);
    });

    it('should return false for missing headers', () => {
      expect(service.shouldReturn304(undefined, '"abc123"')).toBe(false);
      expect(service.shouldReturn304('"abc123"', undefined)).toBe(false);
    });
  });

  describe('parseIfNoneMatch', () => {
    it('should parse single ETag', () => {
      const result = service.parseIfNoneMatch('"abc123"');
      expect(result).toEqual(['"abc123"']);
    });

    it('should parse multiple ETags', () => {
      const result = service.parseIfNoneMatch('"abc123", "def456"');
      expect(result).toEqual(['"abc123"', '"def456"']);
    });

    it('should handle wildcard', () => {
      const result = service.parseIfNoneMatch('*');
      expect(result).toEqual(['*']);
    });

    it('should handle empty header', () => {
      const result = service.parseIfNoneMatch('');
      expect(result).toEqual([]);
    });

    it('should handle undefined header', () => {
      const result = service.parseIfNoneMatch(undefined);
      expect(result).toEqual([]);
    });

    it('should trim whitespace', () => {
      const result = service.parseIfNoneMatch(' "abc123" , "def456" ');
      expect(result).toEqual(['"abc123"', '"def456"']);
    });
  });
});