import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CouponRepository } from './coupon.repository';
import { CouponGeneratorService, GenerateCouponOptions, BatchGenerationResult } from './coupon-generator.service';
import { CouponValidationService } from './coupon-validation.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  CouponQueryDto,
  CouponResponseDto,
  CouponWithCreatorResponseDto,
  PaginatedCouponResponseDto,
  BatchStatisticsDto,
  CouponValidationResultDto,
  CouponStatus,
  GenerationMethod,
  GenerateCouponsDto,
  CouponExportOptionsDto,
  CouponExportResultDto
} from './dto';
import type { Coupon } from '@prisma/client';

export interface ExportResult {
  data: Buffer;
  filename: string;
  mimeType: string;
}

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly couponGeneratorService: CouponGeneratorService,
    private readonly couponValidationService: CouponValidationService,
  ) {}

  /**
   * Generate single or multiple coupon codes
   */
  async generateCoupons(generateDto: GenerateCouponsDto): Promise<CouponResponseDto[]> {
    const {
      quantity,
      codeLength = 10,
      expirationDays,
      batchName,
      createdBy,
      metadata = {}
    } = generateDto;

    this.logger.log(`Generating ${quantity} coupon(s) for admin ${createdBy}`);

    // Validate input parameters
    this.validateGenerationParameters(quantity, codeLength, expirationDays);

    // Get existing coupon codes to avoid collisions
    const existingCodes = await this.getExistingCouponCodes();

    try {
      let generatedCoupons: CouponResponseDto[];

      if (quantity === 1) {
        // Generate single coupon
        const couponCode = await this.couponGeneratorService.generateSingleCode(
          { codeLength },
          existingCodes
        );

        const couponData: CreateCouponDto = {
          couponCode,
          codeLength,
          createdBy,
          generationMethod: GenerationMethod.SINGLE,
          expiresAt: expirationDays ? this.calculateExpirationDate(expirationDays) : undefined,
          metadata: { ...metadata, generatedAt: new Date().toISOString() }
        };

        const createdCoupon = await this.couponRepository.create(couponData);
        generatedCoupons = [this.mapCouponToResponse(createdCoupon)];

      } else {
        // Generate batch of coupons
        const batchResult = await this.couponGeneratorService.generateBatch(
          { quantity, codeLength },
          existingCodes
        );

        const batchId = batchName || batchResult.batchId;
        const couponDataList: CreateCouponDto[] = batchResult.coupons.map(({ couponCode }) => ({
          couponCode,
          batchId,
          codeLength,
          createdBy,
          generationMethod: GenerationMethod.BATCH,
          expiresAt: expirationDays ? this.calculateExpirationDate(expirationDays) : undefined,
          metadata: {
            ...metadata,
            batchId,
            generatedAt: new Date().toISOString(),
            batchSize: quantity
          }
        }));

        const createdCoupons = await this.couponRepository.createBatch(couponDataList);
        generatedCoupons = createdCoupons.map(coupon => this.mapCouponToResponse(coupon));
      }

      this.logger.log(`Successfully generated ${generatedCoupons.length} coupon(s)`);
      return generatedCoupons;

    } catch (error) {
      this.logger.error(`Failed to generate coupons: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate coupons: ${error.message}`);
    }
  }

  /**
   * Validate coupon for redemption
   */
  async validateCoupon(couponCode: string): Promise<CouponValidationResultDto> {
    this.logger.debug(`Validating coupon: ${couponCode}`);

    const validationResult = await this.couponValidationService.validateCouponForRedemption(couponCode);
    
    if (validationResult.isValid) {
      this.logger.debug(`Coupon ${couponCode} is valid for redemption`);
    } else {
      this.logger.warn(`Coupon ${couponCode} validation failed: ${validationResult.error}`);
    }

    return validationResult;
  }

  /**
   * Redeem a coupon (mark as used)
   */
  async redeemCoupon(couponCode: string, redeemedBy?: number): Promise<CouponResponseDto> {
    this.logger.log(`Redeeming coupon: ${couponCode}`);

    // First validate the coupon
    const validation = await this.validateCoupon(couponCode);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    try {
      const redeemedCoupon = await this.couponRepository.markAsRedeemed(couponCode, redeemedBy);
      this.logger.log(`Successfully redeemed coupon: ${couponCode}`);
      return this.mapCouponToResponse(redeemedCoupon);
    } catch (error) {
      this.logger.error(`Failed to redeem coupon ${couponCode}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to redeem coupon: ${error.message}`);
    }
  }

  /**
   * Get coupon by ID
   */
  async findById(id: number): Promise<CouponWithCreatorResponseDto> {
    const coupon = await this.couponRepository.findByCouponCodeWithRelations(
      (await this.couponRepository.findById(id))?.couponCode || ''
    );

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return this.mapCouponWithRelationsToResponse(coupon);
  }

  /**
   * Get coupon by code
   */
  async findByCouponCode(couponCode: string): Promise<CouponWithCreatorResponseDto> {
    const coupon = await this.couponRepository.findByCouponCodeWithRelations(couponCode);

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${couponCode} not found`);
    }

    return this.mapCouponWithRelationsToResponse(coupon);
  }

  /**
   * Get paginated list of coupons with filters
   */
  async findMany(queryDto: CouponQueryDto): Promise<PaginatedCouponResponseDto> {
    return await this.couponRepository.findWithFilters(queryDto);
  }

  /**
   * Update coupon
   */
  async update(id: number, updateDto: UpdateCouponDto): Promise<CouponResponseDto> {
    this.logger.log(`Updating coupon with ID: ${id}`);

    try {
      const updatedCoupon = await this.couponRepository.update(id, updateDto);
      this.logger.log(`Successfully updated coupon with ID: ${id}`);
      return this.mapCouponToResponse(updatedCoupon);
    } catch (error) {
      this.logger.error(`Failed to update coupon ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Deactivate coupon
   */
  async deactivate(id: number): Promise<CouponResponseDto> {
    this.logger.log(`Deactivating coupon with ID: ${id}`);

    try {
      const deactivatedCoupon = await this.couponRepository.deactivate(id);
      this.logger.log(`Successfully deactivated coupon with ID: ${id}`);
      return this.mapCouponToResponse(deactivatedCoupon);
    } catch (error) {
      this.logger.error(`Failed to deactivate coupon ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete coupon (if allowed)
   */
  async delete(id: number): Promise<void> {
    this.logger.log(`Attempting to delete coupon with ID: ${id}`);

    const canDelete = await this.couponRepository.canDelete(id);
    if (!canDelete) {
      throw new BadRequestException('Cannot delete redeemed coupon for audit trail purposes');
    }

    try {
      await this.couponRepository.delete(id);
      this.logger.log(`Successfully deleted coupon with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete coupon ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get batch statistics
   */
  async getBatchStatistics(batchId: string): Promise<BatchStatisticsDto> {
    const stats = await this.couponRepository.getBatchStatistics(batchId);
    if (!stats) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }
    return stats;
  }

  /**
   * Get all batch statistics
   */
  async getAllBatchStatistics(): Promise<BatchStatisticsDto[]> {
    return await this.couponRepository.getAllBatchStatistics();
  }

  /**
   * Deactivate entire batch
   */
  async deactivateBatch(batchId: string): Promise<{ deactivatedCount: number }> {
    this.logger.log(`Deactivating batch: ${batchId}`);

    try {
      const deactivatedCount = await this.couponRepository.deactivateBatch(batchId);
      this.logger.log(`Successfully deactivated ${deactivatedCount} coupons in batch: ${batchId}`);
      return { deactivatedCount };
    } catch (error) {
      this.logger.error(`Failed to deactivate batch ${batchId}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to deactivate batch: ${error.message}`);
    }
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
    return await this.couponRepository.getStatistics();
  }

  /**
   * Export coupons to CSV or PDF
   */
  async exportCoupons(options: CouponExportOptionsDto): Promise<ExportResult> {
    this.logger.log(`Exporting coupons in ${options.format} format`);

    try {
      // Get coupons based on filters
      const coupons = await this.getCouponsForExport(options.filters);

      if (options.format === 'csv') {
        return await this.exportToCsv(coupons, options.includeMetadata);
      } else if (options.format === 'pdf') {
        return await this.exportToPdf(coupons, options.includeMetadata);
      } else {
        throw new BadRequestException('Unsupported export format');
      }
    } catch (error) {
      this.logger.error(`Failed to export coupons: ${error.message}`, error.stack);
      throw new BadRequestException(`Export failed: ${error.message}`);
    }
  }

  /**
   * Scheduled task to auto-expire coupons
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoExpireCoupons(): Promise<void> {
    this.logger.log('Running auto-expiration task');

    try {
      const expiredCount = await this.couponRepository.autoExpireCoupons();
      if (expiredCount > 0) {
        this.logger.log(`Auto-expired ${expiredCount} coupons`);
      }
    } catch (error) {
      this.logger.error(`Auto-expiration task failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual expiration of coupons
   */
  async expireExpiredCoupons(): Promise<{ expiredCount: number }> {
    this.logger.log('Manually expiring expired coupons');

    try {
      const expiredCount = await this.couponRepository.autoExpireCoupons();
      this.logger.log(`Manually expired ${expiredCount} coupons`);
      return { expiredCount };
    } catch (error) {
      this.logger.error(`Manual expiration failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to expire coupons: ${error.message}`);
    }
  }

  // Private helper methods

  private validateGenerationParameters(quantity: number, codeLength: number, expirationDays?: number): void {
    if (quantity < 1 || quantity > 1000) {
      throw new BadRequestException('Quantity must be between 1 and 1000');
    }

    if (codeLength < 8 || codeLength > 12) {
      throw new BadRequestException('Code length must be between 8 and 12 characters');
    }

    if (expirationDays !== undefined && (expirationDays < 1 || expirationDays > 365)) {
      throw new BadRequestException('Expiration days must be between 1 and 365');
    }
  }

  private async getExistingCouponCodes(): Promise<Set<string>> {
    const existingCoupons = await this.couponRepository.findMany({
      take: 10000, // Reasonable limit for collision detection
    });
    return new Set(existingCoupons.map(coupon => coupon.couponCode));
  }

  private calculateExpirationDate(expirationDays: number): string {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    return expirationDate.toISOString();
  }

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
      metadata: coupon.metadata,
    };
  }

  private mapCouponWithRelationsToResponse(coupon: any): CouponWithCreatorResponseDto {
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
    };
  }

  private async getCouponsForExport(filters?: CouponExportOptionsDto['filters']): Promise<Coupon[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.batchId) {
      where.batchId = filters.batchId;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    return await this.couponRepository.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  private async exportToCsv(coupons: Coupon[], includeMetadata: boolean = false): Promise<ExportResult> {
    const headers = [
      'ID',
      'Coupon Code',
      'Batch ID',
      'Status',
      'Created At',
      'Expires At',
      'Redeemed At',
      'Code Length',
      'Generation Method'
    ];

    if (includeMetadata) {
      headers.push('Metadata');
    }

    const csvRows = [headers.join(',')];

    for (const coupon of coupons) {
      const row = [
        coupon.id.toString(),
        `"${coupon.couponCode}"`,
        `"${coupon.batchId || ''}"`,
        coupon.status,
        coupon.createdAt.toISOString(),
        coupon.expiresAt?.toISOString() || '',
        coupon.redeemedAt?.toISOString() || '',
        coupon.codeLength.toString(),
        coupon.generationMethod
      ];

      if (includeMetadata) {
        row.push(`"${JSON.stringify(coupon.metadata || {})}"`);
      }

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coupons_export_${timestamp}.csv`;

    return {
      data: Buffer.from(csvContent, 'utf-8'),
      filename,
      mimeType: 'text/csv'
    };
  }

  private async exportToPdf(coupons: Coupon[], includeMetadata: boolean = false): Promise<ExportResult> {
    // For now, we'll create a simple text-based PDF content
    // In a real implementation, you would use a PDF library like PDFKit or Puppeteer
    
    const lines = [
      'COUPON EXPORT REPORT',
      `Generated on: ${new Date().toISOString()}`,
      `Total Coupons: ${coupons.length}`,
      '',
      'COUPON DETAILS:',
      '================',
      ''
    ];

    for (const coupon of coupons) {
      lines.push(`Code: ${coupon.couponCode}`);
      lines.push(`Status: ${coupon.status}`);
      lines.push(`Batch: ${coupon.batchId || 'N/A'}`);
      lines.push(`Created: ${coupon.createdAt.toISOString()}`);
      lines.push(`Expires: ${coupon.expiresAt?.toISOString() || 'Never'}`);
      
      if (includeMetadata && coupon.metadata) {
        lines.push(`Metadata: ${JSON.stringify(coupon.metadata)}`);
      }
      
      lines.push('---');
    }

    const pdfContent = lines.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coupons_export_${timestamp}.pdf`;

    // Note: This is a placeholder. In production, you would generate actual PDF
    return {
      data: Buffer.from(pdfContent, 'utf-8'),
      filename,
      mimeType: 'application/pdf'
    };
  }
}