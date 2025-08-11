import { InputType } from '@nestjs/graphql';
import { SubmissionQueryDto } from '../../../modules/submission/dto';

/**
 * GraphQL Input DTO for submission query parameters
 * Inherits all query parameters and validation from base SubmissionQueryDto
 */
@InputType('SubmissionQueryInput')
export class SubmissionQueryGraphQLDto extends SubmissionQueryDto {
  // GraphQL-specific customizations can be added here if needed
  // All query parameters are inherited from the base DTO
}