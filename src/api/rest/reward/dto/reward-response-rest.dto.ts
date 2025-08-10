import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  RewardResponseDto, 
  PaginatedRewardResponseDto
} from '../../../../modules/reward/dto';

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
 * REST-specific response for single reward operations
 */
export class RewardRestResponseDto extends RestSuccessResponseDto<RewardResponseDto> {
  @ApiProperty({ 
    type: RewardResponseDto,
    description: 'Reward data'
  })
  declare data: RewardResponseDto;

  @ApiProperty({ 
    example: 'Reward retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward creation
 */
export class CreateRewardRestResponseDto extends RestSuccessResponseDto<RewardResponseDto> {
  @ApiProperty({ 
    type: RewardResponseDto,
    description: 'Created reward data'
  })
  declare data: RewardResponseDto;

  @ApiProperty({ 
    example: 'Reward created successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward updates
 */
export class UpdateRewardRestResponseDto extends RestSuccessResponseDto<RewardResponseDto> {
  @ApiProperty({ 
    type: RewardResponseDto,
    description: 'Updated reward data'
  })
  declare data: RewardResponseDto;

  @ApiProperty({ 
    example: 'Reward updated successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward queries
 */
export class RewardQueryRestResponseDto extends RestSuccessResponseDto<PaginatedRewardResponseDto> {
  @ApiProperty({ 
    type: PaginatedRewardResponseDto,
    description: 'Paginated reward data'
  })
  declare data: PaginatedRewardResponseDto;

  @ApiProperty({ 
    example: 'Rewards retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for public reward queries (user-facing)
 */
export class PublicRewardQueryRestResponseDto extends RestSuccessResponseDto<RewardResponseDto[]> {
  @ApiProperty({ 
    type: [RewardResponseDto],
    description: 'Array of active rewards available for selection'
  })
  declare data: RewardResponseDto[];

  @ApiProperty({ 
    example: 'Active rewards retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for bulk operations
 */
export class BulkRewardOperationRestResponseDto extends RestSuccessResponseDto<{ affectedCount: number; details: string[] }> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      affectedCount: { type: 'number', example: 3 },
      details: { 
        type: 'array', 
        items: { type: 'string' }, 
        example: ['Reward ID 1 activated', 'Reward ID 2 activated', 'Reward ID 3 activated'] 
      }
    },
    description: 'Bulk operation results'
  })
  declare data: { affectedCount: number; details: string[] };

  @ApiProperty({ 
    example: 'Bulk operation completed successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward ordering
 */
export class RewardOrderingRestResponseDto extends RestSuccessResponseDto<{ updatedCount: number }> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      updatedCount: { type: 'number', example: 5 }
    },
    description: 'Number of rewards with updated display order'
  })
  declare data: { updatedCount: number };

  @ApiProperty({ 
    example: 'Reward ordering updated successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward deletion
 */
export class DeleteRewardRestResponseDto extends RestSuccessResponseDto<{ deletedId: number }> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      deletedId: { type: 'number', example: 1 }
    },
    description: 'ID of the deleted reward'
  })
  declare data: { deletedId: number };

  @ApiProperty({ 
    example: 'Reward deleted successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward statistics
 */
export class RewardStatisticsRestResponseDto extends RestSuccessResponseDto<{
  totalRewards: number;
  activeRewards: number;
  inactiveRewards: number;
  mostPopularReward?: { id: number; name: string; selectionCount: number };
  leastPopularReward?: { id: number; name: string; selectionCount: number };
}> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      totalRewards: { type: 'number', example: 10 },
      activeRewards: { type: 'number', example: 8 },
      inactiveRewards: { type: 'number', example: 2 },
      mostPopularReward: { 
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Premium Gift Card' },
          selectionCount: { type: 'number', example: 150 }
        }
      },
      leastPopularReward: { 
        type: 'object',
        properties: {
          id: { type: 'number', example: 5 },
          name: { type: 'string', example: 'Basic Voucher' },
          selectionCount: { type: 'number', example: 10 }
        }
      }
    },
    description: 'Reward statistics and analytics'
  })
  declare data: {
    totalRewards: number;
    activeRewards: number;
    inactiveRewards: number;
    mostPopularReward?: { id: number; name: string; selectionCount: number };
    leastPopularReward?: { id: number; name: string; selectionCount: number };
  };

  @ApiProperty({ 
    example: 'Reward statistics retrieved successfully',
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
      details: { type: 'array', items: { type: 'string' }, example: ['Name is required'] }
    }
  })
  error: {
    code: string;
    message: string;
    details?: string[];
  };

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/admin/rewards' })
  path: string;
}