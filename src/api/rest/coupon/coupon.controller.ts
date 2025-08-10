import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBody,

  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CouponService } from '../../../modules/coupon/coupon.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';
// Note: AdminRole will be imported from Prisma client after generation

// Import REST-specific DTOs
import {
  GenerateCouponsRestDto,
  CouponQueryRestDto,
  CouponValidationRestDto,
  CouponExportRestDto,
} from './dto';

// Import base response DTOs
import {
  CouponResponseDto,
  CouponWithCreatorResponseDto,
  PaginatedCouponResponseDto,
  CouponValidationResultDto,
  BatchStatisticsDto,
} from '../../../modules/coupon/dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    email: string;
    role: string; // Will be AdminRole after Prisma generation
  };
  traceId: string;
}

@ApiTags('Coupon Management')
@Controller('api/coupons')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly responseBuilder: ResponseBuilderService,
  ) { }

  // ==================== ADMIN ENDPOINTS ====================

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate coupon codes',
    description: 'Generate single or multiple unique coupon codes. Admin authentication required.',
  })
  @ApiBody({
    type: GenerateCouponsRestDto,
    description: 'Coupon generation parameters',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Coupons generated successfully',
    type: [CouponResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid generation parameters',
  })
  async generateCoupons(
    @Body() generateDto: GenerateCouponsRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<CouponResponseDto[]>> {
    try {
      // Set the createdBy field from authenticated user
      const generationData = {
        ...generateDto,
        createdBy: req.user.id,
      };

      const coupons = await this.couponService.generateCoupons(generationData);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons`,
        action: 'generate',
      });

      return this.responseBuilder.buildSuccessResponse(
        coupons,
        `Successfully generated ${coupons.length} coupon(s)`,
        HttpStatus.CREATED,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'COUPON_GENERATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/generate`,
          error.message,
          'Please check your generation parameters and try again',
        ),
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all coupons',
    description: 'Retrieve a paginated list of coupons with filtering and sorting options. Admin authentication required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for coupon code',
    example: 'ABC123',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'REDEEMED', 'EXPIRED', 'DEACTIVATED'],
    description: 'Filter by coupon status',
    example: 'ACTIVE',
  })
  @ApiQuery({
    name: 'batchId',
    required: false,
    type: String,
    description: 'Filter by batch ID',
    example: 'batch_123',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: Number,
    description: 'Filter by creator admin ID',
    example: 1,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupons retrieved successfully',
    type: PaginatedCouponResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async findAll(
    @Query() queryDto: CouponQueryRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<PaginatedCouponResponseDto>> {
    try {
      const result = await this.couponService.findMany(queryDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons`,
        currentPage: result.page,
        totalPages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
        queryParams: queryDto,
        action: 'list',
      });

      const paginationMeta = {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPreviousPage,
      };

      return this.responseBuilder.buildSuccessResponse(
        result,
        'Coupons retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
        paginationMeta,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'COUPON_QUERY_ERROR',
          'Failed to retrieve coupons',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons`,
          error.message,
        ),
      );
    }
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get coupon statistics',
    description: 'Retrieve statistics about coupon usage and performance. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 1000 },
        active: { type: 'number', example: 750 },
        redeemed: { type: 'number', example: 200 },
        expired: { type: 'number', example: 30 },
        deactivated: { type: 'number', example: 20 },
        redemptionRate: { type: 'number', example: 0.2 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getStatistics(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      const statistics = await this.couponService.getStatistics();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/statistics`,
        action: 'statistics',
      });

      return this.responseBuilder.buildSuccessResponse(
        statistics,
        'Statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'STATISTICS_ERROR',
          'Failed to retrieve statistics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/statistics`,
          error.message,
        ),
      );
    }
  }

  @Get('batches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get batch statistics',
    description: 'Retrieve statistics for all coupon batches. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch statistics retrieved successfully',
    type: [BatchStatisticsDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getAllBatchStatistics(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<BatchStatisticsDto[]>> {
    try {
      const batchStats = await this.couponService.getAllBatchStatistics();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/batches`,
        action: 'batch-statistics',
      });

      return this.responseBuilder.buildSuccessResponse(
        batchStats,
        'Batch statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'BATCH_STATISTICS_ERROR',
          'Failed to retrieve batch statistics',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/batches`,
          error.message,
        ),
      );
    }
  }

  @Get('batches/:batchId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get batch statistics by ID',
    description: 'Retrieve statistics for a specific coupon batch. Admin authentication required.',
  })
  @ApiParam({
    name: 'batchId',
    type: 'string',
    description: 'Batch ID',
    example: 'batch_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch statistics retrieved successfully',
    type: BatchStatisticsDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Batch not found',
  })
  async getBatchStatistics(
    @Param('batchId') batchId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<BatchStatisticsDto>> {
    try {
      const batchStats = await this.couponService.getBatchStatistics(batchId);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/batches`,
        resourceId: batchId,
        action: 'get-batch',
      });

      return this.responseBuilder.buildSuccessResponse(
        batchStats,
        'Batch statistics retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'BATCH_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/coupons/batches/${batchId}`,
          ),
        );
      }
      throw error;
    }
  }

  @Put('batches/:batchId/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate batch',
    description: 'Deactivate all coupons in a specific batch. Admin authentication required.',
  })
  @ApiParam({
    name: 'batchId',
    type: 'string',
    description: 'Batch ID',
    example: 'batch_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        deactivatedCount: { type: 'number', example: 50 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Batch not found',
  })
  async deactivateBatch(
    @Param('batchId') batchId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ deactivatedCount: number }>> {
    try {
      const result = await this.couponService.deactivateBatch(batchId);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/batches`,
        resourceId: batchId,
        action: 'deactivate-batch',
      });

      return this.responseBuilder.buildSuccessResponse(
        result,
        `Successfully deactivated ${result.deactivatedCount} coupons in batch ${batchId}`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'BATCH_DEACTIVATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/batches/${batchId}/deactivate`,
          error.message,
        ),
      );
    }
  }

  @Post('expire')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Expire expired coupons',
    description: 'Manually expire all coupons that have passed their expiration date. Admin authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired coupons processed successfully',
    schema: {
      type: 'object',
      properties: {
        expiredCount: { type: 'number', example: 25 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async expireExpiredCoupons(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<{ expiredCount: number }>> {
    try {
      const result = await this.couponService.expireExpiredCoupons();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/expire`,
        action: 'expire',
      });

      return this.responseBuilder.buildSuccessResponse(
        result,
        `Successfully expired ${result.expiredCount} coupons`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'EXPIRATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/expire`,
          error.message,
        ),
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get coupon by ID',
    description: 'Retrieve a specific coupon by ID with creator and submission details. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Coupon ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon retrieved successfully',
    type: CouponWithCreatorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Coupon not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<CouponWithCreatorResponseDto>> {
    try {
      const coupon = await this.couponService.findById(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons`,
        resourceId: id,
        action: 'get',
      });

      return this.responseBuilder.buildSuccessResponse(
        coupon,
        'Coupon retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'COUPON_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/coupons/${id}`,
          ),
        );
      }
      throw error;
    }
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate coupon',
    description: 'Deactivate a specific coupon. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Coupon ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon deactivated successfully',
    type: CouponResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Coupon not found',
  })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<CouponResponseDto>> {
    try {
      const coupon = await this.couponService.deactivate(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons`,
        resourceId: id,
        action: 'deactivate',
      });

      return this.responseBuilder.buildSuccessResponse(
        coupon,
        'Coupon deactivated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'COUPON_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/coupons/${id}/deactivate`,
          ),
        );
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete coupon',
    description: 'Permanently delete a coupon. Only unredeemed coupons can be deleted. Admin authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Coupon ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Coupon deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Coupon not found',
  })
  @ApiBadRequestResponse({
    description: 'Cannot delete redeemed coupon',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      await this.couponService.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'COUPON_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/coupons/${id}`,
          ),
        );
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          this.responseBuilder.buildErrorResponse(
            'COUPON_DELETE_ERROR',
            error.message,
            HttpStatus.BAD_REQUEST,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/coupons/${id}`,
            undefined,
            'Consider deactivating the coupon instead',
          ),
        );
      }
      throw error;
    }
  }

  // ==================== EXPORT ENDPOINTS ====================

  @Post('export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export coupons',
    description: 'Export coupons to CSV or PDF format with filtering options. Admin authentication required.',
  })
  @ApiBody({
    type: CouponExportRestDto,
    description: 'Export options and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export generated successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Base64 encoded file data' },
        filename: { type: 'string', example: 'coupons_export_2024-01-15.csv' },
        mimeType: { type: 'string', example: 'text/csv' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid export parameters',
  })
  async exportCoupons(
    @Body() exportDto: CouponExportRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      // Map REST DTO to service DTO
      const serviceExportDto: any = {
        format: exportDto.format || 'csv',
        filters: {
          status: exportDto.status,
          batchId: exportDto.batchId,
          dateFrom: exportDto.createdFrom ? new Date(exportDto.createdFrom) : undefined,
          dateTo: exportDto.createdTo ? new Date(exportDto.createdTo) : undefined,
        },
        includeMetadata: exportDto.includeBatchInfo || false,
      };

      const exportResult = await this.couponService.exportCoupons(serviceExportDto);

      // Convert buffer to base64 for JSON response
      const base64Data = exportResult.data.toString('base64');
      const dataUri = `data:${exportResult.mimeType};base64,${base64Data}`;

      const result = {
        data: dataUri,
        filename: exportResult.filename,
        mimeType: exportResult.mimeType,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/export`,
        action: 'export',
      });

      return this.responseBuilder.buildSuccessResponse(
        result,
        'Export generated successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'EXPORT_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/export`,
          error.message,
          'Please check your export parameters and try again',
        ),
      );
    }
  }

  @Post('export/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download coupon export',
    description: 'Export and download coupons as a file. Admin authentication required.',
  })
  @ApiBody({
    type: CouponExportRestDto,
    description: 'Export options and filters',
  })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File download initiated',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid export parameters',
  })
  async downloadExport(
    @Body() exportDto: CouponExportRestDto,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Map REST DTO to service DTO
      const serviceExportDto: any = {
        format: exportDto.format || 'csv',
        filters: {
          status: exportDto.status,
          batchId: exportDto.batchId,
          dateFrom: exportDto.createdFrom ? new Date(exportDto.createdFrom) : undefined,
          dateTo: exportDto.createdTo ? new Date(exportDto.createdTo) : undefined,
        },
        includeMetadata: exportDto.includeBatchInfo || false,
      };

      const exportResult = await this.couponService.exportCoupons(serviceExportDto);

      res.set({
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        'Content-Length': exportResult.data.length.toString(),
      });

      res.send(exportResult.data);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json(
        this.responseBuilder.buildErrorResponse(
          'EXPORT_DOWNLOAD_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/export/download`,
          error.message,
          'Please check your export parameters and try again',
        ),
      );
    }
  }

  // ==================== PUBLIC ENDPOINTS ====================

  @Post('validate')
  @ApiOperation({
    summary: 'Validate coupon code',
    description: 'Validate a coupon code for redemption. Public endpoint - no authentication required.',
  })
  @ApiBody({
    type: CouponValidationRestDto,
    description: 'Coupon code to validate',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon validation result',
    type: CouponValidationResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid coupon code format',
  })
  async validateCoupon(
    @Body() validationDto: CouponValidationRestDto,
    @Request() req: ExpressRequest,
  ): Promise<StandardApiResponse<CouponValidationResultDto>> {
    try {
      const validationResult = await this.couponService.validateCoupon(
        validationDto.couponCode,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/validate`,
        action: 'validate',
      });

      const message = validationResult.isValid
        ? 'Coupon is valid for redemption'
        : 'Coupon validation failed';

      return this.responseBuilder.buildSuccessResponse(
        validationResult,
        message,
        HttpStatus.OK,
        (req as any).traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'VALIDATION_ERROR',
          error.message,
          HttpStatus.BAD_REQUEST,
          (req as any).traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/coupons/validate`,
          error.message,
        ),
      );
    }
  }

  @Get('code/:couponCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get coupon by code',
    description: 'Retrieve a specific coupon by its code with creator and submission details. Admin authentication required.',
  })
  @ApiParam({
    name: 'couponCode',
    type: 'string',
    description: 'Coupon code',
    example: 'ABC123XYZ9',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon retrieved successfully',
    type: CouponWithCreatorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Coupon not found',
  })
  async findByCouponCode(
    @Param('couponCode') couponCode: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<CouponWithCreatorResponseDto>> {
    try {
      const coupon = await this.couponService.findByCouponCode(couponCode);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/coupons/code`,
        resourceId: couponCode,
        action: 'get-by-code',
      });

      return this.responseBuilder.buildSuccessResponse(
        coupon,
        'Coupon retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'COUPON_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/coupons/code/${couponCode}`,
          ),
        );
      }
      throw error;
    }
  }
}