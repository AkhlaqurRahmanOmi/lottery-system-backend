import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsString, IsIn, IsInt, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  CreateRewardDto, 
  UpdateRewardDto, 
  RewardResponseDto,
  PaginatedRewardResponseDto,
  RewardQueryDto
} from '../../../../modules/reward/dto';

/**
 * REST-specific DTO for creating rewards
 */
export class CreateRewardRestDto extends CreateRewardDto {
  @ApiProperty({ 
    example: 'Premium Gift Card',
    description: 'Name of the reward'
  })
  declare name: string;

  @ApiPropertyOptional({ 
    example: 'A premium gift card worth $100',
    description: 'Description of the reward'
  })
  declare description?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/images/gift-card.jpg',
    description: 'URL to the reward image'
  })
  declare imageUrl?: string;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Display order for the reward (lower numbers appear first)'
  })
  declare displayOrder?: number;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether the reward is active and available for selection'
  })
  declare isActive?: boolean;
}

/**
 * REST-specific DTO for updating rewards
 */
export class UpdateRewardRestDto extends UpdateRewardDto {
  @ApiPropertyOptional({ 
    example: 'Updated Premium Gift Card',
    description: 'Name of the reward'
  })
  declare name?: string;

  @ApiPropertyOptional({ 
    example: 'An updated premium gift card worth $150',
    description: 'Description of the reward'
  })
  declare description?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/images/updated-gift-card.jpg',
    description: 'URL to the reward image'
  })
  declare imageUrl?: string;

  @ApiPropertyOptional({ 
    example: 2,
    description: 'Display order for the reward (lower numbers appear first)'
  })
  declare displayOrder?: number;

  @ApiPropertyOptional({ 
    example: false,
    description: 'Whether the reward is active and available for selection'
  })
  declare isActive?: boolean;
}

/**
 * REST-specific DTO for reward queries with enhanced documentation
 */
export class RewardQueryRestDto extends RewardQueryDto {
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
    example: 'gift card',
    description: 'Search term to filter rewards by name or description'
  })
  declare search?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Filter by active status (true for active, false for inactive)'
  })
  declare isActive?: boolean;

  @ApiPropertyOptional({ 
    example: 'displayOrder',
    enum: ['id', 'name', 'displayOrder', 'createdAt', 'updatedAt'],
    description: 'Field to sort by'
  })
  declare sortBy?: string;

  @ApiPropertyOptional({ 
    example: 'asc',
    enum: ['asc', 'desc'],
    description: 'Sort order'
  })
  declare sortOrder?: 'asc' | 'desc';
}

/**
 * REST-specific DTO for bulk reward operations
 */
export class BulkRewardOperationRestDto {
  @ApiProperty({ 
    type: [Number],
    example: [1, 2, 3],
    description: 'Array of reward IDs to operate on'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  rewardIds: number[];

  @ApiProperty({ 
    example: 'activate',
    enum: ['activate', 'deactivate', 'delete'],
    description: 'Operation to perform on the selected rewards'
  })
  @IsString()
  @IsIn(['activate', 'deactivate', 'delete'])
  operation: 'activate' | 'deactivate' | 'delete';
}

/**
 * REST-specific DTO for reward ordering
 */
export class RewardOrderingRestDto {
  @ApiProperty({ 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        displayOrder: { type: 'number', example: 1 }
      }
    },
    example: [
      { id: 1, displayOrder: 1 },
      { id: 2, displayOrder: 2 },
      { id: 3, displayOrder: 3 }
    ],
    description: 'Array of reward ID and display order pairs'
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RewardOrderItemRestDto)
  rewards: RewardOrderItemRestDto[];
}

/**
 * Individual reward order item for REST
 */
export class RewardOrderItemRestDto {
  @ApiProperty({ example: 1, description: 'Reward ID' })
  @IsInt()
  id: number;

  @ApiProperty({ example: 1, description: 'New display order' })
  @IsInt()
  displayOrder: number;
}