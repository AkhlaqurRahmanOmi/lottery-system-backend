import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  Logger
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiBody 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ExportService } from '../../../modules/export/export.service';
import { 
  ExportSubmissionsRestDto, 
  ExportCouponsRestDto, 
  ExportResultRestDto 
} from './dto';

@ApiTags('Export')
@Controller('api/admin/export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(
    private readonly exportService: ExportService
  ) {}

  @Post('submissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export user submissions',
    description: 'Export user submissions to CSV, Excel, or PDF format with filtering options. Admin authentication required.'
  })
  @ApiBody({
    type: ExportSubmissionsRestDto,
    description: 'Export options and filters'
  })
  @ApiResponse({
    status: 200,
    description: 'Export completed successfully',
    type: ExportResultRestDto,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Submissions exported successfully' },
        data: {
          type: 'object',
          properties: {
            data: { type: 'string', description: 'Base64 encoded file data' },
            filename: { type: 'string', example: 'submissions_export_2024-01-15.csv' },
            mimeType: { type: 'string', example: 'text/csv' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid export parameters'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required'
  })
  async exportSubmissions(@Body() exportDto: ExportSubmissionsRestDto) {
    this.logger.log(`Exporting submissions in ${exportDto.format} format`);

    try {
      // Map REST DTO to service DTO
      const serviceExportDto = {
        format: exportDto.format,
        filters: exportDto.filters,
        includeMetadata: exportDto.includeMetadata || false
      };

      const result = await this.exportService.exportSubmissions(serviceExportDto);

      return {
        success: true,
        message: 'Submissions exported successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to export submissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('coupons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export coupon codes',
    description: 'Export coupon codes to CSV or PDF format with filtering options. Admin authentication required.'
  })
  @ApiBody({
    type: ExportCouponsRestDto,
    description: 'Export options and filters'
  })
  @ApiResponse({
    status: 200,
    description: 'Export completed successfully',
    type: ExportResultRestDto,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Coupons exported successfully' },
        data: {
          type: 'object',
          properties: {
            data: { type: 'string', description: 'Base64 encoded file data' },
            filename: { type: 'string', example: 'coupons_export_2024-01-15.csv' },
            mimeType: { type: 'string', example: 'text/csv' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid export parameters'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required'
  })
  async exportCoupons(@Body() exportDto: ExportCouponsRestDto) {
    this.logger.log(`Exporting coupons in ${exportDto.format} format`);

    try {
      // Map REST DTO to service DTO
      const serviceExportDto = {
        format: exportDto.format,
        filters: exportDto.filters,
        includeMetadata: exportDto.includeMetadata || false
      };

      const result = await this.exportService.exportCoupons(serviceExportDto);

      return {
        success: true,
        message: 'Coupons exported successfully',
        data: result
      };
    } catch (error) {
      this.logger.error(`Failed to export coupons: ${error.message}`, error.stack);
      throw error;
    }
  }
}