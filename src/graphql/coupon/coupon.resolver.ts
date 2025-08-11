import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Int
} from '@nestjs/graphql';
import {
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
const { PubSub } = require('graphql-subscriptions');
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentAdmin } from '../../modules/auth/decorators/current-admin.decorator';
import { CouponService } from '../../modules/coupon/coupon.service';
import {
  GenerateCouponsGraphQLDto,
  CouponQueryGraphQLDto,
  CouponValidationGraphQLDto,
  CouponExportGraphQLDto,
  BatchManagementGraphQLDto,
  GenerateCouponsGraphQLResponseDto,
  BatchOperationGraphQLResponseDto,
  UpdateCouponStatusGraphQLResponseDto,
  ExportGraphQLResponseDto,
  PaginatedBatchStatisticsGraphQLResponseDto,
  CouponUpdatePayloadDto,
  BatchUpdatePayloadDto,
  UpdateCouponStatusGraphQLDto,
  CouponStatisticsGraphQLDto
} from './dto';
import {
  CouponResponseDto,
  CouponWithCreatorResponseDto,
  PaginatedCouponResponseDto,
  BatchStatisticsDto,
  CouponValidationResultDto
} from '../../modules/coupon/dto';
// Use any type to avoid Prisma import issues - this will be resolved when Prisma client is regenerated
type Admin = any;

@Resolver()
export class CouponResolver {
  private readonly logger = new Logger(CouponResolver.name);
  private readonly pubSub: any;

  constructor(private readonly couponService: CouponService) {
    this.pubSub = new PubSub();
  }

  // Queries

