import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExportService } from './export.service';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import { ExportFormat, ExportSubmissionsDto, ExportCouponsDto } from './dto';

describe('ExportService', () => {
  let service: ExportService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    submission: {
      findMany: jest.fn()
    },
    coupon: {
      findMany: jest.fn()
    }
  };

  const mockSubmission = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, Country',
    productExperience: 'Great product experience',
    submittedAt: new Date('2024-01-15T10:00:00Z'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    assignedRewardId: 1,
    rewardAssignedAt: new Date('2024-01-16T10:00:00Z'),
    rewardAssignedBy: 1,
    coupon: {
      couponCode: 'ABC123XYZ9',
      batchId: 'BATCH_001',
      status: 'REDEEMED',
      createdAt: new Date('2024-01-10T10:00:00Z'),
      expiresAt: new Date('2024-02-10T10:00:00Z')
    },
    assignedReward: {
      serviceName: 'Netflix',
      accountType: 'Premium',
      category: 'STREAMING_SERVICE',
      status: 'ASSIGNED'
    },
    rewardAssignedByAdmin: {
      username: 'admin1',
      email: 'admin@example.com'
    }
  };

  const mockCoupon = {
    id: 1,
    couponCode: 'ABC123XYZ9',
    status: 'ACTIVE',
    batchId: 'BATCH_001',
    codeLength: 10,
    generationMethod: 'BATCH',
    createdAt: new Date('2024-01-10T10:00:00Z'),
    expiresAt: new Date('2024-02-10T10:00:00Z'),
    redeemedAt: null,
    creator: {
      username: 'admin1',
      email: 'admin@example.com'
    },
    submission: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile();

    service = module.get<ExportService>(ExportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportSubmissions', () => {
    it('should export submissions to CSV format', async () => {
      const exportDto: ExportSubmissionsDto = {
        format: ExportFormat.CSV,
        includeMetadata: false
      };

      mockPrismaService.submission.findMany.mockResolvedValue([mockSubmission]);

      const result = await service.exportSubmissions(exportDto);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/submissions_export_\d{4}-\d{2}-\d{2}\.csv/);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toBeDefined();
      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          coupon: {
            select: {
              couponCode: true,
              batchId: true,
              status: true,
              createdAt: true,
              expiresAt: true
            }
          },
          assignedReward: {
            select: {
              serviceName: true,
              accountType: true,
              category: true,
              status: true
            }
          },
          rewardAssignedByAdmin: {
            select: {
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });
    });

    it('should export submissions to Excel format', async () => {
      const exportDto: ExportSubmissionsDto = {
        format: ExportFormat.EXCEL,
        includeMetadata: true
      };

      mockPrismaService.submission.findMany.mockResolvedValue([mockSubmission]);

      const result = await service.exportSubmissions(exportDto);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/submissions_export_\d{4}-\d{2}-\d{2}\.xlsx/);
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.data).toBeDefined();
    });

    it('should export submissions to PDF format', async () => {
      const exportDto: ExportSubmissionsDto = {
        format: ExportFormat.PDF,
        includeMetadata: false
      };

      mockPrismaService.submission.findMany.mockResolvedValue([mockSubmission]);

      const result = await service.exportSubmissions(exportDto);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/submissions_export_\d{4}-\d{2}-\d{2}\.pdf/);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.data).toBeDefined();
    });

    it('should apply filters when exporting submissions', async () => {
      const exportDto: ExportSubmissionsDto = {
        format: ExportFormat.CSV,
        filters: {
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z',
          hasReward: true,
          couponBatchId: 'BATCH_001'
        }
      };

      mockPrismaService.submission.findMany.mockResolvedValue([mockSubmission]);

      await service.exportSubmissions(exportDto);

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith({
        where: {
          submittedAt: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-12-31T23:59:59.999Z')
          },
          assignedRewardId: { not: null },
          coupon: {
            batchId: 'BATCH_001'
          }
        },
        include: expect.any(Object),
        orderBy: {
          submittedAt: 'desc'
        }
      });
    });

    it('should throw BadRequestException for unsupported format', async () => {
      const exportDto = {
        format: 'unsupported' as any
      };

      await expect(service.exportSubmissions(exportDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportCoupons', () => {
    it('should export coupons to CSV format', async () => {
      const exportDto: ExportCouponsDto = {
        format: ExportFormat.CSV,
        includeMetadata: false
      };

      mockPrismaService.coupon.findMany.mockResolvedValue([mockCoupon]);

      const result = await service.exportCoupons(exportDto);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/coupons_export_\d{4}-\d{2}-\d{2}\.csv/);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toBeDefined();
      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          creator: {
            select: {
              username: true,
              email: true
            }
          },
          submission: {
            select: {
              name: true,
              email: true,
              submittedAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('should export coupons to PDF format', async () => {
      const exportDto: ExportCouponsDto = {
        format: ExportFormat.PDF,
        includeMetadata: true
      };

      mockPrismaService.coupon.findMany.mockResolvedValue([mockCoupon]);

      const result = await service.exportCoupons(exportDto);

      expect(result).toBeDefined();
      expect(result.filename).toMatch(/coupons_export_\d{4}-\d{2}-\d{2}\.pdf/);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.data).toBeDefined();
    });

    it('should apply filters when exporting coupons', async () => {
      const exportDto: ExportCouponsDto = {
        format: ExportFormat.CSV,
        filters: {
          status: 'ACTIVE' as any,
          batchId: 'BATCH_001',
          createdBy: 1,
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z'
        }
      };

      mockPrismaService.coupon.findMany.mockResolvedValue([mockCoupon]);

      await service.exportCoupons(exportDto);

      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          batchId: 'BATCH_001',
          createdBy: 1,
          createdAt: {
            gte: new Date('2024-01-01T00:00:00.000Z'),
            lte: new Date('2024-12-31T23:59:59.999Z')
          }
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('should throw BadRequestException for unsupported format', async () => {
      const exportDto = {
        format: 'unsupported' as any
      };

      await expect(service.exportCoupons(exportDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const exportDto: ExportSubmissionsDto = {
        format: ExportFormat.CSV
      };

      mockPrismaService.submission.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.exportSubmissions(exportDto)).rejects.toThrow('Database error');
    });
  });
});