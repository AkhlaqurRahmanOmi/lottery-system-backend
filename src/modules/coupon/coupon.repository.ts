import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import type { Coupon, Prisma, CouponStatus, GenerationMethod } from '@prisma/client';
import { 
  CouponQueryDto, 
  PaginatedCouponResponseDto, 
  CouponWithCreatorResponseDto,
  BatchStatisticsDto,
  CouponValidationResultDto,
  CreateCouponDto,
  UpdateCouponDto
} from './dto';

export interface CouponSearchFilters {
  search?: string;
  status?: CouponStatus;
  batchId?: string;
  generationMethod?: GenerationMethod;
  createdBy?: number;
  createdFrom?: Date;
  createdTo?: Date;
  expiresFrom?: Date;
  expiresTo?: Date;
}

export interface CouponSortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CouponPaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class CouponRepository {
  private readonly logger = new Logger(CouponRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find coupon by ID
   */
  async findById(id: number): Promise<Coupon | null> {
    return this.prisma.coupon.findUnique({
      where: { id },
    });
  }

  /**
   * Find coupon by coupon code
   */
  async findByCouponCode(couponCode: string): Promise<Coupon | null> {
    return this.prisma.coupon.findUnique({
      where: { couponCode },
    });
  }

  /**
   * Find coupon by coupon code with relations
   */
  async findByCouponCodeWithRelations(couponCode: string): Promise<any | null> {
    return this.prisma.coupon.findUnique({
      where: { couponCode },
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
  }

  /**
   * Check if coupon code exists (for uniqueness validation)
   */
  async existsByCouponCode(couponCode: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.CouponWhereInput = {
      couponCode,
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await this.prisma.coupon.count({ where });
    return count > 0;
  }

  /**
   * Create new coupon with uniqueness validation
   */
  async create(data: CreateCouponDto): Promise<Coupon> {
    try {
      // Check for existing coupon code
      const exists = await this.existsByCouponCode(data.couponCode);
      if (exists) {
        throw new ConflictException(`Coupon with code '${data.couponCode}' already exists`);
      }

      // Convert string dates to Date objects
      const createData: Prisma.CouponCreateInput = {
        couponCode: data.couponCode,
        batchId: data.batchId,
        codeLength: data.codeLength,
        generationMethod: data.generationMethod,
        metadata: data.metadata,
        creator: {
          connect: { id: data.createdBy }
        },
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      };

      return await this.prisma.coupon.create({
        data: createData,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Prisma unique constraint violation
        throw new ConflictException(`Coupon with code '${data.couponCode}' already exists`);
      }
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw new NotFoundException(`Admin with ID ${data.createdBy} not found`);
      }
      throw error;
    }
  }

  /**
   * Create multiple coupons in a batch
   */
  async createBatch(coupons: CreateCouponDto[]): Promise<Coupon[]> {
    try {
      // Check for duplicate codes within the batch
      const codes = coupons.map(c => c.couponCode);
      const uniqueCodes = new Set(codes);
      if (codes.length !== uniqueCodes.size) {
        throw new ConflictException('Duplicate coupon codes found in batch');
      }

      // Check for existing codes in database
      const existingCodes = await this.prisma.coupon.findMany({
        where: {
          couponCode: {
            in: codes
          }
        },
        select: { couponCode: true }
      });

      if (existingCodes.length > 0) {
        const conflictingCodes = existingCodes.map(c => c.couponCode);
        throw new ConflictException(`Coupon codes already exist: ${conflictingCodes.join(', ')}`);
      }

      // Create all coupons in a transaction
      return await this.prisma.$transaction(async (tx) => {
        const createdCoupons: Coupon[] = [];
        
        for (const couponData of coupons) {
          const createData: Prisma.CouponCreateInput = {
            couponCode: couponData.couponCode,
            batchId: couponData.batchId,
            codeLength: couponData.codeLength,
            generationMethod: couponData.generationMethod,
            metadata: couponData.metadata,
            creator: {
              connect: { id: couponData.createdBy }
            },
            expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null,
          };

          const coupon = await tx.coupon.create({
            data: createData,
          });
          createdCoupons.push(coupon);
        }

        return createdCoupons;
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('One or more coupon codes already exist');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('One or more admin IDs not found');
      }
      throw error;
    }
  }

  /**
   * Update coupon
   */
  async update(id: number, data: UpdateCouponDto): Promise<Coupon> {
    try {
      // Check if coupon exists
      const existingCoupon = await this.findById(id);
      if (!existingCoupon) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      // Convert string dates to Date objects
      const updateData: Prisma.CouponUpdateInput = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        redeemedAt: data.redeemedAt ? new Date(data.redeemedAt) : undefined,
      };

      return await this.prisma.coupon.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma record not found
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete coupon
   */
  async delete(id: number): Promise<Coupon> {
    try {
      return await this.prisma.coupon.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find many coupons with basic parameters
   */
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CouponWhereInput;
    orderBy?: Prisma.CouponOrderByWithRelationInput;
    include?: Prisma.CouponInclude;
  }): Promise<Coupon[]> {
    const { skip, take, where, orderBy, include } = params || {};

    return this.prisma.coupon.findMany({
      skip,
      take,
      where,
      orderBy,
      include,
    });
  }

  /**
   * Count coupons with optional filters
   */
  async count(where?: Prisma.CouponWhereInput): Promise<number> {
    return this.prisma.coupon.count({ where });
  }

  /**
   * Find coupons with advanced filtering, sorting, and pagination
   */
  async findWithFilters(queryDto: CouponQueryDto): Promise<PaginatedCouponResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      batchId, 
      generationMethod,
      createdBy,
      createdFrom,
      createdTo,
      expiresFrom,
      expiresTo,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Build where clause
    const where: Prisma.CouponWhereInput = {};

    // Add search filter
    if (search) {
      where.couponCode = { contains: search, mode: 'insensitive' };
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add batch ID filter
    if (batchId) {
      where.batchId = batchId;
    }

    // Add generation method filter
    if (generationMethod) {
      where.generationMethod = generationMethod;
    }

    // Add creator filter
    if (createdBy) {
      where.createdBy = createdBy;
    }

    // Add date range filters
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    if (expiresFrom || expiresTo) {
      where.expiresAt = {};
      if (expiresFrom) {
        where.expiresAt.gte = new Date(expiresFrom);
      }
      if (expiresTo) {
        where.expiresAt.lte = new Date(expiresTo);
      }
    }

    // Build order by clause
    const orderBy: Prisma.CouponOrderByWithRelationInput = {};
    if (sortBy && ['id', 'couponCode', 'status', 'createdAt', 'expiresAt', 'redeemedAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
      this.prisma.coupon.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: coupons.map(coupon => ({
        id: coupon.id,
        couponCode: coupon.couponCode,
        batchId: coupon.batchId || undefined,
        codeLength: coupon.codeLength,
        status: coupon.status,
        createdBy: coupon.createdBy,
        createdAt: coupon.createdAt,
        expiresAt: coupon.expiresAt || undefined,
        redeemedAt: coupon.redeemedAt || undefined,
        redeemedBy: coupon.redeemedBy || undefined,
        generationMethod: coupon.generationMethod,
        metadata: coupon.metadata,
        creator: coupon.creator ? {
          id: coupon.creator.id,
          username: coupon.creator.username,
          email: coupon.creator.email,
        } : undefined,
        submission: coupon.submission ? {
          id: coupon.submission.id,
          name: coupon.submission.name,
          email: coupon.submission.email,
          submittedAt: coupon.submission.submittedAt,
        } : undefined,
      })),
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Find coupons by batch ID
   */
  async findByBatchId(batchId: string): Promise<Coupon[]> {
    return this.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Get batch statistics
   */
  async getBatchStatistics(batchId: string): Promise<BatchStatisticsDto | null> {
    const batch = await this.prisma.coupon.findFirst({
      where: { batchId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!batch) {
      return null;
    }

    const [
      totalCoupons,
      activeCoupons,
      redeemedCoupons,
      expiredCoupons,
      deactivatedCoupons
    ] = await Promise.all([
      this.count({ batchId }),
      this.count({ batchId, status: 'ACTIVE' }),
      this.count({ batchId, status: 'REDEEMED' }),
      this.count({ batchId, status: 'EXPIRED' }),
      this.count({ batchId, status: 'DEACTIVATED' }),
    ]);

    return {
      batchId,
      totalCoupons,
      activeCoupons,
      redeemedCoupons,
      expiredCoupons,
      deactivatedCoupons,
      createdAt: batch.createdAt,
      creator: {
        id: batch.creator.id,
        username: batch.creator.username,
        email: batch.creator.email,
      },
    };
  }

  /**
   * Get all batch IDs with statistics
   */
  async getAllBatchStatistics(): Promise<BatchStatisticsDto[]> {
    const batches = await this.prisma.coupon.groupBy({
      by: ['batchId'],
      where: {
        batchId: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        batchId: 'desc'
      }
    });

    const batchStats: BatchStatisticsDto[] = [];

    for (const batch of batches) {
      if (batch.batchId) {
        const stats = await this.getBatchStatistics(batch.batchId);
        if (stats) {
          batchStats.push(stats);
        }
      }
    }

    return batchStats;
  }

  /**
   * Validate coupon for redemption
   */
  async validateCoupon(couponCode: string): Promise<CouponValidationResultDto> {
    const coupon = await this.findByCouponCode(couponCode);

    if (!coupon) {
      return {
        isValid: false,
        error: 'Coupon code not found',
        errorCode: 'COUPON_NOT_FOUND'
      };
    }

    if (coupon.status === 'REDEEMED') {
      return {
        isValid: false,
        error: 'Coupon has already been redeemed',
        errorCode: 'COUPON_ALREADY_REDEEMED'
      };
    }

    if (coupon.status === 'EXPIRED') {
      return {
        isValid: false,
        error: 'Coupon has expired',
        errorCode: 'COUPON_EXPIRED'
      };
    }

    if (coupon.status === 'DEACTIVATED') {
      return {
        isValid: false,
        error: 'Coupon has been deactivated',
        errorCode: 'COUPON_DEACTIVATED'
      };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      // Auto-expire the coupon
      await this.update(coupon.id, { status: 'EXPIRED' });
      return {
        isValid: false,
        error: 'Coupon has expired',
        errorCode: 'COUPON_EXPIRED'
      };
    }

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        couponCode: coupon.couponCode,
        batchId: coupon.batchId || undefined,
        codeLength: coupon.codeLength,
        status: coupon.status,
        createdBy: coupon.createdBy,
        createdAt: coupon.createdAt,
        expiresAt: coupon.expiresAt || undefined,
        redeemedAt: coupon.redeemedAt || undefined,
        redeemedBy: coupon.redeemedBy || undefined,
        generationMethod: coupon.generationMethod,
        metadata: coupon.metadata,
      }
    };
  }

  /**
   * Mark coupon as redeemed
   */
  async markAsRedeemed(couponCode: string, redeemedBy?: number): Promise<Coupon> {
    const coupon = await this.findByCouponCode(couponCode);
    if (!coupon) {
      throw new NotFoundException(`Coupon with code '${couponCode}' not found`);
    }

    return this.update(coupon.id, {
      status: 'REDEEMED',
      redeemedAt: new Date().toISOString(),
      redeemedBy,
    });
  }

  /**
   * Deactivate coupon
   */
  async deactivate(id: number): Promise<Coupon> {
    return this.update(id, { status: 'DEACTIVATED' });
  }

  /**
   * Deactivate batch
   */
  async deactivateBatch(batchId: string): Promise<number> {
    const result = await this.prisma.coupon.updateMany({
      where: { 
        batchId,
        status: 'ACTIVE' // Only deactivate active coupons
      },
      data: { 
        status: 'DEACTIVATED',
      },
    });

    return result.count;
  }

  /**
   * Get expired coupons
   */
  async getExpiredCoupons(): Promise<Coupon[]> {
    return this.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  /**
   * Auto-expire coupons
   */
  async autoExpireCoupons(): Promise<number> {
    const result = await this.prisma.coupon.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED',
      },
    });

    this.logger.log(`Auto-expired ${result.count} coupons`);
    return result.count;
  }

  /**
   * Get coupon statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    redeemed: number;
    expired: number;
    deactivated: number;
    redemptionRate: number;
  }> {
    const [total, active, redeemed, expired, deactivated] = await Promise.all([
      this.count(),
      this.count({ status: 'ACTIVE' }),
      this.count({ status: 'REDEEMED' }),
      this.count({ status: 'EXPIRED' }),
      this.count({ status: 'DEACTIVATED' }),
    ]);

    const redemptionRate = total > 0 ? (redeemed / total) * 100 : 0;

    return {
      total,
      active,
      redeemed,
      expired,
      deactivated,
      redemptionRate: Math.round(redemptionRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Search coupons by code pattern
   */
  async searchByCouponCode(pattern: string, limit: number = 10): Promise<Coupon[]> {
    return this.findMany({
      where: {
        couponCode: { contains: pattern, mode: 'insensitive' }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get coupons created by admin
   */
  async findByCreator(createdBy: number): Promise<Coupon[]> {
    return this.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Check if coupon can be deleted (business logic)
   */
  async canDelete(id: number): Promise<boolean> {
    const coupon = await this.findById(id);
    if (!coupon) {
      return false;
    }

    // Don't allow deletion of redeemed coupons (for audit trail)
    return coupon.status !== 'REDEEMED';
  }
}