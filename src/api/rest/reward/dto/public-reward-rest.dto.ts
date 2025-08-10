import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/**
 * Public-facing DTO for rewards (used by end users during coupon redemption)
 * Excludes sensitive admin information
 */
export class PublicRewardDto {
  @ApiProperty({ 
    example: 1,
    description: 'Unique identifier for the reward'
  })
  id: number;

  @ApiProperty({ 
    example: 'Premium Gift Card',
    description: 'Name of the reward'
  })
  name: string;

  @ApiPropertyOptional({ 
    example: 'A premium gift card worth $100',
    description: 'Description of the reward'
  })
  description?: string | null;

  @ApiPropertyOptional({ 
    example: 'https://example.com/images/gift-card.jpg',
    description: 'URL to the reward image'
  })
  imageUrl?: string | null;

  @ApiProperty({ 
    example: 1,
    description: 'Display order for the reward (lower numbers appear first)'
  })
  displayOrder: number;
}

/**
 * Public response for active rewards list
 */
export class PublicActiveRewardsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    type: [PublicRewardDto],
    description: 'Array of active rewards available for selection'
  })
  data: PublicRewardDto[];

  @ApiProperty({ 
    example: 'Active rewards retrieved successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

/**
 * Public DTO for reward selection validation
 */
export class RewardSelectionValidationDto {
  @ApiProperty({ 
    example: 1,
    description: 'ID of the reward to validate'
  })
  @IsInt()
  rewardId: number;
}

/**
 * Public response for reward selection validation
 */
export class RewardSelectionValidationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    type: 'object',
    properties: {
      isValid: { type: 'boolean', example: true },
      reward: { 
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Premium Gift Card' },
          description: { type: 'string', example: 'A premium gift card worth $100' }
        }
      },
      error: { type: 'string', example: null }
    },
    description: 'Reward validation result'
  })
  data: {
    isValid: boolean;
    reward?: PublicRewardDto;
    error?: string;
  };

  @ApiProperty({ 
    example: 'Reward validation completed',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

/**
 * DTO for reward popularity statistics (public-facing)
 */
export class PublicRewardPopularityDto {
  @ApiProperty({ 
    example: 1,
    description: 'Reward ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'Premium Gift Card',
    description: 'Reward name'
  })
  name: string;

  @ApiProperty({ 
    example: 150,
    description: 'Number of times this reward has been selected'
  })
  selectionCount: number;

  @ApiProperty({ 
    example: 75.5,
    description: 'Percentage of total selections'
  })
  selectionPercentage: number;
}

/**
 * Public response for reward popularity statistics
 */
export class PublicRewardPopularityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    type: [PublicRewardPopularityDto],
    description: 'Array of reward popularity statistics'
  })
  data: PublicRewardPopularityDto[];

  @ApiProperty({ 
    example: 'Reward popularity statistics retrieved successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}