import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';

/**
 * Service for optimizing database queries and monitoring query performance
 */
@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private readonly queryStats = new Map<string, QueryStats>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a query with performance monitoring
   */
  async executeWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    try {
      const result = await queryFn();
      
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
      
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

      // Update query statistics
      this.updateQueryStats(queryName, duration, true, memoryDelta);

      // Log query performance
      this.logQueryPerformance(queryName, duration, memoryDelta, metadata, true);

      // Log warning for slow queries
      if (duration > 500) { // More than 500ms
        this.logger.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`, {
          queryName,
          duration,
          metadata,
        });
      }

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      // Update query statistics for failed queries
      this.updateQueryStats(queryName, duration, false);

      // Log query error
      this.logQueryPerformance(queryName, duration, 0, metadata, false, error.message);

      throw error;
    }
  }

  /**
   * Get optimized query options for product filtering
   */
  getOptimizedProductQuery(filters: ProductQueryFilters): OptimizedQuery {
    const where: any = {};
    const orderBy: any = {};
    let useIndex = '';

    // Build where clause with index hints
    if (filters.category) {
      where.category = filters.category;
      useIndex = 'idx_product_category';
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
      
      // Use composite index if both category and price are filtered
      if (filters.category) {
        useIndex = 'idx_product_category_price';
      } else {
        useIndex = 'idx_product_price';
      }
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
      useIndex = 'idx_product_name';
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
      // Full-text search doesn't use specific index
      useIndex = '';
    }

    // Build order by clause
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc';
      
      // Suggest index based on sort field
      if (filters.sortBy === 'createdAt') {
        useIndex = useIndex || 'idx_product_created_at';
      } else if (filters.sortBy === 'updatedAt') {
        useIndex = useIndex || 'idx_product_updated_at';
      } else if (filters.sortBy === 'price') {
        useIndex = useIndex || 'idx_product_price';
      } else if (filters.sortBy === 'name') {
        useIndex = useIndex || 'idx_product_name';
      }
    } else {
      // Default sort by id for consistent pagination
      orderBy.id = 'asc';
    }

    return {
      where,
      orderBy,
      suggestedIndex: useIndex,
      estimatedComplexity: this.calculateQueryComplexity(where, orderBy),
    };
  }

  /**
   * Calculate estimated query complexity
   */
  private calculateQueryComplexity(where: any, orderBy: any): QueryComplexity {
    let complexity = 'low';
    let factors: string[] = [];

    // Check for complex where conditions
    if (where.OR) {
      complexity = 'high';
      factors.push('OR conditions');
    }

    if (where.price && (where.price.gte || where.price.lte)) {
      if (complexity === 'low') complexity = 'medium';
      factors.push('range query');
    }

    if (where.name?.contains || where.description?.contains) {
      if (complexity === 'low') complexity = 'medium';
      factors.push('text search');
    }

    // Check for sorting complexity
    if (Object.keys(orderBy).length > 1) {
      if (complexity === 'low') complexity = 'medium';
      factors.push('multiple sort fields');
    }

    return {
      level: complexity as 'low' | 'medium' | 'high',
      factors,
    };
  }

  /**
   * Update query statistics
   */
  private updateQueryStats(
    queryName: string,
    duration: number,
    success: boolean,
    memoryDelta: number = 0,
  ): void {
    if (!this.queryStats.has(queryName)) {
      this.queryStats.set(queryName, {
        queryName,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        totalMemoryDelta: 0,
        lastExecuted: new Date(),
      });
    }

    const stats = this.queryStats.get(queryName)!;
    stats.totalExecutions++;
    stats.totalDuration += duration;
    stats.totalMemoryDelta += memoryDelta;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.avgDuration = stats.totalDuration / stats.totalExecutions;
    stats.lastExecuted = new Date();

    if (success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }
  }

  /**
   * Log query performance
   */
  private logQueryPerformance(
    queryName: string,
    duration: number,
    memoryDelta: number,
    metadata?: Record<string, any>,
    success: boolean = true,
    error?: string,
  ): void {
    const logData = {
      queryName,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      success,
      metadata,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      (logData as any).error = error;
    }

    if (success) {
      this.logger.log(`Query executed: ${queryName}`, logData);
    } else {
      this.logger.error(`Query failed: ${queryName}`, logData);
    }
  }

  /**
   * Get query statistics
   */
  getQueryStats(queryName?: string): QueryStats[] {
    if (queryName) {
      const stats = this.queryStats.get(queryName);
      return stats ? [stats] : [];
    }

    return Array.from(this.queryStats.values())
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Clear query statistics
   */
  clearQueryStats(queryName?: string): void {
    if (queryName) {
      this.queryStats.delete(queryName);
    } else {
      this.queryStats.clear();
    }
  }

  /**
   * Get query optimization recommendations
   */
  getOptimizationRecommendations(): QueryOptimizationRecommendation[] {
    const recommendations: QueryOptimizationRecommendation[] = [];
    
    for (const stats of this.queryStats.values()) {
      if (stats.avgDuration > 1000) {
        recommendations.push({
          queryName: stats.queryName,
          issue: 'Slow average execution time',
          recommendation: 'Consider adding database indexes or optimizing query structure',
          priority: 'high',
          avgDuration: stats.avgDuration,
        });
      } else if (stats.avgDuration > 500) {
        recommendations.push({
          queryName: stats.queryName,
          issue: 'Moderate execution time',
          recommendation: 'Monitor query performance and consider optimization',
          priority: 'medium',
          avgDuration: stats.avgDuration,
        });
      }

      if (stats.failedExecutions > 0) {
        const failureRate = (stats.failedExecutions / stats.totalExecutions) * 100;
        if (failureRate > 5) {
          recommendations.push({
            queryName: stats.queryName,
            issue: `High failure rate: ${failureRate.toFixed(1)}%`,
            recommendation: 'Investigate query failures and add proper error handling',
            priority: 'high',
            failureRate,
          });
        }
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

/**
 * Product query filters interface
 */
export interface ProductQueryFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  name?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Optimized query interface
 */
export interface OptimizedQuery {
  where: any;
  orderBy: any;
  suggestedIndex: string;
  estimatedComplexity: QueryComplexity;
}

/**
 * Query complexity interface
 */
export interface QueryComplexity {
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

/**
 * Query statistics interface
 */
export interface QueryStats {
  queryName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  totalMemoryDelta: number;
  lastExecuted: Date;
}

/**
 * Query optimization recommendation interface
 */
export interface QueryOptimizationRecommendation {
  queryName: string;
  issue: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  avgDuration?: number;
  failureRate?: number;
}