import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { RewardQueryDto, PaginatedRewardResponseDto, RewardResponseDto } from './dto';

export interface RewardSearchFilters {
  search?: string;
  isActive?: boolean;
}

export interface RewardSortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RewardPaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class RewardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find reward by ID
   */
  async findById(id: number): Promise<any | null> {
    return this.prisma.reward.findUnique({
      where: { id },
    });
  }

  /**
   * Find reward by name
   */
  async findByName(name: string): Promise<any | null> {
    return this.prisma.reward.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      },
    });
  }

  /**
   * Check if reward exists by name (for uniqueness validation)
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.RewardWhereInput = {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await this.prisma.reward.count({ where });
    return count > 0;
  }

  /**
   * Create new reward with uniqueness validation
   */
  async create(data: any): Promise<any> {
    try {
      // Check for existing name
      const exists = await this.existsByName(data.name);
      if (exists) {
        throw new ConflictException('Reward with this name already exists');
      }

      // Create a copy of data to avoid modifying the original
      const createData = { ...data };

      // If no displayOrder is provided, set it to the next available order
      if (createData.displayOrder === undefined || createData.displayOrder === null) {
        const maxOrder = await this.prisma.reward.aggregate({
          _max: {
            displayOrder: true
          }
        });
        createData.displayOrder = (maxOrder._max.displayOrder || 0) + 1;
      }

      return await this.prisma.reward.create({
        data: createData,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Update reward with uniqueness validation
   */
  async update(id: number, data: any): Promise<any> {
    try {
      // Check if reward exists
      const existingReward = await this.findById(id);
      if (!existingReward) {
        throw new NotFoundException(`Reward with ID ${id} not found`);
      }

      // Check for name conflicts if name is being updated
      if (data.name) {
        const conflicts = await this.existsByName(data.name as string, id);
        if (conflicts) {
          throw new ConflictException('Reward with this name already exists');
        }
      }

      return await this.prisma.reward.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2025') {
        // Prisma record not found
        throw new NotFoundException(`Reward with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Soft delete reward (deactivate)
   */
  async softDelete(id: number): Promise<any> {
    return this.update(id, { isActive: false });
  }

  /**
   * Hard delete reward
   */
  async delete(id: number): Promise<any> {
    try {
      return await this.prisma.reward.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Reward with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find many rewards with basic parameters
   */
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<any[]> {
    const { skip, take, where, orderBy } = params || {};

    return this.prisma.reward.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  /**
   * Count rewards with optional filters
   */
  async count(where?: any): Promise<number> {
    return this.prisma.reward.count({ where });
  }

  /**
   * Find rewards with advanced filtering, sorting, and pagination
   */
  async findWithFilters(queryDto: RewardQueryDto): Promise<PaginatedRewardResponseDto> {
    const { page = 1, limit = 10, search, isActive, sortBy = 'displayOrder', sortOrder = 'asc' } = queryDto;
    
    // Build where clause
    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add active status filter
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy && ['id', 'name', 'displayOrder', 'createdAt', 'updatedAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.displayOrder = 'asc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [rewards, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.reward.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: rewards.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        isActive: reward.isActive,
        displayOrder: reward.displayOrder,
        createdAt: reward.createdAt,
        updatedAt: reward.updatedAt,
      })) as RewardResponseDto[],
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Search rewards by name or description
   */
  async search(query: string, limit: number = 10): Promise<any[]> {
    return this.prisma.reward.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * Get active rewards count
   */
  async getActiveCount(): Promise<number> {
    return this.count({ isActive: true });
  }

  /**
   * Get all active rewards ordered by display order
   */
  async findActiveRewards(): Promise<any[]> {
    return this.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * Get rewards ordered by display order (for admin management)
   */
  async findAllOrdered(): Promise<any[]> {
    return this.findMany({
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * Update display orders for multiple rewards
   */
  async updateDisplayOrders(updates: { id: number; displayOrder: number }[]): Promise<void> {
    const updateOperations = updates.map(update =>
      this.prisma.reward.update({
        where: { id: update.id },
        data: { 
          displayOrder: update.displayOrder,
          updatedAt: new Date()
        }
      })
    );
    
    await this.prisma.$transaction(updateOperations);
  }

  /**
   * Check if reward can be deleted (business logic)
   */
  async canDelete(id: number): Promise<boolean> {
    // Check if reward has been selected by any users
    const submissionCount = await this.prisma.submission.count({
      where: { selectedRewardId: id }
    });

    // Don't allow deletion if reward has been selected (for data integrity)
    return submissionCount === 0;
  }

  /**
   * Get reward selection statistics
   */
  async getSelectionStats(id: number): Promise<{ totalSelections: number; recentSelections: number }> {
    const [totalSelections, recentSelections] = await Promise.all([
      this.prisma.submission.count({
        where: { selectedRewardId: id }
      }),
      this.prisma.submission.count({
        where: {
          selectedRewardId: id,
          submittedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    return { totalSelections, recentSelections };
  }

  /**
   * Get next available display order
   */
  async getNextDisplayOrder(): Promise<number> {
    const maxOrder = await this.prisma.reward.aggregate({
      _max: {
        displayOrder: true
      }
    });
    return (maxOrder._max.displayOrder || 0) + 1;
  }
}