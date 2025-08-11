import { ObjectType } from '@nestjs/graphql';
import { SubmissionConfirmationDto } from '../../../modules/submission/dto';

/**
 * GraphQL Object DTO for submission confirmation responses
 * Inherits structure from base SubmissionConfirmationDto
 */
@ObjectType('SubmissionConfirmation')
export class SubmissionConfirmationGraphQLDto extends SubmissionConfirmationDto {
  // GraphQL-specific customizations can be added here if needed
}