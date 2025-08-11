import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import type { Submission, Prisma } from '@prisma/client';
import { 
  SubmissionQueryDto, 
  PaginatedSubmissionResponseDto, 
  SubmissionWithRelationsResponseDto,
  SubmissionStatisticsDto,
  RewardSelectionStatsDto,
  InternalCreateSubmissionDto,
  UpdateSubmissionDto,
  AssignRewardToSubmissionDto
} from './dto';

export interface SubmissionSearchFilters {
  search?: string;
  email?: string;
  phone?: string;
  couponId?: number;
  selectedRewardId?: number;
  assignedRewardId?: number;
  rewardAssignedBy?: number;
  submittedFrom?: Date;
  submittedTo?: Date;
  rewardAssignedFrom?: Date;
  rewardAssignedTo?: Date;
  hasAssignedReward?: boolean;
}

export interface SubmissionSortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubmissionPaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class SubmissionRepository {
  private readonly logger = new Logger(SubmissionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find submission by ID
   */
  async findById(id: number): Promise<Submission | null> {
    return this.prisma.submission.findUnique({
      where: { id },
    });
  }

  /**
   * Find submission by ID with relations
   */
  async findByIdWithRelations(id: number): Promise<any | null> {
    return this.prisma.submission.findUnique({
      where: { id },
      include: {
        coupon: {
          select: {
            id: true,
            couponCode: true,
            batchId: true,
            status: true,
            createdAt: true,
            expiresAt: true,
          },
        },
        selectedReward: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            isActive: true,
          },
        },
        assignedReward: {
          select: {
            id: true,
            serviceName: true,
            accountType: true,
            subscriptionDuration: true,
            description: true,
            category: true,
            assignedAt: true,
          },
        },
        rewardAssignedByAdmin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find submission by coupon ID
   */
  async findByCouponId(couponId: number): Promise<Submission | null> {
    return this.prisma.submission.findUnique({
      where: { couponId },
    });
  }

  /**
   * Find submission by email
   */
  async findByEmail(email: string): Promise<Submission[]> {
    return this.prisma.submission.findMany({
      where: { email },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Check if submission exists for coupon
   */
  async existsByCouponId(couponId: number): Promise<boolean> {
    const count = await this.prisma.submission.count({
      where: { couponId },
    });
    return count > 0;
  }

  /**
   * Create new submission
   */
  async create(data: InternalCreateSubmissionDto): Promise<Submission> {
    try {
      // Check if coupon is already redeemed
      const existingSubmission = await this.existsByCouponId(data.couponId);
      if (existingSubmission) {
        throw new ConflictException(`Coupon with ID ${data.couponId} has already been redeemed`);
      }

      // Verify coupon exists and is valid
      const coupon = await this.prisma.coupon.findUnique({
        where: { id: data.couponId },
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with ID ${data.couponId} not found`);
      }

      if (coupon.status !== 'ACTIVE') {
        throw new BadRequestException(`Coupon is not active (status: ${coupon.status})`);
      }

      // Verify selected reward exists and is active
      const reward = await this.prisma.reward.findUnique({
        where: { id: data.selectedRewardId },
      });

      if (!reward) {
        throw new NotFoundException(`Reward with ID ${data.selectedRewardId} not found`);
      }

      if (!reward.isActive) {
        throw new BadRequestException(`Selected reward is not active`);
      }

      // Create submission and update coupon status in a transaction
      return await this.prisma.$transaction(async (tx) => {
        // Create the submission
        const submission = await tx.submission.create({
          data: {
            couponId: data.couponId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            productExperience: data.productExperience,
            selectedRewardId: data.selectedRewardId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            additionalData: data.additionalData,
          },
        });

        // Update coupon status to REDEEMED
        await tx.coupon.update({
          where: { id: data.couponId },
          data: {
            status: 'REDEEMED',
            redeemedAt: new Date(),
            redeemedBy: submission.id, // Link to submission ID
          },
        });

        return submission;
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Prisma unique constraint violation
        throw new ConflictException(`Coupon with ID ${data.couponId} has already been redeemed`);
      }
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw new NotFoundException('Referenced coupon or reward not found');
      }
      throw error;
    }
  }

  /**
   * Update submission
   */
  async update(id: number, data: UpdateSubmissionDto): Promise<Submission> {
    try {
      // Check if submission exists
      const existingSubmission = await this.findById(id);
      if (!existingSubmission) {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }

      // If updating selectedRewardId, verify the reward exists and is active
      if (data.selectedRewardId) {
        const reward = await this.prisma.reward.findUnique({
          where: { id: data.selectedRewardId },
        });

        if (!reward) {
          throw new NotFoundException(`Reward with ID ${data.selectedRewardId} not found`);
        }

        if (!reward.isActive) {
          throw new BadRequestException(`Selected reward is not active`);
        }
      }

      return await this.prisma.submission.update({
        where: { id },
        data: {
          ...data,
          rewardAssignedAt: data.rewardAssignedAt ? new Date(data.rewardAssignedAt) : undefined,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma record not found
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw new NotFoundException('Referenced reward or admin not found');
      }
      throw error;
    }
  }

  /**
   * Delete submission
   */
  async delete(id: number): Promise<Submission> {
    try {
      // Get submission to check coupon ID
      const submission = await this.findById(id);
      if (!submission) {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }

      // Delete submission and reset coupon status in a transaction
      return await this.prisma.$transaction(async (tx) => {
        // Delete the submission
        const deletedSubmission = await tx.submission.delete({
          where: { id },
        });

        // Reset coupon status to ACTIVE
        await tx.coupon.update({
          where: { id: submission.couponId },
          data: {
            status: 'ACTIVE',
            redeemedAt: null,
            redeemedBy: null,
          },
        });

        return deletedSubmission;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find many submissions with basic parameters
   */
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SubmissionWhereInput;
    orderBy?: Prisma.SubmissionOrderByWithRelationInput;
    include?: Prisma.SubmissionInclude;
  }): Promise<Submission[]> {
    const { skip, take, where, orderBy, include } = params || {};

    return this.prisma.submission.findMany({
      skip,
      take,
      where,
      orderBy,
      include,
    });
  }

  /**
   * Count submissions with optional filters
   */
  async count(where?: Prisma.SubmissionWhereInput): Promise<number> {
    return this.prisma.submission.count({ where });
  }

  /**
   * Find submissions with advanced filtering, sorting, and pagination
   */
  async findWithFilters(queryDto: SubmissionQueryDto): Promise<PaginatedSubmissionResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      email,
      phone,
      couponId,
      selectedRewardId,
      assignedRewardId,
      rewardAssignedBy,
      submittedFrom,
      submittedTo,
      rewardAssignedFrom,
      rewardAssignedTo,
      hasAssignedReward,
      sortBy = 'submittedAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Build where clause
    const where: Prisma.SubmissionWhereInput = {};

    // Add search filter (searches across name, email, phone)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add specific field filters
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (phone) {
      where.phone = { contains: phone, mode: 'insensitive' };
    }

    if (couponId) {
      where.couponId = couponId;
    }

    if (selectedRewardId) {
      where.selectedRewardId = selectedRewardId;
    }

    if (assignedRewardId) {
      where.assignedRewardId = assignedRewardId;
    }

    if (rewardAssignedBy) {
      where.rewardAssignedBy = rewardAssignedBy;
    }

    // Add date range filters
    if (submittedFrom || submittedTo) {
      where.submittedAt = {};
      if (submittedFrom) {
        where.submittedAt.gte = new Date(submittedFrom);
      }
      if (submittedTo) {
        where.submittedAt.lte = new Date(submittedTo);
      }
    }

    if (rewardAssignedFrom || rewardAssignedTo) {
      where.rewardAssignedAt = {};
      if (rewardAssignedFrom) {
        where.rewardAssignedAt.gte = new Date(rewardAssignedFrom);
      }
      if (rewardAssignedTo) {
        where.rewardAssignedAt.lte = new Date(rewardAssignedTo);
      }
    }

    // Filter by reward assignment status
    if (hasAssignedReward !== undefined) {
      if (hasAssignedReward) {
        where.assignedRewardId = { not: null };
      } else {
        where.assignedRewardId = null;
      }
    }

    // Build order by clause
    const orderBy: Prisma.SubmissionOrderByWithRelationInput = {};
    if (sortBy && ['id', 'name', 'email', 'submittedAt', 'rewardAssignedAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.submittedAt = 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          coupon: {
            select: {
              id: true,
              couponCode: true,
              batchId: true,
              status: true,
              createdAt: true,
              expiresAt: true,
            },
          },
          selectedReward: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              isActive: true,
            },
          },
          assignedReward: {
            select: {
              id: true,
              serviceName: true,
              accountType: true,
              subscriptionDuration: true,
              description: true,
              category: true,
              assignedAt: true,
            },
          },
          rewardAssignedByAdmin: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Transform data to match response DTO
    const transformedData: SubmissionWithRelationsResponseDto[] = submissions.map(submission => ({
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
      coupon: submission.coupon ? {
        id: submission.coupon.id,
        couponCode: submission.coupon.couponCode,
        batchId: submission.coupon.batchId || undefined,
        status: submission.coupon.status,
        createdAt: submission.coupon.createdAt,
        expiresAt: submission.coupon.expiresAt || undefined,
      } : undefined,
      selectedReward: submission.selectedReward ? {
        id: submission.selectedReward.id,
        name: submission.selectedReward.name,
        description: submission.selectedReward.description || undefined,
        imageUrl: submission.selectedReward.imageUrl || undefined,
        isActive: submission.selectedReward.isActive,
      } : undefined,
      assignedReward: submission.assignedReward ? {
        id: submission.assignedReward.id,
        serviceName: submission.assignedReward.serviceName,
        accountType: submission.assignedReward.accountType,
        subscriptionDuration: submission.assignedReward.subscriptionDuration || undefined,
        description: submission.assignedReward.description || undefined,
        category: submission.assignedReward.category,
        assignedAt: submission.assignedReward.assignedAt || undefined,
      } : undefined,
      rewardAssignedByAdmin: submission.rewardAssignedByAdmin ? {
        id: submission.rewardAssignedByAdmin.id,
        username: submission.rewardAssignedByAdmin.username,
        email: submission.rewardAssignedByAdmin.email,
      } : undefined,
    }));

    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Assign reward to submission
   */
  async assignReward(assignmentData: AssignRewardToSubmissionDto, assignedBy: number): Promise<Submission> {
    try {
      // Verify submission exists
      const submission = await this.findById(assignmentData.submissionId);
      if (!submission) {
        throw new NotFoundException(`Submission with ID ${assignmentData.submissionId} not found`);
      }

      // Verify reward account exists and is available
      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { id: assignmentData.rewardAccountId },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account with ID ${assignmentData.rewardAccountId} not found`);
      }

      if (rewardAccount.status !== 'AVAILABLE') {
        throw new BadRequestException(`Reward account is not available (status: ${rewardAccount.status})`);
      }

      // Assign reward in a transaction
      return await this.prisma.$transaction(async (tx) => {
        // Update submission with reward assignment
        const updatedSubmission = await tx.submission.update({
          where: { id: assignmentData.submissionId },
          data: {
            assignedRewardId: assignmentData.rewardAccountId,
            rewardAssignedAt: new Date(),
            rewardAssignedBy: assignedBy,
          },
        });

        // Update reward account status to ASSIGNED
        await tx.rewardAccount.update({
          where: { id: assignmentData.rewardAccountId },
          data: {
            status: 'ASSIGNED',
            assignedToUserId: assignmentData.submissionId,
            assignedAt: new Date(),
          },
        });

        return updatedSubmission;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Submission or reward account not found');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('Referenced submission, reward account, or admin not found');
      }
      throw error;
    }
  }

  /**
   * Remove reward assignment from submission
   */
  async removeRewardAssignment(submissionId: number): Promise<Submission> {
    try {
      const submission = await this.findById(submissionId);
      if (!submission) {
        throw new NotFoundException(`Submission with ID ${submissionId} not found`);
      }

      if (!submission.assignedRewardId) {
        throw new BadRequestException('Submission does not have an assigned reward');
      }

      // Remove assignment in a transaction
      return await this.prisma.$transaction(async (tx) => {
        // Update submission to remove reward assignment
        const updatedSubmission = await tx.submission.update({
          where: { id: submissionId },
          data: {
            assignedRewardId: null,
            rewardAssignedAt: null,
            rewardAssignedBy: null,
          },
        });

        // Update reward account status back to AVAILABLE
        if (submission.assignedRewardId) {
          await tx.rewardAccount.update({
            where: { id: submission.assignedRewardId },
            data: {
              status: 'AVAILABLE',
              assignedToUserId: null,
              assignedAt: null,
            },
          });
        }

        return updatedSubmission;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Submission with ID ${submissionId} not found`);
      }
      throw error;
    }
  }

  /**
   * Get submission statistics
   */
  async getStatistics(): Promise<SubmissionStatisticsDto> {
    const [
      total,
      withAssignedRewards,
      rewardSelectionStats
    ] = await Promise.all([
      this.count(),
      this.count({ assignedRewardId: { not: null } }),
      this.getRewardSelectionStatistics(),
    ]);

    const withoutAssignedRewards = total - withAssignedRewards;
    const rewardAssignmentRate = total > 0 ? (withAssignedRewards / total) * 100 : 0;

    return {
      total,
      withAssignedRewards,
      withoutAssignedRewards,
      rewardAssignmentRate: Math.round(rewardAssignmentRate * 100) / 100, // Round to 2 decimal places
      rewardSelectionStats,
    };
  }

  /**
   * Get reward selection statistics
   */
  async getRewardSelectionStatistics(): Promise<RewardSelectionStatsDto[]> {
    const stats = await this.prisma.submission.groupBy({
      by: ['selectedRewardId'],
      _count: {
        selectedRewardId: true,
      },
      orderBy: {
        _count: {
          selectedRewardId: 'desc',
        },
      },
    });

    const total = await this.count();

    // Get reward names
    const rewardIds = stats.map(stat => stat.selectedRewardId);
    const rewards = await this.prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, name: true },
    });

    const rewardMap = new Map(rewards.map(reward => [reward.id, reward.name]));

    return stats.map(stat => ({
      rewardId: stat.selectedRewardId,
      rewardName: rewardMap.get(stat.selectedRewardId) || 'Unknown Reward',
      selectionCount: stat._count.selectedRewardId,
      selectionPercentage: total > 0 ? Math.round((stat._count.selectedRewardId / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Find submissions by selected reward
   */
  async findBySelectedReward(rewardId: number): Promise<Submission[]> {
    return this.findMany({
      where: { selectedRewardId: rewardId },
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Find submissions by assigned reward
   */
  async findByAssignedReward(rewardAccountId: number): Promise<Submission[]> {
    return this.findMany({
      where: { assignedRewardId: rewardAccountId },
      orderBy: { rewardAssignedAt: 'desc' }
    });
  }

  /**
   * Find submissions without assigned rewards
   */
  async findWithoutAssignedRewards(): Promise<Submission[]> {
    return this.findMany({
      where: { assignedRewardId: null },
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Search submissions by email pattern
   */
  async searchByEmail(pattern: string, limit: number = 10): Promise<Submission[]> {
    return this.findMany({
      where: {
        email: { contains: pattern, mode: 'insensitive' }
      },
      take: limit,
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Get submissions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Submission[]> {
    return this.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Check if submission can be deleted (business logic)
   */
  async canDelete(id: number): Promise<boolean> {
    const submission = await this.findById(id);
    if (!submission) {
      return false;
    }

    // Don't allow deletion if reward has been assigned (for audit trail)
    return !submission.assignedRewardId;
  }

  /**
   * Get recent submissions
   */
  async getRecentSubmissions(limit: number = 10): Promise<Submission[]> {
    return this.findMany({
      take: limit,
      orderBy: { submittedAt: 'desc' }
    });
  }
}