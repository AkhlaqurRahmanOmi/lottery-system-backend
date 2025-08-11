import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService } from './coupon-generator.service';
import { CouponValidationService } from './coupon-validation.service';
import { CouponStatus, GenerationMethod, ExportFormat } from './dto';
import type { Coupon } from '@prisma/client';

describe('CouponService', () => {
  let service: CouponService;
  let repository: CouponRepository;
  let generatorService: CouponGeneratorService;
  let validationService: CouponValidationService;

  const mockCoupon: Coupon = {
    id: 1,
    couponCode: 'TEST123456',
    batchId: 'BATCH_001',
    codeLength: 10,
    status: CouponStatus.ACTIVE,
    createdBy: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    expiresAt: new Date('2024-12-31T23:59:59Z'),
    redeemedAt: null,
    redeemedBy: null,
    generationMethod: GenerationMethod.SINGLE,
    metadata: { test: true },
  };

  const mockCouponRepository = {
    create: jest.fn(),
    createBatch: jest.fn(),
    findById: jest.fn(),
    findByCouponCode: jest.fn(),
    findByCouponCodeWithRelations: jest.fn(),
    findWithFilters: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deactivate: jest.fn(),
    deactivateBatch: jest.fn(),
    validateCoupon: jest.fn(),
    markAsRedeemed: jest.fn(),
    getBatchStatistics: jest.fn(),
    getAllBatchStatistics: jest.fn(),
    getStatistics: jest.fn(),
    autoExpireCoupons: jest.fn(),
    canDelete: jest.fn(),
  };

  const mockCouponGeneratorService = {
    generateSingleCode: jest.fn(),
    generateBatch: jest.fn(),
    validateCodeFormat: jest.fn(),
    getGenerationStats: jest.fn(),
  };

  const mockCouponValidationService = {
    validateCouponForRedemption: jest.fn(),
    validateCouponFormat: jest.fn(),
    canRedeemCoupon: jest.fn(),
    validateMultipleCoupons: jest.fn(),
    getDetailedValidationInfo: jest.fn(),
    validateCouponWithOptions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: CouponRepository,
          useValue: mockCouponRepository,
        },
        {
          provide: CouponGeneratorService,
          useValue: mockCouponGeneratorService,
        },
        {
          provide: CouponValidationService,
          useValue: mockCouponValidationService,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
    repository = module.get<CouponRepository>(CouponRepository);
    generatorService = module.get<CouponGeneratorService>(CouponGeneratorService);
    validationService = module.get<CouponValidationService>(CouponValidationService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateCoupons', () => {
    it('should generate a single coupon successfully', async () => {
      const generateDto = {
        quantity: 1,
        codeLength: 10,
        createdBy: 1,
      };

      mockCouponRepository.findMany.mockResolvedValue([]);
      mockCouponGeneratorService.generateSingleCode.mockResolvedValue('TEST123456');
      mockCouponRepository.create.mockResolvedValue(mockCoupon);

      const result = await service.generateCoupons(generateDto);

      expect(result).toHaveLength(1);
      expect(result[0].couponCode).toBe('TEST123456');
      expect(mockCouponGeneratorService.generateSingleCode).toHaveBeenCalledWith(
        { codeLength: 10 },
        expect.any(Set)
      );
      expect(mockCouponRepository.create).toHaveBeenCalled();
    });

    it('should generate multiple coupons in batch', async () => {
      const generateDto = {
        quantity: 3,
        codeLength: 10,
        createdBy: 1,
      };

      const batchResult = {
        coupons: [
          { couponCode: 'TEST123456', codeLength: 10 },
          { couponCode: 'TEST789012', codeLength: 10 },
          { couponCode: 'TEST345678', codeLength: 10 },
        ],
        batchId: 'BATCH_001',
        totalGenerated: 3,
        failedAttempts: 0,
      };

      mockCouponRepository.findMany.mockResolvedValue([]);
      mockCouponGeneratorService.generateBatch.mockResolvedValue(batchResult);
      mockCouponRepository.createBatch.mockResolvedValue([
        { ...mockCoupon, couponCode: 'TEST123456' },
        { ...mockCoupon, couponCode: 'TEST789012' },
        { ...mockCoupon, couponCode: 'TEST345678' },
      ]);

      const result = await service.generateCoupons(generateDto);

      expect(result).toHaveLength(3);
      expect(mockCouponGeneratorService.generateBatch).toHaveBeenCalledWith(
        { quantity: 3, codeLength: 10 },
        expect.any(Set)
      );
      expect(mockCouponRepository.createBatch).toHaveBeenCalled();
    });

    it('should throw error for invalid quantity', async () => {
      const generateDto = {
        quantity: 0,
        createdBy: 1,
      };

      await expect(service.generateCoupons(generateDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid code length', async () => {
      const generateDto = {
        quantity: 1,
        codeLength: 5,
        createdBy: 1,
      };

      await expect(service.generateCoupons(generateDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle expiration days correctly', async () => {
      const generateDto = {
        quantity: 1,
        codeLength: 10,
        expirationDays: 30,
        createdBy: 1,
      };

      mockCouponRepository.findMany.mockResolvedValue([]);
      mockCouponGeneratorService.generateSingleCode.mockResolvedValue('TEST123456');
      mockCouponRepository.create.mockResolvedValue(mockCoupon);

      await service.generateCoupons(generateDto);

      expect(mockCouponRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(String),
        })
      );
    });
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon using validation service', async () => {
      const couponCode = 'TEST123456';
      const validationResult = {
        isValid: true,
        coupon: mockCoupon,
      };

      mockCouponValidationService.validateCouponForRedemption.mockResolvedValue(validationResult);

      const result = await service.validateCoupon(couponCode);

      expect(result.isValid).toBe(true);
      expect(result.coupon).toBeDefined();
      expect(mockCouponValidationService.validateCouponForRedemption).toHaveBeenCalledWith(couponCode);
    });

    it('should return invalid result from validation service', async () => {
      const couponCode = 'INVALID123';
      const validationResult = {
        isValid: false,
        error: 'Coupon code format is invalid',
        errorCode: 'INVALID_FORMAT',
      };

      mockCouponValidationService.validateCouponForRedemption.mockResolvedValue(validationResult);

      const result = await service.validateCoupon(couponCode);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code format is invalid');
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(mockCouponValidationService.validateCouponForRedemption).toHaveBeenCalledWith(couponCode);
    });

    it('should return already redeemed error from validation service', async () => {
      const couponCode = 'REDEEMED123';
      const validationResult = {
        isValid: false,
        error: 'This coupon has already been redeemed and cannot be used again',
        errorCode: 'COUPON_ALREADY_REDEEMED',
      };

      mockCouponValidationService.validateCouponForRedemption.mockResolvedValue(validationResult);

      const result = await service.validateCoupon(couponCode);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('COUPON_ALREADY_REDEEMED');
      expect(mockCouponValidationService.validateCouponForRedemption).toHaveBeenCalledWith(couponCode);
    });
  });

  describe('redeemCoupon', () => {
    it('should redeem a valid coupon', async () => {
      const couponCode = 'TEST123456';
      const redeemedBy = 123;
      const validationResult = {
        isValid: true,
        coupon: mockCoupon,
      };
      const redeemedCoupon = {
        ...mockCoupon,
        status: CouponStatus.REDEEMED,
        redeemedAt: new Date(),
        redeemedBy,
      };

      mockCouponValidationService.validateCouponForRedemption.mockResolvedValue(validationResult);
      mockCouponRepository.markAsRedeemed.mockResolvedValue(redeemedCoupon);

      const result = await service.redeemCoupon(couponCode, redeemedBy);

      expect(result.status).toBe(CouponStatus.REDEEMED);
      expect(result.redeemedBy).toBe(redeemedBy);
      expect(mockCouponValidationService.validateCouponForRedemption).toHaveBeenCalledWith(couponCode);
      expect(mockCouponRepository.markAsRedeemed).toHaveBeenCalledWith(couponCode, redeemedBy);
    });

    it('should throw error for invalid coupon', async () => {
      const couponCode = 'INVALID123';
      const validationResult = {
        isValid: false,
        error: 'Coupon not found',
        errorCode: 'COUPON_NOT_FOUND',
      };

      mockCouponValidationService.validateCouponForRedemption.mockResolvedValue(validationResult);

      await expect(service.redeemCoupon(couponCode)).rejects.toThrow(BadRequestException);
      expect(mockCouponValidationService.validateCouponForRedemption).toHaveBeenCalledWith(couponCode);
    });
  });

  describe('findById', () => {
    it('should find coupon by ID', async () => {
      const couponId = 1;
      const couponWithRelations = {
        ...mockCoupon,
        creator: { id: 1, username: 'admin', email: 'admin@test.com' },
        submission: null,
      };

      mockCouponRepository.findById.mockResolvedValue(mockCoupon);
      mockCouponRepository.findByCouponCodeWithRelations.mockResolvedValue(couponWithRelations);

      const result = await service.findById(couponId);

      expect(result.id).toBe(couponId);
      expect(result.creator).toBeDefined();
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      const couponId = 999;

      mockCouponRepository.findById.mockResolvedValue(null);
      mockCouponRepository.findByCouponCodeWithRelations.mockResolvedValue(null);

      await expect(service.findById(couponId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCouponCode', () => {
    it('should find coupon by code', async () => {
      const couponCode = 'TEST123456';
      const couponWithRelations = {
        ...mockCoupon,
        creator: { id: 1, username: 'admin', email: 'admin@test.com' },
        submission: null,
      };

      mockCouponRepository.findByCouponCodeWithRelations.mockResolvedValue(couponWithRelations);

      const result = await service.findByCouponCode(couponCode);

      expect(result.couponCode).toBe(couponCode);
      expect(result.creator).toBeDefined();
    });

    it('should throw NotFoundException for non-existent coupon code', async () => {
      const couponCode = 'NONEXISTENT';

      mockCouponRepository.findByCouponCodeWithRelations.mockResolvedValue(null);

      await expect(service.findByCouponCode(couponCode)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update coupon successfully', async () => {
      const couponId = 1;
      const updateDto = { status: CouponStatus.DEACTIVATED };
      const updatedCoupon = { ...mockCoupon, status: CouponStatus.DEACTIVATED };

      mockCouponRepository.update.mockResolvedValue(updatedCoupon);

      const result = await service.update(couponId, updateDto);

      expect(result.status).toBe(CouponStatus.DEACTIVATED);
      expect(mockCouponRepository.update).toHaveBeenCalledWith(couponId, updateDto);
    });
  });

  describe('deactivate', () => {
    it('should deactivate coupon successfully', async () => {
      const couponId = 1;
      const deactivatedCoupon = { ...mockCoupon, status: CouponStatus.DEACTIVATED };

      mockCouponRepository.deactivate.mockResolvedValue(deactivatedCoupon);

      const result = await service.deactivate(couponId);

      expect(result.status).toBe(CouponStatus.DEACTIVATED);
      expect(mockCouponRepository.deactivate).toHaveBeenCalledWith(couponId);
    });
  });

  describe('delete', () => {
    it('should delete coupon if allowed', async () => {
      const couponId = 1;

      mockCouponRepository.canDelete.mockResolvedValue(true);
      mockCouponRepository.delete.mockResolvedValue(mockCoupon);

      await service.delete(couponId);

      expect(mockCouponRepository.canDelete).toHaveBeenCalledWith(couponId);
      expect(mockCouponRepository.delete).toHaveBeenCalledWith(couponId);
    });

    it('should throw error if deletion not allowed', async () => {
      const couponId = 1;

      mockCouponRepository.canDelete.mockResolvedValue(false);

      await expect(service.delete(couponId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBatchStatistics', () => {
    it('should return batch statistics', async () => {
      const batchId = 'BATCH_001';
      const batchStats = {
        batchId,
        totalCoupons: 10,
        activeCoupons: 8,
        redeemedCoupons: 2,
        expiredCoupons: 0,
        deactivatedCoupons: 0,
        createdAt: new Date(),
        creator: { id: 1, username: 'admin', email: 'admin@test.com' },
      };

      mockCouponRepository.getBatchStatistics.mockResolvedValue(batchStats);

      const result = await service.getBatchStatistics(batchId);

      expect(result.batchId).toBe(batchId);
      expect(result.totalCoupons).toBe(10);
    });

    it('should throw NotFoundException for non-existent batch', async () => {
      const batchId = 'NONEXISTENT';

      mockCouponRepository.getBatchStatistics.mockResolvedValue(null);

      await expect(service.getBatchStatistics(batchId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateBatch', () => {
    it('should deactivate batch successfully', async () => {
      const batchId = 'BATCH_001';
      const deactivatedCount = 5;

      mockCouponRepository.deactivateBatch.mockResolvedValue(deactivatedCount);

      const result = await service.deactivateBatch(batchId);

      expect(result.deactivatedCount).toBe(deactivatedCount);
      expect(mockCouponRepository.deactivateBatch).toHaveBeenCalledWith(batchId);
    });
  });

  describe('getStatistics', () => {
    it('should return coupon statistics', async () => {
      const stats = {
        total: 100,
        active: 80,
        redeemed: 15,
        expired: 3,
        deactivated: 2,
        redemptionRate: 15.0,
      };

      mockCouponRepository.getStatistics.mockResolvedValue(stats);

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.redemptionRate).toBe(15.0);
    });
  });

  describe('exportCoupons', () => {
    it('should export coupons to CSV', async () => {
      const options = { format: ExportFormat.CSV };
      const coupons = [mockCoupon];

      mockCouponRepository.findMany.mockResolvedValue(coupons);

      const result = await service.exportCoupons(options);

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should export coupons to PDF', async () => {
      const options = { format: ExportFormat.PDF };
      const coupons = [mockCoupon];

      mockCouponRepository.findMany.mockResolvedValue(coupons);

      const result = await service.exportCoupons(options);

      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toContain('.pdf');
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should throw error for unsupported format', async () => {
      const options = { format: 'xml' as any };

      await expect(service.exportCoupons(options)).rejects.toThrow(BadRequestException);
    });
  });

  describe('autoExpireCoupons', () => {
    it('should auto-expire coupons', async () => {
      const expiredCount = 3;

      mockCouponRepository.autoExpireCoupons.mockResolvedValue(expiredCount);

      await service.autoExpireCoupons();

      expect(mockCouponRepository.autoExpireCoupons).toHaveBeenCalled();
    });

    it('should handle auto-expiration errors gracefully', async () => {
      mockCouponRepository.autoExpireCoupons.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(service.autoExpireCoupons()).resolves.toBeUndefined();
    });
  });

  describe('expireExpiredCoupons', () => {
    it('should manually expire coupons', async () => {
      const expiredCount = 5;

      mockCouponRepository.autoExpireCoupons.mockResolvedValue(expiredCount);

      const result = await service.expireExpiredCoupons();

      expect(result.expiredCount).toBe(expiredCount);
    });

    it('should throw error on manual expiration failure', async () => {
      mockCouponRepository.autoExpireCoupons.mockRejectedValue(new Error('Database error'));

      await expect(service.expireExpiredCoupons()).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMany', () => {
    it('should return paginated coupons', async () => {
      const queryDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockCoupon],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockCouponRepository.findWithFilters.mockResolvedValue(paginatedResult);

      const result = await service.findMany(queryDto);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getAllBatchStatistics', () => {
    it('should return all batch statistics', async () => {
      const batchStats = [
        {
          batchId: 'BATCH_001',
          totalCoupons: 10,
          activeCoupons: 8,
          redeemedCoupons: 2,
          expiredCoupons: 0,
          deactivatedCoupons: 0,
          createdAt: new Date(),
          creator: { id: 1, username: 'admin', email: 'admin@test.com' },
        },
      ];

      mockCouponRepository.getAllBatchStatistics.mockResolvedValue(batchStats);

      const result = await service.getAllBatchStatistics();

      expect(result).toHaveLength(1);
      expect(result[0].batchId).toBe('BATCH_001');
    });
  });
});