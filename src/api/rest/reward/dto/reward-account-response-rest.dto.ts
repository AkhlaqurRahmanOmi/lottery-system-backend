import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  RewardAccountResponseDto, 
  RewardAccountWithCredentialsDto,
  PaginatedRewardAccountResponseDto,
  RewardInventoryStatsDto,
  RewardDistributionAnalyticsDto,
  AssignableRewardDto,
  BulkCreateResultDto,
  RewardAssignmentValidationDto
} from '../../../../modules/reward/dto';

/**
 * REST-specific response wrapper for successful reward account operations
 */
export class RewardAccountRestSuccessResponseDto<T = any> {
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
 * REST-specific response for single reward account operations
 */
export class RewardAccountRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardAccountResponseDto> {
  @ApiProperty({ 
    type: RewardAccountResponseDto,
    description: 'Reward account data (without sensitive credentials)'
  })
  declare data: RewardAccountResponseDto;

  @ApiProperty({ 
    example: 'Reward account retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward account creation
 */
export class CreateRewardAccountRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardAccountResponseDto> {
  @ApiProperty({ 
    type: RewardAccountResponseDto,
    description: 'Created reward account data'
  })
  declare data: RewardAccountResponseDto;

  @ApiProperty({ 
    example: 'Reward account created successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward account updates
 */
export class UpdateRewardAccountRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardAccountResponseDto> {
  @ApiProperty({ 
    type: RewardAccountResponseDto,
    description: 'Updated reward account data'
  })
  declare data: RewardAccountResponseDto;

  @ApiProperty({ 
    example: 'Reward account updated successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward account queries
 */
export class RewardAccountQueryRestResponseDto extends RewardAccountRestSuccessResponseDto<PaginatedRewardAccountResponseDto> {
  @ApiProperty({ 
    type: PaginatedRewardAccountResponseDto,
    description: 'Paginated reward account data'
  })
  declare data: PaginatedRewardAccountResponseDto;

  @ApiProperty({ 
    example: 'Reward accounts retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward account with credentials (admin only)
 */
export class RewardAccountWithCredentialsRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardAccountWithCredentialsDto> {
  @ApiProperty({ 
    type: RewardAccountWithCredentialsDto,
    description: 'Reward account data with decrypted credentials (admin only)'
  })
  declare data: RewardAccountWithCredentialsDto;

  @ApiProperty({ 
    example: 'Reward account credentials retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward assignment
 */
export class AssignRewardRestResponseDto extends RewardAccountRestSuccessResponseDto<{
  rewardAccount: RewardAccountResponseDto;
  submissionId: number;
  assignedAt: Date;
  assignedBy: number;
  notes?: string;
}> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      rewardAccount: { 
        type: 'object', 
        additionalProperties: true,
        description: 'Assigned reward account details' 
      },
      submissionId: { type: 'number', example: 1 },
      assignedAt: { type: 'string', format: 'date-time' },
      assignedBy: { type: 'number', example: 1 },
      notes: { type: 'string', example: 'Winner of weekly draw' }
    },
    description: 'Reward assignment details'
  })
  declare data: {
    rewardAccount: RewardAccountResponseDto;
    submissionId: number;
    assignedAt: Date;
    assignedBy: number;
    notes?: string;
  };

  @ApiProperty({ 
    example: 'Reward assigned successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward assignment validation
 */
export class RewardAssignmentValidationRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardAssignmentValidationDto> {
  @ApiProperty({ 
    type: RewardAssignmentValidationDto,
    description: 'Reward assignment validation result'
  })
  declare data: RewardAssignmentValidationDto;

  @ApiProperty({ 
    example: 'Reward assignment validation completed',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for assignable rewards
 */
export class AssignableRewardsRestResponseDto extends RewardAccountRestSuccessResponseDto<AssignableRewardDto[]> {
  @ApiProperty({ 
    type: [AssignableRewardDto],
    description: 'Array of available rewards that can be assigned'
  })
  declare data: AssignableRewardDto[];

  @ApiProperty({ 
    example: 'Assignable rewards retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for bulk reward account operations
 */
export class BulkRewardAccountOperationRestResponseDto extends RewardAccountRestSuccessResponseDto<{ 
  affectedCount: number; 
  details: string[];
  failed?: string[];
}> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      affectedCount: { type: 'number', example: 3 },
      details: { 
        type: 'array', 
        items: { type: 'string' }, 
        example: ['Reward account ID 1 deactivated', 'Reward account ID 2 deactivated', 'Reward account ID 3 deactivated'] 
      },
      failed: {
        type: 'array',
        items: { type: 'string' },
        example: ['Reward account ID 4 already deactivated']
      }
    },
    description: 'Bulk operation results'
  })
  declare data: { 
    affectedCount: number; 
    details: string[];
    failed?: string[];
  };

  @ApiProperty({ 
    example: 'Bulk operation completed successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for bulk reward account creation
 */
export class BulkCreateRewardAccountRestResponseDto extends RewardAccountRestSuccessResponseDto<BulkCreateResultDto> {
  @ApiProperty({ 
    type: BulkCreateResultDto,
    description: 'Bulk creation results with successful and failed attempts'
  })
  declare data: BulkCreateResultDto;

  @ApiProperty({ 
    example: 'Bulk reward account creation completed',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward inventory statistics
 */
export class RewardInventoryStatsRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardInventoryStatsDto> {
  @ApiProperty({ 
    type: RewardInventoryStatsDto,
    description: 'Reward inventory statistics and analytics'
  })
  declare data: RewardInventoryStatsDto;

  @ApiProperty({ 
    example: 'Reward inventory statistics retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward distribution analytics
 */
export class RewardDistributionAnalyticsRestResponseDto extends RewardAccountRestSuccessResponseDto<RewardDistributionAnalyticsDto> {
  @ApiProperty({ 
    type: RewardDistributionAnalyticsDto,
    description: 'Comprehensive reward distribution analytics'
  })
  declare data: RewardDistributionAnalyticsDto;

  @ApiProperty({ 
    example: 'Reward distribution analytics retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward distribution tracking
 */
export class RewardDistributionTrackingRestResponseDto extends RewardAccountRestSuccessResponseDto<{
  totalDistributed: number;
  distributionsByCategory: Record<string, number>;
  distributionsByAdmin: Record<string, { adminId: number; adminUsername: string; count: number }>;
  distributionsByDate: Record<string, number>;
  averageDistributionTime: number;
}> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      totalDistributed: { type: 'number', example: 150 },
      distributionsByCategory: { 
        type: 'object',
        additionalProperties: { type: 'number' },
        example: { 'STREAMING_SERVICE': 80, 'GIFT_CARD': 50, 'SUBSCRIPTION': 20 }
      },
      distributionsByAdmin: {
        type: 'object',
        additionalProperties: { 
          type: 'object',
          properties: {
            adminId: { type: 'number' },
            adminUsername: { type: 'string' },
            count: { type: 'number' }
          }
        },
        example: {
          '1': { adminId: 1, adminUsername: 'admin1', count: 75 },
          '2': { adminId: 2, adminUsername: 'admin2', count: 75 }
        }
      },
      distributionsByDate: {
        type: 'object',
        additionalProperties: { type: 'number' },
        example: { '2024-01-01': 10, '2024-01-02': 15, '2024-01-03': 8 }
      },
      averageDistributionTime: { type: 'number', example: 2.5, description: 'Average time in hours from submission to reward assignment' }
    },
    description: 'Detailed reward distribution tracking data'
  })
  declare data: {
    totalDistributed: number;
    distributionsByCategory: Record<string, number>;
    distributionsByAdmin: Record<string, { adminId: number; adminUsername: string; count: number }>;
    distributionsByDate: Record<string, number>;
    averageDistributionTime: number;
  };

  @ApiProperty({ 
    example: 'Reward distribution tracking data retrieved successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific response for reward account deletion
 */
export class DeleteRewardAccountRestResponseDto extends RewardAccountRestSuccessResponseDto<{ deletedId: number }> {
  @ApiProperty({ 
    type: 'object',
    properties: {
      deletedId: { type: 'number', example: 1 }
    },
    description: 'ID of the deleted reward account'
  })
  declare data: { deletedId: number };

  @ApiProperty({ 
    example: 'Reward account deleted successfully',
    description: 'Success message'
  })
  declare message: string;
}

/**
 * REST-specific error response for reward account operations
 */
export class RewardAccountRestErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    type: 'object',
    properties: {
      code: { type: 'string', example: 'REWARD_ACCOUNT_NOT_FOUND' },
      message: { type: 'string', example: 'Reward account not found' },
      details: { type: 'array', items: { type: 'string' }, example: ['Reward account with ID 1 does not exist'] }
    }
  })
  error: {
    code: string;
    message: string;
    details?: string[];
  };

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/admin/reward-accounts/1' })
  path: string;
}