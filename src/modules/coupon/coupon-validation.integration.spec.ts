import { Test, TestingModule } from '@nestjs/testing';
import { CouponValidationService } from './coupon-validation.service';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService } from './coupon-generator.service';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import type { Coupon } from '@prisma/client';

describe('CouponValidationService Integration', () => {
  let service: CouponValidationService;
  let prisma: PrismaService;
  let testCouponId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponValidationService,
        CouponRepository,
        CouponGeneratorService,
        PrismaService,
      ],
    }).compile();

    service = module.get<CouponValidationService>(CouponValidationService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean up any existing test data
    await prisma.coupon.deleteMany({
      where: {
        couponCode: {
          startsWith: 'TEST'
        }
      }
    });

    // Create a test admin if it doesn't exist
    const testAdmin = await prisma.admin.upsert({
      where: { username: 'testadmin_validation' },
      update: {},
      create: {
        username: 'testadmin_validation',
        email: 'testadmin_validation@example.com',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    // Create test coupon
    const testCoupon = await prisma.coupon.create({
      data: {
        couponCode: 'TESTVALID123',
        codeLength: 12,
        status: 'ACTIVE',
        createdBy: testAdmin.id,
        generationMethod: 'SINGLE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    testCouponId = testCoupon.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.coupon.deleteMany({
      where: {
        couponCode: {
          startsWith: 'TEST'
        }
      }
    });

    await prisma.admin.deleteMany({
      where: {
        username: 'testadmin_validation'
      }
    });

    await prisma.$disconnect();
  });

  describe('validateCouponForRedemption', () => {
    it('should validate an active coupon successfully', async () => {
      const result = await service.validateCouponForRedemption('TESTVALID123');

      expect(result.isValid).toBe(true);
      expect(result.coupon).toBeDefined();
      expect(result.coupon?.couponCode).toBe('TESTVALID123');
      expect(result.coupon?.status).toBe('ACTIVE');
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should reject invalid format coupon', async () => {
      const result = await service.validateCouponForRedemption('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('format is invalid');
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.coupon).toBeUndefined();
    });

    it('should reject non-existent coupon', async () => {
      const result = await service.validateCouponForRedemption('NOTFOUND123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon code not found');
      expect(result.errorCode).toBe('COUPON_NOT_FOUND');
      expect(result.coupon).toBeUndefined();
    });

    it('should reject already redeemed coupon', async () => {
      // Create a redeemed coupon
      const redeemedCoupon = await prisma.coupon.create({
        data: {
          couponCode: 'TESTREDEEMED',
          codeLength: 12,
          status: 'REDEEMED',
          createdBy: (await prisma.admin.findFirst({ where: { username: 'testadmin_validation' } }))!.id,
          generationMethod: 'SINGLE',
          redeemedAt: new Date(),
        },
      });

      const result = await service.validateCouponForRedemption('TESTREDEEMED');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already been redeemed');
      expect(result.errorCode).toBe('COUPON_ALREADY_REDEEMED');
      expect(result.coupon).toBeUndefined();
    });

    it('should reject expired coupon and auto-expire it', async () => {
      // Create an expired coupon
      const expiredCoupon = await prisma.coupon.create({
        data: {
          couponCode: 'TESTEXPIRED1',
          codeLength: 12,
          status: 'ACTIVE',
          createdBy: (await prisma.admin.findFirst({ where: { username: 'testadmin_validation' } }))!.id,
          generationMethod: 'SINGLE',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      });

      const result = await service.validateCouponForRedemption('TESTEXPIRED1');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('expired');
      expect(result.errorCode).toBe('COUPON_EXPIRED');
      expect(result.coupon).toBeUndefined();

      // Verify the coupon was auto-expired
      const updatedCoupon = await prisma.coupon.findUnique({
        where: { couponCode: 'TESTEXPIRED1' }
      });
      expect(updatedCoupon?.status).toBe('EXPIRED');
    });

    it('should reject deactivated coupon', async () => {
      // Create a deactivated coupon
      const deactivatedCoupon = await prisma.coupon.create({
        data: {
          couponCode: 'TESTDEACTIVATED',
          codeLength: 12,
          status: 'DEACTIVATED',
          createdBy: (await prisma.admin.findFirst({ where: { username: 'testadmin_validation' } }))!.id,
          generationMethod: 'SINGLE',
        },
      });

      const result = await service.validateCouponForRedemption('TESTDEACTIVATED');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('deactivated');
      expect(result.errorCode).toBe('COUPON_DEACTIVATED');
      expect(result.coupon).toBeUndefined();
    });
  });

  describe('validateCouponFormat', () => {
    it('should validate correct format', () => {
      const result = service.validateCouponFormat('ABCD123456');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty string', () => {
      const result = service.validateCouponFormat('');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should reject null input', () => {
      const result = service.validateCouponFormat(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });
  });

  describe('canRedeemCoupon', () => {
    it('should return true for valid coupon', async () => {
      const result = await service.canRedeemCoupon('TESTVALID123');
      expect(result).toBe(true);
    });

    it('should return false for invalid coupon', async () => {
      const result = await service.canRedeemCoupon('INVALID');
      expect(result).toBe(false);
    });
  });

  describe('getDetailedValidationInfo', () => {
    it('should return detailed info for valid coupon', async () => {
      const result = await service.getDetailedValidationInfo('TESTVALID123');

      expect(result.formatValid).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect(result.expired).toBe(false);
      expect(result.canRedeem).toBe(true);
      expect(result.validationResult.isValid).toBe(true);
    });

    it('should return detailed info for invalid format', async () => {
      const result = await service.getDetailedValidationInfo('INVALID');

      expect(result.formatValid).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.status).toBe(null);
      expect(result.expired).toBe(false);
      expect(result.canRedeem).toBe(false);
      expect(result.validationResult.isValid).toBe(false);
    });
  });
});