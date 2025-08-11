/**
 * Demo file showing how to use the RewardDistributionService
 * This demonstrates the key functionality for reward account management and distribution
 */

import { RewardDistributionService } from './reward-distribution.service';
import { RewardCategory, RewardStatus } from '@prisma/client';

export class RewardDistributionDemo {
  constructor(private readonly rewardDistributionService: RewardDistributionService) {}

  /**
   * Demo: Create reward accounts for different services
   * Requirement 7.1: Allow admins to add reward account details
   */
  async createRewardAccountsDemo(adminId: number) {
    console.log('=== Creating Reward Accounts Demo ===');

    // Create Netflix Premium account
    const netflixAccount = await this.rewardDistributionService.createRewardAccount({
      serviceName: 'Netflix',
      accountType: 'Premium',
      credentials: 'netflix.user@example.com:SecurePassword123',
      subscriptionDuration: '3 months',
      description: 'Netflix Premium subscription with 4K streaming',
      category: RewardCategory.STREAMING_SERVICE,
      createdBy: adminId,
    });

    console.log('Created Netflix account:', {
      id: netflixAccount.id,
      serviceName: netflixAccount.serviceName,
      status: netflixAccount.status,
    });

    // Create Spotify Premium account
    const spotifyAccount = await this.rewardDistributionService.createRewardAccount({
      serviceName: 'Spotify',
      accountType: 'Premium',
      credentials: 'spotify.user@example.com:MusicPassword456',
      subscriptionDuration: '6 months',
      description: 'Spotify Premium with ad-free music streaming',
      category: RewardCategory.STREAMING_SERVICE,
      createdBy: adminId,
    });

    console.log('Created Spotify account:', {
      id: spotifyAccount.id,
      serviceName: spotifyAccount.serviceName,
      status: spotifyAccount.status,
    });

    // Create Amazon Gift Card
    const giftCard = await this.rewardDistributionService.createRewardAccount({
      serviceName: 'Amazon',
      accountType: 'Gift Card',
      credentials: 'AMZN-GIFT-1234-5678-9012',
      description: '$50 Amazon Gift Card',
      category: RewardCategory.GIFT_CARD,
      createdBy: adminId,
    });

    console.log('Created Amazon Gift Card:', {
      id: giftCard.id,
      serviceName: giftCard.serviceName,
      status: giftCard.status,
    });

    return { netflixAccount, spotifyAccount, giftCard };
  }

  /**
   * Demo: Bulk create multiple reward accounts
   * Requirement 7.1: Efficiently add multiple reward accounts
   */
  async bulkCreateRewardAccountsDemo(adminId: number) {
    console.log('=== Bulk Creating Reward Accounts Demo ===');

    const accounts = [
      {
        serviceName: 'YouTube Premium',
        accountType: 'Individual',
        credentials: 'youtube1@example.com:YTPass123',
        subscriptionDuration: '1 month',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      },
      {
        serviceName: 'YouTube Premium',
        accountType: 'Individual',
        credentials: 'youtube2@example.com:YTPass456',
        subscriptionDuration: '1 month',
        category: RewardCategory.STREAMING_SERVICE,
        createdBy: adminId,
      },
      {
        serviceName: 'Steam',
        accountType: 'Gift Card',
        credentials: 'STEAM-GIFT-ABCD-EFGH-IJKL',
        description: '$25 Steam Gift Card',
        category: RewardCategory.GIFT_CARD,
        createdBy: adminId,
      },
    ];

    const result = await this.rewardDistributionService.bulkCreateRewardAccounts(accounts);

    console.log('Bulk creation result:', {
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
    });

    return result;
  }

  /**
   * Demo: Get reward inventory and statistics
   * Requirement 7.2: Track available and distributed reward accounts
   */
  async getInventoryStatsDemo() {
    console.log('=== Reward Inventory Statistics Demo ===');

    const stats = await this.rewardDistributionService.getRewardInventoryStats();

    console.log('Inventory Statistics:', {
      total: stats.total,
      available: stats.available,
      assigned: stats.assigned,
      expired: stats.expired,
      deactivated: stats.deactivated,
      categoryBreakdown: stats.byCategory,
    });

    const analytics = await this.rewardDistributionService.getRewardDistributionAnalytics();

    console.log('Distribution Analytics:', {
      distributionRate: `${analytics.distributionRate.toFixed(2)}%`,
      availabilityRate: `${analytics.availabilityRate.toFixed(2)}%`,
    });

    return { stats, analytics };
  }

  /**
   * Demo: Assign reward to user
   * Requirement 7.4: Allow admins to assign specific reward accounts to specific users
   * Requirement 7.5: Record which reward account was given to which user and when
   */
  async assignRewardToUserDemo(rewardAccountId: number, submissionId: number, adminId: number) {
    console.log('=== Assign Reward to User Demo ===');

    // First, validate the assignment
    const validation = await this.rewardDistributionService.validateRewardAssignment(
      rewardAccountId,
      submissionId,
    );

    if (!validation.isValid) {
      console.log('Assignment validation failed:', validation.error);
      return null;
    }

    console.log('Assignment validation passed for reward:', {
      id: validation.rewardAccount?.id,
      serviceName: validation.rewardAccount?.serviceName,
      status: validation.rewardAccount?.status,
    });

    // Assign the reward
    const assignedReward = await this.rewardDistributionService.assignRewardToUser({
      rewardAccountId,
      submissionId,
      assignedBy: adminId,
      notes: 'Assigned to lottery winner',
    });

    console.log('Successfully assigned reward:', {
      id: assignedReward.id,
      serviceName: assignedReward.serviceName,
      status: assignedReward.status,
      assignedToUserId: assignedReward.assignedToUserId,
      assignedAt: assignedReward.assignedAt,
    });

    return assignedReward;
  }

