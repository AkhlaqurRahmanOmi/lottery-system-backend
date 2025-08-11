import { AssignRewardToSubmissionDto, BulkAssignRewardDto } from '../../../../modules/submission/dto';

/**
 * REST API DTO for assigning rewards to individual submissions
 * Inherits validation from base AssignRewardToSubmissionDto
 */
export class AssignRewardToSubmissionRestDto extends AssignRewardToSubmissionDto {
  // REST-specific customizations can be added here if needed
}

/**
 * REST API DTO for bulk reward assignment to multiple submissions
 * Inherits validation from base BulkAssignRewardDto
 */
export class BulkAssignRewardRestDto extends BulkAssignRewardDto {
  // REST-specific customizations can be added here if needed
}