import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  CouponResponseDto, 
  CouponWithCreatorResponseDto, 
  PaginatedCouponResponseDto,
  BatchStatisticsDto,
  CouponValidationResultDto
} from '../../../../modules/coupon/dto/coupon-response.dto';

/**
 * REST-specific response wrapper for successful operations
 */
export class RestSuccessResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty()
  data: T;

  @ApiPropertyOptional({ example: 'Operation completed successfully' })
  message?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

/**
 * REST-specific response for coupon generation
 */
export class GenerateCouponsRestResponseDto extends RestSuccessResponseDto<CouponResponseDto[]> {
  @ApiProperty({ 
    type: [CouponResponseDto],
    description: 'Array of generated coupon codes'
  })
  declare data: CouponResponseDto[];

  @ApiProperty({ 
    example: 'Successfully generated 10 coupon codes',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for coupon queries
 */
export class CouponQueryRestResponseDto extends RestSuccessResponseDto<PaginatedCouponResponseDto> {
  @ApiProperty({ 
    type: PaginatedCouponResponseDto,
    description: 'Paginated coupon data'
  })
  declare data: PaginatedCouponResponseDto;
}

/**
 * REST-specific response for coupon validation
 */
export class CouponValidationRestResponseDto extends RestSuccessResponseDto<CouponValidationResultDto> {
  @ApiProperty({ 
    type: CouponValidationResultDto,
    description: 'Coupon validation result'
  })
  declare data: CouponValidationResultDto;
}

/**
 * REST-specific response for batch statistics
 */
export class BatchStatisticsRestResponseDto extends RestSuccessResponseDto<BatchStatisticsDto[]> {
  @ApiProperty({ 
    type: [BatchStatisticsDto],
    description: 'Array of batch statistics'
  })
  declare data: BatchStatisticsDto[];
}

/**
 * REST-specific response for export operations
 */
export class ExportRestResponseDto extends RestSuccessResponseDto<{ downloadUrl: string; filename: string }> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      downloadUrl: { type: 'string', example: '/api/downloads/coupons_export_20240101.csv' },
      filename: { type: 'string', example: 'coupons_export_20240101.csv' }
    },
    description: 'Export file information'
  })
  declare data: { downloadUrl: string; filename: string };

  @ApiProperty({ 
    example: 'Export completed successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific error response
 */
export class RestErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    type: 'object',
    properties: {
      code: { type: 'string', example: 'VALIDATION_ERROR' },
      message: { type: 'string', example: 'Invalid input data' },
      details: { type: 'array', items: { type: 'string' }, example: ['Quantity must be at least 1'] }
    }
  })
  error: {
    code: string;
    message: string;
    details?: string[];
  };

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/admin/coupons/generate' })
  path: string;
}