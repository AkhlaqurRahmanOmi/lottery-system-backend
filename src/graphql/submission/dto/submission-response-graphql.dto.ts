import { ObjectType } from '@nestjs/graphql';
import { 
  SubmissionResponseDto, 
  SubmissionWithRelationsResponseDto,
  PaginatedSubmissionResponseDto,
  SubmissionStatisticsDto
} from '../../../modules/submission/dto';

/**
 * GraphQL Object DTO for basic submission responses
 */
@ObjectType('SubmissionResponse')
export class SubmissionGraphQLResponseDto extends SubmissionResponseDto {
  // GraphQL-specific customizations can be added here if needed
}

/**
 * GraphQL Object DTO for submission responses with relations
 */
@ObjectType('SubmissionWithRelationsResponse')
export class SubmissionWithRelationsGraphQLResponseDto extends SubmissionWithRelationsResponseDto {
  // GraphQL-specific customizations can be added here if needed
}

/**
 * GraphQL Object DTO for paginated submission responses
 */
@ObjectType('PaginatedSubmissionResponse')
export class PaginatedSubmissionGraphQLResponseDto extends PaginatedSubmissionResponseDto {
  // GraphQL-specific customizations can be added here if needed
}

/**
 * GraphQL Object DTO for submission statistics responses
 */
@ObjectType('SubmissionStatistics')
export class SubmissionStatisticsGraphQLDto extends SubmissionStatisticsDto {
  // GraphQL-specific customizations can be added here if needed
}