  @Query(() => CouponWithCreatorResponseDto, {
    description: 'Get coupon by ID with creator and submission details'
  })
  @UseGuards(JwtAuthGuard)
  async coupon(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() admin: Admin
  ): Promise<CouponWithCreatorResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting coupon with ID: ${id}`);
      return await this.couponService.findById(id);
    } catch (error) {
      this.logger.error(`Failed to get coupon ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => CouponWithCreatorResponseDto, {
    description: 'Get coupon by code with creator and submission details'
  })
  @UseGuards(JwtAuthGuard)
  async couponByCode(
    @Args('couponCode') couponCode: string,
    @CurrentAdmin() admin: Admin
  ): Promise<CouponWithCreatorResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting coupon with code: ${couponCode}`);
      return await this.couponService.findByCouponCode(couponCode);
    } catch (error) {
      this.logger.error(`Failed to get coupon ${couponCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => PaginatedCouponResponseDto, {
    description: 'Get paginated list of coupons with filters'
  })
  @UseGuards(JwtAuthGuard)
  async coupons(
    @Args('query', { nullable: true }) query: CouponQueryGraphQLDto,
    @CurrentAdmin() admin: Admin
  ): Promise<PaginatedCouponResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting coupons list`);
      return await this.couponService.findMany(query || {});
    } catch (error) {
      this.logger.error(`Failed to get coupons: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => CouponValidationResultDto, {
    description: 'Validate coupon code for redemption (public endpoint)'
  })
  async validateCoupon(
    @Args('couponCode') couponCode: string
  ): Promise<CouponValidationResultDto> {
    try {
      this.logger.log(`Public coupon validation request for code: ${couponCode}`);
      return await this.couponService.validateCoupon(couponCode);
    } catch (error) {
      this.logger.error(`Failed to validate coupon ${couponCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => BatchStatisticsDto, {
    description: 'Get statistics for a specific batch'
  })
  @UseGuards(JwtAuthGuard)
  async batchStatistics(
    @Args('batchId') batchId: string,
    @CurrentAdmin() admin: Admin
  ): Promise<BatchStatisticsDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting batch statistics for: ${batchId}`);
      return await this.couponService.getBatchStatistics(batchId);
    } catch (error) {
      this.logger.error(`Failed to get batch statistics ${batchId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => [BatchStatisticsDto], {
    description: 'Get statistics for all batches'
  })
  @UseGuards(JwtAuthGuard)
  async allBatchStatistics(
    @CurrentAdmin() admin: Admin
  ): Promise<BatchStatisticsDto[]> {
    try {
      this.logger.log(`Admin ${admin.username} requesting all batch statistics`);
      return await this.couponService.getAllBatchStatistics();
    } catch (error) {
      this.logger.error(`Failed to get all batch statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => CouponStatisticsGraphQLDto, {
    description: 'Get coupon system statistics'
  })
  @UseGuards(JwtAuthGuard)
  async couponStatistics(
    @CurrentAdmin() admin: Admin
  ): Promise<CouponStatisticsGraphQLDto> {
    try {
      this.logger.log(`Admin ${admin.username} requesting coupon statistics`);
      return await this.couponService.getStatistics();
    } catch (error) {
      this.logger.error(`Failed to get coupon statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Mutations

  @Mutation(() => GenerateCouponsGraphQLResponseDto, {
    description: 'Generate single or multiple coupon codes'
  })
  @UseGuards(JwtAuthGuard)
  async generateCoupons(
    @Args('input') input: GenerateCouponsGraphQLDto,
    @CurrentAdmin() admin: Admin
  ): Promise<GenerateCouponsGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} generating ${input.quantity} coupon(s)`);

      // Set the admin ID from the authenticated user
      const generateDto = { ...input, createdBy: admin.id };
      const coupons = await this.couponService.generateCoupons(generateDto);

      // Publish subscription event for each generated coupon
      for (const coupon of coupons) {
        this.pubSub.publish('couponUpdated', {
          couponUpdated: {
            type: 'GENERATED',
            coupon,
            timestamp: new Date(),
            batchId: coupon.batchId
          }
        });
      }

      // If batch generation, also publish batch update
      if (coupons.length > 1 && coupons[0].batchId) {
        const batchStats = await this.couponService.getBatchStatistics(coupons[0].batchId);
        this.pubSub.publish('batchUpdated', {
          batchUpdated: {
            type: 'CREATED',
            batch: batchStats,
            timestamp: new Date()
          }
        });
      }

      return {
        success: true,
        message: `Successfully generated ${coupons.length} coupon(s)`,
        coupons,
        totalGenerated: coupons.length,
        batchId: coupons[0]?.batchId
      };
    } catch (error) {
      this.logger.error(`Failed to generate coupons: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to generate coupons',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => CouponResponseDto, {
    description: 'Redeem a coupon code (public endpoint)'
  })
  async redeemCoupon(
    @Args('couponCode') couponCode: string,
    @Args('redeemedBy', { type: () => Int, nullable: true }) redeemedBy?: number
  ): Promise<CouponResponseDto> {
    try {
      this.logger.log(`Public coupon redemption for code: ${couponCode}`);
      const redeemedCoupon = await this.couponService.redeemCoupon(couponCode, redeemedBy);

      // Publish subscription event
      this.pubSub.publish('couponUpdated', {
        couponUpdated: {
          type: 'REDEEMED',
          coupon: redeemedCoupon,
          timestamp: new Date(),
          batchId: redeemedCoupon.batchId
        }
      });

      return redeemedCoupon;
    } catch (error) {
      this.logger.error(`Failed to redeem coupon ${couponCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => UpdateCouponStatusGraphQLResponseDto, {
    description: 'Update coupon status'
  })
  @UseGuards(JwtAuthGuard)
  async updateCoupon(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCouponStatusGraphQLDto,
    @CurrentAdmin() admin: Admin
  ): Promise<UpdateCouponStatusGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} updating coupon ${id}`);
      const updatedCoupon = await this.couponService.update(id, input);

      // Publish subscription event
      this.pubSub.publish('couponUpdated', {
        couponUpdated: {
          type: 'UPDATED',
          coupon: updatedCoupon,
          timestamp: new Date(),
          batchId: updatedCoupon.batchId
        }
      });

      return {
        success: true,
        message: 'Coupon updated successfully',
        coupon: updatedCoupon
      };
    } catch (error) {
      this.logger.error(`Failed to update coupon ${id}: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to update coupon',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => UpdateCouponStatusGraphQLResponseDto, {
    description: 'Deactivate a coupon'
  })
  @UseGuards(JwtAuthGuard)
  async deactivateCoupon(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() admin: Admin
  ): Promise<UpdateCouponStatusGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} deactivating coupon ${id}`);
      const deactivatedCoupon = await this.couponService.deactivate(id);

      // Publish subscription event
      this.pubSub.publish('couponUpdated', {
        couponUpdated: {
          type: 'DEACTIVATED',
          coupon: deactivatedCoupon,
          timestamp: new Date(),
          batchId: deactivatedCoupon.batchId
        }
      });

      return {
        success: true,
        message: 'Coupon deactivated successfully',
        coupon: deactivatedCoupon
      };
    } catch (error) {
      this.logger.error(`Failed to deactivate coupon ${id}: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to deactivate coupon',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => BatchOperationGraphQLResponseDto, {
    description: 'Deactivate entire batch of coupons'
  })
  @UseGuards(JwtAuthGuard)
  async deactivateBatch(
    @Args('batchId') batchId: string,
    @CurrentAdmin() admin: Admin
  ): Promise<BatchOperationGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} deactivating batch ${batchId}`);
      const result = await this.couponService.deactivateBatch(batchId);

      // Publish batch update subscription
      const batchStats = await this.couponService.getBatchStatistics(batchId);
      this.pubSub.publish('batchUpdated', {
        batchUpdated: {
          type: 'DEACTIVATED',
          batch: batchStats,
          timestamp: new Date()
        }
      });

      return {
        success: true,
        message: `Successfully deactivated ${result.deactivatedCount} coupons`,
        batchId,
        affectedCoupons: result.deactivatedCount
      };
    } catch (error) {
      this.logger.error(`Failed to deactivate batch ${batchId}: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to deactivate batch',
        errors: [error.message]
      };
    }
  }

  @Mutation(() => BatchOperationGraphQLResponseDto, {
    description: 'Manually expire expired coupons'
  })
  @UseGuards(JwtAuthGuard)
  async expireExpiredCoupons(
    @CurrentAdmin() admin: Admin
  ): Promise<BatchOperationGraphQLResponseDto> {
    try {
      this.logger.log(`Admin ${admin.username} manually expiring expired coupons`);
      const result = await this.couponService.expireExpiredCoupons();

      return {
        success: true,
        message: `Successfully expired ${result.expiredCount} coupons`,
        affectedCoupons: result.expiredCount
      };
    } catch (error) {
      this.logger.error(`Failed to expire coupons: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to expire coupons',
        errors: [error.message]
      };
    }
  }

  // Subscriptions

  @Subscription(() => CouponUpdatePayloadDto, {
    description: 'Subscribe to coupon updates (generated, redeemed, expired, deactivated)'
  })
  couponUpdated(
    @Args('batchId', { nullable: true }) batchId?: string
  ) {
    // Filter by batchId if provided
    if (batchId) {
      return this.pubSub.asyncIterator('couponUpdated');
    }
    return this.pubSub.asyncIterator('couponUpdated');
  }

  @Subscription(() => BatchUpdatePayloadDto, {
    description: 'Subscribe to batch updates (created, deactivated, statistics updated)'
  })
  batchUpdated() {
    return this.pubSub.asyncIterator('batchUpdated');
  }

  @Subscription(() => CouponStatisticsGraphQLDto, {
    description: 'Subscribe to coupon statistics updates'
  })
  @UseGuards(JwtAuthGuard)
  couponStatisticsUpdated() {
    return this.pubSub.asyncIterator('couponStatisticsUpdated');
  }
}