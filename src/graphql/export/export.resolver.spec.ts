import { Test, TestingModule } from '@nestjs/testing';
import { ExportResolver } from './export.resolver';
import { ExportService } from '../../modules/export/export.service';
import { ExportFormat } from '../../modules/export/dto';
import { ExportSubmissionsGraphQLDto, ExportCouponsGraphQLDto } from './dto';

describe('ExportResolver', () => {
  let resolver: ExportResolver;
  let exportService: ExportService;

  const mockExportService = {
    exportSubmissions: jest.fn(),
    exportCoupons: jest.fn()
  };

  const mockExportResult = {
    data: 'base64encodeddata',
    filename: 'test_export.csv',
    mimeType: 'text/csv'
  };

  const mockContext = {
    req: {
      user: { id: 1, username: 'admin' }
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportResolver,
        {
          provide: ExportService,
          useValue: mockExportService
        }
      ]
    }).compile();

    resolver = module.get<ExportResolver>(ExportResolver);
    exportService = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportSubmissions', () => {
    it('should export submissions successfully', async () => {
      const input: ExportSubmissionsGraphQLDto = {
        format: ExportFormat.CSV,
        includeMetadata: false
      };

      mockExportService.exportSubmissions.mockResolvedValue(mockExportResult);

      const result = await resolver.exportSubmissions(input, mockContext);

      expect(mockExportService.exportSubmissions).toHaveBeenCalledWith({
        format: ExportFormat.CSV,
        filters: undefined,
        includeMetadata: false
      });
      expect(result).toEqual(mockExportResult);
    });

    it('should export submissions with filters', async () => {
      const input: ExportSubmissionsGraphQLDto = {
        format: ExportFormat.EXCEL,
        filters: {
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z',
          hasReward: true,
          couponBatchId: 'BATCH_001'
        },
        includeMetadata: true
      };

      mockExportService.exportSubmissions.mockResolvedValue(mockExportResult);

      const result = await resolver.exportSubmissions(input, mockContext);

      expect(mockExportService.exportSubmissions).toHaveBeenCalledWith({
        format: ExportFormat.EXCEL,
        filters: {
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z',
          hasReward: true,
          couponBatchId: 'BATCH_001'
        },
        includeMetadata: true
      });
      expect(result).toEqual(mockExportResult);
    });

    it('should handle export service errors', async () => {
      const input: ExportSubmissionsGraphQLDto = {
        format: ExportFormat.CSV
      };

      const error = new Error('Export failed');
      mockExportService.exportSubmissions.mockRejectedValue(error);

      await expect(resolver.exportSubmissions(input, mockContext)).rejects.toThrow('Export failed');
    });
  });

  describe('exportCoupons', () => {
    it('should export coupons successfully', async () => {
      const input: ExportCouponsGraphQLDto = {
        format: ExportFormat.CSV,
        includeMetadata: false
      };

      mockExportService.exportCoupons.mockResolvedValue(mockExportResult);

      const result = await resolver.exportCoupons(input, mockContext);

      expect(mockExportService.exportCoupons).toHaveBeenCalledWith({
        format: ExportFormat.CSV,
        filters: undefined,
        includeMetadata: false
      });
      expect(result).toEqual(mockExportResult);
    });

    it('should export coupons with filters', async () => {
      const input: ExportCouponsGraphQLDto = {
        format: ExportFormat.PDF,
        filters: {
          status: 'ACTIVE' as any,
          batchId: 'BATCH_001',
          createdBy: 1,
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z'
        },
        includeMetadata: true
      };

      mockExportService.exportCoupons.mockResolvedValue(mockExportResult);

      const result = await resolver.exportCoupons(input, mockContext);

      expect(mockExportService.exportCoupons).toHaveBeenCalledWith({
        format: ExportFormat.PDF,
        filters: {
          status: 'ACTIVE',
          batchId: 'BATCH_001',
          createdBy: 1,
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z'
        },
        includeMetadata: true
      });
      expect(result).toEqual(mockExportResult);
    });

    it('should handle export service errors', async () => {
      const input: ExportCouponsGraphQLDto = {
        format: ExportFormat.CSV
      };

      const error = new Error('Export failed');
      mockExportService.exportCoupons.mockRejectedValue(error);

      await expect(resolver.exportCoupons(input, mockContext)).rejects.toThrow('Export failed');
    });
  });
});