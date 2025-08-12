import { Test, TestingModule } from '@nestjs/testing';
import { InputSanitizationService } from './input-sanitization.service';

describe('InputSanitizationService', () => {
  let service: InputSanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InputSanitizationService],
    }).compile();

    service = module.get<InputSanitizationService>(InputSanitizationService);
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = service.sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should remove JavaScript protocols', () => {
      const input = 'javascript:alert("xss")';
      const result = service.sanitizeText(input);
      expect(result).toBe('');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = service.sanitizeText(input);
      expect(result).toBe('');
    });

    it('should normalize whitespace', () => {
      const input = '  Hello    World  ';
      const result = service.sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty input', () => {
      expect(service.sanitizeText('')).toBe('');
      expect(service.sanitizeText(null as any)).toBe('');
      expect(service.sanitizeText(undefined as any)).toBe('');
    });
  });

  describe('sanitizeName', () => {
    it('should preserve international characters', () => {
      const input = 'José María';
      const result = service.sanitizeName(input);
      expect(result).toBe('José María');
    });

    it('should remove dangerous content', () => {
      const input = '<script>alert("xss")</script>John Doe';
      const result = service.sanitizeName(input);
      expect(result).toBe('John Doe');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const input = 'USER@EXAMPLE.COM';
      const result = service.sanitizeEmail(input);
      expect(result).toBe('user@example.com');
    });

    it('should remove spaces', () => {
      const input = ' user @ example.com ';
      const result = service.sanitizeEmail(input);
      expect(result).toBe('user@example.com');
    });

    it('should remove dangerous content', () => {
      const input = '<script>alert("xss")</script>user@example.com';
      const result = service.sanitizeEmail(input);
      expect(result).toBe('user@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should preserve valid phone characters', () => {
      const input = '+1-555-123-4567';
      const result = service.sanitizePhone(input);
      expect(result).toBe('+1-555-123-4567');
    });

    it('should remove invalid characters', () => {
      const input = '+1-555-123-4567abc<script>';
      const result = service.sanitizePhone(input);
      expect(result).toBe('+1-555-123-4567');
    });
  });

  describe('sanitizeCouponCode', () => {
    it('should convert to uppercase', () => {
      const input = 'abc123xyz9';
      const result = service.sanitizeCouponCode(input);
      expect(result).toBe('ABC123XYZ9');
    });

    it('should remove ambiguous characters', () => {
      const input = 'ABC0O1IL123';
      const result = service.sanitizeCouponCode(input);
      expect(result).toBe('ABC123');
    });

    it('should remove invalid characters', () => {
      const input = 'ABC-123_XYZ@9';
      const result = service.sanitizeCouponCode(input);
      expect(result).toBe('ABC123XYZ9');
    });
  });

  describe('containsXSS', () => {
    it('should detect script tags', () => {
      const input = '<script>alert("xss")</script>';
      expect(service.containsXSS(input)).toBe(true);
    });

    it('should detect JavaScript protocols', () => {
      const input = 'javascript:alert("xss")';
      expect(service.containsXSS(input)).toBe(true);
    });

    it('should detect event handlers', () => {
      const input = 'onclick=alert("xss")';
      expect(service.containsXSS(input)).toBe(true);
    });

    it('should not flag safe content', () => {
      const input = 'Hello World';
      expect(service.containsXSS(input)).toBe(false);
    });
  });

  describe('containsSQLInjection', () => {
    it('should detect SQL injection patterns', () => {
      const input = "'; DROP TABLE users; --";
      expect(service.containsSQLInjection(input)).toBe(true);
    });

    it('should detect UNION attacks', () => {
      const input = "' UNION SELECT * FROM users --";
      expect(service.containsSQLInjection(input)).toBe(true);
    });

    it('should not flag safe content', () => {
      const input = 'Hello World';
      expect(service.containsSQLInjection(input)).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string properties', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        email: 'USER@EXAMPLE.COM',
        nested: {
          value: 'javascript:alert("xss")'
        }
      };

      const result = service.sanitizeObject(input);
      
      expect(result.name).toBe('John');
      expect(result.email).toBe('user@example.com');
      expect(result.nested.value).toBe('');
    });

    it('should use custom sanitizers', () => {
      const input = {
        couponCode: 'abc123',
        email: 'USER@EXAMPLE.COM'
      };

      const sanitizers = {
        couponCode: service.sanitizeCouponCode.bind(service),
        email: service.sanitizeEmail.bind(service)
      };

      const result = service.sanitizeObject(input, sanitizers);
      
      expect(result.couponCode).toBe('ABC123');
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = service.escapeHtml(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty input', () => {
      expect(service.escapeHtml('')).toBe('');
      expect(service.escapeHtml(null as any)).toBe('');
    });
  });

  describe('unescapeHtml', () => {
    it('should unescape HTML entities', () => {
      const input = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      const result = service.unescapeHtml(input);
      expect(result).toBe('<script>alert("xss")</script>');
    });
  });
});