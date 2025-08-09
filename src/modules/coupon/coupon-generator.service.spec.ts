import { Test, TestingModule } from '@nestjs/testing';
import { CouponGeneratorService } from './coupon-generator.service';

describe('CouponGeneratorService', () => {
  let service: CouponGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponGeneratorService],
    }).compile();

    service = module.get<CouponGeneratorService>(CouponGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSingleCode', () => {
    it('should generate a code with default length of 10', async () => {
      const code = await service.generateSingleCode();
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBe(10);
    });

    it('should generate a code with custom length', async () => {
      const customLength = 8;
      const code = await service.generateSingleCode({ codeLength: customLength });
      
      expect(code.length).toBe(customLength);
    });

    it('should generate codes using only safe characters (excluding 0, O, 1, I, L)', async () => {
      const code = await service.generateSingleCode();
      const safeCharacterRegex = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
      
      expect(code).toMatch(safeCharacterRegex);
      expect(code).not.toMatch(/[01IOL]/);
    });

    it('should generate unique codes when no collisions exist', async () => {
      const codes = new Set<string>();
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const code = await service.generateSingleCode();
        codes.add(code);
      }
      
      // With a large character set and 10-character codes, collisions should be extremely rare
      expect(codes.size).toBeGreaterThan(iterations * 0.95); // Allow for very rare collisions
    });

    it('should handle collision detection and retry', async () => {
      const existingCodes = new Set(['ABCDEFGHJ2', 'KLMNPQRSTU', 'VWXYZ23456']);
      
      const code = await service.generateSingleCode({}, existingCodes);
      
      expect(code).toBeDefined();
      expect(existingCodes.has(code)).toBe(false);
    });

    it('should throw error after max retries with high collision rate', async () => {
      // Mock the createRandomCode method to always return the same codes
      const originalCreateRandomCode = service['createRandomCode'];
      const mockCodes = ['TESTCODE12', 'SAMPLE3456', 'ANOTHER789'];
      let callCount = 0;
      
      service['createRandomCode'] = jest.fn().mockImplementation(() => {
        return mockCodes[callCount++ % mockCodes.length];
      });
      
      // Create existing codes that match our mock codes
      const existingCodes = new Set(mockCodes);
      
      try {
        await expect(
          service.generateSingleCode({ maxRetries: 3 }, existingCodes)
        ).rejects.toThrow(/Failed to generate unique coupon code after 3 attempts/);
      } finally {
        // Restore original method
        service['createRandomCode'] = originalCreateRandomCode;
      }
    });
  });

  describe('generateBatch', () => {
    it('should generate batch with specified quantity', async () => {
      const quantity = 5;
      const result = await service.generateBatch({ quantity });
      
      expect(result.coupons).toHaveLength(quantity);
      expect(result.totalGenerated).toBe(quantity);
      expect(result.batchId).toBeDefined();
      expect(result.batchId).toMatch(/^BATCH_/);
    });

    it('should generate batch with all unique codes', async () => {
      const quantity = 50;
      const result = await service.generateBatch({ quantity });
      
      const codes = result.coupons.map(c => c.couponCode);
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(quantity);
    });

    it('should respect custom code length in batch generation', async () => {
      const quantity = 10;
      const codeLength = 12;
      const result = await service.generateBatch({ quantity, codeLength });
      
      result.coupons.forEach(coupon => {
        expect(coupon.codeLength).toBe(codeLength);
        expect(coupon.couponCode.length).toBe(codeLength);
      });
    });

    it('should avoid collisions with existing codes in batch generation', async () => {
      const existingCodes = new Set(['TESTCODE12', 'SAMPLE3456']);
      const quantity = 10;
      
      const result = await service.generateBatch({ quantity }, existingCodes);
      
      result.coupons.forEach(coupon => {
        expect(existingCodes.has(coupon.couponCode)).toBe(false);
      });
    });

    it('should throw error for batch size exceeding maximum', async () => {
      const quantity = 1001; // Exceeds MAX_BATCH_SIZE of 1000
      
      await expect(
        service.generateBatch({ quantity })
      ).rejects.toThrow(/Batch size cannot exceed 1000 codes/);
    });

    it('should throw error for invalid quantity', async () => {
      await expect(
        service.generateBatch({ quantity: 0 })
      ).rejects.toThrow(/Quantity must be at least 1/);
      
      await expect(
        service.generateBatch({ quantity: -1 })
      ).rejects.toThrow(/Quantity must be at least 1/);
    });

    it('should generate unique batch IDs', async () => {
      const result1 = await service.generateBatch({ quantity: 1 });
      const result2 = await service.generateBatch({ quantity: 1 });
      
      expect(result1.batchId).not.toBe(result2.batchId);
      expect(result1.batchId).toMatch(/^BATCH_/);
      expect(result2.batchId).toMatch(/^BATCH_/);
    });
  });

  describe('validateCodeFormat', () => {
    it('should validate correct code format', () => {
      const validCodes = [
        'ABCDEFGHJ2', // 10 characters
        'TESTC2DE', // 8 characters  
        'TESTC2DEFGHJ', // 12 characters
        'ABC23456789D', // 12 characters with numbers
      ];
      
      validCodes.forEach(code => {
        expect(service.validateCodeFormat(code)).toBe(true);
      });
    });

    it('should reject codes with ambiguous characters', () => {
      const invalidCodes = [
        'ABCDEFGH0J', // Contains 0
        'ABCDEFGHOJ', // Contains O
        'ABCDEFGH1J', // Contains 1
        'ABCDEFGHIJ', // Contains I
        'ABCDEFGHLJ', // Contains L
      ];
      
      invalidCodes.forEach(code => {
        expect(service.validateCodeFormat(code)).toBe(false);
      });
    });

    it('should reject codes with invalid length', () => {
      const invalidCodes = [
        'SHORT', // 5 characters (too short)
        'ABCDEFG', // 7 characters (too short)
        'VERYLONGCODETEST', // 16 characters (too long)
        '', // Empty string
      ];
      
      invalidCodes.forEach(code => {
        expect(service.validateCodeFormat(code)).toBe(false);
      });
    });

    it('should reject invalid input types', () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        {},
        [],
      ];
      
      invalidInputs.forEach(input => {
        expect(service.validateCodeFormat(input as any)).toBe(false);
      });
    });

    it('should reject codes with lowercase characters', () => {
      const invalidCodes = [
        'abcdefghj2', // All lowercase
        'AbCdEfGhJ2', // Mixed case
        'ABCDEFGHJ2a', // Mostly uppercase with one lowercase
      ];
      
      invalidCodes.forEach(code => {
        expect(service.validateCodeFormat(code)).toBe(false);
      });
    });
  });

  describe('getGenerationStats', () => {
    it('should return correct statistics for default code length', () => {
      const stats = service.getGenerationStats();
      
      expect(stats.characterSetSize).toBe(31); // A-Z (excluding I,L,O) + 2-9 = 23 + 8 = 31 safe chars
      expect(stats.codeLength).toBe(10);
      expect(stats.safeCharacters).toBe('ABCDEFGHJKMNPQRSTUVWXYZ23456789');
      expect(stats.totalPossibleCodes).toBeGreaterThan(0);
      expect(stats.recommendedMaxBatch).toBeGreaterThan(0);
    });

    it('should return correct statistics for custom code length', () => {
      const customLength = 8;
      const stats = service.getGenerationStats(customLength);
      
      expect(stats.codeLength).toBe(customLength);
      expect(stats.totalPossibleCodes).toBe(Math.pow(31, customLength));
    });

    it('should calculate recommended max batch as 10% of total possible codes', () => {
      const stats = service.getGenerationStats(8);
      const expectedMaxBatch = Math.floor(stats.totalPossibleCodes * 0.1);
      
      expect(stats.recommendedMaxBatch).toBe(expectedMaxBatch);
    });
  });

  describe('character set validation', () => {
    it('should use exactly 31 safe characters', () => {
      const stats = service.getGenerationStats();
      expect(stats.characterSetSize).toBe(31);
    });

    it('should exclude all ambiguous characters from safe set', () => {
      const stats = service.getGenerationStats();
      const ambiguousChars = ['0', 'O', '1', 'I', 'L'];
      
      ambiguousChars.forEach(char => {
        expect(stats.safeCharacters).not.toContain(char);
      });
    });

    it('should include all expected safe characters', () => {
      const stats = service.getGenerationStats();
      const expectedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      
      expect(stats.safeCharacters).toBe(expectedChars);
      expect(stats.safeCharacters.length).toBe(31);
    });
  });

  describe('error handling', () => {
    it('should handle and log generation failures appropriately', async () => {
      // Test with impossible conditions to trigger error handling
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      
      try {
        await service.generateBatch({ 
          quantity: 10, 
          codeLength: 2, // Very short length
          maxRetries: 1 // Very low retries
        }, new Set(Array.from({ length: 900 }, (_, i) => `T${i}`)));
      } catch (error) {
        expect(error.message).toContain('Batch generation failed');
        expect(loggerSpy).toHaveBeenCalled();
      }
    });
  });
});