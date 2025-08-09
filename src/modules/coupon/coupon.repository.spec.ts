import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CouponRepository } from './coupon.repository';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { CouponStatus, GenerationMethod } from '@prisma/client';
import { CreateCouponDto, UpdateCouponDto, CouponQueryDto } from './dto';

describe('CouponRepository', () => {
  let repository: CouponRepository;
  let prismaService: PrismaService;

  const mockCoupon = {
    id: 1,
    couponCode: 'ABC123XYZ9',
    batchId: 'batch_001',
    codeLength: 10,
    status: CouponStatus.ACTIVE,
    createdBy: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    expiresAt: new Date('2025-12-31T23:59:59.999Z'),
    redeemedAt: null,
    redeemedBy: null,
    generationMethod: GenerationMethod.SINGLE,
    metadata: null,
  };

  const mockCouponWithRelations = {
    ...mockCoupon,
    creator: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
    },
    submission: null,
  };

  const mockPrismaService = {
    coupon: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<CouponRepository>(CouponRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find coupon by ID', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await repository.findById(1);

      expect(result).toEqual(mockCoupon);
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null if coupon not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByCouponCode', () => {
    it('should find coupon by coupon code', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await repository.findByCouponCode('ABC123XYZ9');

      expect(result).toEqual(mockCoupon);
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { couponCode: 'ABC123XYZ9' },
      });
    });

    it('should return null if coupon not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await repository.findByCouponCode('NOTFOUND');

      expect(result).toBeNull();
    });
  });

  describe('findByCouponCodeWithRelations', () => {
    it('should find coupon with relations', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCouponWithRelations);

      const result = await repository.findByCouponCodeWithRelations('ABC123XYZ9');

      expect(result).toEqual(mockCouponWithRelations);
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { couponCode: 'ABC123XYZ9' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          submission: {
            select: {
              id: true,
              name: true,
              email: true,
              submittedAt: true,
            },
          },
        },
      });
    });
  });

  describe('existsByCouponCode', () => {
    it('should return true if coupon exists', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(1);

      const result = await repository.existsByCouponCode('ABC123XYZ9');

      expect(result).toBe(true);
      expect(mockPrismaService.coupon.count).toHaveBeenCalledWith({
        where: { couponCode: 'ABC123XYZ9' },
      });
    });

    it('should return false if coupon does not exist', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(0);

      const result = await repository.existsByCouponCode('NOTFOUND');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking existence', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(0);

      await repository.existsByCouponCode('ABC123XYZ9', 1);

      expect(mockPrismaService.coupon.count).toHaveBeenCalledWith({
        where: {
          couponCode: 'ABC123XYZ9',
          NOT: { id: 1 },
        },
      });
    });
  });

  describe('create', () => {
    const createCouponDto: CreateCouponDto = {
      couponCode: 'NEW123CODE',
      batchId: 'batch_002',
      codeLength: 10,
      createdBy: 1,
      generationMethod: GenerationMethod.SINGLE,
      expiresAt: '2024-12-31T23:59:59.999Z',
      metadata: { test: 'data' },
    };

    it('should create a new coupon', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(0); // Not exists
      mockPrismaService.coupon.create.mockResolvedValue(mockCoupon);

      const result = await repository.create(createCouponDto);

      expect(result).toEqual(mockCoupon);
      expect(mockPrismaService.coupon.create).toHaveBeenCalledWith({
        data: {
          couponCode: 'NEW123CODE',
          batchId: 'batch_002',
          codeLength: 10,
          generationMethod: GenerationMethod.SINGLE,
          metadata: { test: 'data' },
          creator: { connect: { id: 1 } },
          expiresAt: new Date('2024-12-31T23:59:59.999Z'),
        },
      });
    });

    it('should throw ConflictException if coupon code already exists', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(1); // Exists

      await expect(repository.create(createCouponDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on Prisma unique constraint violation', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(0);
      mockPrismaService.coupon.create.mockRejectedValue({ code: 'P2002' });

      await expect(repository.create(createCouponDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException on foreign key constraint violation', async () => {
      mockPrismaService.coupon.count.mockResolvedValue(0);
      mockPrismaService.coupon.create.mockRejectedValue({ code: 'P2003' });

      await expect(repository.create(createCouponDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBatch', () => {
    const batchCoupons: CreateCouponDto[] = [
      {
        couponCode: 'BATCH001',
        batchId: 'batch_003',
        codeLength: 10,
        createdBy: 1,
        generationMethod: GenerationMethod.BATCH,
      },
      {
        couponCode: 'BATCH002',
        batchId: 'batch_003',
        codeLength: 10,
        createdBy: 1,
        generationMethod: GenerationMethod.BATCH,
      },
    ];

    it('should create multiple coupons in a batch', async () => {
      mockPrismaService.coupon.findMany.mockResolvedValue([]); // No existing codes
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          coupon: {
            create: jest.fn()
              .mockResolvedValueOnce({ ...mockCoupon, couponCode: 'BATCH001' })
              .mockResolvedValueOnce({ ...mockCoupon, couponCode: 'BATCH002' }),
          },
        });
      });

      const result = await repository.createBatch(batchCoupons);

      expect(result).toHaveLength(2);
      expect(result[0].couponCode).toBe('BATCH001');
      expect(result[1].couponCode).toBe('BATCH002');
    });

    it('should throw ConflictException for duplicate codes within batch', async () => {
      const duplicateBatch = [
        { ...batchCoupons[0] },
        { ...batchCoupons[0] }, // Duplicate
      ];

      await expect(repository.createBatch(duplicateBatch)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if codes already exist in database', async () => {
      mockPrismaService.coupon.findMany.mockResolvedValue([
        { couponCode: 'BATCH001' },
      ]);

      await expect(repository.createBatch(batchCoupons)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateCouponDto: UpdateCouponDto = {
      status: CouponStatus.DEACTIVATED,
      expiresAt: '2024-06-30T23:59:59.999Z',
    };

    it('should update a coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.update.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.DEACTIVATED,
      });

      const result = await repository.update(1, updateCouponDto);

      expect(result.status).toBe(CouponStatus.DEACTIVATED);
      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: CouponStatus.DEACTIVATED,
          expiresAt: new Date('2024-06-30T23:59:59.999Z'),
          redeemedAt: undefined,
        },
      });
    });

    it('should throw NotFoundException if coupon not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(repository.update(999, updateCouponDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateCoupon', () => {
    it('should return valid result for active coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await repository.validateCoupon('ABC123XYZ9');

      expect(result.isValid).toBe(true);
      expect(result.coupon).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return invalid result for non-existent coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await repository.validateCoupon('NOTFOUND');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code not found');
      expect(result.errorCode).toBe('COUPON_NOT_FOUND');
    });

    it('should return invalid result for redeemed coupon', async () => {
      const redeemedCoupon = { ...mockCoupon, status: CouponStatus.REDEEMED };
      mockPrismaService.coupon.findUnique.mockResolvedValue(redeemedCoupon);

      const result = await repository.validateCoupon('ABC123XYZ9');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon has already been redeemed');
      expect(result.errorCode).toBe('COUPON_ALREADY_REDEEMED');
    });

    it('should return invalid result for expired coupon', async () => {
      const expiredCoupon = { ...mockCoupon, status: CouponStatus.EXPIRED };
      mockPrismaService.coupon.findUnique.mockResolvedValue(expiredCoupon);

      const result = await repository.validateCoupon('ABC123XYZ9');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
      expect(result.errorCode).toBe('COUPON_EXPIRED');
    });

    it('should auto-expire coupon if past expiration date', async () => {
      const pastExpiredCoupon = {
        ...mockCoupon,
        expiresAt: new Date('2020-01-01T00:00:00.000Z'), // Past date
      };
      mockPrismaService.coupon.findUnique.mockResolvedValue(pastExpiredCoupon);
      mockPrismaService.coupon.update.mockResolvedValue({
        ...pastExpiredCoupon,
        status: CouponStatus.EXPIRED,
      });

      const result = await repository.validateCoupon('ABC123XYZ9');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
      expect(result.errorCode).toBe('COUPON_EXPIRED');
      expect(mockPrismaService.coupon.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'EXPIRED',
          expiresAt: undefined,
          redeemedAt: undefined,
        },
      });
    });
  });

  describe('findWithFilters', () => {
    const queryDto: CouponQueryDto = {
      page: 1,
      limit: 10,
      search: 'ABC',
      status: CouponStatus.ACTIVE,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    it('should find coupons with filters and pagination', async () => {
      const mockCoupons = [mockCouponWithRelations];
      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);
      mockPrismaService.coupon.count.mockResolvedValue(1);

      const result = await repository.findWithFilters(queryDto);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
  });

  describe('getBatchStatistics', () => {
    it('should return batch statistics', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue(mockCouponWithRelations);
      mockPrismaService.coupon.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(1)  // redeemed
        .mockResolvedValueOnce(1)  // expired
        .mockResolvedValueOnce(0); // deactivated

      const result = await repository.getBatchStatistics('batch_001');

      expect(result).toEqual({
        batchId: 'batch_001',
        totalCoupons: 10,
        activeCoupons: 8,
        redeemedCoupons: 1,
        expiredCoupons: 1,
        deactivatedCoupons: 0,
        createdAt: mockCoupon.createdAt,
        creator: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
        },
      });
    });

    it('should return null if batch not found', async () => {
      mockPrismaService.coupon.findFirst.mockResolvedValue(null);

      const result = await repository.getBatchStatistics('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('markAsRedeemed', () => {
    it('should mark coupon as redeemed', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.update.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.REDEEMED,
        redeemedAt: new Date(),
        redeemedBy: 123,
      });

      const result = await repository.markAsRedeemed('ABC123XYZ9', 123);

      expect(result.status).toBe(CouponStatus.REDEEMED);
      expect(result.redeemedBy).toBe(123);
    });

    it('should throw NotFoundException if coupon not found', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(repository.markAsRedeemed('NOTFOUND')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return coupon statistics', async () => {
      mockPrismaService.coupon.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(70)  // active
        .mockResolvedValueOnce(20)  // redeemed
        .mockResolvedValueOnce(8)   // expired
        .mockResolvedValueOnce(2);  // deactivated

      const result = await repository.getStatistics();

      expect(result).toEqual({
        total: 100,
        active: 70,
        redeemed: 20,
        expired: 8,
        deactivated: 2,
        redemptionRate: 20, // 20/100 * 100 = 20%
      });
    });

    it('should handle zero total coupons', async () => {
      mockPrismaService.coupon.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0) // redeemed
        .mockResolvedValueOnce(0) // expired
        .mockResolvedValueOnce(0); // deactivated

      const result = await repository.getStatistics();

      expect(result.redemptionRate).toBe(0);
    });
  });

  describe('autoExpireCoupons', () => {
    it('should auto-expire expired coupons', async () => {
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 5 });

      const result = await repository.autoExpireCoupons();

      expect(result).toBe(5);
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: expect.any(Date),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    });
  });

  describe('deactivateBatch', () => {
    it('should deactivate all active coupons in a batch', async () => {
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 3 });

      const result = await repository.deactivateBatch('batch_001');

      expect(result).toBe(3);
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          batchId: 'batch_001',
          status: 'ACTIVE',
        },
        data: {
          status: 'DEACTIVATED',
        },
      });
    });
  });

  describe('canDelete', () => {
    it('should return true for non-redeemed coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await repository.canDelete(1);

      expect(result).toBe(true);
    });

    it('should return false for redeemed coupon', async () => {
      const redeemedCoupon = { ...mockCoupon, status: CouponStatus.REDEEMED };
      mockPrismaService.coupon.findUnique.mockResolvedValue(redeemedCoupon);

      const result = await repository.canDelete(1);

      expect(result).toBe(false);
    });

    it('should return false for non-existent coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await repository.canDelete(999);

      expect(result).toBe(false);
    });
  });
});