  /**
   * Demo: Get available rewards for assignment
   * Requirement 7.4: Support admin reward assignment functionality
   */
  async getAssignableRewardsDemo() {
    console.log('=== Get Assignable Rewards Demo ===');

    // Get all assignable rewards
    const allAssignable = await this.rewardDistributionService.getAssignableRewards();
    console.log(`Total assignable rewards: ${allAssignable.length}`);

    // Get assignable rewards by category
    const streamingRewards = await this.rewardDistributionService.getAssignableRewards(
      RewardCategory.STREAMING_SERVICE,
    );
    console.log(`Assignable streaming service rewards: ${streamingRewards.length}`);

    const giftCardRewards = await this.rewardDistributionService.getAssignableRewards(
      RewardCategory.GIFT_CARD,
    );
    console.log(`Assignable gift card rewards: ${giftCardRewards.length}`);

    return { allAssignable, streamingRewards, giftCardRewards };
  }

  /**
   * Demo: Manage reward account status
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async manageRewardStatusDemo(rewardAccountId: number) {
    console.log('=== Manage Reward Status Demo ===');

    // Get current reward status
    const reward = await this.rewardDistributionService.getRewardAccount(rewardAccountId);
    console.log('Current reward status:', {
      id: reward.id,
      serviceName: reward.serviceName,
      status: reward.status,
    });

    // Deactivate the reward
    const deactivatedReward = await this.rewardDistributionService.deactivateRewardAccount(rewardAccountId);
    console.log('Deactivated reward:', {
      id: deactivatedReward.id,
      status: deactivatedReward.status,
    });

    // Reactivate the reward (only if not assigned)
    if (deactivatedReward.status !== RewardStatus.ASSIGNED) {
      const reactivatedReward = await this.rewardDistributionService.reactivateRewardAccount(rewardAccountId);
      console.log('Reactivated reward:', {
        id: reactivatedReward.id,
        status: reactivatedReward.status,
      });
    }

    return reward;
  }

  /**
   * Demo: Mark expired rewards
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async markExpiredRewardsDemo() {
    console.log('=== Mark Expired Rewards Demo ===');

    const result = await this.rewardDistributionService.markExpiredRewardAccounts();
    console.log('Expired rewards result:', result);

    return result;
  }

  /**
   * Demo: Get reward account with credentials (admin only)
   * Shows how admins can access decrypted credentials for distribution
   */
  async getRewardCredentialsDemo(rewardAccountId: number) {
    console.log('=== Get Reward Credentials Demo (Admin Only) ===');

    const rewardWithCredentials = await this.rewardDistributionService.getRewardAccountWithCredentials(
      rewardAccountId,
    );

    console.log('Reward account with credentials:', {
      id: rewardWithCredentials.id,
      serviceName: rewardWithCredentials.serviceName,
      accountType: rewardWithCredentials.accountType,
      credentials: rewardWithCredentials.decryptedCredentials, // Only for admin use
      status: rewardWithCredentials.status,
    });

    return rewardWithCredentials;
  }

  /**
   * Complete demo workflow
   */
  async runCompleteDemo(adminId: number, submissionId: number) {
    console.log('=== Complete Reward Distribution Demo ===\n');

    try {
      // 1. Create reward accounts
      const { netflixAccount } = await this.createRewardAccountsDemo(adminId);

      // 2. Bulk create more accounts
      await this.bulkCreateRewardAccountsDemo(adminId);

      // 3. Get inventory statistics
      await this.getInventoryStatsDemo();

      // 4. Get assignable rewards
      await this.getAssignableRewardsDemo();

      // 5. Assign a reward to a user
      await this.assignRewardToUserDemo(netflixAccount.id, submissionId, adminId);

      // 6. Get updated statistics after assignment
      await this.getInventoryStatsDemo();

      // 7. Demonstrate status management
      // Note: We can't demonstrate with the assigned Netflix account, so we'll create a new one
      const testReward = await this.rewardDistributionService.createRewardAccount({
        serviceName: 'Test Service',
        accountType: 'Test',
        credentials: 'test:credentials',
        category: RewardCategory.OTHER,
        createdBy: adminId,
      });
      await this.manageRewardStatusDemo(testReward.id);

      // 8. Mark expired rewards
      await this.markExpiredRewardsDemo();

      console.log('\n=== Demo completed successfully! ===');
    } catch (error) {
      console.error('Demo failed:', error.message);
    }
  }
}

/**
 * Usage example:
 * 
 * const rewardDistributionService = new RewardDistributionService(rewardAccountRepository);
 * const demo = new RewardDistributionDemo(rewardDistributionService);
 * 
 * // Run individual demos
 * await demo.createRewardAccountsDemo(adminId);
 * await demo.getInventoryStatsDemo();
 * await demo.assignRewardToUserDemo(rewardId, submissionId, adminId);
 * 
 * // Or run the complete demo
 * await demo.runCompleteDemo(adminId, submissionId);
 */