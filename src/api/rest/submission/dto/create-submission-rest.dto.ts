import { OmitType } from '@nestjs/swagger';
import { CreateSubmissionDto } from '../../../../modules/submission/dto';

/**
 * REST API DTO for creating user submissions
 * Inherits validation from base CreateSubmissionDto
 */
export class CreateSubmissionRestDto extends CreateSubmissionDto {
  // REST-specific customizations can be added here if needed
  // Currently inherits all validation from the base DTO
}