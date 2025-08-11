import { InputType } from '@nestjs/graphql';
import { AssignRewardToSubmissionDto, BulkAssignRewardDto } from '../../../modules/submission/dto';

/**
 * GraphQL Input DTO for assigning rewards to individual submissions
 * Inherits validation from base AssignRewardToSubmissionDto
 */
@InputType('AssignRewardToSubmissionInput')
export class AssignRewardToSubmissionGraphQLDto extends AssignRewardToSubmissionDto {
  // GraphQL-specific customizations can be added here if needed
}

/**
 * GraphQL Input DTO for bulk reward assignment to multiple submissions
 * Inherits validation from base BulkAssignRewardDto
 */
@InputType('BulkAssignRewardInput')
export class BulkAssignRewardGraphQLDto extends BulkAssignRewardDto {
  // GraphQL-specific customizations can be added here if needed
}