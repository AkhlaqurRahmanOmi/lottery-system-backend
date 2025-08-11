import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, IsInt, ArrayNotEmpty, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RewardCategory, RewardStatus } from '@prisma/client';
import { 
  CreateRewardAccountDto, 
  UpdateRewardAccountDto, 
  AssignRewardDto,
  RewardAccountQueryDto
} from '../../../../modules/reward/dto';

/**
 * REST-specific DTO for creating reward accounts
 */
export class CreateRewardAccountRestDto extends CreateRewardAccountDto {
  @ApiProperty({ 
    example: 'Netflix Premium',
    description: 'Name of the service (e.g., Netflix, Spotify, YouTube Premium)'
  })
  declare serviceName: string;

  @ApiProperty({ 
    example: 'Premium Account',
    description: 'Type of account (e.g., Premium, Basic, Family)'
  })
  declare accountType: string;

  @ApiProperty({ 
    example: 'username:password123 or email:password123',
    description: 'Account credentials (will be encrypted before storage)'
  })
  declare credentials: string;

  @ApiPropertyOptional({ 
    example: '12 months',
    description: 'Duration of the subscription'
  })
  declare subscriptionDuration?: string;

  @ApiPropertyOptional({ 
    example: 'Premium Netflix account with 4K streaming',
    description: 'Additional description of the reward account'
  })
  declare description?: string;

  @ApiProperty({ 
    enum: RewardCategory,
    example: 'STREAMING_SERVICE',
    description: 'Category of the reward account'
  })
  declare category: RewardCategory;

  @ApiProperty({ 
    example: 1,
    description: 'ID of the admin creating the reward account'
  })
  declare createdBy: number;
}

/**
 * REST-specific DTO for updating reward accounts
 */
export class UpdateRewardAccountRestDto extends UpdateRewardAccountDto {
  @ApiPropertyOptional({ 
    example: 'Netflix Premium Updated',
    description: 'Name of the service'
  })
  declare serviceName?: string;

  @ApiPropertyOptional({ 
    example: 'Premium Account',
    description: 'Type of account'
  })
  declare accountType?: string;

  @ApiPropertyOptional({ 
    example: 'newusername:newpassword123',
    description: 'Updated account credentials (will be encrypted before storage)'
  })
  declare credentials?: string;

  @ApiPropertyOptional({ 
    example: '24 months',
    description: 'Updated duration of the subscription'
  })
  declare subscriptionDuration?: string;

  @ApiPropertyOptional({ 
    example: 'Updated premium Netflix account with 4K streaming',
    description: 'Updated description of the reward account'
  })
  declare description?: string;

  @ApiPropertyOptional({ 
    enum: RewardCategory,
    example: 'STREAMING_SERVICE',
    description: 'Updated category of the reward account'
  })
  declare category?: RewardCategory;
}

/**
 * REST-specific DTO for reward account queries with enhanced documentation
 */
export class RewardAccountQueryRestDto extends RewardAccountQueryDto {
  @ApiPropertyOptional({ 
    example: 1,
    minimum: 1,
    description: 'Page number for pagination'
  })
  declare page?: number;

  @ApiPropertyOptional({ 
    example: 10,
    minimum: 1,
    maximum: 100,
    description: 'Number of items per page'
  })
  declare limit?: number;

  @ApiPropertyOptional({ 
    example: 'Netflix',
    description: 'Search term to filter by service name, account type, or description'
  })
  declare search?: string;

  @ApiPropertyOptional({ 
    enum: RewardCategory,
    example: 'STREAMING_SERVICE',
    description: 'Filter by reward category'
  })
  declare category?: RewardCategory;

  @ApiPropertyOptional({ 
    enum: RewardStatus,
    example: 'AVAILABLE',
    description: 'Filter by reward status'
  })
  declare status?: RewardStatus;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filter by assigned user ID'
  })
  declare assignedToUserId?: number;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filter by creator admin ID'
  })
  declare createdBy?: number;

  @ApiPropertyOptional({ 
    example: 'createdAt',
    enum: ['id', 'serviceName', 'category', 'status', 'createdAt', 'updatedAt', 'assignedAt'],
    description: 'Field to sort by'
  })
  declare sortBy?: string;

  @ApiPropertyOptional({ 
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort order'
  })
  declare sortOrder?: 'asc' | 'desc';
}

/**
 * REST-specific DTO for assigning rewards to users
 */
export class AssignRewardRestDto extends AssignRewardDto {
  @ApiProperty({ 
    example: 1,
    description: 'ID of the reward account to assign'
  })
  declare rewardAccountId: number;

  @ApiProperty({ 
    example: 1,
    description: 'ID of the user submission to assign the reward to'
  })
  declare submissionId: number;

  @ApiProperty({ 
    example: 1,
    description: 'ID of the admin assigning the reward'
  })
  declare assignedBy: number;

  @ApiPropertyOptional({ 
    example: 'Winner of the weekly lottery draw',
    description: 'Optional notes about the assignment'
  })
  declare notes?: string;
}

/**
 * REST-specific DTO for bulk reward account operations
 */
export class BulkRewardAccountOperationRestDto {
  @ApiProperty({ 
    type: [Number],
    example: [1, 2, 3],
    description: 'Array of reward account IDs to operate on'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  rewardAccountIds: number[];

  @ApiProperty({ 
    example: 'deactivate',
    enum: ['activate', 'deactivate', 'delete', 'mark_expired'],
    description: 'Operation to perform on the selected reward accounts'
  })
  @IsString()
  @IsIn(['activate', 'deactivate', 'delete', 'mark_expired'])
  operation: 'activate' | 'deactivate' | 'delete' | 'mark_expired';
}

/**
 * REST-specific DTO for bulk reward account creation
 */
export class BulkCreateRewardAccountRestDto {
  @ApiProperty({ 
    type: [CreateRewardAccountRestDto],
    description: 'Array of reward accounts to create'
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRewardAccountRestDto)
  rewardAccounts: CreateRewardAccountRestDto[];
}

/**
 * REST-specific DTO for reward distribution tracking
 */
export class RewardDistributionTrackingRestDto {
  @ApiPropertyOptional({ 
    example: '2024-01-01',
    description: 'Start date for distribution tracking (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-12-31',
    description: 'End date for distribution tracking (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ 
    enum: RewardCategory,
    example: 'STREAMING_SERVICE',
    description: 'Filter by reward category'
  })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filter by admin who assigned the rewards'
  })
  @IsOptional()
  @IsInt()
  assignedBy?: number;
}

/**
 * REST-specific DTO for reward inventory management
 */
export class RewardInventoryManagementRestDto {
  @ApiPropertyOptional({ 
    enum: RewardCategory,
    example: 'STREAMING_SERVICE',
    description: 'Filter by reward category'
  })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @ApiPropertyOptional({ 
    enum: RewardStatus,
    example: 'AVAILABLE',
    description: 'Filter by reward status'
  })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Include detailed breakdown by category and status'
  })
  @IsOptional()
  includeBreakdown?: boolean;
}