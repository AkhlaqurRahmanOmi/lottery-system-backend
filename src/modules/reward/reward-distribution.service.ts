import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardAccountRepository } from './reward-account.repository';
import { RewardCategory, RewardStatus } from '@prisma/client';
import { 
  CreateRewardAccountDto, 
  UpdateRewardAccountDto, 
  AssignRewardDto,
  RewardInventoryStatsDto,
  RewardAccountQueryDto
} from './dto';

// Local interfaces for service-specific types
interface RewardDistributionFilters {
  search?: string;
  category?: RewardCategory;
  status?: RewardStatus;
  assignedToUserId?: number;
  createdBy?: number;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class RewardDistributionService {
  constructor(private readonly rewardAccountRepository: RewardAccountRepository) {}

  /**
   * Create a new reward account
   * Requirement 7.1: Allow admins to add reward account details
   */
  async createRewardAccount(createDto: CreateRewardAccountDto) {
    try {
      const rewardAccount = await this.rewardAccountRepository.create({
        serviceName: createDto.serviceName,
        accountType: createDto.accountType,
        credentials: createDto.credentials,
        subscriptionDuration: createDto.subscriptionDuration,
        description: createDto.description,
        category: createDto.category,
        createdBy: createDto.createdBy,
      });

      return rewardAccount;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('A reward account with these details already exists');
      }
      throw error;
    }
  }

