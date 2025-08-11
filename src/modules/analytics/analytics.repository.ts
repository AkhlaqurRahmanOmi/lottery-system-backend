import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';

@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get coupon statistics with aggregation
   */
  async getCouponStatistics() {
    const stats = await this.prisma.coupon.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const batchCount = await this.prisma.coupon.groupBy({
      by: ['batchId'],
      where: { batchId: { not: null } }
    });

    const result = {
      totalGenerated: 0,
      totalActive: 0,
      totalRedeemed: 0,
      totalExpired: 0,
      totalDeactivated: 0,
      totalBatches: batchCount.length
    };

    stats.forEach(stat => {
      result.totalGenerated += stat._count.status;
      switch (stat.status) {
        case 'ACTIVE':
          result.totalActive = stat._count.status;
          break;
        case 'REDEEMED':
          result.totalRedeemed = stat._count.status;
          break;
        case 'EXPIRED':
          result.totalExpired = stat._count.status;
          break;
        case 'DEACTIVATED':
          result.totalDeactivated = stat._count.status;
          break;
      }
    });

    return result;
  }

  /**
   * Get submission statistics with aggregation
   */
  async getSubmissionStatistics() {
    const [totalSubmissions, submissionsWithRewards, uniqueUsers] = await Promise.all([
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { assignedRewardId: { not: null } } }),
      this.prisma.submission.groupBy({
        by: ['email']
      }).then(groups => groups.length)
    ]);

    return {
      totalSubmissions,
      submissionsWithRewards,
      uniqueUsers
    };
  }

  /**
   * Get reward account statistics with aggregation
   */
  async getRewardAccountStatistics() {
    const stats = await this.prisma.rewardAccount.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const result = {
      totalRewardAccounts: 0,
      availableRewards: 0,
      assignedRewards: 0,
      expiredRewards: 0
    };

    stats.forEach(stat => {
      result.totalRewardAccounts += stat._count.status;
      switch (stat.status) {
        case 'AVAILABLE':
          result.availableRewards = stat._count.status;
          break;
        case 'ASSIGNED':
          result.assignedRewards = stat._count.status;
          break;
        case 'EXPIRED':
          result.expiredRewards = stat._count.status;
          break;
      }
    });

    return result;
  }

  /**
   * Get reward selection statistics
   */
  async getRewardSelectionStatistics() {
    const rewardSelections = await this.prisma.submission.groupBy({
      by: ['selectedRewardId'],
      _count: {
        selectedRewardId: true
      },
      orderBy: {
        _count: {
          selectedRewardId: 'desc'
        }
      }
    });

    const rewardDetails = await this.prisma.reward.findMany({
      where: {
        id: {
          in: rewardSelections.map(r => r.selectedRewardId)
        }
      }
    });

    return {
      selections: rewardSelections,
      rewards: rewardDetails
    };
  }

  /**
   * Get reward category statistics
   */
  async getRewardCategoryStatistics() {
    return this.prisma.rewardAccount.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });
  }

  /**
   * Get daily statistics for performance metrics
   */
  async getDailyStatistics(startDate: Date) {
    const dailyCouponStats = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as coupons_generated,
        COUNT(CASE WHEN status = 'REDEEMED' THEN 1 END) as coupons_redeemed
      FROM coupons 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{
      date: Date;
      coupons_generated: bigint;
      coupons_redeemed: bigint;
    }>;

    const dailySubmissionStats = await this.prisma.$queryRaw`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as submissions,
        COUNT(CASE WHEN assigned_reward_id IS NOT NULL THEN 1 END) as rewards_assigned
      FROM user_submissions 
      WHERE submitted_at >= ${startDate}
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    ` as Array<{
      date: Date;
      submissions: bigint;
      rewards_assigned: bigint;
    }>;

    return {
      couponStats: dailyCouponStats.map(stat => ({
        date: stat.date,
        couponsGenerated: Number(stat.coupons_generated),
        couponsRedeemed: Number(stat.coupons_redeemed)
      })),
      submissionStats: dailySubmissionStats.map(stat => ({
        date: stat.date,
        submissions: Number(stat.submissions),
        rewardsAssigned: Number(stat.rewards_assigned)
      }))
    };
  }

  /**
   * Get campaign statistics for a specific batch
   */
  async getCampaignStatistics(batchId: string) {
    const [batchCoupons, batchSubmissions, batchRewards] = await Promise.all([
      this.prisma.coupon.groupBy({
        by: ['status'],
        where: { batchId },
        _count: { status: true }
      }),
      this.prisma.submission.count({
        where: {
          coupon: { batchId }
        }
      }),
      this.prisma.submission.count({
        where: {
          coupon: { batchId },
          assignedRewardId: { not: null }
        }
      })
    ]);

    return {
      couponStats: batchCoupons,
      totalSubmissions: batchSubmissions,
      totalRewardsAssigned: batchRewards
    };
  }

  /**
   * Get all batch IDs for campaign analytics
   */
  async getAllBatchIds(): Promise<string[]> {
    const batches = await this.prisma.coupon.groupBy({
      by: ['batchId'],
      where: { batchId: { not: null } }
    });

    return batches.map(batch => batch.batchId).filter(Boolean) as string[];
  }

  /**
   * Get batch creation date
   */
  async getBatchCreationDate(batchId: string): Promise<Date | null> {
    const batch = await this.prisma.coupon.findFirst({
      where: { batchId },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    return batch?.createdAt || null;
  }
}