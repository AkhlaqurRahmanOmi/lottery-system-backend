import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CouponController } from './coupon.controller';
import { CouponService } from '../../../modules/coupon/coupon.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { CouponStatus } from '@prisma/client';
import { ExportFormat } from '../../../modules/coupon/dto/coupon-export.dto';

describe('CouponController', () => {
  let controller: CouponController;
  let couponService: jest.Mocked<CouponService>;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;

  const mockAuthenticatedRequest = {
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN', // Will be AdminRole.ADMIN after Prisma generation
    },
    traceId: 'test-trace-id',
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
  };

  const mockCouponResponse = {
    id: 1,
    couponCode: 'ABC123XYZ9',
    batchId: 'batch_001',
    codeLength: 10,
    status: CouponStatus.ACTIVE,
    createdBy: 1,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    redeemedAt: undefined,
    redeemedBy: undefined,
    generationMethod: 'BATCH',
    metadata: {},
  };

  const mockCouponService = {
    generateCoupons: jest.fn(),
    findMany: jest.fn(),
    getStatistics: jest.fn(),
    getAllBatchStatistics: jest.fn(),
    getBatchStatistics: jest.fn(),
    deactivateBatch: jest.fn(),
    expireExpiredCoupons: jest.fn(),
    findById: jest.fn(),
    deactivate: jest.fn(),
    delete: jest.fn(),
    exportCoupons: jest.fn(),
    validateCoupon: jest.fn(),
    findByCouponCode: jest.fn(),
  };

  const mockResponseBuilder = {
    buildSuccessResponse: jest.fn(),
    buildErrorResponse: jest.fn(),
    generateHATEOASLinks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponController],
      providers: [
        {
          provide: CouponService,
          useValue: mockCouponService,
        },
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CouponController>(CouponController);
    couponService = module.get(CouponService);
    responseBuilder = module.get(ResponseBuilderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCoupons', () => {
    it('should generate coupons successfully', async () => {
      const generateDto = {
        quantity: 5,
        codeLength: 10,
        expirationDays: 30,
        batchName: 'Test Batch',
        createdBy: 1,
        metadata: { test: true },
      };

      const generatedCoupons = Array(5).fill(mockCouponResponse);
      mockCouponService.generateCoupons.mockResolvedValue(generatedCoupons);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.CREATED,
        data: generatedCoupons,
        message: 'Successfully generated 5 coupon(s)',
      });

      const result = await controller.generateCoupons(generateDto, mockAuthenticatedRequest as any);

      expect(couponService.generateCoupons).toHaveBeenCalledWith({
        ...generateDto,
        createdBy: mockAuthenticatedRequest.user.id,
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
    });

    it('should handle generation errors', async () => {
      const generateDto = {
        quantity: 5,
        codeLength: 10,
        createdBy: 1,
      };

      mockCouponService.generateCoupons.mockRejectedValue(new Error('Generation failed'));

      await expect(
        controller.generateCoupons(generateDto, mockAuthenticatedRequest as any),
      ).rejects.toThrow('Bad Request');
    });
  });

  describe('findAll', () => {
    it('should return paginated coupons', async () => {
      const queryDto = {
        page: 1,
        limit: 10,
        status: CouponStatus.ACTIVE,
      };

      const paginatedResult = {
        data: [mockCouponResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockCouponService.findMany.mockResolvedValue(paginatedResult);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: paginatedResult,
        message: 'Coupons retrieved successfully',
      });

      const result = await controller.findAll(queryDto, mockAuthenticatedRequest as any);

      expect(couponService.findMany).toHaveBeenCalledWith(queryDto);
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return coupon statistics', async () => {
      const mockStats = {
        total: 1000,
        active: 750,
        redeemed: 200,
        expired: 30,
        deactivated: 20,
        redemptionRate: 0.2,
      };

      mockCouponService.getStatistics.mockResolvedValue(mockStats);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockStats,
        message: 'Statistics retrieved successfully',
      });

      const result = await controller.getStatistics(mockAuthenticatedRequest as any);

      expect(couponService.getStatistics).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.total).toBe(1000);
    });
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      const validationDto = { couponCode: 'ABC123XYZ9' };
      const validationResult = {
        isValid: true,
        coupon: mockCouponResponse,
      };

      mockCouponService.validateCoupon.mockResolvedValue(validationResult);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: validationResult,
        message: 'Coupon is valid for redemption',
      });

      const result = await controller.validateCoupon(
        validationDto,
        mockAuthenticatedRequest as any,
      );

      expect(couponService.validateCoupon).toHaveBeenCalledWith('ABC123XYZ9');
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(true);
    });

    it('should validate an invalid coupon', async () => {
      const validationDto = { couponCode: 'INVALID123' };
      const validationResult = {
        isValid: false,
        error: 'Coupon not found',
        errorCode: 'COUPON_NOT_FOUND',
      };

      mockCouponService.validateCoupon.mockResolvedValue(validationResult);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: validationResult,
        message: 'Coupon validation failed',
      });

      const result = await controller.validateCoupon(
        validationDto,
        mockAuthenticatedRequest as any,
      );

      expect(couponService.validateCoupon).toHaveBeenCalledWith('INVALID123');
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(false);
    });
  });

  describe('exportCoupons', () => {
    it('should export coupons successfully', async () => {
      const exportDto = {
        format: ExportFormat.CSV,
        status: CouponStatus.ACTIVE,
        includeBatchInfo: true,
      };

      const exportResult = {
        data: Buffer.from('id,couponCode,status\n1,ABC123XYZ9,ACTIVE'),
        filename: 'coupons_export_2024-01-15.csv',
        mimeType: 'text/csv',
      };

      mockCouponService.exportCoupons.mockResolvedValue(exportResult);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: {
          data: 'data:text/csv;base64,' + exportResult.data.toString('base64'),
          filename: exportResult.filename,
          mimeType: exportResult.mimeType,
        },
        message: 'Export generated successfully',
      });

      const result = await controller.exportCoupons(exportDto, mockAuthenticatedRequest as any);

      expect(couponService.exportCoupons).toHaveBeenCalledWith({
        format: 'csv',
        filters: {
          status: CouponStatus.ACTIVE,
          batchId: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        },
        includeMetadata: true,
      });
      expect(result.success).toBe(true);
      expect(result.data.filename).toBe('coupons_export_2024-01-15.csv');
    });
  });

  describe('findOne', () => {
    it('should return a coupon by ID', async () => {
      const couponId = 1;
      const mockCouponWithCreator = {
        ...mockCouponResponse,
        creator: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
        },
        submission: null,
      };

      mockCouponService.findById.mockResolvedValue(mockCouponWithCreator);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: mockCouponWithCreator,
        message: 'Coupon retrieved successfully',
      });

      const result = await controller.findOne(couponId, mockAuthenticatedRequest as any);

      expect(couponService.findById).toHaveBeenCalledWith(couponId);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(couponId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a coupon', async () => {
      const couponId = 1;
      const deactivatedCoupon = {
        ...mockCouponResponse,
        status: CouponStatus.DEACTIVATED,
      };

      mockCouponService.deactivate.mockResolvedValue(deactivatedCoupon);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: deactivatedCoupon,
        message: 'Coupon deactivated successfully',
      });

      const result = await controller.deactivate(couponId, mockAuthenticatedRequest as any);

      expect(couponService.deactivate).toHaveBeenCalledWith(couponId);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(CouponStatus.DEACTIVATED);
    });
  });

  describe('remove', () => {
    it('should delete a coupon', async () => {
      const couponId = 1;

      mockCouponService.delete.mockResolvedValue(undefined);

      await controller.remove(couponId, mockAuthenticatedRequest as any);

      expect(couponService.delete).toHaveBeenCalledWith(couponId);
    });
  });

  describe('deactivateBatch', () => {
    it('should deactivate a batch of coupons', async () => {
      const batchId = 'batch_001';
      const deactivationResult = { deactivatedCount: 50 };

      mockCouponService.deactivateBatch.mockResolvedValue(deactivationResult);
      mockResponseBuilder.generateHATEOASLinks.mockReturnValue({});
      mockResponseBuilder.buildSuccessResponse.mockReturnValue({
        success: true,
        statusCode: HttpStatus.OK,
        data: deactivationResult,
        message: 'Successfully deactivated 50 coupons in batch batch_001',
      });

      const result = await controller.deactivateBatch(batchId, mockAuthenticatedRequest as any);

      expect(couponService.deactivateBatch).toHaveBeenCalledWith(batchId);
      expect(result.success).toBe(true);
      expect(result.data.deactivatedCount).toBe(50);
    });
  });
});