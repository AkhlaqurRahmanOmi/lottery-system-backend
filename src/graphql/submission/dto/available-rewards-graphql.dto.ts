import { ObjectType } from '@nestjs/graphql';
import { AvailableRewardDto, AvailableRewardsResponseDto } from '../../../modules/submission/dto';

/**
 * GraphQL Object DTO for individual available rewards
 */
@ObjectType('AvailableReward')
export class AvailableRewardGraphQLDto extends AvailableRewardDto {
  // GraphQL-specific customizations can be added here if needed
}

/**
 * GraphQL Object DTO for available rewards response
 */
@ObjectType('AvailableRewardsResponse')
export class AvailableRewardsGraphQLResponseDto extends AvailableRewardsResponseDto {
  // GraphQL-specific customizations can be added here if needed
}