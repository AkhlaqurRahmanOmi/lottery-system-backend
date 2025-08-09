import { Test, TestingModule } from '@nestjs/testing';
import { TraceIdService } from './trace-id.service';

describe('TraceIdService', () => {
  let service: TraceIdService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [TraceIdService],
    }).compile();

    service = await module.resolve<TraceIdService>(TraceIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTraceId', () => {
    it('should generate a valid UUID v4', () => {
      const traceId = service.generateTraceId();
      
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique trace IDs', () => {
      const traceId1 = service.generateTraceId();
      const traceId2 = service.generateTraceId();
      
      expect(traceId1).not.toBe(traceId2);
    });
  });

  describe('getTraceId', () => {
    it('should return the current trace ID', () => {
      const traceId = service.getTraceId();
      
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(service.isValidTraceId(traceId)).toBe(true);
    });

    it('should return the same trace ID on multiple calls', () => {
      const traceId1 = service.getTraceId();
      const traceId2 = service.getTraceId();
      
      expect(traceId1).toBe(traceId2);
    });
  });

  describe('setTraceId', () => {
    it('should set a custom trace ID', () => {
      const customTraceId = '550e8400-e29b-41d4-a716-446655440000';
      
      service.setTraceId(customTraceId);
      
      expect(service.getTraceId()).toBe(customTraceId);
    });
  });

  describe('createNewTraceId', () => {
    it('should create and return a new trace ID', () => {
      const originalTraceId = service.getTraceId();
      const newTraceId = service.createNewTraceId();
      
      expect(newTraceId).not.toBe(originalTraceId);
      expect(service.getTraceId()).toBe(newTraceId);
      expect(service.isValidTraceId(newTraceId)).toBe(true);
    });
  });

  describe('getLoggingContext', () => {
    it('should return logging context with trace ID', () => {
      const context = service.getLoggingContext();
      
      expect(context).toHaveProperty('traceId');
      expect(context.traceId).toBe(service.getTraceId());
    });
  });

  describe('isValidTraceId', () => {
    it('should validate correct UUID v4 format', () => {
      const validTraceIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-41d1-80b4-00c04fd430c8'
      ];

      validTraceIds.forEach(traceId => {
        expect(service.isValidTraceId(traceId)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidTraceIds = [
        'invalid-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '',
        'not-a-uuid-at-all',
        '550e8400-e29b-31d4-a716-446655440000', // version 3, not 4
        '550e8400-e29b-51d4-a716-446655440000'  // version 5, not 4
      ];

      invalidTraceIds.forEach(traceId => {
        expect(service.isValidTraceId(traceId)).toBe(false);
      });
    });
  });

  describe('extractOrGenerateTraceId', () => {
    it('should extract valid trace ID from x-trace-id header', () => {
      const validTraceId = '550e8400-e29b-41d4-a716-446655440000';
      const headers = { 'x-trace-id': validTraceId };
      
      const result = service.extractOrGenerateTraceId(headers);
      
      expect(result).toBe(validTraceId);
      expect(service.getTraceId()).toBe(validTraceId);
    });

    it('should extract valid trace ID from X-Trace-ID header (case sensitive)', () => {
      const validTraceId = '550e8400-e29b-41d4-a716-446655440000';
      const headers = { 'X-Trace-ID': validTraceId };
      
      const result = service.extractOrGenerateTraceId(headers);
      
      expect(result).toBe(validTraceId);
      expect(service.getTraceId()).toBe(validTraceId);
    });

    it('should generate new trace ID when header contains invalid UUID', () => {
      const invalidTraceId = 'invalid-uuid';
      const headers = { 'x-trace-id': invalidTraceId };
      const originalTraceId = service.getTraceId();
      
      const result = service.extractOrGenerateTraceId(headers);
      
      expect(result).not.toBe(invalidTraceId);
      expect(result).not.toBe(originalTraceId);
      expect(service.isValidTraceId(result)).toBe(true);
      expect(service.getTraceId()).toBe(result);
    });

    it('should generate new trace ID when no trace ID header is present', () => {
      const headers = { 'other-header': 'value' };
      const originalTraceId = service.getTraceId();
      
      const result = service.extractOrGenerateTraceId(headers);
      
      expect(result).not.toBe(originalTraceId);
      expect(service.isValidTraceId(result)).toBe(true);
      expect(service.getTraceId()).toBe(result);
    });

    it('should generate new trace ID when headers object is empty', () => {
      const headers = {};
      const originalTraceId = service.getTraceId();
      
      const result = service.extractOrGenerateTraceId(headers);
      
      expect(result).not.toBe(originalTraceId);
      expect(service.isValidTraceId(result)).toBe(true);
      expect(service.getTraceId()).toBe(result);
    });
  });
});