import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from '../../../modules/export/export.service';
import { ExportFormat } from '../../../modules/export/dto';
import { ExportSubmissionsRestDto, ExportCouponsRestDto } from './dto';

describe('ExportController', () => {
    let controller: ExportController;
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ExportController],
            providers: [
                {
                    provide: ExportService,
                    useValue: mockExportService
                }
            ]
        }).compile();

        controller = module.get<ExportController>(ExportController);
        exportService = module.get<ExportService>(ExportService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('exportSubmissions', () => {
        it('should export submissions successfully', async () => {
            const exportDto: ExportSubmissionsRestDto = {
                format: ExportFormat.CSV,
                includeMetadata: false
            };

            mockExportService.exportSubmissions.mockResolvedValue(mockExportResult);

            const result = await controller.exportSubmissions(exportDto);

            expect(mockExportService.exportSubmissions).toHaveBeenCalledWith({
                format: ExportFormat.CSV,
                filters: undefined,
                includeMetadata: false
            });
            expect(result).toEqual({
                success: true,
                message: 'Submissions exported successfully',
                data: mockExportResult
            });
        });

        it('should export submissions with filters', async () => {
            const exportDto: ExportSubmissionsRestDto = {
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

            await controller.exportSubmissions(exportDto);

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
        });

        it('should handle export service errors', async () => {
            const exportDto: ExportSubmissionsRestDto = {
                format: ExportFormat.CSV
            };

            const error = new Error('Export failed');
            mockExportService.exportSubmissions.mockRejectedValue(error);

            await expect(controller.exportSubmissions(exportDto)).rejects.toThrow('Export failed');
        });
    });

    describe('exportCoupons', () => {
        it('should export coupons successfully', async () => {
            const exportDto: ExportCouponsRestDto = {
                format: ExportFormat.CSV,
                includeMetadata: false
            };

            mockExportService.exportCoupons.mockResolvedValue(mockExportResult);

            const result = await controller.exportCoupons(exportDto);

            expect(mockExportService.exportCoupons).toHaveBeenCalledWith({
                format: ExportFormat.CSV,
                filters: undefined,
                includeMetadata: false
            });
            expect(result).toEqual({
                success: true,
                message: 'Coupons exported successfully',
                data: mockExportResult
            });
        });

        it('should export coupons with filters', async () => {
            const exportDto: ExportCouponsRestDto = {
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

            await controller.exportCoupons(exportDto);

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
        });

        it('should handle export service errors', async () => {
            const exportDto: ExportCouponsRestDto = {
                format: ExportFormat.CSV
            };

            const error = new Error('Export failed');
            mockExportService.exportCoupons.mockRejectedValue(error);

            await expect(controller.exportCoupons(exportDto)).rejects.toThrow('Export failed');
        });
    });
});