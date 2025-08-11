import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { ExportService } from '../../modules/export/export.service';
import { 
  ExportSubmissionsGraphQLDto, 
  ExportCouponsGraphQLDto, 
  ExportResultGraphQLDto 
} from './dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ExportResolver {
  private readonly logger = new Logger(ExportResolver.name);

  constructor(private readonly exportService: ExportService) {}

  @Mutation(() => ExportResultGraphQLDto, {
    description: 'Export user submissions to CSV, Excel, or PDF format'
  })
  async exportSubmissions(
    @Args('input') input: ExportSubmissionsGraphQLDto,
    @Context() context: any
  ): Promise<ExportResultGraphQLDto> {
    this.logger.log(`Admin ${context.req.user?.id} exporting submissions in ${input.format} format`);

    try {
      // Map GraphQL DTO to service DTO
      const serviceExportDto = {
        format: input.format,
        filters: input.filters,
        includeMetadata: input.includeMetadata || false
      };

      const result = await this.exportService.exportSubmissions(serviceExportDto);

      return {
        data: result.data,
        filename: result.filename,
        mimeType: result.mimeType
      };
    } catch (error) {
      this.logger.error(`Failed to export submissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => ExportResultGraphQLDto, {
    description: 'Export coupon codes to CSV or PDF format'
  })
  async exportCoupons(
    @Args('input') input: ExportCouponsGraphQLDto,
    @Context() context: any
  ): Promise<ExportResultGraphQLDto> {
    this.logger.log(`Admin ${context.req.user?.id} exporting coupons in ${input.format} format`);

    try {
      // Map GraphQL DTO to service DTO
      const serviceExportDto = {
        format: input.format,
        filters: input.filters,
        includeMetadata: input.includeMetadata || false
      };

      const result = await this.exportService.exportCoupons(serviceExportDto);

      return {
        data: result.data,
        filename: result.filename,
        mimeType: result.mimeType
      };
    } catch (error) {
      this.logger.error(`Failed to export coupons: ${error.message}`, error.stack);
      throw error;
    }
  }
}