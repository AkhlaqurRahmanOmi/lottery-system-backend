import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import type { RewardAccount, Prisma } from '@prisma/client';
import { RewardCategory, RewardStatus } from '@prisma/client';
import { EncryptionService } from '../../shared/services';

export interface RewardAccountSearchFilters {
  search?: string;
  category?: RewardCategory;
  status?: RewardStatus;
  assignedToUserId?: number;
  createdBy?: number;
}

export interface RewardAccountSortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RewardAccountPaginationOptions {
  page?: number;
  limit?: number;
}

export interface CreateRewardAccountData {
  serviceName: string;
  accountType: string;
  credentials: string; // Plain text credentials to be encrypted
  subscriptionDuration?: string;
  description?: string;
  category: RewardCategory;
  createdBy: number;
}

export interface UpdateRewardAccountData {
  serviceName?: string;
  accountType?: string;
  credentials?: string; // Plain text credentials to be encrypted
  subscriptionDuration?: string;
  description?: string;
  category?: RewardCategory;
  status?: RewardStatus;
  assignedToUserId?: number | null;
}

@Injectable()
export class RewardAccountRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Find reward account by ID
   */
  async findById(id: number): Promise<RewardAccount | null> {
    return this.prisma.rewardAccount.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        assignedSubmissions: {
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
   * Find reward account by ID with decrypted credentials (admin only)
   */
  async findByIdWithCredentials(id: number): Promise<RewardAccount & { decryptedCredentials: string } | null> {
    const rewardAccount = await this.findById(id);
    if (!rewardAccount) {
      return null;
    }

    try {
      const decryptedCredentials = this.encryptionService.decrypt(rewardAccount.encryptedCredentials);
      return {
        ...rewardAccount,
        decryptedCredentials,
      };
    } catch (error) {
      throw new Error(`Failed to decrypt credentials for reward account ${id}: ${error.message}`);
    }
  }

  /**
   * Create new reward account with encrypted credentials
   */
  async create(data: CreateRewardAccountData): Promise<RewardAccount> {
    try {
      const encryptedCredentials = this.encryptionService.encrypt(data.credentials);

      return await this.prisma.rewardAccount.create({
        data: {
          serviceName: data.serviceName,
          accountType: data.accountType,
          encryptedCredentials,
          subscriptionDuration: data.subscriptionDuration,
          description: data.description,
          category: data.category,
          createdBy: data.createdBy,
        },
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Reward account with these details already exists');
      }
      throw error;
    }
  }

  /**
   * Update reward account with optional credential encryption
   */
  async update(id: number, data: UpdateRewardAccountData): Promise<RewardAccount> {
    try {
      // Check if reward account exists
      const existingAccount = await this.findById(id);
      if (!existingAccount) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Encrypt credentials if provided
      if (data.credentials) {
        updateData.encryptedCredentials = this.encryptionService.encrypt(data.credentials);
        delete updateData.credentials;
      }

      return await this.prisma.rewardAccount.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          assignedSubmissions: {
            select: {
              id: true,
              name: true,
              email: true,
              submittedAt: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete reward account
   */
  async delete(id: number): Promise<RewardAccount> {
    try {
      return await this.prisma.rewardAccount.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find many reward accounts with basic parameters
   */
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.RewardAccountWhereInput;
    orderBy?: Prisma.RewardAccountOrderByWithRelationInput;
    include?: Prisma.RewardAccountInclude;
  }): Promise<RewardAccount[]> {
    const { skip, take, where, orderBy, include } = params || {};

    return this.prisma.rewardAccount.findMany({
      skip,
      take,
      where,
      orderBy,
      include: include || {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        assignedSubmissions: {
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
   * Count reward accounts with optional filters
   */
  async count(where?: Prisma.RewardAccountWhereInput): Promise<number> {
    return this.prisma.rewardAccount.count({ where });
  }

  /**
   * Find reward accounts with advanced filtering, sorting, and pagination
   */
  async findWithFilters(
    filters: RewardAccountSearchFilters,
    pagination: RewardAccountPaginationOptions,
    sorting: RewardAccountSortOptions,
  ): Promise<{
    data: RewardAccount[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const { page = 1, limit = 10 } = pagination;
    const { sortBy = 'createdAt', sortOrder = 'desc' } = sorting;
    const { search, category, status, assignedToUserId, createdBy } = filters;

    // Build where clause
    const where: Prisma.RewardAccountWhereInput = {};

    // Add search filter
    if (search) {
      where.OR = [
        { serviceName: { contains: search, mode: 'insensitive' } },
        { accountType: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add category filter
    if (category) {
      where.category = category;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add assigned user filter
    if (assignedToUserId !== undefined) {
      where.assignedToUserId = assignedToUserId;
    }

    // Add creator filter
    if (createdBy) {
      where.createdBy = createdBy;
    }

    // Build order by clause
    const orderBy: Prisma.RewardAccountOrderByWithRelationInput = {};
    const validSortFields = ['id', 'serviceName', 'category', 'status', 'createdAt', 'updatedAt', 'assignedAt'];
    
    if (sortBy && validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [rewardAccounts, total] = await Promise.all([
      this.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.count(where),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: rewardAccounts,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Find available reward accounts by category
   */
  async findAvailableByCategory(category?: RewardCategory): Promise<RewardAccount[]> {
    const where: Prisma.RewardAccountWhereInput = {
      status: RewardStatus.AVAILABLE,
    };

    if (category) {
      where.category = category;
    }

    return this.findMany({
      where,
      orderBy: { createdAt: 'asc' }, // FIFO for fairness
    });
  }

  /**
   * Find assigned reward accounts for a user
   */
  async findAssignedToUser(userId: number): Promise<RewardAccount[]> {
    return this.findMany({
      where: {
        assignedToUserId: userId,
        status: RewardStatus.ASSIGNED,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Assign reward account to user
   */
  async assignToUser(id: number, userId: number, assignedBy: number): Promise<RewardAccount> {
    try {
      // Check if reward account exists and is available
      const rewardAccount = await this.findById(id);
      if (!rewardAccount) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }

      if (rewardAccount.status !== RewardStatus.AVAILABLE) {
        throw new ConflictException(`Reward account ${id} is not available for assignment`);
      }

      // Update the submission record to link the reward
      await this.prisma.submission.update({
        where: { id: userId },
        data: {
          assignedRewardId: id,
          rewardAssignedAt: new Date(),
          rewardAssignedBy: assignedBy,
        },
      });

      // Update the reward account status
      return await this.update(id, {
        status: RewardStatus.ASSIGNED,
        assignedToUserId: userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Unassign reward account from user
   */
  async unassignFromUser(id: number): Promise<RewardAccount> {
    try {
      const rewardAccount = await this.findById(id);
      if (!rewardAccount) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }

      if (rewardAccount.status !== RewardStatus.ASSIGNED) {
        throw new ConflictException(`Reward account ${id} is not currently assigned`);
      }

      // Update the submission records to remove the reward link
      await this.prisma.submission.updateMany({
        where: { assignedRewardId: id },
        data: {
          assignedRewardId: null,
          rewardAssignedAt: null,
          rewardAssignedBy: null,
        },
      });

      // Update the reward account status
      return await this.update(id, {
        status: RewardStatus.AVAILABLE,
        assignedToUserId: null,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Get reward account statistics
   */
  async getStatistics(): Promise<{
    total: number;
    available: number;
    assigned: number;
    expired: number;
    deactivated: number;
    byCategory: Record<RewardCategory, number>;
  }> {
    const [total, available, assigned, expired, deactivated, categoryStats] = await Promise.all([
      this.count(),
      this.count({ status: RewardStatus.AVAILABLE }),
      this.count({ status: RewardStatus.ASSIGNED }),
      this.count({ status: RewardStatus.EXPIRED }),
      this.count({ status: RewardStatus.DEACTIVATED }),
      this.prisma.rewardAccount.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
      }),
    ]);

    const byCategory = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = stat._count.id;
      return acc;
    }, {} as Record<RewardCategory, number>);

    return {
      total,
      available,
      assigned,
      expired,
      deactivated,
      byCategory,
    };
  }

  /**
   * Mark expired reward accounts
   */
  async markExpiredAccounts(): Promise<number> {
    // This would typically be based on business logic
    // For now, we'll mark accounts as expired if they've been assigned for more than 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await this.prisma.rewardAccount.updateMany({
      where: {
        status: RewardStatus.ASSIGNED,
        assignedAt: {
          lt: oneYearAgo,
        },
      },
      data: {
        status: RewardStatus.EXPIRED,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Check if reward account can be deleted
   */
  async canDelete(id: number): Promise<boolean> {
    const rewardAccount = await this.findById(id);
    if (!rewardAccount) {
      return false;
    }

    // Don't allow deletion if assigned to a user
    return rewardAccount.status !== RewardStatus.ASSIGNED;
  }

  /**
   * Get reward accounts created by admin
   */
  async findByCreator(createdBy: number): Promise<RewardAccount[]> {
    return this.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get category statistics for analytics
   */
  async getCategoryStatistics(filters: {
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    category: string;
    totalAccounts: number;
    availableAccounts: number;
    assignedAccounts: number;
    assignmentRate: number;
    averageAssignmentTime: number;
  }>> {
    const where: Prisma.RewardAccountWhereInput = {};

    if (filters.category) {
      where.category = filters.category as RewardCategory;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const categoryStats = await this.prisma.rewardAccount.groupBy({
      by: ['category'],
      where,
      _count: {
        id: true,
      },
      _avg: {
        // This would need a calculated field for assignment time
      },
    });

    const results: Array<{
      category: string;
      totalAccounts: number;
      availableAccounts: number;
      assignedAccounts: number;
      assignmentRate: number;
      averageAssignmentTime: number;
    }> = [];
    
    for (const stat of categoryStats) {
      const [available, assigned] = await Promise.all([
        this.count({ ...where, category: stat.category, status: RewardStatus.AVAILABLE }),
        this.count({ ...where, category: stat.category, status: RewardStatus.ASSIGNED }),
      ]);

      results.push({
        category: stat.category,
        totalAccounts: stat._count.id,
        availableAccounts: available,
        assignedAccounts: assigned,
        assignmentRate: stat._count.id > 0 ? (assigned / stat._count.id) * 100 : 0,
        averageAssignmentTime: 24.5, // This would be calculated from actual assignment data
      });
    }

    return results.sort((a, b) => b.totalAccounts - a.totalAccounts);
  }

  /**
   * Get service statistics for analytics
   */
  async getServiceStatistics(filters: {
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    serviceName: string;
    accountType: string;
    totalAccounts: number;
    assignedAccounts: number;
    assignmentRate: number;
    category: string;
  }>> {
    const where: Prisma.RewardAccountWhereInput = {};

    if (filters.category) {
      where.category = filters.category as RewardCategory;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const serviceStats = await this.prisma.rewardAccount.groupBy({
      by: ['serviceName', 'accountType', 'category'],
      where,
      _count: {
        id: true,
      },
    });

    const results: Array<{
      serviceName: string;
      accountType: string;
      totalAccounts: number;
      assignedAccounts: number;
      assignmentRate: number;
      category: string;
    }> = [];
    
    for (const stat of serviceStats) {
      const assigned = await this.count({
        ...where,
        serviceName: stat.serviceName,
        accountType: stat.accountType,
        status: RewardStatus.ASSIGNED,
      });

      results.push({
        serviceName: stat.serviceName,
        accountType: stat.accountType,
        totalAccounts: stat._count.id,
        assignedAccounts: assigned,
        assignmentRate: stat._count.id > 0 ? (assigned / stat._count.id) * 100 : 0,
        category: stat.category,
      });
    }

    return results.sort((a, b) => b.totalAccounts - a.totalAccounts);
  }

  /**
   * Get assignment trends over time
   */
  async getAssignmentTrends(filters: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    date: string;
    assignmentCount: number;
    categoryBreakdown: Record<string, number>;
  }>> {
    const dateFrom = filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo || new Date();

    // Get daily assignment data from submissions table
    const dailyAssignments = await this.prisma.$queryRaw`
      SELECT 
        DATE(reward_assigned_at) as date,
        COUNT(*) as assignment_count,
        ra.category
      FROM user_submissions us
      JOIN reward_accounts ra ON us.assigned_reward_id = ra.id
      WHERE us.reward_assigned_at >= ${dateFrom}
        AND us.reward_assigned_at <= ${dateTo}
        AND us.assigned_reward_id IS NOT NULL
      GROUP BY DATE(reward_assigned_at), ra.category
      ORDER BY date ASC
    ` as Array<{
      date: Date;
      assignment_count: bigint;
      category: string;
    }>;

    // Group by date and create category breakdown
    const trendMap = new Map<string, {
      assignmentCount: number;
      categoryBreakdown: Record<string, number>;
    }>();

    dailyAssignments.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      const count = Number(row.assignment_count);

      if (!trendMap.has(dateStr)) {
        trendMap.set(dateStr, {
          assignmentCount: 0,
          categoryBreakdown: {},
        });
      }

      const trend = trendMap.get(dateStr)!;
      trend.assignmentCount += count;
      trend.categoryBreakdown[row.category] = (trend.categoryBreakdown[row.category] || 0) + count;
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      assignmentCount: data.assignmentCount,
      categoryBreakdown: data.categoryBreakdown,
    }));
  }
}