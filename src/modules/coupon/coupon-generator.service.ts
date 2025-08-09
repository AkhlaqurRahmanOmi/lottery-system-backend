import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface GenerateCouponOptions {
  codeLength?: number;
  quantity?: number;
  excludeAmbiguous?: boolean;
  maxRetries?: number;
}

export interface GeneratedCoupon {
  couponCode: string;
  codeLength: number;
}

export interface BatchGenerationResult {
  coupons: GeneratedCoupon[];
  batchId: string;
  totalGenerated: number;
  failedAttempts: number;
}

@Injectable()
export class CouponGeneratorService {
  private readonly logger = new Logger(CouponGeneratorService.name);
  
  // Character set excluding ambiguous characters (0, O, 1, I, L)
  private readonly SAFE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  private readonly DEFAULT_CODE_LENGTH = 10;
  private readonly DEFAULT_MAX_RETRIES = 10;
  private readonly MAX_BATCH_SIZE = 1000;

  /**
   * Generate a single unique alphanumeric coupon code
   * @param options Generation options
   * @param existingCodes Set of existing codes to check for collisions
   * @returns Generated coupon code
   */
  async generateSingleCode(
    options: GenerateCouponOptions = {},
    existingCodes: Set<string> = new Set()
  ): Promise<string> {
    const {
      codeLength = this.DEFAULT_CODE_LENGTH,
      maxRetries = this.DEFAULT_MAX_RETRIES,
    } = options;

    let attempts = 0;
    let generatedCode: string;

    do {
      attempts++;
      generatedCode = this.createRandomCode(codeLength);
      
      // Check for collision with existing codes
      if (!existingCodes.has(generatedCode)) {
        this.logger.debug(`Generated unique code: ${generatedCode} after ${attempts} attempts`);
        return generatedCode;
      }

      this.logger.warn(`Code collision detected: ${generatedCode}, attempt ${attempts}/${maxRetries}`);
      
      if (attempts >= maxRetries) {
        throw new Error(
          `Failed to generate unique coupon code after ${maxRetries} attempts. ` +
          `Consider increasing code length or reducing batch size.`
        );
      }
    } while (attempts < maxRetries);

    throw new Error('Unexpected error in code generation');
  }

  /**
   * Generate multiple unique coupon codes in batch
   * @param options Generation options including quantity
   * @param existingCodes Set of existing codes to check for collisions
   * @returns Batch generation result
   */
  async generateBatch(
    options: GenerateCouponOptions,
    existingCodes: Set<string> = new Set()
  ): Promise<BatchGenerationResult> {
    const {
      quantity = 1,
      codeLength = this.DEFAULT_CODE_LENGTH,
      maxRetries = this.DEFAULT_MAX_RETRIES,
    } = options;

    if (quantity > this.MAX_BATCH_SIZE) {
      throw new Error(`Batch size cannot exceed ${this.MAX_BATCH_SIZE} codes`);
    }

    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const batchId = this.generateBatchId();
    const generatedCoupons: GeneratedCoupon[] = [];
    const usedCodes = new Set([...existingCodes]);
    let totalFailedAttempts = 0;

    this.logger.log(`Starting batch generation: ${quantity} codes, length: ${codeLength}, batchId: ${batchId}`);

    for (let i = 0; i < quantity; i++) {
      try {
        const couponCode = await this.generateSingleCode(
          { codeLength, maxRetries },
          usedCodes
        );

        generatedCoupons.push({
          couponCode,
          codeLength,
        });

        // Add to used codes to prevent duplicates within the batch
        usedCodes.add(couponCode);

      } catch (error) {
        totalFailedAttempts += maxRetries;
        this.logger.error(`Failed to generate code ${i + 1}/${quantity}: ${error.message}`);
        throw new Error(
          `Batch generation failed at code ${i + 1}/${quantity}. ` +
          `Generated ${generatedCoupons.length} codes successfully. ` +
          `Error: ${error.message}`
        );
      }
    }

    const result: BatchGenerationResult = {
      coupons: generatedCoupons,
      batchId,
      totalGenerated: generatedCoupons.length,
      failedAttempts: totalFailedAttempts,
    };

    this.logger.log(
      `Batch generation completed: ${result.totalGenerated} codes generated, ` +
      `${result.failedAttempts} failed attempts, batchId: ${batchId}`
    );

    return result;
  }

  /**
   * Validate a coupon code format
   * @param couponCode Code to validate
   * @returns True if code format is valid
   */
  validateCodeFormat(couponCode: string): boolean {
    if (!couponCode || typeof couponCode !== 'string') {
      return false;
    }

    // Check length (8-12 characters)
    if (couponCode.length < 8 || couponCode.length > 12) {
      return false;
    }

    // Check if all characters are from safe character set
    const regex = new RegExp(`^[${this.SAFE_CHARACTERS}]+$`);
    return regex.test(couponCode);
  }

  /**
   * Get statistics about the character set and generation capacity
   * @param codeLength Length of codes to analyze
   * @returns Generation statistics
   */
  getGenerationStats(codeLength: number = this.DEFAULT_CODE_LENGTH) {
    const characterSetSize = this.SAFE_CHARACTERS.length;
    const totalPossibleCodes = Math.pow(characterSetSize, codeLength);
    
    return {
      characterSetSize,
      safeCharacters: this.SAFE_CHARACTERS,
      codeLength,
      totalPossibleCodes,
      recommendedMaxBatch: Math.floor(totalPossibleCodes * 0.1), // 10% of total space
    };
  }

  /**
   * Create a random alphanumeric code of specified length
   * @param length Length of the code to generate
   * @returns Random code string
   */
  private createRandomCode(length: number): string {
    const charactersLength = this.SAFE_CHARACTERS.length;
    let result = '';
    
    // Use crypto.randomBytes for cryptographically secure random generation
    const randomBytesArray = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytesArray[i] % charactersLength;
      result += this.SAFE_CHARACTERS.charAt(randomIndex);
    }
    
    return result;
  }

  /**
   * Generate a unique batch ID for tracking batch operations
   * @returns Unique batch identifier
   */
  private generateBatchId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(4).toString('hex');
    return `BATCH_${timestamp}_${randomPart}`.toUpperCase();
  }
}