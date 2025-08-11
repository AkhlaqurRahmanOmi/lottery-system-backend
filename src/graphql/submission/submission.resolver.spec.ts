import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionResolver } from './submission.resolver';
import { SubmissionService } from '../../modules/submission/submission.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

describe('SubmissionResolver', () => {
  let resolver: SubmissionResolver;
  let submissionService: jest.Mocked<SubmissionService>;

  const mockSubmissionService = {
    validateCouponCode: jest.fn(),
    processUserSubmission: jest.fn(),
    getSubmissionById: jest.fn(),
    getSubmissions: jest.fn(),
    getSubmissionsWithoutRewards: jest.fn(),
    getRecentSubmissions: jest.fn(),
    searchSubmissionsByEmail: jest.fn(),
    getSubmissionStatistics: jest.fn(),
    assignRewardToSubmission: jest.fn(),
    removeRewardAssignment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionResolver,
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<SubmissionResolver>(SubmissionResolver);
    submissionService = module.get(SubmissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCouponForSubmission', () => {
    it('should validate coupon code successfully', async () => {
      const mockValidation = { isValid: true };
      submissionService.validateCouponCode.mockResolvedValue(mockValidation);

      const result = await resolver.validateCouponForSubmission({ couponCode: 'TEST123456' });

      expect(result).toEqual({
        isValid: true,
        message: undefined,
      });
      expect(submissionService.validateCouponCode).toHaveBeenCalledWith('TEST123456');
    });

    it('should handle invalid coupon code', async () => {
      const mockValidation = { isValid: false, error: 'Coupon not found' };
      submissionService.validateCouponCode.mockResolvedValue(mockValidation);

      const result = await resolver.validateCouponForSubmission({ couponCode: 'INVALID123' });

      expect(result).toEqual({
        isValid: false,
        message: 'Coupon not found',
      });
    });

    it('should handle validation errors gracefully', async () => {
      submissionService.validateCouponCode.mockRejectedValue(new Error('Service error'));

      const result = await resolver.validateCouponForSubmission({ couponCode: 'ERROR123' });

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error occurred',
      });
    });
  });

  describe('createSubmission', () => {
    it('should create submission successfully without reward selection', async () => {
      const mockSubmission = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
        submittedAt: '2024-01-01T00:00:00.000Z',
      };

      submissionService.processUserSubmission.mockResolvedValue(mockSubmission as any);

      const input = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
      };

      const result = await resolver.createSubmission(input);

      expect(result).toEqual(mockSubmission);
      expect(submissionService.processUserSubmission).toHaveBeenCalledWith({
        ...input,
        selectedRewardId: 1, // Default reward ID
      });
    });

    it('should use provided selectedRewardId if given', async () => {
      const mockSubmission = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        submittedAt: '2024-01-01T00:00:00.000Z',
      };

      submissionService.processUserSubmission.mockResolvedValue(mockSubmission as any);

      const input = {
        couponCode: 'TEST123456',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        productExperience: 'Great product',
        selectedRewardId: 5,
      };

      await resolver.createSubmission(input);

      expect(submissionService.processUserSubmission).toHaveBeenCalledWith({
        ...input,
        selectedRewardId: 5,
      });
    });
  });

  describe('assignRewardToSubmission', () => {
    it('should assign reward to submission successfully', async () => {
      const mockAdmin = { id: 1, username: 'admin' };
      const mockUpdatedSubmission = {
        id: 1,
        assignedRewardId: 5,
        rewardAssignedAt: '2024-01-01T00:00:00.000Z',
        rewardAssignedBy: 1,
      };

      submissionService.assignRewardToSubmission.mockResolvedValue(mockUpdatedSubmission as any);

      const input = {
        submissionId: 1,
        rewardAccountId: 5,
        notes: 'Assigned for excellent feedback',
      };

      const result = await resolver.assignRewardToSubmission(input, mockAdmin);

      expect(result).toEqual(mockUpdatedSubmission);
      expect(submissionService.assignRewardToSubmission).toHaveBeenCalledWith(input, 1);
    });
  });

  describe('removeRewardAssignment', () => {
    it('should remove reward assignment successfully', async () => {
      const mockAdmin = { id: 1, username: 'admin' };
      const mockUpdatedSubmission = {
        id: 1,
        assignedRewardId: null,
        rewardAssignedAt: null,
        rewardAssignedBy: null,
      };

      submissionService.removeRewardAssignment.mockResolvedValue(mockUpdatedSubmission as any);

      const result = await resolver.removeRewardAssignment(1, mockAdmin);

      expect(result).toEqual(mockUpdatedSubmission);
      expect(submissionService.removeRewardAssignment).toHaveBeenCalledWith(1);
    });
  });

  describe('getSubmissions', () => {
    it('should get paginated submissions', async () => {
      const mockAdmin = { id: 1, username: 'admin' };
      const mockPaginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      submissionService.getSubmissions.mockResolvedValue(mockPaginatedResult as any);

      const query = { page: 1, limit: 10 };
      const result = await resolver.submissions(query, mockAdmin);

      expect(result).toEqual(mockPaginatedResult);
      expect(submissionService.getSubmissions).toHaveBeenCalledWith(query);
    });
  });

  describe('getSubmissionsWithoutRewards', () => {
    it('should get submissions without assigned rewards', async () => {
      const mockAdmin = { id: 1, username: 'admin' };
      const mockSubmissions = [
        { id: 1, name: 'John Doe', assignedRewardId: null },
        { id: 2, name: 'Jane Smith', assignedRewardId: null },
      ];

      submissionService.getSubmissionsWithoutRewards.mockResolvedValue(mockSubmissions as any);

      const result = await resolver.submissionsWithoutRewards(mockAdmin);

      expect(result).toEqual(mockSubmissions);
      expect(submissionService.getSubmissionsWithoutRewards).toHaveBeenCalled();
    });
  });

  describe('getSubmissionStatistics', () => {
    it('should get submission statistics', async () => {
      const mockAdmin = { id: 1, username: 'admin' };
      const mockStats = {
        total: 100,
        withAssignedRewards: 75,
        withoutAssignedRewards: 25,
        rewardAssignmentRate: 75.0,
        rewardSelectionStats: [],
      };

      submissionService.getSubmissionStatistics.mockResolvedValue(mockStats as any);

      const result = await resolver.submissionStatistics(mockAdmin);

      expect(result).toEqual(mockStats);
      expect(submissionService.getSubmissionStatistics).toHaveBeenCalled();
    });
  });
});