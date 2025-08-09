import { Test, TestingModule } from '@nestjs/testing';
import { CouponGeneratorService } from './coupon-generator.service';

describe('CouponGeneratorService Integration', () => {
  let service: CouponGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponGeneratorService],
    }).compile();

    service = module.get<CouponGeneratorService>(CouponGeneratorService);
  });

  describe('Real-world usage scenarios', () => {
    it('should generate a single coupon code successfully', async () => {
      const code = await service.generateSingleCode();
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBe(10);
      expect(service.validateCodeFormat(code)).toBe(true);
    });

    it('should generate a batch of unique coupon codes', async () => {
      const quantity = 25;
      const result = await service.generateBatch({ quantity, codeLength: 8 });
      
      expect(result.coupons).toHaveLength(quantity);
      expect(result.totalGenerated).toBe(quantity);
      expect(result.batchId).toMatch(/^BATCH_/);
      
      // Verify all codes are unique
      const codes = result.coupons.map(c => c.couponCode);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(quantity);
      
      // Verify all codes are valid format
      codes.forEach(code => {
        expect(service.validateCodeFormat(code)).toBe(true);
        expect(code.length).toBe(8);
      });
    });

    it('should handle collision detection in real scenario', async () => {
      // Generate some codes first
      const firstBatch = await service.generateBatch({ quantity: 10 });
      const existingCodes = new Set(firstBatch.coupons.map(c => c.couponCode));
      
      // Generate new codes avoiding collisions
      const newCode = await service.generateSingleCode({}, existingCodes);
      
      expect(existingCodes.has(newCode)).toBe(false);
      expect(service.validateCodeFormat(newCode)).toBe(true);
    });

    it('should provide accurate generation statistics', () => {
      const stats = service.getGenerationStats(10);
      
      expect(stats.characterSetSize).toBe(31);
      expect(stats.codeLength).toBe(10);
      expect(stats.totalPossibleCodes).toBe(Math.pow(31, 10));
      expect(stats.safeCharacters).toBe('ABCDEFGHJKMNPQRSTUVWXYZ23456789');
      expect(stats.recommendedMaxBatch).toBeGreaterThan(0);
    });

    it('should demonstrate exclusion of ambiguous characters', async () => {
      // Generate many codes to test character distribution
      const result = await service.generateBatch({ quantity: 100, codeLength: 6 });
      const allCodes = result.coupons.map(c => c.couponCode).join('');
      
      // Verify no ambiguous characters are present
      expect(allCodes).not.toMatch(/[01IOL]/);
      
      // Verify only safe characters are used
      expect(allCodes).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    });
  });
});