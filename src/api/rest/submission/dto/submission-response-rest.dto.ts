import { 
  SubmissionResponseDto, 
  SubmissionWithRelationsResponseDto,
  PaginatedSubmissionResponseDto,
  SubmissionStatisticsDto
} from '../../../../modules/submission/dto';

/**
 * REST API DTO for basic submission responses
 */
export class SubmissionRestResponseDto extends SubmissionResponseDto {
  // REST-specific customizations can be added here if needed
}

/**
 * REST API DTO for submission responses with relations
 */
export class SubmissionWithRelationsRestResponseDto extends SubmissionWithRelationsResponseDto {
  // REST-specific customizations can be added here if needed
}

/**
 * REST API DTO for paginated submission responses
 */
export class PaginatedSubmissionRestResponseDto extends PaginatedSubmissionResponseDto {
  // REST-specific customizations can be added here if needed
}

/**
 * REST API DTO for submission statistics responses
 */
export class SubmissionStatisticsRestDto extends SubmissionStatisticsDto {
  // REST-specific customizations can be added here if needed
}