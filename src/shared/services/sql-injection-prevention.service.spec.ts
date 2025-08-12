import { Test, TestingModule } from '@nestjs/testing';
import { SqlInjectionPreventionService } from './sql-injection-prevention.service';

describe('SqlInjectionPreventionService', () => {
  let service: SqlInjectionPreventionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqlInjectionPreventionService],
    }).compile();

    service = module.get<SqlInjectionPreventionService>(SqlInjectionPreventionService);
  });

  describe('containsSqlInjection', () => {
    describe('strict mode', () => {
      it('should detect basic SQL keywords', () => {
        expect(service.containsSqlInjection('SELECT * FROM users', 'strict')).toBe(true);
        expect(service.containsSqlInjection('DROP TABLE users', 'strict')).toBe(true);
        expect(service.containsSqlInjection('INSERT INTO users', 'strict')).toBe(true);
      });

      it('should detect SQL comments', () => {
        expect(service.containsSqlInjection('-- comment', 'strict')).toBe(true);
        expect(service.containsSqlInjection('/* comment */', 'strict')).toBe(true);
        expect(service.containsSqlInjection('# comment', 'strict')).toBe(true);
      });
    });

    describe('moderate mode', () => {
      it('should detect obvious injection patterns', () => {
        expect(service.containsSqlInjection("'; DROP TABLE users; --", 'moderate')).toBe(true);
        expect(service.containsSqlInjection("' UNION SELECT * FROM users --", 'moderate')).toBe(true);
        expect(service.containsSqlInjection("' OR 1=1 OR '", 'moderate')).toBe(true);
      });

      it('should not flag single SQL keywords', () => {
        expect(service.containsSqlInjection('select', 'moderate')).toBe(false);
        expect(service.containsSqlInjection('from', 'moderate')).toBe(false);
      });

      it('should flag multiple SQL patterns', () => {
        expect(service.containsSqlInjection('SELECT * FROM users WHERE id = 1', 'moderate')).toBe(true);
      });
    });

    describe('lenient mode', () => {
      it('should only detect obvious attacks', () => {
        expect(service.containsSqlInjection("' UNION SELECT * FROM users", 'lenient')).toBe(true);
        expect(service.containsSqlInjection("' OR 1=1 OR '", 'lenient')).toBe(true);
      });

      it('should not flag normal SQL keywords', () => {
        expect(service.containsSqlInjection('SELECT', 'lenient')).toBe(false);
        expect(service.containsSqlInjection('FROM users', 'lenient')).toBe(false);
      });
    });

    it('should handle empty input', () => {
      expect(service.containsSqlInjection('', 'moderate')).toBe(false);
      expect(service.containsSqlInjection(null as any, 'moderate')).toBe(false);
      expect(service.containsSqlInjection(undefined as any, 'moderate')).toBe(false);
    });
  });

  describe('sanitizeSqlInput', () => {
    it('should remove SQL comments', () => {
      const input = 'Hello -- comment';
      const result = service.sanitizeSqlInput(input);
      expect(result).toBe('Hello');
    });

    it('should remove dangerous SQL keywords', () => {
      const input = 'DROP TABLE users';
      const result = service.sanitizeSqlInput(input);
      expect(result).toBe('TABLE users');
    });

    it('should remove suspicious patterns', () => {
      const input = "' OR 1=1 OR '";
      const result = service.sanitizeSqlInput(input);
      expect(result).toBe("'  '");
    });

    it('should preserve spaces when requested', () => {
      const input = 'Hello   World';
      const result = service.sanitizeSqlInput(input, true);
      expect(result).toBe('Hello World');
    });

    it('should remove spaces when not preserving', () => {
      const input = 'Hello   World';
      const result = service.sanitizeSqlInput(input, false);
      expect(result).toBe('HelloWorld');
    });
  });

  describe('validateQueryParams', () => {
    it('should validate clean parameters', () => {
      const params = {
        name: 'John Doe',
        age: '25',
        city: 'New York'
      };

      const result = service.validateQueryParams(params, 'moderate');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect SQL injection in parameters', () => {
      const params = {
        name: 'John Doe',
        query: "'; DROP TABLE users; --"
      };

      const result = service.validateQueryParams(params, 'moderate');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parameter 'query' contains potential SQL injection patterns");
    });

    it('should validate array parameters', () => {
      const params = {
        names: ['John', "'; DROP TABLE users; --", 'Jane']
      };

      const result = service.validateQueryParams(params, 'moderate');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parameter 'names[1]' contains potential SQL injection patterns");
    });
  });

  describe('createSafeSearchQuery', () => {
    it('should escape special characters', () => {
      const input = 'test%_search';
      const result = service.createSafeSearchQuery(input);
      expect(result).toBe('test\\%\\_search');
    });

    it('should escape single quotes', () => {
      const input = "O'Connor";
      const result = service.createSafeSearchQuery(input);
      expect(result).toBe("O''Connor");
    });

    it('should remove SQL injection patterns', () => {
      const input = "test'; DROP TABLE users; --";
      const result = service.createSafeSearchQuery(input);
      expect(result).not.toContain('DROP');
      expect(result).not.toContain('--');
    });
  });

  describe('validateSortParams', () => {
    const allowedFields = ['id', 'name', 'email', 'createdAt'];

    it('should validate allowed sort fields', () => {
      const result = service.validateSortParams('name', 'asc', allowedFields);
      expect(result.isValid).toBe(true);
    });

    it('should reject disallowed sort fields', () => {
      const result = service.validateSortParams('password', 'asc', allowedFields);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid sort field');
    });

    it('should validate sort order', () => {
      const result = service.validateSortParams('name', 'invalid', allowedFields);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid sort order');
    });

    it('should detect SQL injection in sort parameters', () => {
      const result = service.validateSortParams('name; DROP TABLE users', 'asc', allowedFields);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  describe('validatePaginationParams', () => {
    it('should validate normal pagination', () => {
      const result = service.validatePaginationParams(1, 10);
      expect(result.isValid).toBe(true);
      expect(result.safePage).toBe(1);
      expect(result.safeLimit).toBe(10);
    });

    it('should handle negative values', () => {
      const result = service.validatePaginationParams(-1, -5);
      expect(result.isValid).toBe(true);
      expect(result.safePage).toBe(1);
      expect(result.safeLimit).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = service.validatePaginationParams(1, 1000, 100);
      expect(result.isValid).toBe(true);
      expect(result.safeLimit).toBe(100);
    });

    it('should reject extremely large page numbers', () => {
      const result = service.validatePaginationParams(50000, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Page number too large');
    });
  });

  describe('isQuerySafe', () => {
    it('should identify safe parameterized queries', () => {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = service.isQuerySafe(query);
      expect(result.isSafe).toBe(true);
      expect(result.risks).toHaveLength(0);
    });

    it('should identify risky queries', () => {
      const query = "SELECT * FROM users WHERE name = '" + "userInput" + "'";
      const result = service.isQuerySafe(query);
      expect(result.isSafe).toBe(false);
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should detect high-risk operations', () => {
      const query = 'DROP TABLE users';
      const result = service.isQuerySafe(query);
      expect(result.isSafe).toBe(false);
      expect(result.risks).toContain('Contains high-risk SQL operations');
    });
  });
});