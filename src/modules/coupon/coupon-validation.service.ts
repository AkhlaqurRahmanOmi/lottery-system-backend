import { Injectable, Logger } from '@nestjs/common';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService } from './coupon-generator.service';
import { CouponValidationResultDto, CouponResponseDto } from './dto';
import type { Coupon } from '@prisma/client';

export interface CouponValidationOptions {
  checkFormat?: boolean;
  checkExpiration?: boolean;
  checkStatus?: boolean;
  checkRedemption?: boolean;
}

@Injectable()
export class CouponValidationService {
  private readonly logger = new Logger(CouponValidationService.name);

  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly couponGeneratorService: CouponGeneratorService,
  ) {}

  /**
   * Validate coupon for redemption with comprehensive checks
   * Requirements: 4.1, 4.4, 4.10
   */
  async validateCouponForRedemption(couponCode: string): Promise<CouponValidationResultDto> {
    this.logger.debug(`Validating coupon for redemption: ${couponCode}`);

    // Step 1: Basic format validation
    const formatValidation = this.validateCouponFormat(couponCode);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // Step 2: Database existence check
    const existenceValidation = await this.validateCouponExists(couponCode);
    if (!existenceValidation.isValid) {
      return existenceValidation;
    }

    const coupon = existenceValidation.coupon!;

    // Step 3: Status validation (prevent reuse of redeemed coupons)
    const statusValidation = this.validateCouponStatus(coupon);
    if (!statusValidation.isValid) {
      return statusValidation;
    }

    // Step 4: Expiration validation
    const expirationValidation = await this.validateCouponExpiration(coupon);
    if (!expirationValidation.isValid) {
      return expirationValidation;
    }

    // All validations passed
    this.logger.debug(`Coupon ${couponCode} is valid for redemption`);
    return {
      isValid: true,
      coupon: this.mapCouponToResponse(coupon)
    };
  }

  /**
   * Validate coupon format according to generation rules
   * Requirements: 4.1
   */
  validateCouponFormat(couponCode: string): CouponValidationResultDto {
    // Check if coupon code is provided
    if (!couponCode || typeof couponCode !== 'string') {
      return {
        isValid: false,
        error: 'Coupon code is required and must be a string',
        errorCode: 'INVALID_FORMAT'
      };
    }

    // Trim whitespace
    const trimmedCode = couponCode.trim();
    if (trimmedCode.length === 0) {
      return {
        isValid: false,
        error: 'Coupon code cannot be empty',
        errorCode: 'INVALID_FORMAT'
      };
    }

    // Use the generator service to validate format
    if (!this.couponGeneratorService.validateCodeFormat(trimmedCode)) {
      return {
        isValid: false,
        error: 'Coupon code format is invalid. Must be 8-12 alphanumeric characters (A-Z, 2-9)',
        errorCode: 'INVALID_FORMAT'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Check if coupon exists in database
   * Requirements: 4.1
   */
  private async validateCouponExists(couponCode: string): Promise<CouponValidationResultDto & { coupon?: Coupon }> {
    const coupon = await this.couponRepository.findByCouponCode(couponCode);

    if (!coupon) {
      return {
        isValid: false,
        error: 'Coupon code not found',
        errorCode: 'COUPON_NOT_FOUND'
      };
    }

    return {
      isValid: true,
      coupon: coupon as any
    };
  }

  /**
   * Validate coupon status to prevent reuse of redeemed coupons
   * Requirements: 4.4, 4.10
   */
  private validateCouponStatus(coupon: Coupon): CouponValidationResultDto {
    switch (coupon.status) {
      case 'REDEEMED':
        return {
          isValid: false,
          error: 'This coupon has already been redeemed and cannot be used again',
          errorCode: 'COUPON_ALREADY_REDEEMED'
        };

      case 'DEACTIVATED':
        return {
          isValid: false,
          error: 'This coupon has been deactivated and is no longer valid',
          errorCode: 'COUPON_DEACTIVATED'
        };

      case 'EXPIRED':
        return {
          isValid: false,
          error: 'This coupon has expired and is no longer valid',
          errorCode: 'COUPON_EXPIRED'
        };

      case 'ACTIVE':
        return {
          isValid: true
        };

      default:
        return {
          isValid: false,
          error: 'Coupon has an invalid status',
          errorCode: 'INVALID_STATUS'
        };
    }
  }

  /**
   * Validate coupon expiration and auto-expire if needed
   * Requirements: 4.4
   */
  private async validateCouponExpiration(coupon: Coupon): Promise<CouponValidationResultDto> {
    // If no expiration date is set, coupon doesn't expire
    if (!coupon.expiresAt) {
      return {
        isValid: true
      };
    }

    const now = new Date();
    const expirationDate = new Date(coupon.expiresAt);

    // Check if coupon has expired
    if (expirationDate <= now) {
      // Auto-expire the coupon if it's still marked as active
      if (coupon.status === 'ACTIVE') {
        try {
          await this.couponRepository.update(coupon.id, { status: 'EXPIRED' });
          this.logger.log(`Auto-expired coupon: ${coupon.couponCode}`);
        } catch (error) {
          this.logger.error(`Failed to auto-expire coupon ${coupon.couponCode}: ${error.message}`);
        }
      }

      return {
        isValid: false,
        error: 'This coupon has expired and is no longer valid',
        errorCode: 'COUPON_EXPIRED'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Validate multiple coupons at once (batch validation)
   */
  async validateMultipleCoupons(couponCodes: string[]): Promise<Map<string, CouponValidationResultDto>> {
    const results = new Map<string, CouponValidationResultDto>();

    // Validate each coupon
    for (const couponCode of couponCodes) {
      try {
        const result = await this.validateCouponForRedemption(couponCode);
        results.set(couponCode, result);
      } catch (error) {
        this.logger.error(`Error validating coupon ${couponCode}: ${error.message}`);
        results.set(couponCode, {
          isValid: false,
          error: 'Validation error occurred',
          errorCode: 'VALIDATION_ERROR'
        });
      }
    }

    return results;
  }

  /**
   * Check if coupon can be redeemed (comprehensive check)
   */
  async canRedeemCoupon(couponCode: string): Promise<boolean> {
    const validation = await this.validateCouponForRedemption(couponCode);
    return validation.isValid;
  }

  /**
   * Get detailed validation information for debugging
   */
  async getDetailedValidationInfo(couponCode: string): Promise<{
    formatValid: boolean;
    exists: boolean;
    status: string | null;
    expired: boolean;
    canRedeem: boolean;
    validationResult: CouponValidationResultDto;
  }> {
    const formatValidation = this.validateCouponFormat(couponCode);
    
    if (!formatValidation.isValid) {
      return {
        formatValid: false,
        exists: false,
        status: null,
        expired: false,
        canRedeem: false,
        validationResult: formatValidation
      };
    }

    const coupon = await this.couponRepository.findByCouponCode(couponCode);
    
    if (!coupon) {
      return {
        formatValid: true,
        exists: false,
        status: null,
        expired: false,
        canRedeem: false,
        validationResult: {
          isValid: false,
          error: 'Coupon not found',
          errorCode: 'COUPON_NOT_FOUND'
        }
      };
    }

    const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) <= new Date() : false;
    const validationResult = await this.validateCouponForRedemption(couponCode);

    return {
      formatValid: true,
      exists: true,
      status: coupon.status,
      expired: isExpired,
      canRedeem: validationResult.isValid,
      validationResult
    };
  }

  /**
   * Validate coupon with custom options
   */
  async validateCouponWithOptions(
    couponCode: string, 
    options: CouponValidationOptions = {}
  ): Promise<CouponValidationResultDto> {
    const {
      checkFormat = true,
      checkExpiration = true,
      checkStatus = true,
      checkRedemption = true
    } = options;

    // Format validation
    if (checkFormat) {
      const formatValidation = this.validateCouponFormat(couponCode);
      if (!formatValidation.isValid) {
        return formatValidation;
      }
    }

    // Get coupon from database
    const coupon = await this.couponRepository.findByCouponCode(couponCode);
    if (!coupon) {
      return {
        isValid: false,
        error: 'Coupon code not found',
        errorCode: 'COUPON_NOT_FOUND'
      };
    }

    // Status validation
    if (checkStatus) {
      const statusValidation = this.validateCouponStatus(coupon);
      if (!statusValidation.isValid) {
        return statusValidation;
      }
    }

    // Redemption prevention (check if already redeemed)
    if (checkRedemption && coupon.status === 'REDEEMED') {
      return {
        isValid: false,
        error: 'This coupon has already been redeemed',
        errorCode: 'COUPON_ALREADY_REDEEMED'
      };
    }

    // Expiration validation
    if (checkExpiration) {
      const expirationValidation = await this.validateCouponExpiration(coupon);
      if (!expirationValidation.isValid) {
        return expirationValidation;
      }
    }

    return {
      isValid: true,
      coupon: this.mapCouponToResponse(coupon)
    };
  }

  /**
   * Map Coupon entity to response DTO
   */
  private mapCouponToResponse(coupon: Coupon): CouponResponseDto {
    return {
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
      metadata: coupon.metadata || undefined,
    };
  }
}