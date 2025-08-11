import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from '../../../modules/submission/submission.service';
import { ResponseBuilderService } from '../../../shared/services/response-builder.service';
import { AdminRole } from '@prisma/client';

describe('SubmissionController', () => {
  let controller: SubmissionController;
  let submissionService: jest.Mocked<SubmissionService>;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;

  const mockSubmissionService = {
    validateCouponCode: jest.fn(),
    processUserSubmission: jest.fn(),
    getSubmissions: jest.fn(),
    getSubmissionById: jest.fn(),
    getSubmissionStatistics: jest.fn(),
    getSubmissionsWithoutRewards: jest.fn(),
    assignRewardToSubmission: jest.fn(),
    removeRewardAssignment: jest.fn(),
    deleteSubmission: jest.fn(),
    searchSubmissionsByEmail: jest.fn(),
  };

  const mockResponseBuilder = {
    buildSuccessResponse: jest.fn(),
    buildErrorResponse: jest.fn(),
    generateHATEOASLinks: jest.fn(),
  };

  const mockRequest = {
    protocol: 'https',
    get: jest.fn().mockReturnValue('localhost:3000'),
    traceId: 'test-trace-id',
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      role: AdminRole.ADMIN,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionController],
      providers: [
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
      ],
    }).compile();

    controller = module.get<SubmissionController>(SubmissionController);
    submissionService = module.get(SubmissionService);
    responseBuilder = module.get(ResponseBuilderService);

    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockResponseBuilder.generateHATEOASLinks.mockReturnValue({
      self: 'https://localhost:3000/api/submissions',
    });
    
    mockResponseBuilder.buildSuccessResponse.mockImplementation((data, message, status, traceId, links) => ({
      success: true,
      statusCode: status,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
        version: '1.0.0',
      },
      links,
    }));
  });

  describe('validateCoupon', () => {
    const validateCouponDto = {
      couponCode: 'ABC123XYZ9',
    };

    it('should validate coupon successfully', async () => {
      const mockValidation = {
        isValid: true,
        error: undefined,
      };

      mockSubmissionService.validateCouponCode.mockResolvedValue(mockValidation);

      const result = await controller.validateCoupon(validateCouponDto, mockRequest as any);

      expect(submissionService.validateCouponCode).toHaveBeenCalledWith('ABC123XYZ9');
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          isValid: true,
          message: 'Coupon is valid',
          couponCode: 'ABC123XYZ9',
        },
        'Coupon is valid',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle invalid coupon', async () => {
      const mockValidation = {
        isValid: false,
        error: 'Coupon not found',
      };

      mockSubmissionService.validateCouponCode.mockResolvedValue(mockValidation);

      const result = await controller.validateCoupon(validateCouponDto, mockRequest as any);

      expect(submissionService.validateCouponCode).toHaveBeenCalledWith('ABC123XYZ9');
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          isValid: false,
          message: 'Coupon not found',
          couponCode: 'ABC123XYZ9',
        },
        'Coupon validation completed',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle validation errors', async () => {
      mockSubmissionService.validateCouponCode.mockRejectedValue(new Error('Database error'));
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'COUPON_VALIDATION_ERROR',
          message: 'Failed to validate coupon',
        },
      });

      await expect(controller.validateCoupon(validateCouponDto, mockRequest as any))
        .rejects.toThrow(BadRequestException);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'COUPON_VALIDATION_ERROR',
        'Failed to validate coupon',
        HttpStatus.BAD_REQUEST,
        'test-trace-id',
        'https://localhost:3000/api/submissions/validate-coupon',
        'Database error',
      );
    });
  });

  describe('createSubmission', () => {
    const createSubmissionDto = {
      couponCode: 'ABC123XYZ9',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, State 12345',
      productExperience: 'Great product, been using for 2 years',
      selectedRewardId: 1,
    };

    const mockSubmission = {
      id: 1,
      couponId: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, State 12345',
      productExperience: 'Great product, been using for 2 years',
      selectedRewardId: 1,
      submittedAt: '2024-01-01T00:00:00.000Z',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      additionalData: null,
      assignedRewardId: null,
      rewardAssignedAt: null,
      rewardAssignedBy: null,
    };

    it('should create submission successfully', async () => {
      mockSubmissionService.processUserSubmission.mockResolvedValue(mockSubmission);

      const result = await controller.createSubmission(
        createSubmissionDto,
        '127.0.0.1',
        'Mozilla/5.0',
        mockRequest as any,
      );

      expect(submissionService.processUserSubmission).toHaveBeenCalledWith({
        ...createSubmissionDto,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          id: 1,
          message: 'Thank you for your submission! Your entry has been recorded successfully.',
          submittedAt: '2024-01-01T00:00:00.000Z',
          couponCode: 'ABC123XYZ9',
        },
        'Submission created successfully',
        HttpStatus.CREATED,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle coupon already redeemed error', async () => {
      mockSubmissionService.processUserSubmission.mockRejectedValue(
        new ConflictException('This coupon has already been redeemed'),
      );

      await expect(controller.createSubmission(
        createSubmissionDto,
        '127.0.0.1',
        'Mozilla/5.0',
        mockRequest as any,
      )).rejects.toThrow(ConflictException);
    });

    it('should handle validation errors', async () => {
      mockSubmissionService.processUserSubmission.mockRejectedValue(
        new BadRequestException('Invalid email format'),
      );

      await expect(controller.createSubmission(
        createSubmissionDto,
        '127.0.0.1',
        'Mozilla/5.0',
        mockRequest as any,
      )).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmissions', () => {
    const queryDto = {
      page: 1,
      limit: 10,
      search: 'john',
      hasReward: false,
      sortBy: 'submittedAt',
      sortOrder: 'desc' as const,
    };

    const mockPaginatedResponse = {
      data: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          submittedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
      total: 1,
    };

    it('should get submissions successfully', async () => {
      mockSubmissionService.getSubmissions.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getSubmissions(queryDto, mockRequest as any);

      expect(submissionService.getSubmissions).toHaveBeenCalledWith(queryDto);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockPaginatedResponse,
        'Submissions retrieved successfully',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle service errors', async () => {
      mockSubmissionService.getSubmissions.mockRejectedValue(new Error('Database error'));
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        error: {
          code: 'SUBMISSIONS_FETCH_ERROR',
          message: 'Failed to retrieve submissions',
        },
      });

      await expect(controller.getSubmissions(queryDto, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmissionById', () => {
    const submissionId = 1;
    const mockSubmissionWithRelations = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      coupon: {
        id: 1,
        couponCode: 'ABC123XYZ9',
      },
      assignedReward: null,
    };

    it('should get submission by ID successfully', async () => {
      mockSubmissionService.getSubmissionById.mockResolvedValue(mockSubmissionWithRelations);

      const result = await controller.getSubmissionById(submissionId, mockRequest as any);

      expect(submissionService.getSubmissionById).toHaveBeenCalledWith(submissionId);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockSubmissionWithRelations,
        'Submission retrieved successfully',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle submission not found', async () => {
      mockSubmissionService.getSubmissionById.mockRejectedValue(
        new NotFoundException('Submission with ID 1 not found'),
      );
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Submission with ID 1 not found',
        },
      });

      await expect(controller.getSubmissionById(submissionId, mockRequest as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('assignReward', () => {
    const assignRewardDto = {
      submissionId: 1,
      rewardAccountId: 1,
      notes: 'Winner selection',
    };

    const mockUpdatedSubmission = {
      id: 1,
      name: 'John Doe',
      assignedRewardId: 1,
      rewardAssignedAt: '2024-01-01T00:00:00.000Z',
      rewardAssignedBy: 1,
    };

    it('should assign reward successfully', async () => {
      mockSubmissionService.assignRewardToSubmission.mockResolvedValue(mockUpdatedSubmission);

      const result = await controller.assignReward(assignRewardDto, mockRequest as any);

      expect(submissionService.assignRewardToSubmission).toHaveBeenCalledWith(
        assignRewardDto,
        1, // admin ID
      );
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockUpdatedSubmission,
        'Reward assigned successfully',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle reward assignment errors', async () => {
      mockSubmissionService.assignRewardToSubmission.mockRejectedValue(
        new BadRequestException('Reward account not available'),
      );

      await expect(controller.assignReward(assignRewardDto, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkAssignRewards', () => {
    const bulkAssignDto = {
      submissionIds: [1, 2],
      rewardAccountIds: [1, 2],
      notes: 'Bulk winner selection',
    };

    it('should handle bulk assignment successfully', async () => {
      mockSubmissionService.assignRewardToSubmission
        .mockResolvedValueOnce({ id: 1 } as any)
        .mockResolvedValueOnce({ id: 2 } as any);

      const result = await controller.bulkAssignRewards(bulkAssignDto, mockRequest as any);

      expect(submissionService.assignRewardToSubmission).toHaveBeenCalledTimes(2);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          successCount: 2,
          failureCount: 0,
          results: [
            { submissionId: 1, rewardAccountId: 1, success: true, error: null },
            { submissionId: 2, rewardAccountId: 2, success: true, error: null },
          ],
        },
        'Bulk assignment completed: 2 successful, 0 failed',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle partial failures in bulk assignment', async () => {
      mockSubmissionService.assignRewardToSubmission
        .mockResolvedValueOnce({ id: 1 } as any)
        .mockRejectedValueOnce(new Error('Reward not available'));

      const result = await controller.bulkAssignRewards(bulkAssignDto, mockRequest as any);

      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        {
          successCount: 1,
          failureCount: 1,
          results: [
            { submissionId: 1, rewardAccountId: 1, success: true, error: null },
            { submissionId: 2, rewardAccountId: 2, success: false, error: 'Reward not available' },
          ],
        },
        'Bulk assignment completed: 1 successful, 1 failed',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should validate array lengths', async () => {
      const invalidBulkAssignDto = {
        submissionIds: [1, 2],
        rewardAccountIds: [1], // Different length
        notes: 'Invalid bulk assignment',
      };

      await expect(controller.bulkAssignRewards(invalidBulkAssignDto, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('removeRewardAssignment', () => {
    const submissionId = 1;
    const mockUpdatedSubmission = {
      id: 1,
      name: 'John Doe',
      assignedRewardId: null,
      rewardAssignedAt: null,
      rewardAssignedBy: null,
    };

    it('should remove reward assignment successfully', async () => {
      mockSubmissionService.removeRewardAssignment.mockResolvedValue(mockUpdatedSubmission);

      const result = await controller.removeRewardAssignment(submissionId, mockRequest as any);

      expect(submissionService.removeRewardAssignment).toHaveBeenCalledWith(submissionId);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockUpdatedSubmission,
        'Reward assignment removed successfully',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle submission not found', async () => {
      mockSubmissionService.removeRewardAssignment.mockRejectedValue(
        new NotFoundException('Submission with ID 1 not found'),
      );
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Submission with ID 1 not found',
        },
      });

      await expect(controller.removeRewardAssignment(submissionId, mockRequest as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSubmission', () => {
    const submissionId = 1;

    it('should delete submission successfully', async () => {
      mockSubmissionService.deleteSubmission.mockResolvedValue(undefined);

      await controller.deleteSubmission(submissionId, mockRequest as any);

      expect(submissionService.deleteSubmission).toHaveBeenCalledWith(submissionId);
    });

    it('should handle submission not found', async () => {
      mockSubmissionService.deleteSubmission.mockRejectedValue(
        new NotFoundException('Submission with ID 1 not found'),
      );
      mockResponseBuilder.buildErrorResponse.mockReturnValue({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Submission with ID 1 not found',
        },
      });

      await expect(controller.deleteSubmission(submissionId, mockRequest as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('searchByEmail', () => {
    const email = 'john@example.com';
    const limit = 5;
    const mockSearchResults = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        submittedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('should search by email successfully', async () => {
      mockSubmissionService.searchSubmissionsByEmail.mockResolvedValue(mockSearchResults);

      const result = await controller.searchByEmail(email, limit, mockRequest as any);

      expect(submissionService.searchSubmissionsByEmail).toHaveBeenCalledWith(email, limit);
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockSearchResults,
        `Found ${mockSearchResults.length} submissions for email: ${email}`,
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should handle missing email parameter', async () => {
      await expect(controller.searchByEmail('', undefined, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should use default limit when not provided', async () => {
      mockSubmissionService.searchSubmissionsByEmail.mockResolvedValue(mockSearchResults);

      await controller.searchByEmail(email, undefined, mockRequest as any);

      expect(submissionService.searchSubmissionsByEmail).toHaveBeenCalledWith(email, 10);
    });
  });

  describe('getStatistics', () => {
    const mockStatistics = {
      total: 100,
      withAssignedRewards: 25,
      withoutAssignedRewards: 75,
      rewardAssignmentRate: 25.0,
      rewardSelectionStats: [],
    };

    it('should get statistics successfully', async () => {
      mockSubmissionService.getSubmissionStatistics.mockResolvedValue(mockStatistics);

      const result = await controller.getStatistics(mockRequest as any);

      expect(submissionService.getSubmissionStatistics).toHaveBeenCalled();
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockStatistics,
        'Statistics retrieved successfully',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getSubmissionsWithoutRewards', () => {
    const mockSubmissions = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        assignedRewardId: null,
      },
    ];

    it('should get submissions without rewards successfully', async () => {
      mockSubmissionService.getSubmissionsWithoutRewards.mockResolvedValue(mockSubmissions);

      const result = await controller.getSubmissionsWithoutRewards(mockRequest as any);

      expect(submissionService.getSubmissionsWithoutRewards).toHaveBeenCalled();
      expect(responseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        mockSubmissions,
        'Submissions without rewards retrieved successfully',
        HttpStatus.OK,
        'test-trace-id',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });
  });
});