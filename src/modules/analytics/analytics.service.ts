import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { 
  AnalyticsSummaryDto,
  ConversionRateDto,
  RewardSelectionAnalyticsDto,
  PerformanceMetricsDto,
  CampaignAnalyticsDto
} from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive analytics summary
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
    this.logger.log('Calculating analytics summary');

    const [
      couponStats,
      submissionStats,
      rewardStats,
      conversionRates,
      rewardSelectionStats
    ] = await Promise.all([
      this.getCouponStatistics(),
      this.getSubmissionStatistics(),
      this.getRewardAccountStatistics(),
      this.getConversionRates(),
      this.getRewardSelectionAnalytics()
    ]);

    return {
      coupons: couponStats,
      submissions: submissionStats,
      rewards: rewardStats,
      conversion: conversionRates,
      rewardSelection: rewardSelectionStats,
      generatedAt: new Date()
    };
  }

  /**
   * Get coupon statistics
   */
  private async getCouponStatistics() {
    const [
      totalGenerated,
      totalActive,
      totalRedeemed,
      totalExpired,
      totalDeactivated,
      batchCount
    ] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({ where: { status: 'ACTIVE' } }),
      this.prisma.coupon.count({ where: { status: 'REDEEMED' } }),
      this.prisma.coupon.count({ where: { status: 'EXPIRED' } }),
      this.prisma.coupon.count({ where: { status: 'DEACTIVATED' } }),
      this.prisma.coupon.groupBy({
        by: ['batchId'],
        where: { batchId: { not: null } }
      }).then(batches => batches.length)
    ]);

    return {
      totalGenerated,
      totalActive,
      totalRedeemed,
      totalExpired,
      totalDeactivated,
      totalBatches: batchCount
    };
  }

  /**
   * Get submission statistics
   */
  private async getSubmissionStatistics() {
    const [
      totalSubmissions,
      submissionsWithRewards,
      uniqueUsers
    ] = await Promise.all([
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
   * Get reward account statistics
   */
  private async getRewardAccountStatistics() {
    const [
      totalRewardAccounts,
      availableRewards,
      assignedRewards,
      expiredRewards
    ] = await Promise.all([
      this.prisma.rewardAccount.count(),
      this.prisma.rewardAccount.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.rewardAccount.count({ where: { status: 'ASSIGNED' } }),
      this.prisma.rewardAccount.count({ where: { status: 'EXPIRED' } })
    ]);

    return {
      totalRewardAccounts,
      availableRewards,
      assignedRewards,
      expiredRewards
    };
  }

  /**
   * Calculate conversion rates and performance metrics
   */
  async getConversionRates(): Promise<ConversionRateDto> {
    const [
      totalCoupons,
      redeemedCoupons,
      totalSubmissions,
      submissionsWithRewards
    ] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({ where: { status: 'REDEEMED' } }),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { assignedRewardId: { not: null } } })
    ]);

    const couponRedemptionRate = totalCoupons > 0 ? (redeemedCoupons / totalCoupons) * 100 : 0;
    const rewardAssignmentRate = totalSubmissions > 0 ? (submissionsWithRewards / totalSubmissions) * 100 : 0;
    const overallConversionRate = totalCoupons > 0 ? (submissionsWithRewards / totalCoupons) * 100 : 0;

    return {
      couponRedemptionRate: Math.round(couponRedemptionRate * 100) / 100,
      rewardAssignmentRate: Math.round(rewardAssignmentRate * 100) / 100,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      totalCouponsGenerated: totalCoupons,
      totalCouponsRedeemed: redeemedCoupons,
      totalSubmissions,
      totalRewardsAssigned: submissionsWithRewards
    };
  }

  /**
   * Get reward selection analytics and popularity
   */
  async getRewardSelectionAnalytics(): Promise<RewardSelectionAnalyticsDto> {
    // Get reward selection statistics
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

    // Get reward details for the selections
    const rewardDetails = await this.prisma.reward.findMany({
      where: {
        id: {
          in: rewardSelections.map(r => r.selectedRewardId)
        }
      }
    });

    // Combine selection counts with reward details
    const rewardPopularity = rewardSelections.map(selection => {
      const reward = rewardDetails.find(r => r.id === selection.selectedRewardId);
      return {
        rewardId: selection.selectedRewardId,
        rewardName: reward?.name || 'Unknown Reward',
        rewardDescription: reward?.description || undefined,
        selectionCount: selection._count.selectedRewardId,
        isActive: reward?.isActive || false
      };
    });

    // Get reward category statistics from reward accounts
    const categoryStats = await this.prisma.rewardAccount.groupBy({
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

    const categoryPopularity = categoryStats.map(stat => ({
      category: stat.category,
      accountCount: stat._count.category
    }));

    // Calculate total selections for percentage calculations
    const totalSelections = rewardSelections.reduce((sum, r) => sum + r._count.selectedRewardId, 0);

    const processedRewardPopularity = rewardPopularity.map(r => ({
      ...r,
      selectionPercentage: totalSelections > 0 ? Math.round((r.selectionCount / totalSelections) * 10000) / 100 : 0
    }));

    return {
      totalRewardSelections: totalSelections,
      rewardPopularity: processedRewardPopularity,
      categoryPopularity,
      mostPopularReward: processedRewardPopularity.length > 0 ? processedRewardPopularity[0] : undefined,
      leastPopularReward: processedRewardPopularity.length > 0 ? processedRewardPopularity[processedRewardPopularity.length - 1] : undefined
    };
  }

  /**
   * Get performance metrics over time
   */
  async getPerformanceMetrics(days: number = 30): Promise<PerformanceMetricsDto> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily statistics for the specified period
    const dailyStats = await this.prisma.$queryRaw`
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

    const dailySubmissions = await this.prisma.$queryRaw`
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

    // Convert BigInt to number for JSON serialization
    const processedDailyStats = dailyStats.map(stat => ({
      date: stat.date,
      couponsGenerated: Number(stat.coupons_generated),
      couponsRedeemed: Number(stat.coupons_redeemed)
    }));

    const processedDailySubmissions = dailySubmissions.map(stat => ({
      date: stat.date,
      submissions: Number(stat.submissions),
      rewardsAssigned: Number(stat.rewards_assigned)
    }));

    return {
      periodDays: days,
      startDate,
      endDate: new Date(),
      dailyCouponStats: processedDailyStats,
      dailySubmissionStats: processedDailySubmissions
    };
  }

  /**
   * Get campaign analytics for specific batch
   */
  async getCampaignAnalytics(batchId: string): Promise<CampaignAnalyticsDto | null> {
    // Check if batch exists
    const batchExists = await this.prisma.coupon.findFirst({
      where: { batchId }
    });

    if (!batchExists) {
      return null;
    }

    const [
      batchCoupons,
      batchSubmissions,
      batchRewards
    ] = await Promise.all([
      // Get coupon statistics for this batch
      this.prisma.coupon.groupBy({
        by: ['status'],
        where: { batchId },
        _count: { status: true }
      }),
      // Get submissions for this batch
      this.prisma.submission.count({
        where: {
          coupon: { batchId }
        }
      }),
      // Get reward assignments for this batch
      this.prisma.submission.count({
        where: {
          coupon: { batchId },
          assignedRewardId: { not: null }
        }
      })
    ]);

    // Process coupon statistics
    const couponStats = {
      total: 0,
      active: 0,
      redeemed: 0,
      expired: 0,
      deactivated: 0
    };

    batchCoupons.forEach(stat => {
      couponStats.total += stat._count.status;
      couponStats[stat.status.toLowerCase() as keyof typeof couponStats] = stat._count.status;
    });

    const conversionRate = couponStats.total > 0 ? (couponStats.redeemed / couponStats.total) * 100 : 0;
    const rewardAssignmentRate = batchSubmissions > 0 ? (batchRewards / batchSubmissions) * 100 : 0;

    return {
      batchId,
      coupons: couponStats,
      totalSubmissions: batchSubmissions,
      totalRewardsAssigned: batchRewards,
      conversionRate: Math.round(conversionRate * 100) / 100,
      rewardAssignmentRate: Math.round(rewardAssignmentRate * 100) / 100,
      createdAt: batchExists.createdAt
    };
  }

  /**
   * Get top performing batches
   */
  async getTopPerformingBatches(limit: number = 10): Promise<CampaignAnalyticsDto[]> {
    // Get all batch IDs
    const batches = await this.prisma.coupon.groupBy({
      by: ['batchId'],
      where: { batchId: { not: null } }
    });

    const batchAnalytics: CampaignAnalyticsDto[] = [];

    for (const batch of batches) {
      if (batch.batchId) {
        const analytics = await this.getCampaignAnalytics(batch.batchId);
        if (analytics) {
          batchAnalytics.push(analytics);
        }
      }
    }

    // Sort by conversion rate and return top performers
    return batchAnalytics
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);
  }
}