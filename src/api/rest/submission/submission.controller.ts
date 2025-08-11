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
  ConflictException,
  BadRequestException,
  Ip,
  Headers,
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
  ApiConflictResponse,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { SubmissionService } from '../../../modules/submission/submission.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiResponse as StandardApiResponse } from '../../../shared/types/api-response.interface';
import { Request as ExpressRequest } from 'express';
import { AdminRole } from '@prisma/client';

// Import REST DTOs
import {
  CreateSubmissionRestDto,
  ValidateCouponRestDto,
  CouponValidationRestResponseDto,
  SubmissionConfirmationRestDto,
  SubmissionRestResponseDto,
  SubmissionWithRelationsRestResponseDto,
  PaginatedSubmissionRestResponseDto,
  SubmissionQueryRestDto,
  SubmissionStatisticsRestDto,
  AssignRewardToSubmissionRestDto,
  BulkAssignRewardRestDto,
} from './dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    username: string;
    email: string;
    role: AdminRole;
  };
  traceId: string;
}

@ApiTags('Submissions')
@Controller('api/submissions')
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly responseBuilder: ResponseBuilderService,
  ) {}

  // ========================================
  // PUBLIC ENDPOINTS (No Authentication)
  // ========================================

  @Post('validate-coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate coupon code',
    description: 'Validate if a coupon code is valid for redemption. Public endpoint.',
  })
  @ApiBody({
    type: ValidateCouponRestDto,
    description: 'Coupon code to validate',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon validation result',
    type: CouponValidationRestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid coupon code format',
  })
  async validateCoupon(
    @Body() validateCouponDto: ValidateCouponRestDto,
    @Request() req: ExpressRequest,
  ): Promise<StandardApiResponse<CouponValidationRestResponseDto>> {
    try {
      const validation = await this.submissionService.validateCouponCode(
        validateCouponDto.couponCode,
      );

      const responseDto: CouponValidationRestResponseDto = {
        isValid: validation.isValid,
        message: validation.error || (validation.isValid ? 'Coupon is valid' : 'Coupon is invalid'),
        couponCode: validateCouponDto.couponCode,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        action: 'validate-coupon',
      });

      return this.responseBuilder.buildSuccessResponse(
        responseDto,
        validation.isValid ? 'Coupon is valid' : 'Coupon validation completed',
        HttpStatus.OK,
        req['traceId'] || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'COUPON_VALIDATION_ERROR',
          'Failed to validate coupon',
          HttpStatus.BAD_REQUEST,
          req['traceId'] || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/validate-coupon`,
          error.message,
        ),
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit user form',
    description: 'Submit user information with coupon code for lottery participation. Public endpoint.',
  })
  @ApiBody({
    type: CreateSubmissionRestDto,
    description: 'User submission data',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Submission created successfully',
    type: SubmissionConfirmationRestDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid submission data or coupon code',
  })
  @ApiConflictResponse({
    description: 'Coupon already redeemed',
  })
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionRestDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Request() req: ExpressRequest,
  ): Promise<StandardApiResponse<SubmissionConfirmationRestDto>> {
    try {
      const submissionData = {
        couponCode: createSubmissionDto.couponCode,
        name: createSubmissionDto.name,
        email: createSubmissionDto.email,
        phone: createSubmissionDto.phone,
        address: createSubmissionDto.address,
        productExperience: createSubmissionDto.productExperience,
        selectedRewardId: createSubmissionDto.selectedRewardId,
        ipAddress,
        userAgent,
      };

      const submission = await this.submissionService.processUserSubmission(submissionData);

      const confirmationDto: SubmissionConfirmationRestDto = {
        id: submission.id!,
        message: 'Thank you for your submission! Your entry has been recorded successfully.',
        submittedAt: new Date(submission.submittedAt!),
        couponCode: createSubmissionDto.couponCode,
        userName: submission.name!,
        userEmail: submission.email!,
        selectedRewardName: 'Selected Reward', // This will be populated by the service
        nextSteps: 'Thank you for your submission! Our administrators will review your entry and contact you if you are selected to receive a reward.',
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        resourceId: submission.id,
        action: 'create',
      });

      return this.responseBuilder.buildSuccessResponse(
        confirmationDto,
        'Submission created successfully',
        HttpStatus.CREATED,
        req['traceId'] || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSION_ERROR',
          'Failed to process submission',
          HttpStatus.BAD_REQUEST,
          req['traceId'] || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions`,
          error.message,
        ),
      );
    }
  }

  // ========================================
  // ADMIN ENDPOINTS (Authentication Required)
  // ========================================

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all submissions',
    description: 'Get paginated list of all user submissions with filtering and sorting options. Admin only.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'hasReward',
    required: false,
    type: Boolean,
    description: 'Filter by reward assignment status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (submittedAt, name, email)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submissions retrieved successfully',
    type: PaginatedSubmissionRestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getSubmissions(
    @Query() queryDto: SubmissionQueryRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<PaginatedSubmissionRestResponseDto>> {
    try {
      const submissions = await this.submissionService.getSubmissions(queryDto);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        action: 'list',
      });

      return this.responseBuilder.buildSuccessResponse(
        submissions,
        'Submissions retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSIONS_FETCH_ERROR',
          'Failed to retrieve submissions',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions`,
          error.message,
        ),
      );
    }
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get submission statistics',
    description: 'Get comprehensive statistics about submissions and reward assignments. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: SubmissionStatisticsRestDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getStatistics(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<SubmissionStatisticsRestDto>> {
    try {
      const statistics = await this.submissionService.getSubmissionStatistics();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
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
          `${req.protocol}://${req.get('host')}/api/submissions/statistics`,
          error.message,
        ),
      );
    }
  }

  @Get('without-rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get submissions without assigned rewards',
    description: 'Get list of submissions that do not have rewards assigned yet. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submissions without rewards retrieved successfully',
    type: [SubmissionRestResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getSubmissionsWithoutRewards(
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<SubmissionRestResponseDto[]>> {
    try {
      const submissions = await this.submissionService.getSubmissionsWithoutRewards();

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        action: 'without-rewards',
      });

      return this.responseBuilder.buildSuccessResponse(
        submissions,
        'Submissions without rewards retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSIONS_FETCH_ERROR',
          'Failed to retrieve submissions without rewards',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/without-rewards`,
          error.message,
        ),
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get submission by ID',
    description: 'Get detailed information about a specific submission including relations. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission retrieved successfully',
    type: SubmissionWithRelationsRestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Submission not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getSubmissionById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<SubmissionWithRelationsRestResponseDto>> {
    try {
      const submission = await this.submissionService.getSubmissionById(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        resourceId: id,
        action: 'get',
      });

      return this.responseBuilder.buildSuccessResponse(
        submission,
        'Submission retrieved successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'SUBMISSION_NOT_FOUND',
            `Submission with ID ${id} not found`,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/submissions/${id}`,
          ),
        );
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSION_FETCH_ERROR',
          'Failed to retrieve submission',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/${id}`,
          error.message,
        ),
      );
    }
  }

  @Post('assign-reward')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign reward to submission',
    description: 'Assign a specific reward account to a user submission. Admin only.',
  })
  @ApiBody({
    type: AssignRewardToSubmissionRestDto,
    description: 'Reward assignment data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward assigned successfully',
    type: SubmissionRestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid assignment data or reward not available',
  })
  @ApiNotFoundResponse({
    description: 'Submission or reward account not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async assignReward(
    @Body() assignRewardDto: AssignRewardToSubmissionRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<SubmissionRestResponseDto>> {
    try {
      const updatedSubmission = await this.submissionService.assignRewardToSubmission(
        assignRewardDto,
        req.user.id,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        resourceId: assignRewardDto.submissionId,
        action: 'assign-reward',
      });

      return this.responseBuilder.buildSuccessResponse(
        updatedSubmission,
        'Reward assigned successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'RESOURCE_NOT_FOUND',
            error.message,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/submissions/assign-reward`,
          ),
        );
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_ASSIGNMENT_ERROR',
          'Failed to assign reward',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/assign-reward`,
          error.message,
        ),
      );
    }
  }

  @Post('bulk-assign-rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk assign rewards to submissions',
    description: 'Assign multiple reward accounts to multiple submissions in a single operation. Admin only.',
  })
  @ApiBody({
    type: BulkAssignRewardRestDto,
    description: 'Bulk reward assignment data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rewards assigned successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            successCount: { type: 'number' },
            failureCount: { type: 'number' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  submissionId: { type: 'number' },
                  rewardAccountId: { type: 'number' },
                  success: { type: 'boolean' },
                  error: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid bulk assignment data',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async bulkAssignRewards(
    @Body() bulkAssignDto: BulkAssignRewardRestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<any>> {
    try {
      // Validate that arrays have the same length
      if (bulkAssignDto.submissionIds.length !== bulkAssignDto.rewardAccountIds.length) {
        throw new BadRequestException('Submission IDs and reward account IDs arrays must have the same length');
      }

      const results: Array<{
        submissionId: number;
        rewardAccountId: number;
        success: boolean;
        error: string | null;
      }> = [];
      let successCount = 0;
      let failureCount = 0;

      // Process each assignment
      for (let i = 0; i < bulkAssignDto.submissionIds.length; i++) {
        const submissionId = bulkAssignDto.submissionIds[i];
        const rewardAccountId = bulkAssignDto.rewardAccountIds[i];

        try {
          await this.submissionService.assignRewardToSubmission(
            {
              submissionId,
              rewardAccountId,
              notes: bulkAssignDto.notes,
            },
            req.user.id,
          );

          results.push({
            submissionId,
            rewardAccountId,
            success: true,
            error: null,
          });
          successCount++;
        } catch (error) {
          results.push({
            submissionId,
            rewardAccountId,
            success: false,
            error: error.message,
          });
          failureCount++;
        }
      }

      const responseData = {
        successCount,
        failureCount,
        results,
      };

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        action: 'bulk-assign-rewards',
      });

      return this.responseBuilder.buildSuccessResponse(
        responseData,
        `Bulk assignment completed: ${successCount} successful, ${failureCount} failed`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'BULK_ASSIGNMENT_ERROR',
          'Failed to process bulk reward assignment',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/bulk-assign-rewards`,
          error.message,
        ),
      );
    }
  }

  @Delete(':id/reward')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove reward assignment',
    description: 'Remove reward assignment from a submission, making the reward available again. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reward assignment removed successfully',
    type: SubmissionRestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Submission not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async removeRewardAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<SubmissionRestResponseDto>> {
    try {
      const updatedSubmission = await this.submissionService.removeRewardAssignment(id);

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        resourceId: id,
        action: 'remove-reward',
      });

      return this.responseBuilder.buildSuccessResponse(
        updatedSubmission,
        'Reward assignment removed successfully',
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'SUBMISSION_NOT_FOUND',
            `Submission with ID ${id} not found`,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/submissions/${id}/reward`,
          ),
        );
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'REWARD_REMOVAL_ERROR',
          'Failed to remove reward assignment',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/${id}/reward`,
          error.message,
        ),
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete submission',
    description: 'Delete a submission permanently. This action cannot be undone. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Submission ID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Submission deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Submission not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async deleteSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      await this.submissionService.deleteSubmission(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          this.responseBuilder.buildErrorResponse(
            'SUBMISSION_NOT_FOUND',
            `Submission with ID ${id} not found`,
            HttpStatus.NOT_FOUND,
            req.traceId || 'unknown',
            `${req.protocol}://${req.get('host')}/api/submissions/${id}`,
          ),
        );
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'SUBMISSION_DELETE_ERROR',
          'Failed to delete submission',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/${id}`,
          error.message,
        ),
      );
    }
  }

  @Get('search/email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search submissions by email',
    description: 'Search for submissions by email address. Admin only.',
  })
  @ApiQuery({
    name: 'email',
    type: String,
    description: 'Email address to search for',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Maximum number of results (default: 10)',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: [SubmissionRestResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async searchByEmail(
    @Query('email') email: string,
    @Query('limit') limit: number = 10,
    @Request() req: AuthenticatedRequest,
  ): Promise<StandardApiResponse<SubmissionRestResponseDto[]>> {
    try {
      if (!email) {
        throw new BadRequestException('Email parameter is required');
      }

      const submissions = await this.submissionService.searchSubmissionsByEmail(
        email,
        limit,
      );

      const links = this.responseBuilder.generateHATEOASLinks({
        baseUrl: `${req.protocol}://${req.get('host')}/api/submissions`,
        action: 'search-email',
        queryParams: { email, limit },
      });

      return this.responseBuilder.buildSuccessResponse(
        submissions,
        `Found ${submissions.length} submissions for email: ${email}`,
        HttpStatus.OK,
        req.traceId || 'unknown',
        links,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        this.responseBuilder.buildErrorResponse(
          'EMAIL_SEARCH_ERROR',
          'Failed to search submissions by email',
          HttpStatus.BAD_REQUEST,
          req.traceId || 'unknown',
          `${req.protocol}://${req.get('host')}/api/submissions/search/email`,
          error.message,
        ),
      );
    }
  }
}