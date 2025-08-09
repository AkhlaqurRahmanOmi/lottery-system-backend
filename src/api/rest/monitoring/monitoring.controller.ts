import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PerformanceMonitorService } from '../../../shared/services/performance-monitor.service';
import { QueryOptimizerService } from '../../../shared/services/query-optimizer.service';

/**
 * Controller for performance monitoring and metrics endpoints
 * These endpoints are typically used by administrators and monitoring systems
 */
@ApiTags('Monitoring')
@Controller('api/v1/monitoring')
export class MonitoringController {
    constructor(
        private readonly performanceMonitor: PerformanceMonitorService,
        private readonly queryOptimizer: QueryOptimizerService,
    ) { }

    /**
     * Get performance statistics for all operations
     */
    @Get('performance/stats')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get performance statistics',
        description: 'Retrieves performance statistics for all monitored operations',
    })
    @ApiResponse({
        status: 200,
        description: 'Performance statistics retrieved successfully',
        schema: {
            example: [
                {
                    operation: 'HTTP_GET_/api/v1/products',
                    count: 150,
                    duration: {
                        min: 45.2,
                        max: 1250.8,
                        avg: 156.7,
                        p95: 320.5,
                        p99: 890.2
                    },
                    memory: {
                        min: -1024000,
                        max: 5242880,
                        avg: 1048576
                    },
                    lastUpdated: '2025-01-29T10:30:00Z'
                }
            ]
        }
    })
    async getPerformanceStats() {
        return {
            success: true,
            statusCode: 200,
            message: 'Performance statistics retrieved successfully',
            data: this.performanceMonitor.getAllStats(),
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }

    /**
     * Get performance statistics for a specific operation
     */
    @Get('performance/stats/:operation')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get performance statistics for specific operation',
        description: 'Retrieves performance statistics for a specific operation',
    })
    @ApiResponse({
        status: 200,
        description: 'Operation statistics retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Operation not found',
    })
    async getOperationStats(@Query('operation') operation: string) {
        const stats = this.performanceMonitor.getOperationStats(operation);

        if (!stats) {
            return {
                success: false,
                statusCode: 404,
                error: {
                    code: 'OPERATION_NOT_FOUND',
                    message: `No statistics found for operation: ${operation}`,
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                },
            };
        }

        return {
            success: true,
            statusCode: 200,
            message: 'Operation statistics retrieved successfully',
            data: stats,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }

    /**
     * Get database query statistics
     */
    @Get('database/query-stats')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get database query statistics',
        description: 'Retrieves performance statistics for database queries',
    })
    @ApiQuery({
        name: 'queryName',
        required: false,
        description: 'Filter by specific query name',
    })
    @ApiResponse({
        status: 200,
        description: 'Query statistics retrieved successfully',
        schema: {
            example: [
                {
                    queryName: 'product_find_with_filters',
                    totalExecutions: 245,
                    successfulExecutions: 243,
                    failedExecutions: 2,
                    totalDuration: 38450.5,
                    minDuration: 12.3,
                    maxDuration: 890.7,
                    avgDuration: 156.9,
                    totalMemoryDelta: 125829120,
                    lastExecuted: '2025-01-29T10:30:00Z'
                }
            ]
        }
    })
    async getQueryStats(@Query('queryName') queryName?: string) {
        const stats = this.queryOptimizer.getQueryStats(queryName);

        return {
            success: true,
            statusCode: 200,
            message: 'Query statistics retrieved successfully',
            data: stats,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                totalQueries: stats.length,
            },
        };
    }

    /**
     * Get query optimization recommendations
     */
    @Get('database/optimization-recommendations')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get query optimization recommendations',
        description: 'Retrieves recommendations for optimizing slow or problematic queries',
    })
    @ApiResponse({
        status: 200,
        description: 'Optimization recommendations retrieved successfully',
        schema: {
            example: [
                {
                    queryName: 'product_find_with_filters',
                    issue: 'Slow average execution time',
                    recommendation: 'Consider adding database indexes or optimizing query structure',
                    priority: 'high',
                    avgDuration: 1250.5
                }
            ]
        }
    })
    async getOptimizationRecommendations() {
        const recommendations = this.queryOptimizer.getOptimizationRecommendations();

        return {
            success: true,
            statusCode: 200,
            message: 'Optimization recommendations retrieved successfully',
            data: recommendations,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                totalRecommendations: recommendations.length,
                highPriority: recommendations.filter(r => r.priority === 'high').length,
                mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
                lowPriority: recommendations.filter(r => r.priority === 'low').length,
            },
        };
    }

    /**
     * Get system resource usage
     */
    @Get('system/resources')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get system resource usage',
        description: 'Retrieves current system resource usage including memory and CPU',
    })
    @ApiResponse({
        status: 200,
        description: 'System resources retrieved successfully',
        schema: {
            example: {
                memory: {
                    rss: '45.2MB',
                    heapUsed: '32.1MB',
                    heapTotal: '38.5MB',
                    external: '2.1MB'
                },
                cpu: {
                    user: '1250.5ms',
                    system: '890.2ms'
                },
                uptime: '125.5 minutes',
                nodeVersion: 'v18.17.0',
                platform: 'linux'
            }
        }
    })
    async getSystemResources() {
        const memory = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        const systemInfo = {
            memory: {
                rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
                heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
                external: `${(memory.external / 1024 / 1024).toFixed(2)}MB`,
            },
            cpu: {
                user: `${(cpuUsage.user / 1000).toFixed(2)}ms`,
                system: `${(cpuUsage.system / 1000).toFixed(2)}ms`,
            },
            uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid,
        };

        // Log system resources for monitoring
        this.performanceMonitor.logSystemResources();

        return {
            success: true,
            statusCode: 200,
            message: 'System resources retrieved successfully',
            data: systemInfo,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }

    /**
     * Clear performance metrics
     */
    @Get('performance/clear')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Clear performance metrics',
        description: 'Clears all or specific performance metrics (use with caution)',
    })
    @ApiQuery({
        name: 'operation',
        required: false,
        description: 'Clear metrics for specific operation only',
    })
    @ApiResponse({
        status: 200,
        description: 'Metrics cleared successfully',
    })
    async clearMetrics(@Query('operation') operation?: string) {
        this.performanceMonitor.clearMetrics(operation);

        if (operation) {
            this.queryOptimizer.clearQueryStats(operation);
        } else {
            this.queryOptimizer.clearQueryStats();
        }

        return {
            success: true,
            statusCode: 200,
            message: operation
                ? `Metrics cleared for operation: ${operation}`
                : 'All metrics cleared successfully',
            data: null,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }

    /**
     * Health check endpoint with performance metrics
     */
    @Get('health')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Health check with performance metrics',
        description: 'Returns application health status with basic performance metrics',
    })
    @ApiResponse({
        status: 200,
        description: 'Application is healthy',
    })
    async healthCheck() {
        const memory = process.memoryUsage();
        const uptime = process.uptime();
        const stats = this.performanceMonitor.getAllStats();

        // Calculate average response time across all operations
        const avgResponseTime = stats.length > 0
            ? stats.reduce((sum, stat) => sum + stat.duration.avg, 0) / stats.length
            : 0;

        // Check for any high-priority optimization recommendations
        const recommendations = this.queryOptimizer.getOptimizationRecommendations();
        const highPriorityIssues = recommendations.filter(r => r.priority === 'high').length;

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: `${(uptime / 60).toFixed(2)} minutes`,
            memory: {
                used: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                total: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
                usage: `${((memory.heapUsed / memory.heapTotal) * 100).toFixed(1)}%`,
            },
            performance: {
                avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
                totalOperations: stats.length,
                highPriorityIssues,
            },
            database: {
                connected: true, // This could be enhanced with actual DB health check
            },
        };

        return {
            success: true,
            statusCode: 200,
            message: 'Application is healthy',
            data: healthStatus,
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        };
    }
}