  /**
   * Update an existing reward account
   * Requirement 7.1: Allow admins to manage reward account details
   */
  async updateRewardAccount(id: number, updateDto: UpdateRewardAccountDto) {
    try {
      const rewardAccount = await this.rewardAccountRepository.update(id, updateDto);
      return rewardAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Get reward account by ID
   */
  async getRewardAccount(id: number) {
    const rewardAccount = await this.rewardAccountRepository.findById(id);
    if (!rewardAccount) {
      throw new NotFoundException(`Reward account with ID ${id} not found`);
    }
    return rewardAccount;
  }

  /**
   * Get reward account with decrypted credentials (admin only)
   */
  async getRewardAccountWithCredentials(id: number) {
    const rewardAccount = await this.rewardAccountRepository.findByIdWithCredentials(id);
    if (!rewardAccount) {
      throw new NotFoundException(`Reward account with ID ${id} not found`);
    }
    return rewardAccount;
  }

  /**
   * Get all reward accounts with filtering, sorting, and pagination
   * Requirement 7.2: Track available and distributed reward accounts
   */
  async getRewardAccounts(
    filters: RewardDistributionFilters = {},
    pagination: PaginationOptions = {},
    sorting: SortOptions = {},
  ) {
    return this.rewardAccountRepository.findWithFilters(filters, pagination, sorting);
  }

  /**
   * Get available reward accounts by category
   * Requirement 7.2: Track available reward accounts
   */
  async getAvailableRewardAccounts(category?: RewardCategory) {
    return this.rewardAccountRepository.findAvailableByCategory(category);
  }

  /**
   * Assign reward account to a user submission
   * Requirement 7.4: Allow admins to assign specific reward accounts to specific users
   * Requirement 7.5: Record which reward account was given to which user and when
   */
  async assignRewardToUser(assignDto: AssignRewardDto) {
    try {
      // Validate that the reward account exists and is available
      const rewardAccount = await this.rewardAccountRepository.findById(assignDto.rewardAccountId);
      if (!rewardAccount) {
        throw new NotFoundException(`Reward account with ID ${assignDto.rewardAccountId} not found`);
      }

      if (rewardAccount.status !== RewardStatus.AVAILABLE) {
        throw new ConflictException(
          `Reward account ${assignDto.rewardAccountId} is not available for assignment. Current status: ${rewardAccount.status}`,
        );
      }

      // Assign the reward to the user
      const assignedReward = await this.rewardAccountRepository.assignToUser(
        assignDto.rewardAccountId,
        assignDto.submissionId,
        assignDto.assignedBy,
      );

      return assignedReward;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to assign reward: ${error.message}`);
    }
  }

  /**
   * Unassign reward account from user (make it available again)
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async unassignRewardFromUser(rewardAccountId: number) {
    try {
      const unassignedReward = await this.rewardAccountRepository.unassignFromUser(rewardAccountId);
      return unassignedReward;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to unassign reward: ${error.message}`);
    }
  }

  /**
   * Get reward accounts assigned to a specific user
   * Requirement 7.5: Track distribution records
   */
  async getUserAssignedRewards(userId: number) {
    return this.rewardAccountRepository.findAssignedToUser(userId);
  }

  /**
   * Get reward inventory statistics
   * Requirement 7.2: Track available and distributed reward accounts
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async getRewardInventoryStats(): Promise<RewardInventoryStatsDto> {
    const stats = await this.rewardAccountRepository.getStatistics();
    
    return {
      total: stats.total,
      available: stats.available,
      assigned: stats.assigned,
      expired: stats.expired,
      deactivated: stats.deactivated,
      byCategory: JSON.stringify(stats.byCategory), // Convert to JSON string as per DTO
    };
  }

  /**
   * Get reward accounts created by a specific admin
   */
  async getRewardAccountsByCreator(createdBy: number) {
    return this.rewardAccountRepository.findByCreator(createdBy);
  }

  /**
   * Deactivate a reward account
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async deactivateRewardAccount(id: number) {
    try {
      const rewardAccount = await this.rewardAccountRepository.update(id, {
        status: RewardStatus.DEACTIVATED,
      });
      return rewardAccount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Reactivate a reward account (make it available)
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async reactivateRewardAccount(id: number) {
    try {
      const rewardAccount = await this.rewardAccountRepository.findById(id);
      if (!rewardAccount) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }

      // Only allow reactivation if not currently assigned
      if (rewardAccount.status === RewardStatus.ASSIGNED) {
        throw new ConflictException('Cannot reactivate a reward account that is currently assigned to a user');
      }

      const updatedReward = await this.rewardAccountRepository.update(id, {
        status: RewardStatus.AVAILABLE,
        assignedToUserId: null,
      });

      return updatedReward;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Mark expired reward accounts
   * Requirement 7.7: Track reward accounts as available, assigned, or expired
   */
  async markExpiredRewardAccounts() {
    const expiredCount = await this.rewardAccountRepository.markExpiredAccounts();
    return {
      message: `Marked ${expiredCount} reward accounts as expired`,
      expiredCount,
    };
  }

  /**
   * Delete a reward account
   * Only allowed if not assigned to any user
   */
  async deleteRewardAccount(id: number) {
    try {
      const canDelete = await this.rewardAccountRepository.canDelete(id);
      if (!canDelete) {
        throw new BadRequestException(
          'Cannot delete reward account that is currently assigned to a user or does not exist',
        );
      }

      await this.rewardAccountRepository.delete(id);
      return { message: `Reward account ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Reward account with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Get reward distribution analytics
   * Requirement 7.5: Track distribution records
   */
  async getRewardDistributionAnalytics() {
    const stats = await this.getRewardInventoryStats();
    
    return {
      inventory: stats,
      distributionRate: stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0,
      availabilityRate: stats.total > 0 ? (stats.available / stats.total) * 100 : 0,
      categoryDistribution: stats.byCategory,
    };
  }

  /**
   * Bulk create reward accounts
   * Requirement 7.1: Allow admins to add multiple reward accounts efficiently
   */
  async bulkCreateRewardAccounts(accounts: CreateRewardAccountDto[]) {
    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < accounts.length; i++) {
      try {
        const rewardAccount = await this.createRewardAccount(accounts[i]);
        results.push(rewardAccount);
      } catch (error) {
        errors.push({
          index: i,
          account: accounts[i],
          error: error.message,
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      summary: {
        total: accounts.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  }

  /**
   * Get reward accounts suitable for assignment (available accounts)
   * Requirement 7.4: Support admin reward assignment functionality
   */
  async getAssignableRewards(category?: RewardCategory) {
    const availableRewards = await this.getAvailableRewardAccounts(category);
    
    return availableRewards.map(reward => ({
      id: reward.id,
      serviceName: reward.serviceName,
      accountType: reward.accountType,
      category: reward.category,
      subscriptionDuration: reward.subscriptionDuration,
      description: reward.description,
      createdAt: reward.createdAt,
    }));
  }

  /**
   * Validate reward account assignment eligibility
   * Requirement 7.4: Ensure proper reward assignment validation
   */
  async validateRewardAssignment(rewardAccountId: number, submissionId: number) {
    // Check if reward account exists and is available
    const rewardAccount = await this.rewardAccountRepository.findById(rewardAccountId);
    if (!rewardAccount) {
      return {
        isValid: false,
        error: `Reward account with ID ${rewardAccountId} not found`,
      };
    }

    if (rewardAccount.status !== RewardStatus.AVAILABLE) {
      return {
        isValid: false,
        error: `Reward account is not available for assignment. Current status: ${rewardAccount.status}`,
      };
    }

    // Additional validation could be added here (e.g., check if user already has a reward)
    
    return {
      isValid: true,
      rewardAccount,
    };
  }
}