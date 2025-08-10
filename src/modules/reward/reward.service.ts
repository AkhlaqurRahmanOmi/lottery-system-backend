import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardRepository } from './reward.repository';
import { CreateRewardDto, UpdateRewardDto, RewardQueryDto, PaginatedRewardResponseDto, RewardResponseDto } from './dto';

@Injectable()
export class RewardService {
  constructor(private readonly rewardRepository: RewardRepository) {}

  /**
   * Create a new reward
   */
  async create(createRewardDto: CreateRewardDto): Promise<RewardResponseDto> {
    const reward = await this.rewardRepository.create({
      name: createRewardDto.name,
      description: createRewardDto.description,
      imageUrl: createRewardDto.imageUrl,
      isActive: createRewardDto.isActive ?? true,
      displayOrder: createRewardDto.displayOrder,
    });

    return this.mapToResponseDto(reward);
  }

  /**
   * Find all rewards with filtering, sorting, and pagination
   */
  async findAll(queryDto: RewardQueryDto): Promise<PaginatedRewardResponseDto> {
    return this.rewardRepository.findWithFilters(queryDto);
  }

  /**
   * Find reward by ID
   */
  async findOne(id: number): Promise<RewardResponseDto> {
    const reward = await this.rewardRepository.findById(id);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }
    return this.mapToResponseDto(reward);
  }

  /**
   * Update reward
   */
  async update(id: number, updateRewardDto: UpdateRewardDto): Promise<RewardResponseDto> {
    const reward = await this.rewardRepository.update(id, updateRewardDto);
    return this.mapToResponseDto(reward);
  }

  /**
   * Soft delete reward (deactivate)
   */
  async deactivate(id: number): Promise<RewardResponseDto> {
    const reward = await this.rewardRepository.softDelete(id);
    return this.mapToResponseDto(reward);
  }

  /**
   * Hard delete reward
   */
  async remove(id: number): Promise<void> {
    // Check if reward can be deleted
    const canDelete = await this.rewardRepository.canDelete(id);
    if (!canDelete) {
      throw new BadRequestException('Cannot delete reward that has been selected by users');
    }

    await this.rewardRepository.delete(id);
  }

  /**
   * Get all active rewards (for user selection)
   */
  async findActiveRewards(): Promise<RewardResponseDto[]> {
    const rewards = await this.rewardRepository.findActiveRewards();
    return rewards.map(reward => this.mapToResponseDto(reward));
  }

  /**
   * Search rewards
   */
  async search(query: string, limit: number = 10): Promise<RewardResponseDto[]> {
    const rewards = await this.rewardRepository.search(query, limit);
    return rewards.map(reward => this.mapToResponseDto(reward));
  }

  /**
   * Update display orders for multiple rewards
   */
  async updateDisplayOrders(updates: { id: number; displayOrder: number }[]): Promise<void> {
    // Validate that all IDs exist
    for (const update of updates) {
      const exists = await this.rewardRepository.findById(update.id);
      if (!exists) {
        throw new NotFoundException(`Reward with ID ${update.id} not found`);
      }
    }

    // Validate display orders are unique and positive
    const displayOrders = updates.map(u => u.displayOrder);
    const uniqueOrders = new Set(displayOrders);
    if (uniqueOrders.size !== displayOrders.length) {
      throw new BadRequestException('Display orders must be unique');
    }

    if (displayOrders.some(order => order < 0)) {
      throw new BadRequestException('Display orders must be non-negative');
    }

    await this.rewardRepository.updateDisplayOrders(updates);
  }

  /**
   * Get reward statistics
   */
  async getRewardStats(id: number): Promise<{
    reward: RewardResponseDto;
    totalSelections: number;
    recentSelections: number;
  }> {
    const [reward, stats] = await Promise.all([
      this.findOne(id),
      this.rewardRepository.getSelectionStats(id)
    ]);

    return {
      reward,
      ...stats
    };
  }

  /**
   * Get summary statistics for all rewards
   */
  async getSummaryStats(): Promise<{
    totalRewards: number;
    activeRewards: number;
    inactiveRewards: number;
  }> {
    const [total, active] = await Promise.all([
      this.rewardRepository.count(),
      this.rewardRepository.getActiveCount()
    ]);

    return {
      totalRewards: total,
      activeRewards: active,
      inactiveRewards: total - active
    };
  }

  /**
   * Activate reward
   */
  async activate(id: number): Promise<RewardResponseDto> {
    const reward = await this.rewardRepository.update(id, { isActive: true });
    return this.mapToResponseDto(reward);
  }

  /**
   * Get next available display order
   */
  async getNextDisplayOrder(): Promise<number> {
    return this.rewardRepository.getNextDisplayOrder();
  }

  /**
   * Map Prisma reward entity to response DTO
   */
  private mapToResponseDto(reward: any): RewardResponseDto {
    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      imageUrl: reward.imageUrl,
      isActive: reward.isActive,
      displayOrder: reward.displayOrder,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
    };
  }
}