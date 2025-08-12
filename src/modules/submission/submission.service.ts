import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { SubmissionRepository } from './submission.repository';
import { CouponValidationService } from '../coupon/coupon-validation.service';
import { RewardDistributionService } from '../reward/reward-distribution.service';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { 
  CreateSubmissionDto, 
  InternalCreateSubmissionDto,
  UpdateSubmissionDto, 
  SubmissionResponseDto,
  SubmissionWithRelationsResponseDto,
  PaginatedSubmissionResponseDto,
  SubmissionQueryDto,
  SubmissionStatisticsDto,
  AssignRewardToSubmissionDto
} from './dto';

export interface UserSubmissionData {
  couponCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  productExperience: string;
  selectedRewardId?: number;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: any;
}

export interface SubmissionAnalytics {
  totalSubmissions: number;
  submissionsWithRewards: number;
  submissionsWithoutRewards: number;
  rewardAssignmentRate: number;
  submissionsByDate: Array<{
    date: string;
    count: number;
  }>;
  topRewardSelections: Array<{
    rewardId: number;
    rewardName: string;
    count: number;
    percentage: number;
  }>;
}

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    private readonly submissionRepository: SubmissionRepository,
    private readonly couponValidationService: CouponValidationService,
    private readonly rewardDistributionService: RewardDistributionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Process user form submission without reward selection
   * Requirements: 4.2, 4.3, 4.7, 4.8, 4.9, 4.10
   */
  async processUserSubmission(submissionData: UserSubmissionData): Promise<SubmissionResponseDto> {
    this.logger.debug(`Processing user submission for coupon: ${submissionData.couponCode}`);

    try {
      // Step 1: Validate and sanitize input data
      const sanitizedData = await this.validateAndSanitizeSubmissionData(submissionData);

      // Step 2: Validate coupon for redemption
      const couponValidation = await this.couponValidationService.validateCouponForRedemption(sanitizedData.couponCode);
      if (!couponValidation.isValid) {
        throw new BadRequestException(couponValidation.error || 'Invalid coupon code');
      }

      const coupon = couponValidation.coupon!;

      // Step 3: Check if coupon is already redeemed (additional safety check)
      const existingSubmission = await this.submissionRepository.findByCouponId(coupon.id);
      if (existingSubmission) {
        throw new ConflictException('This coupon has already been redeemed');
      }

      // Step 4: Get default reward for submission (since users don't select rewards anymore)
      const defaultReward = await this.getDefaultReward();
      
      // Step 5: Create submission without user reward selection (as per updated requirements)
      const createSubmissionDto: InternalCreateSubmissionDto = {
        couponId: coupon.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        address: sanitizedData.address,
        productExperience: sanitizedData.productExperience,
        selectedRewardId: sanitizedData.selectedRewardId || defaultReward.id,
        ipAddress: sanitizedData.ipAddress,
        userAgent: sanitizedData.userAgent,
        additionalData: sanitizedData.additionalData,
      };

      const submission = await this.submissionRepository.create(createSubmissionDto);

      this.logger.log(`User submission created successfully: ID ${submission.id}, Coupon: ${sanitizedData.couponCode}`);

      // Return success response without promising specific rewards
      return this.mapSubmissionToResponse(submission);

    } catch (error) {
      this.logger.error(`Failed to process user submission: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to process submission. Please try again.');
    }
  }

  /**
   * Validate coupon code for redemption (public endpoint)
   * Requirements: 4.1, 4.4
   */
  async validateCouponCode(couponCode: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const validation = await this.couponValidationService.validateCouponForRedemption(couponCode);
      return {
        isValid: validation.isValid,
        error: validation.error
      };
    } catch (error) {
      this.logger.error(`Error validating coupon ${couponCode}: ${error.message}`);
      return {
        isValid: false,
        error: 'Validation error occurred'
      };
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: number): Promise<SubmissionWithRelationsResponseDto> {
    const submission = await this.submissionRepository.findByIdWithRelations(id);
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  /**
   * Get submissions with filtering, sorting, and pagination
   * Requirements: 6.1, 6.2
   */
  async getSubmissions(queryDto: SubmissionQueryDto): Promise<PaginatedSubmissionResponseDto> {
    return this.submissionRepository.findWithFilters(queryDto);
  }

  /**
   * Update submission (admin only)
   */
  async updateSubmission(id: number, updateDto: UpdateSubmissionDto): Promise<SubmissionResponseDto> {
    const updatedSubmission = await this.submissionRepository.update(id, updateDto);
    return this.mapSubmissionToResponse(updatedSubmission);
  }

  /**
   * Delete submission (admin only)
   */
  async deleteSubmission(id: number): Promise<void> {
    await this.submissionRepository.delete(id);
    this.logger.log(`Submission ${id} deleted successfully`);
  }

  /**
   * Assign reward to user submission (admin functionality)
   * Requirements: 6.1, 6.3, 6.4
   */
  async assignRewardToSubmission(
    assignmentData: AssignRewardToSubmissionDto, 
    assignedBy: number
  ): Promise<SubmissionResponseDto> {
    try {
      // Validate reward assignment eligibility
      const validation = await this.rewardDistributionService.validateRewardAssignment(
        assignmentData.rewardAccountId,
        assignmentData.submissionId
      );

      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }

      // Assign reward through repository
      const updatedSubmission = await this.submissionRepository.assignReward(assignmentData, assignedBy);

      this.logger.log(
        `Reward ${assignmentData.rewardAccountId} assigned to submission ${assignmentData.submissionId} by admin ${assignedBy}`
      );

      return this.mapSubmissionToResponse(updatedSubmission);

    } catch (error) {
      this.logger.error(`Failed to assign reward: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to assign reward');
    }
  }

  /**
   * Remove reward assignment from submission (admin functionality)
   */
  async removeRewardAssignment(submissionId: number): Promise<SubmissionResponseDto> {
    const updatedSubmission = await this.submissionRepository.removeRewardAssignment(submissionId);
    this.logger.log(`Reward assignment removed from submission ${submissionId}`);
    return this.mapSubmissionToResponse(updatedSubmission);
  }

  /**
   * Get submission statistics and analytics
   * Requirements: 4.7, 4.8, 6.4, 6.5
   */
  async getSubmissionStatistics(): Promise<SubmissionStatisticsDto> {
    return this.submissionRepository.getStatistics();
  }

  /**
   * Get detailed submission analytics
   * Requirements: 6.4, 6.5
   */
  async getSubmissionAnalytics(dateFrom?: Date, dateTo?: Date): Promise<SubmissionAnalytics> {
    const stats = await this.getSubmissionStatistics();
    
    // Get submissions by date range if specified
    let submissions;
    if (dateFrom && dateTo) {
      submissions = await this.submissionRepository.findByDateRange(dateFrom, dateTo);
    } else {
      submissions = await this.submissionRepository.findMany({
        orderBy: { submittedAt: 'desc' }
      });
    }

    // Calculate submissions by date
    const submissionsByDate = this.calculateSubmissionsByDate(submissions);

    return {
      totalSubmissions: stats.total,
      submissionsWithRewards: stats.withAssignedRewards,
      submissionsWithoutRewards: stats.withoutAssignedRewards,
      rewardAssignmentRate: stats.rewardAssignmentRate,
      submissionsByDate,
      topRewardSelections: stats.rewardSelectionStats.map(stat => ({
        rewardId: stat.rewardId,
        rewardName: stat.rewardName,
        count: stat.selectionCount,
        percentage: stat.selectionPercentage
      }))
    };
  }

  /**
   * Search submissions by email
   */
  async searchSubmissionsByEmail(email: string, limit: number = 10): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionRepository.searchByEmail(email, limit);
    return submissions.map(submission => this.mapSubmissionToResponse(submission));
  }

  /**
   * Get submissions without assigned rewards (for admin review)
   */
  async getSubmissionsWithoutRewards(): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionRepository.findWithoutAssignedRewards();
    return submissions.map(submission => this.mapSubmissionToResponse(submission));
  }

  /**
   * Get recent submissions
   */
  async getRecentSubmissions(limit: number = 10): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionRepository.getRecentSubmissions(limit);
    return submissions.map(submission => this.mapSubmissionToResponse(submission));
  }

  /**
   * Validate and sanitize submission data
   * Requirements: 4.3, 4.4, 4.5, 4.6, 10.2, 10.3
   */
  private async validateAndSanitizeSubmissionData(data: UserSubmissionData): Promise<UserSubmissionData> {
    const errors: string[] = [];

    // Validate required fields
    if (!data.couponCode?.trim()) {
      errors.push('Coupon code is required');
    }

    if (!data.name?.trim()) {
      errors.push('Name is required');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    }

    if (!data.phone?.trim()) {
      errors.push('Phone number is required');
    }

    if (!data.address?.trim()) {
      errors.push('Address is required');
    }

    if (!data.productExperience?.trim()) {
      errors.push('Product experience is required');
    }

    // Validate email format
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone format (basic validation)
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Validation failed: ${errors.join(', ')}`);
    }

    // Sanitize data (prevent XSS)
    return {
      couponCode: this.sanitizeString(data.couponCode),
      name: this.sanitizeString(data.name),
      email: this.sanitizeString(data.email.toLowerCase()),
      phone: this.sanitizeString(data.phone),
      address: this.sanitizeString(data.address),
      productExperience: this.sanitizeString(data.productExperience),
      selectedRewardId: data.selectedRewardId,
      ipAddress: data.ipAddress ? this.sanitizeString(data.ipAddress) : undefined,
      userAgent: data.userAgent ? this.sanitizeString(data.userAgent) : undefined,
      additionalData: data.additionalData
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (basic validation)
   */
  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    // Accept phone numbers with 10-15 digits
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Sanitize string input to prevent XSS (deprecated - use InputSanitizationService)
   * @deprecated Use InputSanitizationService.sanitizeText() instead
   */
  private sanitizeString(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/&[^;]+;/g, ''); // Remove HTML entities
  }

  /**
   * Calculate submissions by date for analytics
   */
  private calculateSubmissionsByDate(submissions: any[]): Array<{ date: string; count: number }> {
    const dateMap = new Map<string, number>();

    submissions.forEach(submission => {
      const date = new Date(submission.submittedAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get or create default reward for submissions
   * Since users no longer select rewards, we use a default placeholder
   */
  private async getDefaultReward(): Promise<{ id: number; name: string }> {
    // Try to find existing default reward
    let defaultReward = await this.prisma.reward.findFirst({
      where: { name: 'Default Submission Reward' },
    });

    // Create default reward if it doesn't exist
    if (!defaultReward) {
      defaultReward = await this.prisma.reward.create({
        data: {
          name: 'Default Submission Reward',
          description: 'Default reward placeholder for user submissions. Actual rewards are assigned by admins.',
          isActive: true,
          displayOrder: 0,
        },
      });
      
      this.logger.log('Created default reward for submissions');
    }

    return defaultReward;
  }

  /**
   * Map submission entity to response DTO
   */
  private mapSubmissionToResponse(submission: any): SubmissionResponseDto {
    return {
      id: submission.id,
      couponId: submission.couponId,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      address: submission.address,
      productExperience: submission.productExperience,
      selectedRewardId: submission.selectedRewardId,
      submittedAt: submission.submittedAt.toISOString(),
      ipAddress: submission.ipAddress || undefined,
      userAgent: submission.userAgent || undefined,
      additionalData: submission.additionalData,
      assignedRewardId: submission.assignedRewardId || undefined,
      rewardAssignedAt: submission.rewardAssignedAt?.toISOString(),
      rewardAssignedBy: submission.rewardAssignedBy || undefined,
    };
  }
}