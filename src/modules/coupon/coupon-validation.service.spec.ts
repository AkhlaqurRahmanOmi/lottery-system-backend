import { Test, TestingModule } from '@nestjs/testing';
import { CouponValidationService } from './coupon-validation.service';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService } from './coupon-generator.service';
import type { Coupon } from '@prisma/client';

describe('CouponValidationService', () => {
  let service: CouponValidationService;
  let couponRepository: jest.Mocked<CouponRepository>;
  let couponGeneratorService: jest.Mocked<CouponGeneratorService>;

  const mockActiveCoupon: Coupon = {
    id: 1,
    couponCode: 'ABCD123456',
    batchId: 'batch-1',
    codeLength: 10,
    status: 'ACTIVE',
    createdBy: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    expiresAt: new Date('2024-12-31T23:59:59Z'),
    redeemedAt: null,
    redeemedBy: null,
    generationMethod: 'SINGLE',
    metadata: {}
  };

  const mockRedeemedCoupon: Coupon = {
    ...mockActiveCoupon,
    id: 2,
    couponCode: 'REDEEMED123',
    status: 'REDEEMED',
    redeemedAt: new Date('2024-06-01T12:00:00Z'),
    redeemedBy: 100
  };

  const mockExpiredCoupon: Coupon = {
    ...mockActiveCoupon,
    id: 3,
    couponCode: 'EXPIRED123',
    status: 'ACTIVE',
    expiresAt: new Date('2023-12-31T23:59:59Z') // Past date
  };

  const mockDeactivatedCoupon: Coupon = {
    ...mockActiveCoupon,
    id: 4,
    couponCode: 'DEACTIVATED123',
    status: 'DEACTIVATED'
  };

  beforeEach(async () => {
    const mockCouponRepository = {
      findByCouponCode: jest.fn(),
      update: jest.fn(),
    };

    const mockCouponGeneratorService = {
      validateCodeFormat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponValidationService,
        {
          provide: CouponRepository,
          useValue: mockCouponRepository,
        },
        {
          provide: CouponGeneratorService,
          useValue: mockCouponGeneratorService,
        },
      ],
    }).compile();

    service = module.get<CouponValidationService>(CouponValidationService);
    couponRepository = module.get(CouponRepository);
    couponGeneratorService = module.get(CouponGeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCouponFormat', () => {
    it('should return invalid for null coupon code', () => {
      const result = service.validateCouponFormat(null as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code is required and must be a string');
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return invalid for undefined coupon code', () => {
      const result = service.validateCouponFormat(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code is required and must be a string');
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return invalid for empty string', () => {
      const result = service.validateCouponFormat('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code cannot be empty');
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return invalid for whitespace-only string', () => {
      const result = service.validateCouponFormat('   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code cannot be empty');
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return invalid for non-string input', () => {
      const result = service.validateCouponFormat(123 as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code is required and must be a string');
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return invalid for invalid format according to generator service', () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(false);

      const result = service.validateCouponFormat('INVALID123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code format is invalid. Must be 8-12 alphanumeric characters (A-Z, 2-9)');
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(couponGeneratorService.validateCodeFormat).toHaveBeenCalledWith('INVALID123');
    });

    it('should return valid for properly formatted coupon code', () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);

      const result = service.validateCouponFormat('ABCD123456');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
      expect(couponGeneratorService.validateCodeFormat).toHaveBeenCalledWith('ABCD123456');
    });

    it('should trim whitespace before validation', () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);

      const result = service.validateCouponFormat('  ABCD123456  ');

      expect(result.isValid).toBe(true);
      expect(couponGeneratorService.validateCodeFormat).toHaveBeenCalledWith('ABCD123456');
    });
  });

  describe('validateCouponForRedemption', () => {
    it('should return invalid for malformed coupon code', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(false);

      const result = await service.validateCouponForRedemption('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return invalid for non-existent coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(null);

      const result = await service.validateCouponForRedemption('NOTFOUND123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code not found');
      expect(result.errorCode).toBe('COUPON_NOT_FOUND');
    });

    it('should return invalid for already redeemed coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockRedeemedCoupon);

      const result = await service.validateCouponForRedemption('REDEEMED123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This coupon has already been redeemed and cannot be used again');
      expect(result.errorCode).toBe('COUPON_ALREADY_REDEEMED');
    });

    it('should return invalid for deactivated coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockDeactivatedCoupon);

      const result = await service.validateCouponForRedemption('DEACTIVATED123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This coupon has been deactivated and is no longer valid');
      expect(result.errorCode).toBe('COUPON_DEACTIVATED');
    });

    it('should return invalid and auto-expire for expired coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockExpiredCoupon);
      couponRepository.update.mockResolvedValue({ ...mockExpiredCoupon, status: 'EXPIRED' });

      const result = await service.validateCouponForRedemption('EXPIRED123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This coupon has expired and is no longer valid');
      expect(result.errorCode).toBe('COUPON_EXPIRED');
      expect(couponRepository.update).toHaveBeenCalledWith(3, { status: 'EXPIRED' });
    });

    it('should return valid for active, non-expired coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockActiveCoupon);

      const result = await service.validateCouponForRedemption('ABCD123456');

      expect(result.isValid).toBe(true);
      expect(result.coupon).toBeDefined();
      expect(result.coupon!.couponCode).toBe('ABCD123456');
      expect(result.coupon!.status).toBe('ACTIVE');
    });

    it('should return valid for coupon without expiration date', async () => {
      const neverExpiresCoupon = { ...mockActiveCoupon, expiresAt: null };
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(neverExpiresCoupon);

      const result = await service.validateCouponForRedemption('ABCD123456');

      expect(result.isValid).toBe(true);
      expect(result.coupon).toBeDefined();
    });

    it('should handle auto-expiration errors gracefully', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockExpiredCoupon);
      couponRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await service.validateCouponForRedemption('EXPIRED123');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUPON_EXPIRED');
      // Should still return expired even if auto-expiration fails
    });
  });

  describe('canRedeemCoupon', () => {
    it('should return true for valid coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockActiveCoupon);

      const result = await service.canRedeemCoupon('ABCD123456');

      expect(result).toBe(true);
    });

    it('should return false for invalid coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockRedeemedCoupon);

      const result = await service.canRedeemCoupon('REDEEMED123');

      expect(result).toBe(false);
    });
  });

  describe('validateMultipleCoupons', () => {
    it('should validate multiple coupons and return results map', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode
        .mockResolvedValueOnce(mockActiveCoupon)
        .mockResolvedValueOnce(mockRedeemedCoupon)
        .mockResolvedValueOnce(null);

      const result = await service.validateMultipleCoupons(['VALID123', 'REDEEMED123', 'NOTFOUND123']);

      expect(result.size).toBe(3);
      expect(result.get('VALID123')?.isValid).toBe(true);
      expect(result.get('REDEEMED123')?.isValid).toBe(false);
      expect(result.get('REDEEMED123')?.errorCode).toBe('COUPON_ALREADY_REDEEMED');
      expect(result.get('NOTFOUND123')?.isValid).toBe(false);
      expect(result.get('NOTFOUND123')?.errorCode).toBe('COUPON_NOT_FOUND');
    });

    it('should handle validation errors gracefully', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockRejectedValue(new Error('Database error'));

      const result = await service.validateMultipleCoupons(['ERROR123']);

      expect(result.size).toBe(1);
      expect(result.get('ERROR123')?.isValid).toBe(false);
      expect(result.get('ERROR123')?.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('getDetailedValidationInfo', () => {
    it('should return detailed info for invalid format', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(false);

      const result = await service.getDetailedValidationInfo('INVALID');

      expect(result.formatValid).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.status).toBe(null);
      expect(result.expired).toBe(false);
      expect(result.canRedeem).toBe(false);
      expect(result.validationResult.errorCode).toBe('INVALID_FORMAT');
    });

    it('should return detailed info for non-existent coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(null);

      const result = await service.getDetailedValidationInfo('NOTFOUND123');

      expect(result.formatValid).toBe(true);
      expect(result.exists).toBe(false);
      expect(result.status).toBe(null);
      expect(result.expired).toBe(false);
      expect(result.canRedeem).toBe(false);
      expect(result.validationResult.errorCode).toBe('COUPON_NOT_FOUND');
    });

    it('should return detailed info for expired coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockExpiredCoupon);
      couponRepository.update.mockResolvedValue({ ...mockExpiredCoupon, status: 'EXPIRED' });

      const result = await service.getDetailedValidationInfo('EXPIRED123');

      expect(result.formatValid).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect(result.expired).toBe(true);
      expect(result.canRedeem).toBe(false);
      expect(result.validationResult.errorCode).toBe('COUPON_EXPIRED');
    });

    it('should return detailed info for valid coupon', async () => {
      couponGeneratorService.validateCodeFormat.mockReturnValue(true);
      couponRepository.findByCouponCode.mockResolvedValue(mockActiveCoupon);

      const result = await service.getDetailedValidationInfo('ABCD123456');

      expect(result.formatValid).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect(result.expired).toBe(false);
      expect(result.canRedeem).toBe(true);
      expect(result.validationResult.isValid).toBe(true);
    });
  });

  describe('validateCouponWithOptions', () => {
    it('should skip format validation when checkFormat is false', async () => {
      couponRepository.findByCouponCode.mockResolvedValue(mockActiveCoupon);

      const result = await service.validateCouponWithOptions('INVALID', { checkFormat: false });

      expect(result.isValid).toBe(true);
      expect(couponGeneratorService.validateCodeFormat).not.toHaveBeenCalled();
    });

    it('should skip expiration validation when checkExpiration is false', async () => {
      couponRepository.findByCouponCode.mockResolvedValue(mockExpiredCoupon);

      const result = await service.validateCouponWithOptions('EXPIRED123', { 
        checkFormat: false, 
        checkExpiration: false 
      });

      expect(result.isValid).toBe(true);
      expect(couponRepository.update).not.toHaveBeenCalled();
    });

    it('should skip status validation when checkStatus is false', async () => {
      couponRepository.findByCouponCode.mockResolvedValue(mockRedeemedCoupon);

      const result = await service.validateCouponWithOptions('REDEEMED123', { 
        checkFormat: false, 
        checkStatus: false,
        checkRedemption: false
      });

      expect(result.isValid).toBe(true);
    });

    it('should check redemption when checkRedemption is true', async () => {
      couponRepository.findByCouponCode.mockResolvedValue(mockRedeemedCoupon);

      const result = await service.validateCouponWithOptions('REDEEMED123', { 
        checkFormat: false, 
        checkStatus: false,
        checkRedemption: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUPON_ALREADY_REDEEMED');
    });

    it('should return not found for non-existent coupon regardless of options', async () => {
      couponRepository.findByCouponCode.mockResolvedValue(null);

      const result = await service.validateCouponWithOptions('NOTFOUND123', { 
        checkFormat: false 
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUPON_NOT_FOUND');
    });
  });
});